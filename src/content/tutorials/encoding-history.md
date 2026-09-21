---
title: '编码的进化史：从莫尔斯电码到 UTF-8，字符如何变成 0 和 1'
toolId: encoding-history
category: encoding
description: '从莫尔斯电码、ASCII、各国编码到 Unicode 与 UTF-8，讲清字符与二进制之间的转换，以及 ASCII/GBK/UTF-8/Base64/Hex/URL 编码的区别与互转'
keywords: [字符编码, 编码原理, ASCII, Unicode, UTF-8, GBK, 乱码, Base64, Hex, 二进制, 字符集, 编码转换]
author: 开发工具箱
date: 2026-09-20
updated: 2026-09-20
phase: 1
relatedTools: [charset-convert, utf8, unicode, base64, hex, binary, url-encode, html-entity]
relatedTutorials: []
---

你一定见过这种场面：一个本来显示得好好的中文文件，换台电脑、换个编辑器，突然变成一堆「锘? 鍙?」之类的鬼画符。或者你写着代码，突然好奇为什么 `strlen("中文")` 在有些语言里返回 6，有些返回 2。

这些怪事背后，全是一个东西在搞鬼：**编码**。这篇我想把它从头到尾捋一遍——字符在屏幕上长什么样、在硬盘里又是什么样，中间到底经过了什么，以及那些名字里都带「编码」的 Base64、Hex、URL 到底在编什么。

## 先给你一张地图

编码这事儿不是一天变这么乱的，它是一条时间线。下面这张图把关键节点串起来了，后面我一个个展开：

<figure class="dg-figure" data-interval="2000" data-steps='[{"t":"莫尔斯电码","d":"1830s，用点与划表示字母，是最早的「编码」雏形。"},{"t":"ASCII","d":"1963，7 位定长，定义 128 个英文字符与控制符。"},{"t":"各国编码","d":"1980s，GB2312/GBK/Big5 等各搞一套，互不兼容，乱码根源。"},{"t":"Unicode","d":"1991，给全球每个字符分配唯一码点，统一编号层。"},{"t":"UTF-8","d":"1993，变长编码、兼容 ASCII，最终成为 Web 事实标准。"}]'>
<svg viewBox="0 0 840 280" role="img" aria-label="编码发展时间线" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<text class="dg-ts" x="420" y="44">编码发展大事记：从「能传信号」到「统一全世界字符」</text>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="20" y="110" width="140" height="80" rx="9"/><text class="dg-tb" x="90" y="134">莫尔斯电码</text><text class="dg-ts" x="90" y="156">1830s · 点划</text><text class="dg-ts" x="90" y="176">编码雏形</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M160,150 H182" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="184" y="110" width="140" height="80" rx="9"/><text class="dg-tb" x="254" y="134">ASCII</text><text class="dg-ts" x="254" y="156">1963 · 7 位</text><text class="dg-ts" x="254" y="176">128 英文字符</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M324,150 H346" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="348" y="110" width="140" height="80" rx="9"/><text class="dg-tb" x="418" y="134">各国编码</text><text class="dg-ts" x="418" y="156">1980s · GBK</text><text class="dg-ts" x="418" y="176">互不兼容</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M488,150 H510" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="512" y="110" width="140" height="80" rx="9"/><text class="dg-tb" x="582" y="134">Unicode</text><text class="dg-ts" x="582" y="156">1991 · 码点</text><text class="dg-ts" x="582" y="176">统一编号</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M652,150 H674" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-g" x="676" y="110" width="140" height="80" rx="9"/><text class="dg-tb" x="746" y="134">UTF-8</text><text class="dg-ts" x="746" y="156">1993 · 变长</text><text class="dg-ts" x="746" y="176">Web 标准</text></g>
<text class="dg-ts" x="420" y="250">箭头表示演进与替代；UTF-8 最终成为互联网事实标准</text>
</svg>
<figcaption>图：编码发展大事记。从莫尔斯电码到 ASCII、各国编码、Unicode，最终 UTF-8 一统江湖。点上面的「播放」可以看演进过程。</figcaption>
</figure>

## 从电报说起

「编码」这两个字听着唬人，其实本质特简单：**把一种信息，用另一种能存能传的符号表示出来**。把这件事做到极致的，是 1830 年代的电报。

莫尔斯电码用「点（·）」和「划（—）」两种符号，配上长短间隔，把 26 个字母和数字映射成电信号。`SOS` 就是 `···———···`。它和今天的 UTF-8 共享同一个核心思想：**收发双方约定同一张「符号 ↔ 信号」对照表，信息才不会被误解**。区别只是，莫尔斯解决的是「文字 ↔ 电信号」，我们要解决的是「文字 ↔ 二进制」。

## ASCII：那 7 位定义了英文世界

1963 年，ASCII 出场。它用 **7 个比特**给字符编号，范围是 `0~127`，总共 128 个位置：

- `0~31` 是控制字符，比如换行、回车、响铃；
- `32~126` 是可打印的：空格、英文字母、数字、常见标点；
- 大写字母 `A` 就是 `65`（二进制 `1000001`），数字 `0` 是 `48`。

当时一字节是 8 位，留 1 位做奇偶校验，剩下 7 位刚好够覆盖英语世界。这一步很关键：它第一次把「字符」和「数字编号」严丝合缝地绑在了一起——`A` 永远等于 65，到哪台机器上都一样。后来所有字符编码，都是踩在它肩膀上的。

顺带说两个冷知识。第一，IBM 的大型机当年走的是另一条路，用 **EBCDIC** 编码，跟 ASCII 完全对不上，这本身就是早期跨系统乱码的一大源头。第二，ASCII 设计得特巧：大写 `A`=65、小写 `a`=97，刚好差 32（也就是二进制第 6 位不同），所以切换大小写本质上只是翻转**一个比特**——这种「比特级的小聪明」后来被各种编码沿用。

## 乱世：各家一套，谁也不服谁

ASCII 只够英语用。世界这么大，中文、日文、俄文怎么办？大家盯上了那个被闲置的最高位：把 8 位都用上，编号扩到 `0~255`，后 128 个位置拿来塞本国字符。

问题就出在这后 128 个位置——**谁来规定放什么？没人规定**。于是：

- 西欧搞了 ISO-8859 系列；
- 中国大陆在 1980 年推出 **GB2312**（收了 6763 个汉字），后来扩成 **GBK**，再到 GB18030；
- 港澳台用 **Big5**（繁体）；
- 日本用 Shift-JIS，韩国用 EUC-KR……

它们在 `0~127` 上和 ASCII 完全一致（这是还能共存的原因），但在更高的区间上**各说各话**。同一串字节，用 GBK 解和用 Big5 解，出来的字天差地别。你现在看到的乱码，根子就扎在这儿。

拿咱们最熟的 GB2312 说，它的思路挺「矩阵化」：把字符排成 **94 区 × 94 位**的表，行叫「区」、列叫「位」，每个字用「区号 + 位号」定位。「中」在第 54 区第 48 位，区位码就是 `5448`；「国」是 25 区 90 位。真正存进电脑时，区、位各自加上 `0xA0` 偏移，变成两个字节（这就是所谓「机内码」），为的是让两字节的最高位都是 1，不至于和 ASCII 撞车。GBK 是在这个骨架上扩容，把生僻字、繁体也塞了进去。也正因为「区 + 位」这种二维排法，早期中文系统才有「区位输入法」这么个东西。

## Unicode 来统一

1991 年，Unicode 联盟出手了，目标很大也朴素：**给全世界每一个字符，发一个全球唯一的编号**。这个编号叫**码点（Code Point）**，写成 `U+XXXX`。

- `A` → `U+0041`
- `中` → `U+4E2D`
- `😀` → `U+1F600`

Unicode 把码点空间划成 17 个「平面」，从 `U+0000` 到 `U+10FFFF`。我们日常用的绝大多数字符——中文、英文、日文、韩文加一堆符号——都挤在第 0 平面，叫**基本多文种平面（BMP）**，`U+0000~U+FFFF`。像 `😀` 这种超出 BMP 的，被丢进「补充平面」。

这里有个坑很多人绕不过去，得掰开说：**字符变成字节，其实过了两道关**。

第一道，字符 → 码点，这一步是全球统一的，这是 Unicode 的功劳；第二道，码点 → 字节，这一步当时还没定，于是又吵了一架（下一节）。所以 Unicode 解决的是「给谁编号」，不是「编号怎么存」。

## UTF-8 凭什么一统江湖

码点只是个抽象编号，真要写进文件还得变成字节。几种存法各有算盘：

| 方案 | 怎么存 | 优点 | 缺点 |
|---|---|---|---|
| **UTF-32** | 每个码点固定 4 字节 | 定长，随机访问快 | 英文也占 4 字节，太浪费 |
| **UTF-16** | 2 或 4 字节 | 早期 Windows / Java 内部用 | 不兼容 ASCII，还有字节序麻烦 |
| **UTF-8** | 1~4 字节变长 | 兼容 ASCII、省空间、能自愈 | 中文通常占 3 字节（比 GBK 的 2 字节略多） |

UTF-8 最后赢了，是因为它最聪明：英文字母还是 1 个字节，跟 ASCII 一模一样，老系统啥都不用改；中文等按需用 2~4 字节；而且它「自同步」——哪怕某个字节传错了，最多坏一个字符，不会连环崩。

还有个挺有意思的来历：UTF-8 是 1992 年 Ken Thompson（Unix 之父）和 Rob Pike 在吃晚饭时，于一张餐巾纸上花几天鼓捣出来的。它一出生就带着「兼容 ASCII、能自同步、省空间」这几个目标，几十年下来证明它最经得起时间。

它的变长规则也好记，看一个字节的开头就知道它占几个字节：

```
1 字节：0xxxxxxx                    （ASCII，0~127）
2 字节：110xxxxx 10xxxxxx           （128~2047）
3 字节：1110xxxx 10xxxxxx 10xxxxxx  （2048~65535，大部分中文在这）
4 字节：11110xxx 10xxxxxx 10xxxxxx 10xxxxxx  （65536 以上，含 emoji）
```

### 来，亲手把「中」算一遍

光看规则不过瘾，我们把「中」**手动算成字节**，你就彻底懂变长是怎么回事了。

「中」的码点是 `U+4E2D`，换成二进制是 `0100 1110 0010 1101`，共 16 位。它落在「2048~65535」区间，所以用 3 字节模板：

```
16 位码点：   0100 1110 0010 1101
按 4/6/6 切：  0100 | 111000 | 101101
套 3 字节模板（1110xxxx 10xxxxxx 10xxxxxx）：
   1110 + 0100  →  1110 0100  →  E4
   10  + 111000 →  1011 1000  →  B8
   10  + 101101 →  1010 1101  →  AD
```

于是「中」的 UTF-8 字节就是 `E4 B8 AD`——和 [UTF-8 编码](/tools/encoding/utf8) 工具算出来的一模一样。注意那个切法：16 位被分成「4 + 6 + 6」，分别填进模板里预留的 `x` 空位。这就是为什么「中文占 3 字节」——不是拍脑袋定的，而是码点落在那个区间，模板就强制它用 3 个字节。

## 字符到底怎么变成 0 和 1

现在把整条链路接起来。你眼里的「中」，到电脑里的 0/1，要过三道关：

1. **字符 → 码点**：查表，得到抽象编号（`中` → `U+4E2D`）；
2. **码点 → UTF-8 字节**：按上面那套变长规则，编成一串字节（`U+4E2D` → `E4 B8 AD`）；
3. **字节 → 二进制**：每个字节写成 8 位 0/1（`E4 B8 AD` → `11100100 10111000 10101101`）。

反过来完全对称：读到 0/1 → 拼成字节 → 按 UTF-8 解回码点 → 查表还原成字符。

<figure class="dg-figure" data-interval="2000" data-steps='[{"t":"用户输入字符","d":"人在编辑器里打出「中」，这是人能看懂的符号。"},{"t":"查 Unicode 码点","d":"计算机先查 Unicode 码表，把「中」映射成唯一编号 U+4E2D。"},{"t":"UTF-8 编码成字节","d":"再把码点按 UTF-8 变长规则编码成 3 个字节：E4 B8 AD。"},{"t":"展开成二进制","d":"每个字节写成 8 位 0/1，合起来就是 24 位二进制串。"},{"t":"存进计算机","d":"磁盘、内存、网络里真正存的就是这串 0 和 1，反向解码同理。"}]'>
<svg viewBox="0 0 820 470" role="img" aria-label="字符到二进制的转换流程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="250" y="24" width="320" height="48" rx="9"/><text class="dg-tb" x="410" y="48">字符「中」（人看到的）</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M410,72 V108" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="250" y="110" width="320" height="48" rx="9"/><text class="dg-tb" x="410" y="134">Unicode 码点：U+4E2D</text></g>
<text class="dg-ts" x="590" y="128" text-anchor="start">查码表：每个字符</text>
<text class="dg-ts" x="590" y="146" text-anchor="start">对应一个唯一编号</text>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M410,158 V194" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="250" y="196" width="320" height="48" rx="9"/><text class="dg-tb" x="410" y="220">UTF-8 字节：E4 B8 AD（3 字节）</text></g>
<text class="dg-ts" x="590" y="214" text-anchor="start">变长编码：中文</text>
<text class="dg-ts" x="590" y="232" text-anchor="start">字符通常占 3 字节</text>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M410,244 V280" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="250" y="282" width="320" height="44" rx="9"/><text class="dg-tb" x="410" y="304">字节 → 二进制位流</text></g>
<text class="dg-ts" x="410" y="350">1110 0100  1011 1000  1010 1101</text>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M410,326 V364" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-g" x="250" y="366" width="320" height="48" rx="9"/><text class="dg-tb" x="410" y="390">磁盘 / 内存 / 网络里的 0 和 1</text></g>
<text class="dg-ts" x="410" y="446">反向同理：0/1 → 字节 → UTF-8 解码 → 码点 → 字符</text>
</svg>
<figcaption>图：字符「中」变成二进制的过程。人看到的字符先查 Unicode 码点，再按 UTF-8 编码成字节，最后展开成 0/1 存进计算机。点上面的「播放」可以看每一步。</figcaption>
</figure>

想亲手看这一步步怎么走的，把「中」粘进 [UTF-8 编码](/tools/encoding/utf8) 工具，它会把码点、字节、二进制同时列出来；想看任意文字的码点，用 [Unicode 编码](/tools/encoding/unicode) 工具。

### 顺带回答开头那个问题

为什么 `strlen("中文")` 有的返回 6、有的返回 2？字符串在内存里到底算「几个字符」还是「几个字节」，取决于语言怎么数。以 Python 3 为例：

```python
>>> s = "中文"
>>> len(s)                   # 数的是「字符（码点）」
2
>>> len(s.encode("utf-8"))   # 数的是 UTF-8 字节
6
>>> len(s.encode("gbk"))     # 数的是 GBK 字节
4
```

所以「6」是 UTF-8 下 2 个汉字 × 3 字节；老程序按 GBK 存（每字 2 字节）数出来就是 4；而现代语言按「字符」数就是 2。同一个「中文」，三种数法三种答案——根子还是编码规则不同。

另一个常踩的坑是 emoji。`😀` 的码点是 `U+1F600`，已经超出 BMP（`U+FFFF`）了。在 UTF-16 里它必须用一对 16 位（叫**代理对**）表示，于是 JavaScript 里 `"😀".length` 返回的是 `2` 而不是 `1`——因为它数的是「码元」不是「码点」。这就是为什么你做字数统计、字符串截取时，emoji 经常「被劈成两半」：你按 `length` 截断，正好切在代理对中间，出来的就是个豆腐块。

## 乱码到底怎么来的

上面那条链路捅破了，乱码这层窗户纸也就破了。**乱码的本质就一句：编码时用的规则，和解码时用的规则不是同一套。**

字节本身是中性的——它只是一串数字，不携带「我是用 UTF-8 存的」这种标签。接收方要是拿错误的规则去解释，就会得到一串对不上号、看着像乱码的字。

<figure class="dg-figure" data-interval="2000" data-steps='[{"t":"同一串字节","d":"文本保存后只留下字节，本身不带编码信息。"},{"t":"用 UTF-8 解码","d":"按 UTF-8 规则解释字节，还原出原本的「中文」。"},{"t":"正确显示","d":"编码与解码一致，正常显示，绿色为正确结果。"},{"t":"误用 GBK 解码","d":"同一串字节若用 GBK 规则解释，每个字节被错误分组。"},{"t":"出现乱码","d":"解码规则与编码不一致，屏幕出现看不懂的乱码字符。"}]'>
<svg viewBox="0 0 820 340" role="img" aria-label="乱码产生的原因：编码与解码不一致" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="24" y="146" width="250" height="50" rx="9"/><text class="dg-tb" x="149" y="171">字节流 E4 B8 AD E6 96 87</text></g>
<text class="dg-ts" x="24" y="220" text-anchor="start">同一串字节，不含编码信息</text>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M274,160 C 300,140 305,124 318,122" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="320" y="96" width="180" height="48" rx="9"/><text class="dg-tb" x="410" y="120">按 UTF-8 解码</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M500,120 H538" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box-g" x="540" y="96" width="200" height="48" rx="9"/><text class="dg-tb" x="640" y="120">中文（正确）</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M274,192 C 300,212 305,228 318,246" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="320" y="240" width="180" height="48" rx="9"/><text class="dg-tb" x="410" y="264">按 GBK 解码</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M500,264 H538" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-w" x="540" y="240" width="200" height="48" rx="9"/><text class="dg-tb" x="640" y="264">乱码字符（Mojibake）</text></g>
<text class="dg-ts" x="410" y="320">字节本身没有语义，语义由「用什么规则解码」决定</text>
</svg>
<figcaption>图：乱码是怎么来的。同一串字节，用 UTF-8 解码得到「中文」，误用 GBK 解码就变成看不懂的乱码。点上面的「播放」可以看两个分支。</figcaption>
</figure>

最常见的翻车现场：用 UTF-8 存了 `中文`（字节是 `E4 B8 AD E6 96 87`），却拿 GBK 的眼界去读它，每个字节被重新分组，屏幕上就冒出一堆怪字。

开头提到的「锘?」就是这么来的，而且成因非常具体：Windows 记事本保存 UTF-8 时，会偷偷在文件最前面塞三个字节 `EF BB BF`，叫 **BOM（字节顺序标记）**。这仨字节本身不是文字。可一旦你拿 GBK 的眼看它：

```
EF BB BF  →  按 GBK 解  →  「锘?»
```

`EF BB` 被解成「锘」，`BF` 解成个问号样的小字——开头的「锘?」怪象就这么冒出来的。所以：跨平台、做 Web 时，**永远保存成「UTF-8 无 BOM」**，能避开一大半这类怪事。BOM 这东西，在 UTF-16/UTF-32 里是用来标字节序的（大端小端），但 UTF-8 字节序固定，BOM 纯属多余，反而常在 HTML 顶部顶出一块莫名空白、甚至弄坏 JSON。

救法也简单：只要你晓得它「本来是用什么编码存的」，拿正确的规则重新解码就行。这正是 [字符编码转换](/tools/encoding/charset-convert) 工具的活儿——选对源编码和目标编码（比如 GBK → UTF-8），乱码当场还原。

## 你平时用的那些「编码」，其实不是一回事

讲到这你可能有点晕：Base64、Hex、URL 编码，名字里都带「编码」，跟 UTF-8 是一家人吗？**不是，得掰成两类看。**

- **字符集编码（charset）**：解决「字符 ↔ 字节」，像 ASCII、GBK、UTF-8。乱码只发生在这类。
- **传输 / 表示编码（encoding）**：解决「字节 ↔ 可打印字符串」，不改字符的意思，只是换种写法，让数据好存好传好读。

后者是工具箱里最常见的一类，挨个说：

**Hex（十六进制）**——把每个字节拆成两个 `0~9 A~F` 的字符。`E4` 就是一个字节的「人话写法」，常用来直接看二进制长什么样，比如分析协议包、查哈希。见 [Hex 编码](/tools/encoding/hex)。

**Binary（二进制）**——把每个字节写成 8 个 `0/1`，最贴近计算机本质，常用来做教学演示。见 [二进制编码](/tools/encoding/binary)。

**Base64**——每 3 个字节变成 4 个可打印字符（用 `A~Z a~z 0~9 + /` 这 64 个），专门把任意二进制塞进只认文本的场合：邮件附件、Data URI 内嵌图片、JWT 载荷。提醒一句，它**不是加密**，只是换写法；而且 3 字节变 4 字符意味着数据会膨胀大约 33%，这是它为兼容性付的代价。见 [Base64 编码](/tools/encoding/base64)。

**URL 编码（百分号编码）**——把 URL 里不能直接出现的字符（空格、`&`、`=`、中文等）变成 `%XX`。那个 `%` 后面跟的是该字符 UTF-8 字节的十六进制：空格 `20` 变 `%20`，「中」的字节 `E4 B8 AD` 变 `%E4%B8%AD`。没它，URL 早被特殊字符搞崩了。见 [URL 编码](/tools/encoding/url-encode)。

**HTML 实体**——把 `<`、`>`、`&` 变成 `&lt;`、`&gt;`、`&amp;`，防浏览器把它们当标签，顺带挡掉 XSS。见 [HTML 实体编码](/tools/encoding/html-entity)。

一句话拎清：**charset 管「字怎么变字节」，表示法管「字节怎么变好看的字符串」**。两者还能叠着用——一份 UTF-8 文本，可以先 Base64 一遍塞进邮件，收件方再 Base64 解回字节、按 UTF-8 解出字。

## 怎么跟乱码说再见

几条能落地的：

1. **全程统一 UTF-8**：源码文件、数据库连接串、HTTP 响应头、HTML 的 `<meta charset>`，全部显式写 UTF-8。绝大多数现代乱码，都是某一环偷偷用了别的编码。
2. **看到乱码先猜「它本来是什么」**：来源若是 GBK 老系统，别拿 UTF-8 硬读，直接用 [字符编码转换](/tools/encoding/charset-convert) 转成 UTF-8。
3. **排查时看字节**：把疑似乱码的内容粘进 [UTF-8 编码](/tools/encoding/utf8) 或 [Hex 编码](/tools/encoding/hex)，看底层字节到底是 `E4 B8 AD` 还是 `D6 D0`，一眼就能判断原始编码。
4. **传二进制用 Base64 包一层**：图片、证书、JWT 这类，用 [Base64](/tools/encoding/base64) 最稳。

几个高发现场，单独拎出来说：

- **网页显示乱码**：浏览器优先信 HTTP 响应头里的 `Content-Type: text/html; charset=...`，其次才看 HTML 里的 `<meta>`。如果你本地看着正常、别人看着乱，多半是服务器没发对 charset。另：保存文件务必「UTF-8 无 BOM」，BOM 在 HTML 里有时会让页面顶上多出奇怪空白，甚至破坏 JSON 解析。
- **MySQL 乱码**：MySQL 有三处编码各自独立——连接层（`character_set_client`）、结果集（`character_set_results`）、存储层（表的 `CHARSET`）。只要有一处和另外两处不一致，存进去或读出来就乱。排查时一句 `SHOW VARIABLES LIKE 'char%';` 把三处全看一遍。
- **终端 / 编辑器乱码**：你 `cat` 一个 GBK 文件到 UTF-8 终端，必然乱。临时救急用 `iconv -f gbk -t utf-8 file.txt`，但治本是统一成 UTF-8 保存。

## 常见问题

**Q：UTF-8 和 Unicode 到底啥关系？**
**A：**Unicode 负责「给字符发编号」（码点），UTF-8 负责「把编号存成字节」。一个是身份证号，一个是把身份证号写进存储的写法。GBK、UTF-16 也是「写法」，只是规则不同。

**Q：为什么同一个中文有时占 2 字节、有时占 3 字节？**
**A：**GBK 给每个汉字固定 2 字节；UTF-8 是变长，常用汉字落在基本平面区间，用 3 字节。同一「中」字，编码规则不同，字节数就不同。

**Q：文件已经是 UTF-8 了，打开怎么还乱码？**
**A：**常见两种情况：一是带了 BOM（文件头三个字节 `EF BB BF`），被某些解析器误读成「锘?»——用「UTF-8 无 BOM」重新保存即可；二是内容本来是用 GBK 存的，你却按 UTF-8 打开，先用 [字符编码转换](/tools/encoding/charset-convert) 试 GBK → UTF-8。

**Q：Base64 是加密吗？**
**A：**不是。它只是把字节换成可打印字符的「表示法」，不含任何密钥，谁都能瞬间解回原内容。它解决的是「传输 / 存储兼容」，不解决「保密」。

**Q：emoji 为什么有时会显示成两个方块？**
**A：**像 😀 这种超出基本平面的字符，在 UTF-16 里是「代理对」（两个码元）。一些老旧字体或按码元截断的逻辑会把代理对拆开，于是变成两个豆腐块。

## 相关工具

- [字符编码转换](/tools/encoding/charset-convert)：GBK / GB2312 / Big5 / Shift-JIS 与 UTF-8 互转，修复乱码。
- [UTF-8 编码](/tools/encoding/utf8)：查看字符的码点、UTF-8 字节与二进制，理解转换全链路。
- [Unicode 编码](/tools/encoding/unicode)：中文与 `\uXXXX` 互转，处理 JSON / JS / Java 转义。
- [Base64 编码 / 解码](/tools/encoding/base64)：文本与文件的 Base64 转换，支持 URL-safe 变体。
- [Hex 编码](/tools/encoding/hex)：文本与十六进制字节互转，辅助逆向与协议分析。
- [二进制编码](/tools/encoding/binary)：文本与 0/1 字符串互转，理解底层表示。
- [URL 编码](/tools/encoding/url-encode)：百分号编码，处理 URL 中的中文与特殊字符。
- [HTML 实体编码](/tools/encoding/html-entity)：`< > &` 与实体互转，防 XSS、安全展示代码。
