/**
 * Unicode formatter for LinkedIn posts.
 *
 * LinkedIn has no rich-text editor. We trick it by substituting normal letters
 * with characters from the Unicode Mathematical Alphanumeric Symbols block
 * (U+1D400..U+1D7FF). Those code points are entirely different characters that
 * happen to look bold/italic/etc — so they survive a plain-text editor with
 * their styling intact.
 *
 * We use sans-serif variants because they pair visually with LinkedIn's font.
 * Sans-serif italic and sans-serif bold-italic have no reserved-position gaps,
 * so no exception table is needed for those alphabets.
 *
 * Underline and strikethrough work differently: they're combining marks
 * (U+0332, U+0336) appended after each character, so they stack on top of any
 * alphabet style.
 *
 * Iteration MUST be by code point (`Array.from`, `codePointAt`) — these
 * characters live outside the BMP and using charCodeAt/str[i] would split
 * surrogate pairs and corrupt the output.
 */

export type AlphabetStyle = "bold" | "italic" | "boldItalic" | "monospace";
export type Style = AlphabetStyle | "underline" | "strikethrough" | "plain";

/** Combining marks (appended after each char). */
const COMBINING_UNDERLINE = "̲";
const COMBINING_STRIKE = "̶";

interface AlphabetConfig {
  /** Code point of the styled 'A'. */
  upper: number;
  /** Code point of the styled 'a'. */
  lower: number;
  /** Code point of the styled '0', or null if the alphabet has no digit forms. */
  digit: number | null;
}

const ALPHABETS: Record<AlphabetStyle, AlphabetConfig> = {
  bold: { upper: 0x1d5d4, lower: 0x1d5ee, digit: 0x1d7ec },
  italic: { upper: 0x1d608, lower: 0x1d622, digit: null },
  boldItalic: { upper: 0x1d63c, lower: 0x1d656, digit: null },
  monospace: { upper: 0x1d670, lower: 0x1d68a, digit: 0x1d7f6 },
};

const CODE_A = 65;
const CODE_Z = 90;
const CODE_a = 97;
const CODE_z = 122;
const CODE_0 = 48;
const CODE_9 = 57;

function transformChar(ch: string, style: AlphabetStyle): string {
  const code = ch.codePointAt(0);
  if (code === undefined) return ch;
  const cfg = ALPHABETS[style];

  if (code >= CODE_A && code <= CODE_Z) {
    return String.fromCodePoint(cfg.upper + (code - CODE_A));
  }
  if (code >= CODE_a && code <= CODE_z) {
    return String.fromCodePoint(cfg.lower + (code - CODE_a));
  }
  if (code >= CODE_0 && code <= CODE_9 && cfg.digit !== null) {
    return String.fromCodePoint(cfg.digit + (code - CODE_0));
  }
  return ch;
}

/**
 * Apply a single style to a string. Iterates by code point so surrogate
 * pairs (emoji, etc.) are preserved.
 */
export function transform(text: string, style: Style): string {
  if (style === "plain") return text;

  if (style === "underline") {
    return Array.from(text).map((ch) => ch + COMBINING_UNDERLINE).join("");
  }
  if (style === "strikethrough") {
    return Array.from(text).map((ch) => ch + COMBINING_STRIKE).join("");
  }

  return Array.from(text).map((ch) => transformChar(ch, style)).join("");
}

/* -------------------------------------------------------------------------- */
/* Doc serializer (Tiptap / ProseMirror JSON → LinkedIn-ready string)         */
/* -------------------------------------------------------------------------- */

export interface Mark {
  type: string;
}

export interface DocNode {
  type: string;
  text?: string;
  marks?: Mark[];
  content?: DocNode[];
  attrs?: Record<string, unknown>;
}

function pickAlphabet(marks: Mark[]): AlphabetStyle | "plain" {
  let bold = false;
  let italic = false;
  let code = false;
  for (const m of marks) {
    if (m.type === "bold") bold = true;
    else if (m.type === "italic") italic = true;
    else if (m.type === "code") code = true;
  }
  if (code) return "monospace";
  if (bold && italic) return "boldItalic";
  if (bold) return "bold";
  if (italic) return "italic";
  return "plain";
}

function applyCombining(text: string, marks: Mark[]): string {
  let underline = false;
  let strike = false;
  for (const m of marks) {
    if (m.type === "underline") underline = true;
    else if (m.type === "strike" || m.type === "strikethrough") strike = true;
  }
  if (!underline && !strike) return text;
  return Array.from(text)
    .map((ch) => {
      let out = ch;
      if (underline) out += COMBINING_UNDERLINE;
      if (strike) out += COMBINING_STRIKE;
      return out;
    })
    .join("");
}

function serializeTextRun(text: string, marks: Mark[]): string {
  const alphabet = pickAlphabet(marks);
  const substituted = alphabet === "plain" ? text : transform(text, alphabet);
  return applyCombining(substituted, marks);
}

interface ListContext {
  kind: "bullet" | "ordered" | null;
  index: number;
}

function walk(node: DocNode, out: string[], ctx: ListContext): void {
  switch (node.type) {
    case "doc": {
      const children = node.content ?? [];
      children.forEach((child, i) => {
        if (i > 0) out.push("\n");
        walk(child, out, ctx);
      });
      return;
    }

    case "paragraph": {
      (node.content ?? []).forEach((child) => walk(child, out, ctx));
      out.push("\n");
      return;
    }

    case "heading": {
      // LinkedIn has no headings — render as bold paragraph.
      (node.content ?? []).forEach((child) => {
        if (child.type === "text") {
          const marks = [{ type: "bold" }, ...(child.marks ?? [])];
          out.push(serializeTextRun(child.text ?? "", marks));
        } else {
          walk(child, out, ctx);
        }
      });
      out.push("\n");
      return;
    }

    case "text": {
      out.push(serializeTextRun(node.text ?? "", node.marks ?? []));
      return;
    }

    case "hardBreak": {
      out.push("\n");
      return;
    }

    case "bulletList": {
      (node.content ?? []).forEach((child) =>
        walk(child, out, { kind: "bullet", index: 0 })
      );
      return;
    }

    case "orderedList": {
      (node.content ?? []).forEach((child, i) =>
        walk(child, out, { kind: "ordered", index: i + 1 })
      );
      return;
    }

    case "listItem": {
      if (ctx.kind === "bullet") out.push("• ");
      else if (ctx.kind === "ordered") out.push(`${ctx.index}. `);

      // listItem content is usually paragraphs — flatten so we don't get
      // an extra blank line between marker and text.
      const inner: string[] = [];
      (node.content ?? []).forEach((child) => {
        if (child.type === "paragraph") {
          (child.content ?? []).forEach((gc) => walk(gc, inner, ctx));
        } else {
          walk(child, inner, ctx);
        }
      });
      out.push(inner.join(""));
      out.push("\n");
      return;
    }

    default: {
      // Unknown node type — walk children so we don't drop content.
      (node.content ?? []).forEach((child) => walk(child, out, ctx));
    }
  }
}

/**
 * Convert a Tiptap/ProseMirror JSON doc into the final LinkedIn-pasteable
 * string. Trims trailing whitespace and collapses runs of 3+ newlines.
 */
export function serialize(doc: DocNode): string {
  const buf: string[] = [];
  walk(doc, buf, { kind: null, index: 0 });
  return buf.join("").replace(/\n{3,}/g, "\n\n").trim();
}

/* -------------------------------------------------------------------------- */
/* stripToPlain — reverse styled Unicode + combining marks back to ASCII      */
/* -------------------------------------------------------------------------- */

const REVERSE_MAP = new Map<number, string>();

(function buildReverseMap() {
  for (const cfg of Object.values(ALPHABETS)) {
    for (let i = 0; i < 26; i++) {
      REVERSE_MAP.set(cfg.upper + i, String.fromCharCode(CODE_A + i));
      REVERSE_MAP.set(cfg.lower + i, String.fromCharCode(CODE_a + i));
    }
    if (cfg.digit !== null) {
      for (let i = 0; i < 10; i++) {
        REVERSE_MAP.set(cfg.digit + i, String.fromCharCode(CODE_0 + i));
      }
    }
  }
})();

/**
 * Reverse `transform` — strip styled Unicode characters and combining marks
 * back to their ASCII equivalents.
 */
export function stripToPlain(text: string): string {
  const out: string[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (code === 0x0332 || code === 0x0336) continue;
    const plain = REVERSE_MAP.get(code);
    out.push(plain ?? ch);
  }
  return out.join("");
}

