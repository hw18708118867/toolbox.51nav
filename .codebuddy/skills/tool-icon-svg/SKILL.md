---
name: tool-icon-svg
description: This skill should be used when a tool needs a new app-style icon. It documents the exact SVG conventions (48x48 viewBox, white foreground symbol rendered over an auto-drawn category gradient background, entry keyed by tool.id) so new icons stay visually consistent with the existing 170+ tool icons.
---

# Tool Icon SVG

## Purpose

Every tool icon is a small white line/fill symbol drawn on top of a gradient rounded-rect that the `AnimatedIcon.astro` component renders automatically. The foreground markup lives in `src/data/tool-icons.ts`. This skill records the exact coordinate system, styling rules, and keying convention so new icons match the set.

## When to use

Use when adding or editing a tool's icon 〞 i.e. any time a new `tool.id` is introduced in `tools-registry.ts` and needs its `tool-icons.ts` entry.

## Keying convention (critical)

`getToolIcon(toolId)` looks the entry up **by `tool.id`**, not by the registry `icon` field (which is legacy and unused for rendering). Add the entry under the tool's id:

```ts
'cron': { bg: bg('converter'), fg: `<circle cx="16" cy="24" r="9" ＃/>` },
```

- `bg('converter')` 〞 use the `bg()` helper with the tool's category id. Available categories include: `encoding, encryption, hashing, text, regex, data-format, network, security, converter, image, css, javascript, generator, math, document, analysis`.
- If no entry exists for an id, `AnimatedIcon` renders a white `?` over the category gradient 〞 so always add one.

## Foreground (`fg`) rules

- The SVG is injected into a parent `<svg viewBox="0 0 48 48">`. Author the `fg` markup in that same 48℅48 coordinate space.
- The background rounded rect + glossy overlay are drawn by the component at `x=2 y=2 w=44 h=44 rx=11`. Keep the symbol inside roughly the central `x:6每42, y:6每42` area so it doesn't touch the edges.
- Color: **white only** 〞 use `fill="white"` or `stroke="white"`. No other colors (the gradient provides the color).
- Use `stroke-width` around `2`每`2.5` for line icons; set `stroke-linecap="round"` and `stroke-linejoin="round"` for a friendly app-icon look.
- The `fg` string is passed through `set:html`, so it must be valid SVG markup (no surrounding `<svg>` tag 〞 only inner elements).

## Reference example (the `cron` icon)

```ts
'cron': {
  bg: bg('converter'),
  fg: `<circle cx="16" cy="24" r="9" fill="none" stroke="white" stroke-width="2.5"/>` +
      `<polyline points="16,17 16,24 21,27" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>` +
      `<circle cx="33" cy="25" r="5" fill="none" stroke="white" stroke-width="2"/>` +
      `<path d="M33 17v-2M38 19.5l1.5-1.5M41 25h-2M38 30.5l1.5 1.5M28 30.5l-1.5 1.5M27 25h-2M28 19.5l-1.5-1.5" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`,
},
```

This pairs a clock (left) with a gear/settings mark (right) 〞 a good pattern when a tool combines two concepts: compose two simple, recognizable symbols rather than one ambiguous shape.

## Workflow

1. Decide the symbol(s) that best represent the tool (one clear concept, or two composed).
2. Sketch coordinates inside the 48℅48 box; keep strokes ~2每2.5 and white.
3. Add the entry to `tool-icons.ts` keyed by `tool.id`, with `bg(<category>)`.
4. Verify by loading the tool page 〞 the icon should appear next to the title; a `?` means the key is missing or misspelled.
