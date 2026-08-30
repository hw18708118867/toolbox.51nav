---
name: animated-diagram
description: 为本 Astro 教程站的文章（src/content/tutorials/*.md）绘制内联 SVG 原理示意图，并可附带「播放按钮 + 分步骤动画」的交互播放器。适用于用户要求给教程文章配原理图、流程图、架构图、算法过程图，或要求把已有的图改成可以点播放动态演示的版本。
---

# 教程原理示意图（内联 SVG + 可播放动画）

## Overview

在教程正文里插入**手写内联 SVG** 的原理图，配色走站点的 `.dg-*` 主题类，
因此亮色/暗色模式自动适配、无需图片文件、不引入任何第三方图表库。

可播放动画采用**渐进增强**：不点播放时整张图完整静态可见，
播放后才按步骤逐段点亮，并配合流动虚线表现数据流向。
爬虫、无 JS 环境、RSS 读者看到的都是完整原理图。

参考实现：`src/content/tutorials/aes.md`（5 张图，含 3 种不同编排风格），
动手前先读其中一两张，比读本文档更快建立直觉。

## 决策：静态图 or 可播放图

| 判断 | 结论 |
|---|---|
| 表达的是**过程/流程**（数据怎么一步步被处理） | 做可播放图 |
| 表达的是**结构/关系/对照**（谁包含谁、A 和 B 有什么区别） | 做静态图 |
| 图里有「先后」概念（多轮迭代、链式依赖、逐块处理） | 优先可播放图 |
| 一眼看全才有意义（层级树、对照表） | 静态图，拆成分步反而破坏整体感 |

拿不准就做可播放图——静态图只是「少写一个 `data-steps`」的特例。

## 工作流程

### 1. 规划（可播放图）

先列出步骤，再画图。**步骤数 = 阶段数**，从输入开始、到输出结束。

- 常规流程 4~8 步；多轮迭代可把中间的多轮合并成一步（如「Round 3 ~ Round 9，结构完全相同」）
- 每步只描述**这一步的动作**，不要把整张图复述一遍
- 最后一步通常是结论或风险提示，配一条通栏提示条（`dg-box-g` 推荐 / `dg-box-w` 风险）

### 2. 画坐标

在写 SVG 前先在脑中排好坐标，遵守这些尺寸（来自实际的图，视觉已验证）：

- `viewBox` 宽 **820 ~ 840**（840 是 CSS `max-width`，再宽只会等比缩小）
- 标准方块 高 40~44 / 宽 90~190；小方块 高 34~36 / 宽 78~110
- 列间距 165~175，行间距 76~82，元素横竖对齐
- `viewBox` 高 = 内容底部 + 24

**文本宽度估算**（最容易翻车的地方）：一个汉字 ≈ 字号宽度，ASCII ≈ 0.55 × 字号。

- `dg-t` / `dg-tb` 为 13px：宽 90 的方块最多约 6 个汉字；宽 110 约 8 个
- `dg-ts` 为 11px：宽 190 的方块一行约 17 个汉字
- 放不下就缩短文案，或拆成两行 `<text>`（y 相差 18px）

### 3. 写 SVG

从 `assets/templates/` 挑一个最接近的模板改，**不要从空白开始**：

| 模板 | 适用 |
|---|---|
| `pipeline.svg` | 数据经若干串行/并行阶段的流程（首选） |
| `matrix-transform.svg` | 对同一组数据反复做变换（轮函数、卷积、置换） |
| `compare-branches.svg` | 同一输入走不同分支，或正确 vs 错误做法对比 |
| `static.svg` | 结构关系、层级，不做动画 |

完整类名与 snippets 见 `references/svg-classes.md`。

### 4. 挂播放器（可播放图）

按步骤把元素包进 `<g data-step="N">`（N 从 0 开始，与 `data-steps` 下标一一对应）：

- 同一个步骤号可以出现在多个 `<g>` 上。惯例：**方块一组**、**连线一组**
- 方块组加 `class="dg-pop"`（放大入场），连线组加 `data-flow="1"`（流动虚线）
- 元素只归属它**第一次出现**的那一步，后续靠 `is-done` 保持淡显
- 章节标题、贯穿全图的辅助线**不要**加 `data-step`

完整协议、常见错误见 `references/player-protocol.md`。

### 5. 校验（必做）

```bash
python3 .codebuddy/skills/animated-diagram/scripts/validate_diagram.py src/content/tutorials/<文章>.md
```

会检查：XML 合法性、marker id 全页唯一、步骤分组无缺口/不越界、
`data-flow` 分组未混入方块、figure 内无空行、文本溢出估算、硬编码颜色。
**有错误必须修完再继续**，警告酌情处理（文本溢出和硬编码颜色建议都修）。

脚本也能直接校验模板文件（`assets/templates/*.svg`），改完模板顺手跑一遍。

### 6. 构建验收

```bash
npm run build
```

再抽查产物，确认 `data-steps` 的 JSON 在 HTML 转义后没有被破坏：

```bash
python3 -c "
import re, json, html
h = open('dist/tutorials/<文章>/index.html', encoding='utf-8').read()
for i, a in enumerate(re.findall(r'data-steps=\"([^\"]+)\"', h), 1):
    print(i, len(json.loads(html.unescape(a))), '步')
"
```

## 硬性约束（违反会导致渲染错乱）

1. **`<figure>` 内部不能有空行**——空行会提前闭合 `</svg>`，让后续 `<g data-step>` 掉到
   SVG 外面的 `<p>` 里，动画直接失效。实测证据见 `references/player-protocol.md`
2. **`data-flow` 必须写成 `data-flow="1"`**——裸属性 `data-flow` 是非法 XML
3. **marker `id` 全页唯一**——建议按图编号 `m1` / `m1p` / `m1a`、`m2` / `m2p` ……
   两张图用同一个 id 会导致箭头互相串
4. **`data-steps` 用单引号包裹属性、内部 JSON 用双引号**，免去转义
5. **不要硬编码颜色**——一律用 `.dg-*` 类，否则暗色模式下会看不见
6. **SVG 里不能出现裸的 `<` 和未转义的 `&`**——需要时用 `&lt;` `&amp;`
7. 在 `<svg>` 根写 `text-anchor="middle" dominant-baseline="central"`，
   之后 `<text>` 只需给中心坐标，排版最省事
8. 直接写裸 HTML，**不要**放进围栏代码块里

## 图注规范

```html
<figcaption>图 3：ECB 模式。每个块用同一把密钥独立加密……点上面的「播放」可以看这个过程。</figcaption>
```

- 以 `图 N：` 开头，N 按文章内顺序递增
- 中间是一句话概括**整张图**（不是复述动画）
- 可播放图末尾追加「点上面的「播放」可以看……」

## 资源

### scripts/

- `validate_diagram.py` — 校验 md 里所有 figure 的结构与动画配置。写完图后必跑

### references/

- `svg-classes.md` — `.dg-*` 全套类名、marker 模板、排版尺寸参考
- `player-protocol.md` — `data-steps` / `data-step` / `data-flow` 协议与常见错误

### assets/templates/

- `pipeline.svg` / `matrix-transform.svg` / `compare-branches.svg` / `static.svg`
  均为带注释的起点模板，复制到正文后改坐标和文案即可
