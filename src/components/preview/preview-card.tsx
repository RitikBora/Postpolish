"use client";

import { type Editor } from "@tiptap/react";
import { Fragment, type ReactNode } from "react";

import { useSerializedPost } from "@/hooks/use-serialized-post";
import { FOLD_THRESHOLD } from "@/lib/linkedin";

interface PreviewCardProps {
  editor: Editor | null;
}

/**
 * Lift the serializer's combining underline (U+0332) and strike (U+0336)
 * marks into <u>/<s> wrappers. Combining marks render as floating shards on
 * space characters in most fonts; <u>'s CSS underline draws a continuous
 * line through spaces, which is what the preview should communicate. The
 * clipboard copy still uses the raw combining-mark Unicode for LinkedIn.
 */
function renderRichText(text: string): ReactNode {
  const codepoints = Array.from(text);
  const groups: { text: string; underline: boolean; strike: boolean }[] = [];

  let i = 0;
  while (i < codepoints.length) {
    const base = codepoints[i];
    // Skip orphan combining marks that landed at the slice boundary.
    if (base === "̲" || base === "̶") {
      i++;
      continue;
    }
    let underline = false;
    let strike = false;
    let j = i + 1;
    while (j < codepoints.length) {
      const next = codepoints[j];
      if (next === "̲") {
        underline = true;
        j++;
      } else if (next === "̶") {
        strike = true;
        j++;
      } else break;
    }

    const last = groups[groups.length - 1];
    if (last && last.underline === underline && last.strike === strike) {
      last.text += base;
    } else {
      groups.push({ text: base, underline, strike });
    }

    i = j;
  }

  return groups.map((g, idx) => {
    let node: ReactNode = g.text;
    if (g.strike) node = <s className="line-through">{node}</s>;
    if (g.underline) node = <u className="underline">{node}</u>;
    return <Fragment key={idx}>{node}</Fragment>;
  });
}

export function PreviewCard({ editor }: PreviewCardProps) {
  const { unicode } = useSerializedPost(editor);

  const isEmpty = unicode.trim().length === 0;
  const overFold = unicode.length > FOLD_THRESHOLD;
  const above = overFold ? unicode.slice(0, FOLD_THRESHOLD) : unicode;
  const below = overFold ? unicode.slice(FOLD_THRESHOLD) : "";

  // Mirrors the editor's canvas (px-4 py-3, text-[15px], leading-relaxed) so
  // both tabs share the same inner padding.
  return (
    <div className="w-full px-4 py-3 text-[15px] leading-relaxed">
      {isEmpty ? (
        <p className="italic text-muted-foreground/70 pt-5">
          your post preview will appear here…
        </p>
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words">
            {renderRichText(above)}
          </p>
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
                {renderRichText(below)}
              </p>
            </>
          )}
        </>
      )}
    </div>
  );
}
