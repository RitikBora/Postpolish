# LinkedIn Post Formatter — Build Plan

A sleek, no-signup web tool that adds the formatting LinkedIn is missing (bold, italic, lists, etc.) and does it *better* than the existing free clones via a built-in accessibility check and a true live preview.

> Companion doc: see `summary.md` for the research, competitor scan, and the "how bolding works" background.

---

## Execution Protocol (how we build this)

We build **one phase at a time**, with a manual checkpoint after each. The rules:

1. **I only start a phase when you say "execute."** I then implement **exactly one** build phase — no running ahead.
2. **After each phase we both validate** at its checkpoint. Checks are mostly **manual/visual** ("does it look/behave right?") — a runnable automated test is nice-to-have, not required.
3. **We stay on the current phase until you're satisfied.** If something's off, we keep fixing *this* phase. I do **not** advance.
4. **I move to the next phase only when you say "next step."** No "next" = no progress to the following phase.
5. Each phase below lists a **✅ Checkpoint** describing what to look at / confirm before moving on.

---

## 0. Locked Decisions

**Goal:** traction + a clean portfolio-grade tool (not monetization). Differentiate on speed, zero-BS UX, and an accessibility-aware angle nobody else nails.

**Tech stack**
- **Framework:** Next.js (App Router), configured for **static export** (`output: export`) — no backend, hostable anywhere.
- **Styling:** Tailwind CSS + **shadcn/ui** primitives.
- **Theme:** generated via **tweakcn** (CSS variables → easy to retheme later). **Light is the default mode**; a working **dark-mode toggle** must be present (`next-themes`, class strategy) — dark is opt-in, not the landing state.
- **Polish libs:** **Aceternity** + **Motion (Framer Motion)** — used **on the landing/hero only**, kept out of the editor to keep the tool instant and no-nonsense.
- **Editor:** **Tiptap** (headless, on ProseMirror) — same engine as NYT/Atlassian/ChatGPT, fully custom UI.
- **Icons:** lucide-react. **Analytics:** Vercel Analytics or Plausible (privacy-friendly, no cookie banner).
- **Testing:** Vitest — runs in Node, no browser needed, fast. Tests live next to `lib/` files.
- **Typography:** mix of **sans + mono** (e.g. Inter/Geist Sans for UI + Geist Mono / JetBrains Mono for accents, counters, code-ish chrome).

**Product decisions (from discussion)**
- **v1 scope:** MVP **+ the hook** — core formatting, copy, char counter, accessibility meter, "see more" fold-line.
- **Layout:** **Editor + live LinkedIn-style preview, side by side.**
- **Formatting UI:** **both** — persistent top toolbar **and** a floating BubbleMenu on text selection.

**Key architecture decision — editing model:**
Edit in **real bold/italic** (CSS applied to Tiptap marks). The fake Unicode characters are generated **only at copy/preview time** via a serializer — never substituted live as you type. This keeps cursor behavior clean, formatting reversible, and the editor itself accessible.

---

## 1. Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Next.js (static export)                                    │
│                                                             │
│  Tiptap editor  ──getJSON()──►  serializer (lib/unicode)    │
│  (real bold via CSS)            doc → Unicode string        │
│        │                              │                     │
│        ▼                              ▼                     │
│  Toolbar + BubbleMenu          Preview card  ──►  Copy      │
│                                Char counter                 │
│                                Accessibility meter          │
└────────────────────────────────────────────────────────────┘
```

**Data flow:** Tiptap holds the source of truth as a structured doc (text nodes + `marks`). On every change we run the serializer to produce the Unicode output, which feeds the preview card, the char counter, the accessibility meter, and the copy button. Nothing depends on a server.

**The serializer (`lib/unicode.ts`) is the heart of the app:**
- Walk the doc; for each text run map marks → style: `bold`, `italic`, `bold+italic → boldItalic`, monospace, etc.
- `underline` → append combining `U+0332` per char; `strikethrough` → combining `U+0336`.
- Bullet list → `• ` prefix per line; ordered list → `1. ` etc.
- Paragraphs → newlines (with LinkedIn-friendly spacing normalization).
- Hand-rolled char maps (A–Z, a–z, 0–9) **+ an exceptions map** (italic `h` = `U+210E`, etc.).
- Iterate by **code point** (`Array.from` / `codePointAt`) — never `charCodeAt` (surrogate pairs).
- Provide the **reverse** (`stripToPlain`) for an "un-format / paste as plain" path.

---

## 2. v1 Feature Set

**Core formatting (toolbar + bubble menu)**
- Bold, Italic, Bold-Italic, Underline, Strikethrough
- Bulleted & numbered lists
- "Strip formatting → plain text"

**Output**
- One-click **Copy** (`navigator.clipboard`) with a copied-confirmation
- Live **LinkedIn-style preview card** (avatar + name mock, real Unicode output)

**LinkedIn helpers**
- **Char counter** (Tiptap `CharacterCount`, ~3,000 limit, warns near cap) — mono font
- **"See more" fold-line** in the preview (approx. mobile truncation point; configurable constant)

**The hook (differentiator)**
- **Accessibility meter:** % of characters that are non-ASCII styled → "Screen readers can't read X% of this post." With a soft "emphasize sparingly" nudge past a threshold.

**Always-on**
- Dark mode toggle, fully responsive, fast (no heavy animation in the editor)

**Explicitly out of v1 (v2+ backlog):** mobile/desktop preview toggle, localStorage autosave, shareable URL-hash links, 20+ extended Unicode styles, emoji picker, Chrome extension.

---

## 3. Proposed File Structure

```
app/
  layout.tsx            # fonts (sans+mono), ThemeProvider, analytics
  page.tsx              # landing/hero (Aceternity/Motion) → CTA into tool
  tool/page.tsx         # the editor app (side-by-side layout)
components/
  editor/
    Editor.tsx          # Tiptap instance + extensions config
    Toolbar.tsx         # persistent B/I/U/S + lists (shadcn buttons)
    BubbleMenu.tsx      # floating menu on selection
  preview/
    PreviewCard.tsx     # LinkedIn-style mock card
    FoldLine.tsx        # "see more" cutoff indicator
  meters/
    CharCounter.tsx
    AccessibilityMeter.tsx
  ui/                   # shadcn primitives
  theme/ThemeToggle.tsx
lib/
  unicode.ts            # style maps + serializer + stripToPlain
  unicode.test.ts       # ~15-20 focused tests: italic h gap, surrogate pairs, passthrough, stripToPlain, doc serializer
  linkedin.ts           # constants: CHAR_LIMIT=3000, FOLD_LINE approx
hooks/
  useSerializedPost.ts  # editor doc → {unicode, charCount, a11yScore}
```

---

## 4. Build Phases (one at a time — see Execution Protocol)

Each phase is a single "execute" unit. We validate at its checkpoint before you say "next step."

**Phase 1 — Scaffold**
Next.js (static export) + Tailwind + shadcn + tweakcn theme + sans/mono fonts + **dark-mode toggle (light default)**. Empty two-pane shell.
- ✅ **Checkpoint:** app runs; two-pane layout visible; **light loads by default**; toggle flips to dark and back; fonts render (sans body, mono accents).

**Phase 2 — Unicode core** *(critical path — riskiest, done before UI)*
`lib/unicode.ts`: `transform(text, style)`, full doc serializer, `stripToPlain`, exceptions map.
`lib/unicode.test.ts`: Vitest test suite covering:
- Basic correctness — one sample string per style (bold, italic, bold-italic, underline, strike, monospace)
- Italic exceptions — `h`, `e`, and the other ~6 edge-case letters that reuse existing Unicode symbols
- Surrogate pair safety — styled chars are multi-byte; confirm no corruption on round-trip
- Passthrough — punctuation, spaces, digits, emoji come through unchanged
- Combined marks — a word that is both bold AND italic serializes correctly
- `stripToPlain` reverses all styled text back to ASCII
- Doc serializer — bullet list items get `• ` prefix; paragraphs produce correct line breaks; nested marks work
- ✅ **Checkpoint:** run `npx vitest run` — all tests green. Then also eyeball a few outputs in the terminal manually (bold/italic/strike/italic-`h`).

**Phase 3 — Editor**
Tiptap (StarterKit + Underline + CharacterCount); real bold/italic editing; Toolbar + BubbleMenu wired to commands.
- ✅ **Checkpoint:** type text; select and bold/italic/underline/strike via both toolbar and the floating bubble; active states light up; lists work; editing feels clean (no cursor weirdness).

**Phase 4 — Serializer wiring (Copy button + Ctrl/Cmd+C override)**
Two clipboard paths, both running text through `serialize` so users get Unicode-styled output either way:
- `useSerializedPost` hook (editor doc → Unicode string) — also feeds the preview and meters in later phases.
- **Copy button** below the editor: serializes the **whole doc** → clipboard, with a "copied!" confirmation. The discoverable primary action.
- **Ctrl+C / Cmd+C override inside the editor**: intercepts the copy event so any selection — partial or full — is serialized through the same pipeline before hitting the clipboard. Implemented via Tiptap's `editorProps.clipboardTextSerializer` (or `handleDOMEvents.copy`) so it only affects copies *out of the editor*; the rest of the page keeps default browser behavior.
- ✅ **Checkpoint:** (a) format text, click Copy, paste into LinkedIn → bold/italic survive; "copied" confirmation fires. (b) format text, select part of it, press Ctrl/Cmd+C, paste into LinkedIn → only the selected slice arrives, styled. (c) plain text outside the editor still copies normally.

**Phase 5 — Preview**
LinkedIn-style preview card rendering the live Unicode output + FoldLine.
- ✅ **Checkpoint:** preview updates as you type; styled text matches what Copy produces; fold-line sits at a believable "see more" point.

**Phase 6 — Meters (the hook)**
CharCounter (~3,000 limit) + AccessibilityMeter.
- ✅ **Checkpoint:** counter tracks length and warns near the cap; a11y meter % rises as you add styled text and the "emphasize sparingly" nudge appears past the threshold.

**Phase 7 — Landing / polish**
Aceternity/Motion hero, responsive pass, dark-mode QA, empty/placeholder states.
- ✅ **Checkpoint:** landing looks sharp and leads into the tool; works on mobile width; dark mode looks right everywhere; editor still feels fast (no heavy animation leaked in).

**Phase 8 — Ship**
SEO meta + OG image, analytics, deploy (Vercel/static). Launch post.
- ✅ **Checkpoint:** production build/export succeeds; deployed URL works; analytics records a visit; OG preview renders.

**Critical path:** Phase 2 gates everything. Nail the serializer + edge cases first.

---

## 5. Implementation Notes / Gotchas

- **Surrogate pairs:** all styled chars are outside the BMP — iterate by code point everywhere.
- **Italic/script gaps:** maintain an exceptions map, not a pure offset (e.g. italic `h` = `U+210E`).
- **Only A–Z/a–z/0–9 have styled forms** — pass punctuation/accents through unchanged.
- **Underline/strike are combining marks**, not a separate alphabet — different code path from bold/italic.
- **Accessibility meter** = (count of styled/non-ASCII code points) / (total letter code points). Keep it honest; it's the differentiator.
- **Fold-line** is approximate (LinkedIn truncates ~140 chars / ~3 lines on mobile, varies) — make it a tunable constant, label it "approx."
- **Keep the editor dependency-light and animation-free**; reserve Motion/Aceternity for the landing.
- **Static export caveat:** no server actions/API routes — everything client-side (which is the whole point).

---

## 6. Design Direction

- **Light is the default**; dark mode is a fully working opt-in toggle. Theme via tweakcn CSS vars so palette swaps are trivial later.
- **Type:** sans for body/UI, **mono for the "tool chrome"** (char counter, a11y %, labels) — gives a clean dev-tool feel.
- **Editor = calm and minimal**; **landing = one tasteful Aceternity/Motion moment** that earns the share, then gets out of the way.
- Generous whitespace, fast transitions only, no gratuitous motion in the workflow.

---

## 7. Traction Plan (post-build)

- SEO is brutal against incumbents — don't rely on it. Lead with the **accessibility angle** as the story.
- Launch thread on Reddit (r/linkedin, r/SideProject), Hacker News "Show HN", IndieHackers — framed as "free, no signup, and it warns you when your bold breaks screen readers."
- Lightweight privacy-friendly analytics to track what actually drives visits.
- v2 hook for repeat traffic: a **Chrome extension** that formats in-place on LinkedIn.

---

## Open items to revisit later
- Exact extended style set for the "more" dropdown (v2).
- Whether to add localStorage autosave in v1.1 (cheap, high "respects me" value).
- OG image / brand name + domain.
