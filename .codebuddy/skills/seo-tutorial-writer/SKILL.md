---
name: seo-tutorial-writer
description: This skill should be used when writing or editing tutorial articles (src/content/tutorials/*.md) for this site. It ensures the article meets Google indexing requirements (sufficient length, structured headings, genuine value) while keeping a natural, human, non-AI tone, and that the content-collection frontmatter is valid so the production build does not break.
---

# SEO Tutorial Writer

## Purpose

Tutorials are the site's main organic-traffic driver. Each must (a) satisfy Google's content-depth signals, (b) read like a real person wrote it (no "AI flavor"), and (c) parse as valid YAML so `npm run build` succeeds. This skill captures the frontmatter schema, length/structure targets, tone rules, and the quoting pitfall that has broken builds before.

## When to use

Use when creating or rewriting any file under `src/content/tutorials/`, or when asked to "write a tutorial" / "make the docs SEO-friendly" for a tool.

## Frontmatter schema (enforced by `src/content/config.ts`)

```yaml
---
title: '标题（含中文/双引号时用单引号包裹）'
toolId: 'cron'                       # 必须与 tools-registry.ts 的 id 一致，工具页才能关联
category: 'converter'                # 必须是 categories.ts 里的分类 id
description: '一句话摘要，会出现在搜索结果里；含双引号同样用单引号包'
keywords:
  - 'Cron'
  - 'crontab'
  - '定时任务'
author: '开发工具箱'                 # 可选，默认即此值
date: 2026-07-08                     # 必填，ISO 日期
updated: 2026-07-08                  # 可选
phase: 1                             # 可选，1–3，默认 1
relatedTools: ['timestamp', 'radix'] # 可选
relatedTutorials: []                 # 可选
---
```

**Critical quoting rule:** if `title` or `description` contains a literal double quote `"`, the entire value MUST be wrapped in single quotes `'…'`. A bare double-quoted YAML scalar containing another `"` breaks the parser and fails the whole build. Single quotes inside a single-quoted scalar are escaped by doubling them (`'It''s'`).

The file name must be `<toolId>.md` (e.g. `cron.md`) so the route `/tutorials/<toolId>` and the tool page cross-link correctly.

## Length & structure targets

- **Body length:** ≥ 1500 Chinese characters (≈ 2000+ is safer for competitive keywords). Thin pages get filtered out of rankings.
- **Headings:** use real `<h2>`/`<h3>` (`##` / `###`) with descriptive, keyword-bearing titles — they become the TOC and help topical relevance. Avoid a single wall of text.
- **Recommended skeleton:**
  1. **Hook** — open with a concrete incident or confusion (e.g. "上次线上定时任务没触发，排查了半小时才发现是日期和星期字段的'或'逻辑"), not generic scene-setting.
  2. **Core concept** — explain the format field by field with a table.
  3. **Symbol / edge-case reference** — `*` `,` `-` `/` `?`, and the day/week "OR" rule, timezone, leap year.
  4. **Worked examples** — a copy-paste table mapping expression → meaning.
  5. **Debugging / FAQ** — 4–6 real questions a beginner would ask.
  6. **Related tools** — link to sibling tools.

## Tone: avoid "AI flavor"

Write like a developer explaining to a colleague. Specifically:

- **Do not** open with "在当今…时代", "随着…的发展", "值得注意的是", "总而言之", "它不仅…而且…"。
- **Do not** lean on "首先 / 其次 / 最后" as the only connective tissue, or pad with three nearly-identical bullet points.
- **Do** use first-person where natural ("我踩过的坑", "后来发现"), concrete numbers, and short sentences.
- **Do** prefer specific, memorable phrasing over abstract filler. If a sentence could appear in any AI-generated blog, rewrite it.
- Keep code/commands verbatim and correct; never paraphrase a shell command into something that won't run.

## Validation before finishing

1. Confirm the frontmatter parses (no YAML errors) — a broken quote here fails the entire `npm run build`.
2. Confirm `toolId` matches a real registry entry.
3. Confirm body is long enough and has ≥ 4 distinct headings.
