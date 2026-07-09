---
name: tool-component-conventions
description: This skill should be used when adding a new tool/feature component to this Astro + Vue web-tools site. It encodes the exact file locations, registry entry format, dynamic-loader registration, shared UI component API, CSS-variable theming, and the optional tutorial wiring required so a new tool renders correctly and stays visually consistent with the ~170 existing tools.
---

# Tool Component Conventions

## Purpose

This site (Astro + Vue) renders each tool as a Vue SFC mounted into a dynamic loader. A new tool touches **four fixed files** (plus one optional tutorial file). Following the exact conventions below prevents the two most common breakages: a missing loader entry that fails the entire site build, and a style/icon mismatch with existing tools.

## When to use

Use this skill whenever the task is to **add, remove, or refactor a tool component** in this repo — including new converters, security tools, generators, etc. Also apply the component API and CSS-variable rules when editing an existing tool's UI.

## File map

| Concern | Path | Notes |
|---|---|---|
| Component | `src/components/tools/<category>/<Name>Tool.vue` | One SFC per tool. `<Name>` matches the registry `component` value (e.g. `CronTool`). |
| Registry | `src/data/tools-registry.ts` | Array of tool objects. `category` must be one of the ids in `src/data/categories.ts`. |
| Loader | `src/pages/tools/[category]/[tool].astro` | A `ComponentName: () => import('...')` line in the dynamic import map. **Required for the page to render.** |
| Icon | `src/data/tool-icons.ts` | Keyed by **`tool.id`** (NOT the registry `icon` field — `icon` is legacy/unused for rendering). Must contain an entry or the icon falls back to a `?`. |
| Tutorial (optional) | `src/content/tutorials/<toolId>.md` | Content-collection doc; see the `seo-tutorial-writer` skill for its schema. |

## Registry entry format

Add one object to the array in `tools-registry.ts`:

```ts
{ id: 'cron', category: 'converter', name: 'Cron 表达式生成/解析',
  description: '…',                       // 简短一句话，显示在工具页与卡片
  keywords: ['Cron', 'crontab', …],       // 用于 SEO/检索
  component: 'CronTool',                  // 对应 SFC 文件名（无 .vue）
  icon: 'clock',                          // 遗留字段，可保留但渲染不看它
  popular: true,                          // 是否进“热门”
  phase: 2,                               // 上线批次
  related: ['timestamp', 'radix'],        // 工具页底部“相关工具”
  useCases: ['…', '…'] }                  // 3–5 条真实使用场景，展示在工具页
```

## Loader registration (critical)

In `src/pages/tools/[category]/[tool].astro`, add a line inside the existing dynamic-import map:

```ts
CronTool: () => import('../../../components/tools/converter/CronTool.vue'),
```

- The key must exactly equal the registry `component` value.
- **Deleting a component file is NOT enough** — its loader line must also be removed, otherwise the whole site build fails (Vite cannot resolve the missing import). The reverse is also true: never leave a loader line pointing at a non-existent file.

## Component API conventions

Every tool SFC should reuse the shared primitives (import from `../../common/`):

- `TabView` — `:tabs="['标签1','标签2',…]"`, slots `#tab-0`, `#tab-1`, …
- `TextInput` — `v-model`, `label`, `placeholder`, `:rows`
- `CopyButton` — `:text` to copy
- `ErrorAlert` — `:message`
- `AnimatedIcon` — only used in layouts, not inside tools.

Theming uses CSS custom properties (never hard-coded colors):

- `--color-bg`, `--color-bg-secondary`, `--color-border`
- `--color-text`, `--color-text-muted`, `--color-text-secondary`, `--color-primary`

Example card wrapper used in existing tools:

```vue
<div class="rounded-md border p-4" style="background-color: var(--color-bg-secondary); border-color: var(--color-border);">
  <p class="text-xs" style="color: var(--color-text-secondary);">中文描述</p>
  <p class="text-base font-medium" style="color: var(--color-text);">{{ result.description }}</p>
</div>
```

Long value strings (e.g. field breakdowns) must wrap — use a `<table>` with `break-all` on the value cell, not a 2-column grid, to avoid overflow.

## Known-good example

`src/components/tools/converter/CronTool.vue` is a reference implementation: three tabs (解析 / 可视化生成 / 最近执行时间), pure-frontend logic, shared components, CSS variables, and a tutorial at `src/content/tutorials/cron.md`. Mirror its structure for new tools.
