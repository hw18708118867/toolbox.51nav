# SVG 主题类速查（`.dg-*`）

所有类定义在 `src/styles/global.css` 的「教程正文 · 原理示意图」小节。
配色全部走主题 CSS 变量，因此**亮色/暗色模式自动适配，不要写硬编码颜色**。

## 容器

| 类 | 用途 |
|---|---|
| `figure.dg-figure` | 外层容器，`margin: 1.75rem 0`，正文居中 |
| `figcaption` | 图注。格式固定为 `图 N：<一句话概述>…点上面的「播放」可以看……` |

`<figure>` 内部的 `<svg>` 由 CSS 约束为 `width:100%; max-width:840px`。

## 方块（`<rect>`）

| 类 | 视觉 | 典型用途 |
|---|---|---|
| `dg-box` | 中性灰 | 普通节点、中间结果 |
| `dg-box-p` | 蓝（primary） | 输入、输出、当前主角 |
| `dg-box-a` | 紫（accent） | 密钥、派生量、并行分支 |
| `dg-box-w` | 橙（warning） | 风险/警示提示条 |
| `dg-box-g` | 绿（success） | 最终结果、成功态 |

统一 `stroke-width: 1.2`。

## 连线（`<path>` / `<line>`）

| 类 | 视觉 | 典型用途 |
|---|---|---|
| `dg-line` | 灰色实线 + 箭头 | 普通数据流 |
| `dg-line-p` | 蓝色实线 | 主数据通路 |
| `dg-line-a` | 紫色实线 | 反馈/链接（如 CBC 的密文反馈） |
| `dg-dash` | 灰色虚线 | 分组框、归属关系、注释 |
| `dg-frame` | 无填充虚线框 | 把一组操作框起来（如「Round 1」） |

## 文字（`<text>`）

| 类 | 字号 | 字重 | 用途 |
|---|---|---|---|
| `dg-t` | 13px | 常规 | 方块内正文 |
| `dg-tb` | 13px | 600 | 方块标题、标签 |
| `dg-tl` | 11.5px | 600 | 步骤小标题（如 SubBytes） |
| `dg-ts` | 11px | 常规 | 注释、补充说明 |
| `dg-op` | 15px | 常规 | 运算符（⊕、+、×） |

在 `<svg>` 根节点上写 `text-anchor="middle" dominant-baseline="central"`，
之后所有 `<text>` 只需给 `x`/`y` 且坐标为**元素中心**，排版最省事。
个别需要左对齐的加 `text-anchor="start"`，右对齐加 `text-anchor="end"`。

## 状态矩阵单元格（`<rect>`，用于画 4×4 / 8×8 网格）

| 类 | 用途 |
|---|---|
| `dg-cell` | 空格子，也用作网格线的 `stroke` |
| `dg-cell-p` | 蓝色填充格 |
| `dg-cell-a` | 紫色填充格 |
| `dg-cell-x` | 浅紫填充格（表示「与密钥混合后」） |

画网格线的技巧：一个 `<path class="dg-cell" d="M.. V.. M.. V.. M.. H.. M.. H.."/>` 搞定。

## 运算符

```html
<circle class="dg-xor" cx="195" cy="130" r="16"/><text class="dg-op" x="195" y="130">⊕</text>
```

## 箭头 marker 模板

`<defs>` 里按颜色准备 marker，**id 必须全页唯一**（建议 `m1`/`m1p`/`m1a` 按图编号）：

```html
<defs>
<marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
  <path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/>
</marker>
<marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
  <path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/>
</marker>
<marker id="m1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
  <path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/>
</marker>
</defs>
```

用法：`<path class="dg-line" d="M195,80 V112" marker-end="url(#m1)"/>`

## 排版尺寸参考

- `viewBox` 宽度建议 **820 ~ 840**（840 是 CSS `max-width`，再宽不会变大只会变小）
- 标准方块：高 40~44，宽 90~190；小方块：高 34~36，宽 78~110
- 列间距 165~175，行间距 76~82，保持元素横竖对齐
- **文本宽度估算**：一个汉字 ≈ 字号宽度，一个 ASCII 字符 ≈ 0.55 × 字号
  - `dg-t`/`dg-tb`（13px）：6 个汉字 ≈ 78px。一个宽 90 的方块最多放约 6 个汉字
  - `dg-ts`（11px）：宽 190 的方块一行约 17 个汉字
  - 放不下就缩短文案，或用 `<text>` 分两行（y 各差 18px）
