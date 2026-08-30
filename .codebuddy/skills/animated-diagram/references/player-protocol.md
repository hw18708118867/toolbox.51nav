# 可播放动画协议

播放器实现位于 `src/lib/diagram-player.ts`，由 `src/layouts/TutorialLayout.astro`
在教程页底部导入并调用 `initDiagramPlayers()`。**全站教程页共用，无需重复接入。**

## 设计原则：渐进增强

未点播放时，整张图**完整静态可见**（所有 `<g data-step>` 都显示）。
这意味着爬虫、无 JS 环境、RSS 读者看到的都是完整原理图，动画只是增强。
因此**绝不能**把「只有点播放才能看到的信息」作为唯一表达。

## 触发条件

```html
<figure class="dg-figure" data-interval="1900" data-steps='[{"t":"标题","d":"说明"}, ...]'>
```

- `class="dg-figure"` — 必须，播放器按此选择器查找
- `data-steps` — 步骤数组，**单引号包裹属性、内部 JSON 用双引号**，省去转义
- `data-interval` — 每步停留毫秒数，可省略（默认 1800）。文字较长的步骤建议 2100~2300

## `data-steps` 每项字段

| 字段 | 说明 |
|---|---|
| `t` | 步骤标题，短（4~12 字），显示在说明框加粗处 |
| `d` | 步骤说明，一到两句话，讲清「这一步做了什么、为什么」 |

写作要点：只描述**当前这一步**的动作，不要把整张图复述一遍。
最后一步通常是总结或风险提示（配合 `dg-box-w` / `dg-box-g` 做提示条）。

## 元素分组：`data-step`

把 SVG 元素按步骤包进 `<g>`，**N 从 0 开始**，必须与 `data-steps` 下标一一对应：

```html
<g class="dg-pop" data-step="0"> ...第 1 步出现的方块... </g>
<g data-step="1" data-flow="1"> ...第 2 步的连线... </g>
<g class="dg-pop" data-step="1"> ...第 2 步出现的方块... </g>
```

规则：

- 同一个步骤号可以出现在**多个** `<g>` 上（常见：一个装方块、一个装连线）
- 每个步骤号**至少要有**一个分组，否则动画会跳过该步
- 元素只属于**它第一次出现**的那一步，不要重复归属（后续步骤靠 `is-done` 保持淡显）
- 公共底图（章节标题、贯穿全图的辅助线）**不要**加 `data-step`，让它始终可见

## 两种装饰类

| 类/属性 | 作用 |
|---|---|
| `class="dg-pop"` | 该组激活时轻微放大入场。用于**方块类**分组 |
| `data-flow="1"` | 该组激活时走「流动虚线」动画。用于**连线类**分组 |

注意：`data-flow` 必须写成 `data-flow="1"`，裸属性 `data-flow` 是非法 XML。
`data-flow` 分组里**只能放** `path` / `line` / `polyline` / `text`，混入 `rect` 会导致方块也被套上虚线动画。

## 三态视觉

播放器给每个 `[data-step]` 元素加状态类，CSS 负责渲染：

| 状态 | 类 | 效果 |
|---|---|---|
| 未到 | `is-hidden` | `opacity: 0` 淡出 |
| 当前 | `is-active` | 全亮 + 主题色 `drop-shadow` 辉光 |
| 已过 | `is-done` | `opacity: .38`，保留已走过的过程 |

过渡 `0.4s ease`；`prefers-reduced-motion` 下自动关闭动画。

## 播放器注入的 UI

自动插在 `<svg>` 之前，无需手写：

```
[▶ 播放] [↻ 重播] [＋ 查看全图] [速度 ▾] ① ② ③ …
┌─────────────────────────────────┐
│ 步骤 3 / 11   标题              │
│ 说明文字……                       │
└─────────────────────────────────┘
```

- 播放/暂停/继续/重播 四态合一（播完自动变「重播」）
- 速度：0.5× / 1× / 1.5× / 2×
- 圆点：点击跳转到任意步骤，并暂停当前播放
- 查看全图：恢复静态完整图

## 常见错误

| 现象 | 原因 |
|---|---|
| 图没有任何控件 | `figure` 上少了 `data-steps`，或 JSON 解析失败 |
| 点了播放但某步空白 | 该步骤号没有任何 `data-step` 分组 |
| 方块边缘出现虚线 | `data-flow` 分组里混入了 `rect` |
| 两张图的箭头互相串了 | 两张 SVG 用了相同的 marker `id` |
| 部分 `<g>` 跑到 SVG 外面、动画失效 | `<figure>` 内部有空行，见下 |

## 为什么 `<figure>` 内不能有空行（已实测）

Markdown 的 HTML 块（CommonMark type 6）遇到空行就结束。空行之后的
`<g data-step="N">…</g>` 不是浏览器认知的块级标签，会被当成段落正文处理。

本站 Astro 管线下实测，源文本：

```html
<figure class="dg-figure">
<svg viewBox="0 0 100 20"><g data-step="0"><rect …/></g>

<g data-step="1"><rect …/></g></svg>
<figcaption>图注A</figcaption>
</figure>
```

渲染结果（注意 `</svg>` 被提前闭合、第二个 `<g>` 掉进 `<p>` 里、脱离了 SVG）：

```html
<svg viewBox="0 0 100 20"><g data-step="0"><rect …></rect></g>
</svg><p><g data-step="1"><rect …></rect></g></p>
<figcaption>图注A</figcaption>
</figure>
```

后果：第二个分组不属于 SVG，播放器查不到它，动画直接失效。
**这一条没有例外**，写图时务必保证 `<figure>` 到 `</figure>` 之间零空行。
校验脚本会把它报为错误。
