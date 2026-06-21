"use client";

import { type Editor } from "@tiptap/react";

import { useSerializedPost } from "@/hooks/use-serialized-post";
import { FOLD_THRESHOLD } from "@/lib/linkedin";

interface PreviewCardProps {
  editor: Editor | null;
}

export function PreviewCard({ editor }: PreviewCardProps) {
  const { unicode } = useSerializedPost(editor);

  const isEmpty = unicode.trim().length === 0;
  const overFold = unicode.length > FOLD_THRESHOLD;
  const above = overFold ? unicode.slice(0, FOLD_THRESHOLD) : unicode;
  const below = overFold ? unicode.slice(FOLD_THRESHOLD) : "";

  return (
    <div className="h-full overflow-y-auto bg-muted/30 p-4 md:p-6">
      <article className="mx-auto max-w-xl rounded-lg border border-border bg-card text-card-foreground shadow-sm">
        <div className="px-5 py-4 text-[14px] leading-relaxed">
          {isEmpty ? (
            <p className="italic text-muted-foreground/70">
              your post preview will appear here…
            </p>
          ) : (
            <>
              <p className="whitespace-pre-wrap break-words">{above}</p>
              {overFold && (
                <>
                  <div
                    className="my-2 flex items-center gap-2"
                    aria-label="LinkedIn 'see more' cutoff (approx)"
                  >
                    <span className="text-[12px] text-muted-foreground/80">
                      …see more
                    </span>
                    <div
                      className="flex-1 border-t border-dashed border-border/80"
                      aria-hidden
                    />
                  </div>
                  <p className="whitespace-pre-wrap break-words text-muted-foreground/60">
                    {below}
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </article>
    </div>
  );
}
