---
title: "CSS 渐变详解：linear-gradient 背后的插值原理"
toolId: css-gradient
category: css
description: "深入理解 CSS 线性/径向/圆锥渐变的工作原理、色标插值方式、角度计算，以及为什么渐变颜色有时发灰"
keywords: [CSS渐变, linear-gradient, radial-gradient, conic-gradient, 色标插值, 渐变生成]
author: 开发工具箱
date: 2026-06-17
phase: 3
relatedTools: [color-convert, css-shadow]
relatedTutorials: [color-convert]
---

## 渐变是"按位置算颜色"

CSS 渐变（gradient）本质是一个**按位置插值生成颜色**的函数。你给它几个色标（color stop）和位置，浏览器在两点之间做数学插值，算出每个像素该是什么颜色，最终画出一张无锯齿的过渡图。所以渐变是**程序生成的图像**，不是图片文件——它无限放大不失真、体积为零（几行 CSS）。

`linear-gradient(90deg, red, blue)` 的意思是：从左（0%）到右（100%），颜色从红插值到蓝，中间每个位置的颜色是红蓝按比例混合。

## 三种渐变类型

### 线性渐变 linear-gradient

沿一条直线方向插值。方向用角度或关键字指定：

- `to right` = `90deg`：从左到右
- `to bottom` = `180deg`：从上到下（默认）
- `45deg`：从左下到右上的对角
- `0deg` = `to top`：从下到上

**角度的语义容易搞反**：`0deg` 是向上（to top），顺时针增加，`90deg` 向右。记法：角度指"渐变线指向的方向"。

```
linear-gradient(45deg, red, blue)
```

### 径向渐变 radial-gradient

从一个中心点向外辐射，圆形或椭圆。常做光晕、聚光灯效果：

```
radial-gradient(circle at center, white, transparent)
```

可指定形状（circle/ellipse）、中心位置（at center / at 50% 50%）、大小（farthest-corner 等）。

### 圆锥渐变 conic-gradient

绕中心点旋转扫过一圈，像雷达图、饼图。和径向的区别：径向是"距离中心多远"，圆锥是"绕中心多少角度"：

```
conic-gradient(red, yellow, green, blue, red)
```

圆锥渐变是做饼图、色环最简洁的方式，无需 SVG。

## 色标（Color Stop）与位置

色标定义"在某个位置出现某个颜色"，浏览器在相邻色标间插值：

```
linear-gradient(to right, red 0%, blue 100%)        /* 标准两端 */
linear-gradient(to right, red, green 50%, blue)     /* 三色标，中间停绿 */
linear-gradient(to right, red 20%, blue 20%)        /* 硬切，无过渡 → 色带分界 */
linear-gradient(to right, red 40%)                  /* blue 隐含在 100% */
```

关键技巧：

- **两个色标同位置** = 硬边界，没有过渡，做出色块拼接
- **位置可省略**：浏览器自动均匀分配，第一个默认 0%，最后一个默认 100%
- **位置可超 0~100%**：超出范围会让渐变"压缩"，配合 background-size 做出循环条纹

## 插值为什么有时"发灰"

红渐变到绿，中间常出现一段灰暗的褐色，不好看。原因：默认插值在 **RGB 空间**做线性混合，而 RGB 空间**感知不均匀**——红(255,0,0)和绿(0,255,0)的中点(127,127,0)在人眼看来是暗浊的橄榄色，不是"明亮的黄"。

CSS 现在支持指定**插值颜色空间**（Color 4 / CSS Color Module Level 4）：

```css
linear-gradient(in oklch, red, green)
linear-gradient(in hsl longer hue, red, green)
```

- `oklch`/`oklab`：感知均匀空间，过渡更自然、不发灰
- `hsl` 的色相插值：沿色环走，能经过黄、青等中间色，过渡鲜艳
- `longer hue`/`shorter hue`：控制色相走长弧还是短弧

这是高质量渐变的关键——遇到"中间发灰"时，换 oklch 或 hsl 插值能立刻改善。详见 [[color-convert]] 关于颜色空间的内容。

## 重复渐变

`repeating-linear-gradient` / `repeating-radial-gradient` 让渐变模式重复，做条纹背景：

```css
repeating-linear-gradient(45deg, #fff 0 10px, #000 10px 20px)
```

这是用纯 CSS 做斑马纹、棋盘格、进度条纹理的标准手法，零图片、可缩放。

## 浏览器兼容与写法

- 线性/径向渐变：全浏览器支持多年，无需前缀
- 圆锥渐变：现代浏览器支持，老 Safari 需注意
- `in oklch` 插值空间：较新特性，旧浏览器降级到默认 RGB

生成器输出的 CSS 通常已是兼容写法，直接复制可用。注意渐变作为 `background-image` 而非 `background-color`——渐变是图像。

## 渐变之上：还能叠加

`background` 支持多层叠加，渐变可叠渐变、叠图片：

```css
background: 
  linear-gradient(rgba(0,0,0,0.5), transparent),
  url("photo.jpg");
```

常见做法：图片上叠一层半透明黑→透明的渐变做暗角，让文字可读。多层渐变用逗号分隔，先写的在上层。

## 小结

CSS 渐变是"按位置插值颜色"的程序生成图像，分线性/径向/圆锥三种。色标定义颜色锚点，相邻色标间插值。默认 RGB 插值会"发灰"，换 oklch 或 hsl 色相插值能得到更自然的过渡。重复渐变做条纹、多层叠加做暗角是实用技巧。理解了插值原理，渐变生成器输出的每行 CSS 就不再是黑盒。颜色空间细节见 [[color-convert]]。
