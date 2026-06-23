"use client";

import CharacterCount from "@tiptap/extension-character-count";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Copy, Eye, Pencil } from "lucide-react";
import { motion } from "motion/react";
import { type EditorView } from "prosemirror-view";
import { useState } from "react";
import { toast } from "sonner";

import { EditorToolbar } from "@/components/editor/editor-toolbar";
import { PreviewCard } from "@/components/preview/preview-card";
import { Button } from "@/components/ui/button";
import { useSerializedPost } from "@/hooks/use-serialized-post";
import { CHAR_LIMIT, CHAR_WARN_AT } from "@/lib/linkedin";
import { cn } from "@/lib/utils";
import { serialize, type DocNode } from "@/lib/unicode";

type View = "edit" | "preview";

/** Returns the Unicode-serialized text for the current selection, or null if
 *  the selection is empty (so we let the browser handle copy normally). */
function serializeSelection(view: EditorView): string | null {
  const { from, to } = view.state.selection;
  if (from === to) return null;
  const slice = view.state.doc.slice(from, to);
  const content = slice.content.toJSON() as DocNode[] | null;
  if (!content || content.length === 0) return null;
  return serialize({ type: "doc", content });
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ isActive, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={cn(
        "relative inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {isActive && (
        // Shared layoutId — motion slides the underline between tabs instead
        // of re-mounting it. Spring tuning per motion.dev recommendations.
        <motion.span
          aria-hidden
          layoutId="workspace-tab-underline"
          className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
    </button>
  );
}

export function Workspace() {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        horizontalRule: false,
        codeBlock: false,
        blockquote: false,
      }),
      Placeholder.configure({
        placeholder: "Write your LinkedIn post…",
      }),
      CharacterCount.configure({ limit: CHAR_LIMIT }),
    ],
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose-editor min-h-[280px] w-full px-4 py-3 text-[15px] leading-relaxed focus:outline-none",
      },
      // Ctrl+C / Cmd+C / Ctrl+X from inside the editor produce Unicode-styled
      // text. We override the DOM event so we own *both* clipboard slots —
      // text/plain gets the Unicode; text/html is left empty so paste targets
      // can't fall back to the raw `<strong>` HTML and strip the styling.
      handleDOMEvents: {
        copy: (view, event) => {
          const text = serializeSelection(view);
          if (text === null) return false;
          event.clipboardData?.setData("text/plain", text);
          event.preventDefault();
          return true;
        },
        cut: (view, event) => {
          const text = serializeSelection(view);
          if (text === null) return false;
          event.clipboardData?.setData("text/plain", text);
          event.preventDefault();
          view.dispatch(view.state.tr.deleteSelection());
          return true;
        },
      },
    },
  });

  const [view, setView] = useState<View>("edit");
  const { unicode, charCount } = useSerializedPost(editor);

  const handleCopy = async () => {
    if (!unicode) return;
    try {
      await navigator.clipboard.writeText(unicode);
      toast.success("Copied to clipboard", {
        description: " ",
        classNames: {
        toast: "!border-primary/50",
        title: "!text-primary",
        description: "!text-primary/70",
        icon: "!text-primary",
      },
      });
    } catch {
      toast.error("Couldn't copy", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const overLimit = charCount > CHAR_LIMIT;
  const nearLimit = charCount > CHAR_WARN_AT;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-10 md:px-6">
      <section
        aria-label="Post composer"
        className="from-card to-card/50 shadow-foreground/5 flex h-[520px] flex-col overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b shadow-xl backdrop-blur-sm"
      >
        {/* Tab bar */}
        <div
          role="tablist"
          aria-label="Compose view"
          className="flex items-center gap-1 border-b border-border/40 px-2"
        >
          <TabButton
            isActive={view === "edit"}
            onClick={() => {
              setView("edit");
              editor?.commands.focus();
            }}
            icon={<Pencil className="size-3.5" />}
            label="Edit"
          />
          <TabButton
            isActive={view === "preview"}
            onClick={() => setView("preview")}
            icon={<Eye className="size-3.5" />}
            label="Preview"
          />
        </div>

        {/* Toolbar (edit only). The section's fixed height keeps the card
            from resizing when the toolbar disappears. */}
        {view === "edit" && <EditorToolbar editor={editor} />}

        {/* Content — keep both mounted so editor state survives switching.
            Both wrappers are identical (h-full + overflow-y-auto) so the
            workspace card keeps its size when toggling tabs. */}
        <div className="flex-1 overflow-hidden">
          <div
            className={cn(
              "h-full overflow-y-auto",
              view === "edit" ? "" : "hidden"
            )}
          >
            <EditorContent editor={editor} />
          </div>
          <div
            className={cn(
              "h-full overflow-y-auto",
              view === "preview" ? "" : "hidden"
            )}
          >
            <PreviewCard editor={editor} />
          </div>
        </div>

        {/* Footer — always visible */}
        <div className="flex items-center justify-between gap-3 border-t border-border/40 px-4 py-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {view}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "font-mono text-[11px] tracking-wider",
                overLimit
                  ? "text-destructive"
                  : nearLimit
                    ? "text-foreground"
                    : "text-muted-foreground"
              )}
            >
              {charCount} / {CHAR_LIMIT}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={handleCopy}
              disabled={!unicode}
              className="gap-1.5 transition-transform duration-150 ease-out hover:scale-101 active:scale-98"
            >
              <Copy />
              <span className="hidden sm:inline">Copy for LinkedIn</span>
              <span className="sm:hidden">Copy</span>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
