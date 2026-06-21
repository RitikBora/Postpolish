import { describe, expect, it } from "vitest";

import { serialize, stripToPlain, transform, type DocNode } from "./unicode";

describe("transform — alphabet styles", () => {
  it("bold maps A-Z, a-z, 0-9", () => {
    expect(transform("Hello", "bold")).toBe("𝗛𝗲𝗹𝗹𝗼");
    expect(transform("ABC xyz 123", "bold")).toBe("𝗔𝗕𝗖 𝘅𝘆𝘇 𝟭𝟮𝟯");
  });

  it("italic maps A-Z, a-z and passes digits through (no italic digit forms)", () => {
    expect(transform("Hi", "italic")).toBe("𝘏𝘪");
    expect(transform("a1b2", "italic")).toBe("𝘢1𝘣2");
  });

  it("italic 'h' maps to sans-serif italic h (not Planck constant)", () => {
    // We use the sans-serif italic block which has no reserved gaps.
    expect(transform("h", "italic")).toBe("𝘩");
    expect(transform("h", "italic")).not.toBe("ℎ");
  });

  it("boldItalic maps A-Z, a-z", () => {
    expect(transform("Hi", "boldItalic")).toBe("𝙃𝙞");
  });

  it("monospace maps A-Z, a-z, 0-9", () => {
    expect(transform("Hi 9", "monospace")).toBe("𝙷𝚒 𝟿");
  });

  it("plain returns input unchanged", () => {
    expect(transform("Hello, world!", "plain")).toBe("Hello, world!");
  });
});

describe("transform — combining marks", () => {
  it("underline appends U+0332 after each char", () => {
    expect(transform("hi", "underline")).toBe("h̲i̲");
  });

  it("strikethrough appends U+0336 after each char", () => {
    expect(transform("hi", "strikethrough")).toBe("h̶i̶");
  });
});

describe("transform — passthrough & surrogate safety", () => {
  it("punctuation, spaces and accents pass through unchanged", () => {
    expect(transform("Hello, world!", "bold")).toBe("𝗛𝗲𝗹𝗹𝗼, 𝘄𝗼𝗿𝗹𝗱!");
    expect(transform("café", "bold")).toBe("𝗰𝗮𝗳é");
  });

  it("emoji are not split or corrupted (surrogate-safe iteration)", () => {
    const out = transform("hi 👋", "bold");
    expect(out).toBe("𝗵𝗶 👋");
    // 4 code points: 𝗵, 𝗶, ' ', 👋 — emoji stays intact.
    expect(Array.from(out).length).toBe(4);
  });
});

describe("stripToPlain", () => {
  it("reverses bold", () => {
    expect(stripToPlain("𝗛𝗲𝗹𝗹𝗼")).toBe("Hello");
  });

  it("reverses italic, boldItalic, monospace", () => {
    expect(stripToPlain("𝘏𝘪")).toBe("Hi");
    expect(stripToPlain("𝙃𝙞")).toBe("Hi");
    expect(stripToPlain("𝙷𝚒")).toBe("Hi");
  });

  it("removes combining underline and strike marks", () => {
    expect(stripToPlain("h̲i̲")).toBe("hi");
    expect(stripToPlain("h̶i̶")).toBe("hi");
  });

  it("leaves unstyled text + emoji alone", () => {
    expect(stripToPlain("Hello, world! 👋")).toBe("Hello, world! 👋");
  });

  it("round-trip: transform → stripToPlain returns original ASCII", () => {
    const input = "Hello world 123";
    expect(stripToPlain(transform(input, "bold"))).toBe(input);
    expect(stripToPlain(transform(input, "monospace"))).toBe(input);
  });
});

describe("serialize — doc tree", () => {
  it("plain paragraph", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Hello world" }] },
      ],
    };
    expect(serialize(doc)).toBe("Hello world");
  });

  it("bold mark on part of a paragraph", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "Hello " },
            { type: "text", text: "world", marks: [{ type: "bold" }] },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("Hello 𝘄𝗼𝗿𝗹𝗱");
  });

  it("combined bold+italic uses the boldItalic alphabet", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hi",
              marks: [{ type: "bold" }, { type: "italic" }],
            },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("𝙃𝙞");
  });

  it("underline stacks on top of bold alphabet", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Hi",
              marks: [{ type: "bold" }, { type: "underline" }],
            },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("𝗛̲𝗶̲");
  });

  it("paragraph breaks render as blank lines; hardBreak as a single newline", () => {
    // Two paragraphs → blank line between them (how LinkedIn shows them).
    const twoParas: DocNode = {
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "one" }] },
        { type: "paragraph", content: [{ type: "text", text: "two" }] },
      ],
    };
    expect(serialize(twoParas)).toBe("one\n\ntwo");
  });

  it("bullet list prefixes each item with '• '", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "bulletList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "one" }] },
              ],
            },
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "two" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("• one\n• two");
  });

  it("ordered list numbers each item", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "orderedList",
          content: [
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "one" }] },
              ],
            },
            {
              type: "listItem",
              content: [
                { type: "paragraph", content: [{ type: "text", text: "two" }] },
              ],
            },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("1. one\n2. two");
  });

  it("hardBreak inserts a newline mid-paragraph", () => {
    const doc: DocNode = {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            { type: "text", text: "one" },
            { type: "hardBreak" },
            { type: "text", text: "two" },
          ],
        },
      ],
    };
    expect(serialize(doc)).toBe("one\ntwo");
  });
});
