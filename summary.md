# LinkedIn Post Formatter — Project Research & Plan

A summary of our discussion about building a no-nonsense, no-signup web tool for formatting LinkedIn posts (bold, italic, etc.).

---

## The Problem

LinkedIn's post editor has **no native rich text** — no bold, italics, underline, headings, or bullets. It only supports plain text, line breaks/whitespace, and emojis.

People work around this with Unicode "font" tricks, but existing converters often:
- Require email signups, or
- Force you to convert text **section by section** (5 emphasized sections = 5 round-trips), which was the original frustration that sparked this idea.

---

## 1) Is this a good use case?

**Verdict: real but small ("papercut") problem, and largely already solved.**

- The pain is genuine — LinkedIn really has no formatting.
- But the better existing tools already fix the section-by-section issue with select-and-click editors.
- Known downsides of the Unicode trick (and our best feature angles):
  - **Accessibility:** screen readers read styled text as "Mathematical Bold Small B…" or skip it silently — heavy use makes posts inaccessible.
  - **Not searchable:** LinkedIn search won't match Unicode-styled words; can hurt keyword/SEO matching.
  - **Best practice = restraint:** emphasize a few words, not paragraphs.

---

## 2) Competition & whether to build it

**The space is saturated, and most competitors are already free + no-signup.** 15+ tools found on the first search pages, including:

- Nuelink ("No Signup Required" in the title)
- WaveGen (highlight → toolbar, fold-line preview, mobile/desktop toggle)
- Post-Bridge (inline B/I/U/S toolbar, select-and-click, live preview)
- usefmtly (20+ styles, real-time preview)
- Supergrow, Taplio, Typefully, Triorama, Blabigo
- PostFormatter (Chrome extension — floating toolbar directly on LinkedIn)

The exact "highlight 5 sections and bold each" flow already exists for free (Post-Bridge, WaveGen, PostFormatter).

**Honest take (goal = traction, not money):**
- Not a greenfield opportunity; don't expect to win Google SEO against incumbents.
- Still a legitimate niche: most rivals are upsell-y loss-leaders bolted onto paid SaaS. A genuinely fast, ad-free, single-purpose, **accessibility-aware** tool is a valid angle.
- Traction would come from a **hook** (accessibility checker, in-page Chrome extension, dev-tool integration) + a Reddit/HN "no signup, no BS" launch — not from search ranking.
- **Net:** good weekend project + portfolio piece + plausible niche traction. Lead with a differentiator, not "another formatter."

---

## 3) How bolding actually works (the tech)

**It is NOT encoding or formatting — it's character substitution.**

- Uses the Unicode **Mathematical Alphanumeric Symbols** block (range `U+1D400–U+1D7FF`).
- Regular `A` = `U+0041`. "Bold" `𝗔` = `U+1D5D4` — a *completely different character* that happens to look bold.
- LinkedIn isn't bolding anything; you're typing different letters. That's why it survives the plain-text editor — there's nothing to strip.
- **You don't need LinkedIn's cooperation.** A custom editor just maps selected characters to their styled counterparts.

Minimal JS sketch:

```js
// Sans-serif bold starts at U+1D5D4 ('A') and U+1D5EE ('a')
function toBold(str) {
  return Array.from(str).map(ch => {
    const c = ch.codePointAt(0);
    if (c >= 65 && c <= 90)  return String.fromCodePoint(0x1D5D4 + (c - 65)); // A–Z
    if (c >= 97 && c <= 122) return String.fromCodePoint(0x1D5EE + (c - 97)); // a–z
    if (c >= 48 && c <= 57)  return String.fromCodePoint(0x1D7EC + (c - 48)); // 0–9
    return ch; // spaces, punctuation pass through unchanged
  }).join('');
}
```

**Three gotchas:**
1. **Outside the BMP** — iterate by code point (`Array.from`, `codePointAt`, `for...of`). Never `charCodeAt`/`str[i]` or you corrupt surrogate pairs.
2. **Italic has gaps** — e.g. italic `h` reuses `U+210E` (Planck constant ℎ). Needs a small exceptions map, not a pure offset.
3. **Only A–Z, a–z, 0–9 have styled forms** — punctuation/accents/other scripts pass through unchanged.

To support un-bolding: keep the original plaintext in state and re-render styles on top, or build a reverse map.

---

## Feature Set (client-side only — no backend/auth/DB)

Effort: 🟢 trivial · 🟡 easy · 🟠 moderate

### Core formatting (MVP)
- 🟢 Bold (sans-serif)
- 🟢 Italic (mind the gaps)
- 🟢 Bold italic
- 🟢 Underline (combining char `U+0332`)
- 🟢 Strikethrough (combining char `U+0336`)
- 🟡 Extra styles in a "more" dropdown: monospace, serif bold, script/cursive, double-struck

### Editor UX
- 🟠 **Select-and-apply WYSIWYG** (core fix for section-by-section). Keep plaintext + `{start, end, style}` ranges in state; re-render on change. **Build this first — everything hangs off it.**
- 🟢 One-click copy (`navigator.clipboard.writeText`)
- 🟢 Clear / reset
- 🟢 Strip formatting → plain text
- 🟡 Keyboard shortcuts (Cmd/Ctrl+B, +I)
- 🟡 Auto-save draft to `localStorage`
- 🟢 Undo/redo (snapshot stack on the state model)

### LinkedIn-specific helpers
- 🟡 "See more" fold-line preview (~3 lines / ~140 chars mobile)
- 🟢 Live character counter (~3,000 limit, warn near cap)
- 🟡 Mobile vs desktop preview toggle
- 🟢 Bulleted / numbered list button (`•`, `▪`, `➤`, `1.`)
- 🟢 Line-break / blank-line cleaner
- 🟢 Hashtag & @mention highlighter (preview only)

### Differentiators
- 🟡 **Accessibility meter** — % non-ASCII styled chars + warning. The standout feature.
- 🟢 "Emphasize sparingly" nudge
- 🟡 Emoji picker (or rely on OS picker)
- 🟡 Shareable link via URL hash (base64, no backend)

### Skip (scope traps)
- ❌ Direct "post to LinkedIn" (needs OAuth/API approval — breaks no-signup)
- ❌ AI post generation (the bloated-SaaS path)
- ❌ Scheduling, analytics, accounts (need a backend)

### Suggested build order
1. Plaintext + ranges state model → render to Unicode
2. Bold / italic / bold-italic / underline / strikethrough (select-and-apply)
3. Copy + clear + strip-formatting
4. Char counter + fold-line preview
5. localStorage auto-save
6. Accessibility meter (the hook)

---

## Sources

- https://expandi.io/blog/formatting-linkedin-posts-text/
- https://magicpost.in/blog/linkedin-post-formatting
- https://en.wikipedia.org/wiki/Mathematical_Alphanumeric_Symbols
- https://www.m365princess.com/blogs/bold/
- https://axbom.com/dont-fake-bold-and-italic-text-with-unicode/
- https://nuelink.com/tools/linkedin-text-formatter
- https://wavegen.ai/linkedin-text-formatter
- https://www.post-bridge.com/tools/linkedin-text-formatter
- https://usefmtly.com/tools/text-tools/linkedin-text-formatter/
- https://postformatter.com/
