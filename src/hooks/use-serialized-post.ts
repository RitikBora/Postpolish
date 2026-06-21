"use client";

import { type Editor, useEditorState } from "@tiptap/react";

import { serialize, type DocNode } from "@/lib/unicode";

export interface SerializedPost {
  /** The full LinkedIn-pasteable Unicode string. */
  unicode: string;
  /** Character count from Tiptap's CharacterCount extension. */
  charCount: number;
}

const EMPTY: SerializedPost = { unicode: "", charCount: 0 };

/**
 * Reactive bridge between the Tiptap editor doc and the Unicode serializer.
 * Re-renders only when the derived values change, not on every keystroke.
 */
export function useSerializedPost(editor: Editor | null): SerializedPost {
  const state = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return EMPTY;
      const json = editor.getJSON() as DocNode;
      return {
        unicode: serialize(json),
        charCount: editor.storage.characterCount.characters(),
      };
    },
  });

  return state ?? EMPTY;
}
