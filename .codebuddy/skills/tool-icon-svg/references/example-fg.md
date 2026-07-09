# Example foreground (fg) snippets

These are valid `fg` markup strings for `tool-icons.ts`. All are white, inside the 48×48 viewBox, and contain only inner SVG elements (no `<svg>` wrapper).

## Clock (used by `timestamp`)
```ts
`<circle cx="24" cy="24" r="14" fill="none" stroke="white" stroke-width="2.5"/><polyline points="24,16 24,24 30,27" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
```

## Cron (clock + gear, used by `cron`)
```ts
`<circle cx="16" cy="24" r="9" fill="none" stroke="white" stroke-width="2.5"/><polyline points="16,17 16,24 21,27" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="33" cy="25" r="5" fill="none" stroke="white" stroke-width="2"/><path d="M33 17v-2M38 19.5l1.5-1.5M41 25h-2M38 30.5l1.5 1.5M28 30.5l-1.5 1.5M27 25h-2M28 19.5l-1.5-1.5" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>`
```

## Simple key (used by `jwt-decode`)
```ts
`<circle cx="19" cy="21" r="6" fill="none" stroke="white" stroke-width="2.5"/><path d="M15 33a8 8 0 0 1 8-8h3v8" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`
```

## Checklist when authoring
- [ ] Only `fill="white"` / `stroke="white"` (no other colors)
- [ ] Symbol stays within the central ~6–42 box
- [ ] `stroke-width` ≈ 2–2.5, `stroke-linecap/linejoin="round"`
- [ ] No `<svg>` wrapper tag — inner elements only
- [ ] Entry key equals the tool's `id`, with `bg(<category>)`
