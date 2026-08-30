---
title: "DES 加密：一个时代的落幕与启示"
toolId: des
category: encryption
description: "回顾 DES 加密算法的兴衰历程：56 位密钥为何从国家机密变成 24 小时就能暴力破解、Feistel 网络结构的精妙设计、以及从 DES 到 3DES 再到 AES 的进化之路带给我们的工程启示"
keywords: [DES加密, 3DES, Feistel网络, 对称加密历史, 暴力破解, EFF Deep Crack, 分组密码]
author: 开发工具箱
date: 2026-06-15
phase: 1
relatedTools: [aes, rsa, rsa-keygen]
relatedTutorials: [aes, rsa]
---

## 什么是 DES？

DES（Data Encryption Standard，数据加密标准）是密码学历史上的一座里程碑。1977 年，它被美国国家标准局（NBS，现在的 NIST）正式采纳为联邦信息处理标准，成为全球第一个公开的、标准化的对称加密算法。

把时钟拨回 1970 年代初。IBM 的研究员 Horst Feistel 带领团队开发了一个叫 Lucifer 的加密算法，用的是一种后来以他的名字命名的网络结构——Feistel 网络。NSA（美国国家安全局）介入审查后做了一个在当时看来合理的决定：把 Lucifer 原本 128 位的密钥砍到 56 位，把 128 位的分组砍到 64 位。然后，这个修改过的算法就变成了 DES。

说实话，这场"削减"背后到底是因为 NSA 觉得 56 位足够了，还是他们想给自己留后门，学术界争论了几十年。但有一点是确定的：56 位的密钥长度，直接决定了 DES 最终的命运。

DES 最了不起的地方不在于它多安全，而在于它**把密码学从军方的黑箱里拽了出来**。在此之前，加密算法都是机密，只有军方和情报机构知道怎么运作。DES 公开了全部设计细节，让全世界的学者都能审视、分析、攻击它。这种开放精神影响了之后全部的密码学标准制定流程。

## DES 的工作原理

DES 属于**分组密码**（Block Cipher），明文按 64 位（8 字节）一块进行加密。流程可以概括为：**初始置换 → 16 轮 Feistel 迭代 → 逆初始置换**。

这张图把整个流程从头串到尾，点「播放」可以一步步看：

<figure class="dg-figure" data-interval="2000" data-steps='[{"t":"输入明文","d":"DES 是分组密码，明文按 64 位（8 字节）一块处理。"},{"t":"初始置换 IP","d":"按一张固定表把 64 个位重新排列。这步跟密钥无关，不提供任何安全性，纯粹是 1970 年代的历史遗留。"},{"t":"密钥编排","d":"64 位密钥去掉 8 位校验后，一次性派生出 16 把 48 位轮密钥，每轮用一把。"},{"t":"分成左右两半","d":"置换后的 64 位切成 L₀ 和 R₀，各 32 位。接下来 16 轮，就在这两个半块上反复折腾。"},{"t":"Round 1","d":"R₀ 与轮密钥 K₁ 一起过 F 函数，结果和 L₀ 异或；然后左右两半交换位置。"},{"t":"Round 2 ~ Round 15","d":"结构完全相同，只是每轮换一把轮密钥。轮数越多，明文的统计特征被抹得越干净。"},{"t":"Round 16（最后一轮）","d":"换用轮密钥 K₁₆，结构依旧一样。16 轮跑完，明文和密文之间的关系已经彻底打乱。"},{"t":"合并两半","d":"把最后的 L₁₆ 和 R₁₆ 拼回成 64 位。"},{"t":"逆初始置换 IP⁻¹","d":"初始置换的逆运算，把位序还原回去。同样与密钥无关、同样不提供安全性。"},{"t":"输出密文","d":"得到 64 位密文块。注意分组只有 64 位——这正是后来 Sweet32 攻击盯上它的原因。"},{"t":"解密：换个顺序就行","d":"Feistel 结构最漂亮的地方：解密用的是完全相同的电路，只要把 16 把轮密钥倒序喂进去。"}]'>
<svg viewBox="0 0 840 640" role="img" aria-label="DES 加密原理总览：初始置换、16 轮 Feistel 迭代与逆初始置换" text-anchor="middle" dominant-baseline="central">
<defs><marker id="md1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="md1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="240" y="24" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="44">明文（64 位分组）</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M350,64 V72" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="240" y="76" width="220" height="36" rx="8"/><text class="dg-t" x="350" y="94">初始置换 IP（与密钥无关）</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="600" y="76" width="190" height="44" rx="9"/><text class="dg-tb" x="695" y="90">DES 密钥</text><text class="dg-ts" x="695" y="108">64 位（含 8 位校验）</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M695,120 V128" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="600" y="132" width="190" height="44" rx="9"/><text class="dg-tb" x="695" y="146">密钥编排</text><text class="dg-ts" x="695" y="164">生成 16 把 48 位轮密钥</text>
<path class="dg-dash" d="M695,176 V364"/>
<text class="dg-t" x="695" y="270">⋮</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M350,112 V120" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-frame" x="240" y="124" width="220" height="58" rx="9"/><text class="dg-ts" x="250" y="136" text-anchor="start">分成左右两半 L₀ / R₀</text>
<rect class="dg-box" x="250" y="146" width="96" height="30" rx="7"/><text class="dg-tb" x="298" y="161">L₀（32 位）</text>
<rect class="dg-box" x="354" y="146" width="96" height="30" rx="7"/><text class="dg-tb" x="402" y="161">R₀（32 位）</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M350,182 V192" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-frame" x="180" y="196" width="340" height="68" rx="10"/><text class="dg-ts" x="188" y="208" text-anchor="start">Round 1</text>
<rect class="dg-box" x="188" y="214" width="104" height="36" rx="7"/><text class="dg-t" x="240" y="232">F 函数</text>
<rect class="dg-box" x="298" y="214" width="104" height="36" rx="7"/><text class="dg-t" x="350" y="232">L ⊕ F</text>
<rect class="dg-box" x="408" y="214" width="104" height="36" rx="7"/><text class="dg-t" x="460" y="232">左右交换</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M598,230 H524" marker-end="url(#md1p)"/><text class="dg-ts" x="561" y="219">K₁</text></g>
<g data-step="5" data-flow="1"><path class="dg-line" d="M350,264 V274" marker-end="url(#md1)"/></g>
<g class="dg-pop" data-step="5">
<text class="dg-t" x="350" y="290">⋮</text>
<text class="dg-ts" x="350" y="308">Round 2 ~ Round 15，结构完全相同</text>
</g>
<g data-step="6" data-flow="1"><path class="dg-line" d="M350,320 V326" marker-end="url(#md1)"/></g>
<g class="dg-pop" data-step="6">
<rect class="dg-frame" x="180" y="330" width="340" height="68" rx="10"/><text class="dg-ts" x="188" y="342" text-anchor="start">Round 16（最后一轮）</text>
<rect class="dg-box" x="188" y="348" width="104" height="36" rx="7"/><text class="dg-t" x="240" y="366">F 函数</text>
<rect class="dg-box" x="298" y="348" width="104" height="36" rx="7"/><text class="dg-t" x="350" y="366">L ⊕ F</text>
<rect class="dg-box" x="408" y="348" width="104" height="36" rx="7"/><text class="dg-t" x="460" y="366">左右交换</text>
</g>
<g data-step="6" data-flow="1"><path class="dg-line-p" d="M598,364 H524" marker-end="url(#md1p)"/><text class="dg-ts" x="561" y="353">K₁₆</text></g>
<g data-step="7" data-flow="1"><path class="dg-line-p" d="M350,398 V408" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="7">
<rect class="dg-box" x="240" y="412" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="432">合并 L₁₆ ‖ R₁₆</text>
</g>
<g data-step="8" data-flow="1"><path class="dg-line" d="M350,452 V462" marker-end="url(#md1)"/></g>
<g class="dg-pop" data-step="8">
<rect class="dg-box" x="240" y="466" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="486">逆初始置换 IP⁻¹</text>
</g>
<g data-step="9" data-flow="1"><path class="dg-line-p" d="M350,506 V516" marker-end="url(#md1p)"/></g>
<g class="dg-pop" data-step="9">
<rect class="dg-box-p" x="240" y="520" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="540">密文（64 位）</text>
</g>
<g class="dg-pop" data-step="10">
<rect class="dg-box-a" x="140" y="580" width="560" height="44" rx="9"/><text class="dg-t" x="420" y="602">解密：结构完全相同，只需把 16 把轮密钥倒序使用</text>
</g>
</svg>
<figcaption>图 1：DES 完整加密流程。明文按 64 位分块，经初始置换切成左右两半，再跑 16 轮 Feistel 迭代（每轮用一把不同的 48 位轮密钥），最后合并并做逆初始置换得到密文。点上面的「播放」可以看一步步的演示。</figcaption>
</figure>

### Feistel 网络：DES 的灵魂

Feistel 网络的设计非常对称优雅。每一轮是这样运作的：

1. 把 64 位的输入分成左半 L（32 位）和右半 R（32 位）
2. 把 R 和当前的轮密钥送进一个叫 **F 函数**的东西，算出一个 32 位的结果
3. 把 F 的输出和 L 做 XOR，得到**下一轮的 R**
4. 下一轮的 L 直接等于这一轮的 R

用公式表示就是：

```
L_i+1 = R_i
R_i+1 = L_i XOR F(R_i, K_i)
```

16 轮之后，把最后的 L 和 R 拼在一起，再过一次最终置换，密文就出来了。解密的时候，把轮密钥的顺序倒过来用就行——加密和解密用的是**完全相同的结构**，只不过密钥顺序反了。这在硬件实现上是个巨大的优点，加密器和解密器可以共用一套电路。

把其中一轮单独放大看，就是这个样子：

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"输入：上一轮的左右两半","d":"Lᵢ₋₁ 和 Rᵢ₋₁ 各 32 位，合起来就是上一轮输出的 64 位。"},{"t":"右半与轮密钥进 F 函数","d":"Rᵢ₋₁（32 位）和本轮轮密钥 Kᵢ（48 位）一起送入 F 函数，算出 32 位结果。这是整轮里唯一有密钥参与的地方。"},{"t":"F 的输出与左半异或","d":"F 的 32 位结果和 Lᵢ₋₁ 逐位异或。注意 F 函数不需要可逆——这是 Feistel 结构最巧妙的一点。"},{"t":"得到新的左右两半","d":"右半直接搬过来当新的左半，异或结果当新的右半。一轮结束，两半各 32 位。"},{"t":"解密为什么能复用","d":"靠的是 XOR 的对称性：(A ⊕ B) ⊕ B = A。把轮密钥倒序喂进同一个电路，就能一步步还原明文。"}]'>
<svg viewBox="0 0 840 390" role="img" aria-label="Feistel 网络单轮结构：F 函数、异或与左右交换" text-anchor="middle" dominant-baseline="central">
<defs><marker id="md2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="md2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<text class="dg-tl" x="130" y="40" text-anchor="start">第 i 轮 Feistel 迭代</text>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="130" y="76" width="90" height="40" rx="8"/><text class="dg-tb" x="175" y="88">Lᵢ₋₁</text><text class="dg-ts" x="175" y="106">32 位</text>
<rect class="dg-box-p" x="130" y="180" width="90" height="40" rx="8"/><text class="dg-tb" x="175" y="192">Rᵢ₋₁</text><text class="dg-ts" x="175" y="210">32 位</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M220,200 H356" marker-end="url(#md2)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="360" y="178" width="120" height="44" rx="8"/><text class="dg-tb" x="420" y="190">F 函数</text><text class="dg-ts" x="420" y="210">扩展 → S盒 → P盒</text>
<rect class="dg-box-a" x="360" y="246" width="120" height="36" rx="8"/><text class="dg-tb" x="420" y="256">轮密钥 Kᵢ</text><text class="dg-ts" x="420" y="273">48 位</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,246 V226" marker-end="url(#md2p)"/></g>
<g data-step="2" data-flow="1">
<path class="dg-line" d="M220,96 H504" marker-end="url(#md2)"/>
<path class="dg-line-p" d="M480,200 H520 V112" marker-end="url(#md2p)"/>
</g>
<g class="dg-pop" data-step="2">
<circle class="dg-xor" cx="520" cy="96" r="16"/><text class="dg-op" x="520" y="96">⊕</text>
</g>
<g data-step="3" data-flow="1">
<path class="dg-line-p" d="M536,96 H616" marker-end="url(#md2p)"/>
<path class="dg-line" d="M175,220 V300 H665 V224" marker-end="url(#md2)"/>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-p" x="620" y="76" width="90" height="40" rx="8"/><text class="dg-tb" x="665" y="88">Rᵢ</text><text class="dg-ts" x="665" y="106">32 位</text>
<rect class="dg-box-p" x="620" y="180" width="90" height="40" rx="8"/><text class="dg-tb" x="665" y="192">Lᵢ</text><text class="dg-ts" x="665" y="210">32 位</text>
<text class="dg-ts" x="720" y="90" text-anchor="start">Rᵢ = Lᵢ₋₁ ⊕ F</text>
<text class="dg-ts" x="720" y="194" text-anchor="start">Lᵢ = Rᵢ₋₁</text>
<text class="dg-ts" x="720" y="210" text-anchor="start">（右半直接搬过来）</text>
</g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-a" x="130" y="316" width="580" height="44" rx="9"/><text class="dg-t" x="420" y="338">解密时结构完全不变，只需把轮密钥倒序使用：(A ⊕ B) ⊕ B = A</text>
</g>
</svg>
<figcaption>图 2：Feistel 网络的单轮结构。右半 Rᵢ₋₁ 与轮密钥 Kᵢ 过 F 函数，结果与左半 Lᵢ₋₁ 异或成为新的右半；右半则原封不动搬过来成为新的左半。因为 F 函数不需要可逆，设计难度大大降低。点上面的「播放」可以看数据是怎么流动的。</figcaption>
</figure>

### F 函数里面做了什么？

F 函数是 DES 里唯一"非线性"的部分，它的复杂度决定了整个算法的安全强度。F 函数内部分四步：

1. **扩展置换**：把 32 位的 R 扩展到 48 位，某些位被复制了
2. **与轮密钥 XOR**：48 位扩展结果和 48 位轮密钥做异或
3. **S-Box 替换**：把 48 位分成 8 组，每组 6 位，送进 8 个不同的替换盒（S-Box）。每个 S-Box 把 6 位映射为 4 位，8 个盒子合起来把 48 位压缩成 32 位。这 8 个 S-Box 是 DES 的心脏，也是当年 NSA 被人怀疑埋后门的地方——幸运的是，后来差分密码分析的研究表明，NSA 选的 S-Box 值恰好比随机选择更能抵抗差分攻击，说明他们早就知道这个攻击方法了
4. **P-Box 置换**：把第 3 步输出的 32 位重新排列一下

这四步连起来的位宽变化值得留意——32 位进、32 位出，中间却被撑到 48 位：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"输入：右半 R（32 位）","d":"F 函数只接收上一轮的右半，32 位。左半不进 F 函数，它只在最后参与一次异或。"},{"t":"扩展置换 E","d":"32 位扩展成 48 位，办法是把其中 16 个位复制一遍。看着浪费，其实是为了让每个 S-Box 都能同时影响多个输出位。"},{"t":"与轮密钥异或","d":"48 位扩展结果和 48 位轮密钥 Kᵢ 逐位异或——这是整个 F 函数里唯一的密钥混合步骤。"},{"t":"S-Box 替换","d":"48 位分成 8 组每组 6 位，送进 8 个不同的 S-Box 并行替换，每个盒子 6 位进、4 位出，合起来压缩回 32 位。这是 DES 唯一的非线性部件，也是当年 NSA 被怀疑埋后门的地方。"},{"t":"P-Box 置换","d":"把 32 位按固定表重新排列，让每个 S-Box 的输出扩散到下一轮多个 S-Box 的输入上去。"},{"t":"输出：32 位","d":"F 函数的输出与左半异或，本轮结束。注意 F 函数本身不可逆（S-Box 是 6 进 4 出的压缩），但 Feistel 结构并不需要它可逆。"}]'>
<svg viewBox="0 0 840 320" role="img" aria-label="DES 的 F 函数内部四步：扩展置换、密钥异或、S-Box 替换、P-Box 置换" text-anchor="middle" dominant-baseline="central">
<defs><marker id="md3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="md3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<text class="dg-tl" x="35" y="60" text-anchor="start">F 函数内部：32 位进，32 位出</text>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="35" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="90" y="118">输入 Rᵢ₋₁</text><text class="dg-ts" x="90" y="138">32 位</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M149,128 H163" marker-end="url(#md3)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="167" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="222" y="118">扩展置换 E</text><text class="dg-ts" x="222" y="138">32 → 48 位</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M281,128 H295" marker-end="url(#md3)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="299" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="354" y="118">⊕ 轮密钥 Kᵢ</text><text class="dg-ts" x="354" y="138">48 → 48 位</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M413,128 H427" marker-end="url(#md3)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="431" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="486" y="118">S-Box 替换</text><text class="dg-ts" x="486" y="138">48 → 32 位</text>
<path class="dg-dash" d="M486,158 V186"/>
<rect class="dg-cell" x="360" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="374" y="212">S1</text>
<rect class="dg-cell" x="392" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="406" y="212">S2</text>
<rect class="dg-cell" x="424" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="438" y="212">S3</text>
<rect class="dg-cell" x="456" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="470" y="212">S4</text>
<rect class="dg-cell" x="488" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="502" y="212">S5</text>
<rect class="dg-cell" x="520" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="534" y="212">S6</text>
<rect class="dg-cell" x="552" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="566" y="212">S7</text>
<rect class="dg-cell" x="584" y="196" width="28" height="32" rx="3"/><text class="dg-ts" x="598" y="212">S8</text>
<text class="dg-ts" x="486" y="252">8 个 S-Box 并行：每个 6 位进、4 位出</text>
<text class="dg-ts" x="420" y="278">S-Box 是 DES 唯一的非线性部件，也是当年 NSA 被怀疑埋后门的地方</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M545,128 H559" marker-end="url(#md3)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="563" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="618" y="118">P-Box 置换</text><text class="dg-ts" x="618" y="138">32 → 32 位</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line" d="M677,128 H691" marker-end="url(#md3)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-p" x="695" y="100" width="110" height="56" rx="8"/><text class="dg-tb" x="750" y="118">F 函数输出</text><text class="dg-ts" x="750" y="138">32 位</text>
</g>
</svg>
<figcaption>图 3：F 函数的四个步骤。32 位输入先扩展成 48 位与轮密钥异或，再经 8 个 S-Box 并行压缩回 32 位（每个盒子 6 位进、4 位出），最后做 P-Box 置换。点上面的「播放」可以看位宽是怎么一路变化的。</figcaption>
</figure>

### 密钥编排

DES 输入的"钥匙"名义上是 64 位，但每 8 位的最后一位是奇偶校验位，实际用到的密钥只有 56 位。56 位通过一个固定的置换表生成 16 把各 48 位的轮密钥，每轮用一把。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"输入 64 位密钥","d":"DES 的密钥名义上是 64 位，但每 8 位里有 1 位是奇偶校验位——1970 年代数据传输不可靠的产物。"},{"t":"去掉校验位","d":"8 个校验位被丢掉，真正有效的密钥长度只剩 56 位。这 56 位决定了 DES 的全部安全性。"},{"t":"置换选择 PC-1","d":"56 位按固定表重排，然后切成 C₀ 和 D₀ 两半，各 28 位。"},{"t":"每轮循环左移","d":"每一轮把 C 和 D 各自循环左移 1 或 2 位（第 1、2、9、16 轮移 1 位，其余移 2 位），移位的累计结果保证 16 轮用到的位各不相同。"},{"t":"置换选择 PC-2","d":"从移位后的 56 位里挑出 48 位（丢弃 8 位），做一次重排，就得到本轮的 48 位轮密钥 Kᵢ。"},{"t":"生成 16 把轮密钥","d":"重复 16 次得到 K₁ 到 K₁₆。解密时完全不用重算，只要把这 16 把倒序使用即可。"}]'>
<svg viewBox="0 0 840 360" role="img" aria-label="DES 密钥编排：64 位主密钥派生 16 把 48 位轮密钥" text-anchor="middle" dominant-baseline="central">
<defs><marker id="md4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="md4p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<text class="dg-tl" x="40" y="56" text-anchor="start">DES 密钥编排：64 位主密钥 → 16 把 48 位轮密钥</text>
<g class="dg-pop" data-step="0">
<rect class="dg-box-a" x="40" y="90" width="120" height="56" rx="8"/><text class="dg-tb" x="100" y="110">DES 密钥</text><text class="dg-ts" x="100" y="130">64 位</text>
<text class="dg-ts" x="100" y="168">每 8 位中 1 位是校验位</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M164,118 H192" marker-end="url(#md4)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="196" y="90" width="120" height="56" rx="8"/><text class="dg-tb" x="256" y="110">去校验位</text><text class="dg-ts" x="256" y="130">56 位</text>
<text class="dg-ts" x="256" y="168">去掉 8 位奇偶校验</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M320,118 H348" marker-end="url(#md4)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="352" y="90" width="120" height="56" rx="8"/><text class="dg-tb" x="412" y="110">置换 PC-1</text><text class="dg-ts" x="412" y="130">分成 C₀ D₀</text>
<text class="dg-ts" x="412" y="168">C₀ / D₀ 各 28 位</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M476,118 H504" marker-end="url(#md4)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="508" y="90" width="120" height="56" rx="8"/><text class="dg-tb" x="568" y="110">循环左移</text><text class="dg-ts" x="568" y="130">每轮 1~2 位</text>
<text class="dg-ts" x="568" y="168">第 1、2、9、16 轮移 1 位，其余移 2 位</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M632,118 H660" marker-end="url(#md4)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="664" y="90" width="120" height="56" rx="8"/><text class="dg-tb" x="724" y="110">置换 PC-2</text><text class="dg-ts" x="724" y="130">48 位</text>
<text class="dg-ts" x="724" y="168">从 56 位里挑 48 位</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-dash" d="M724,146 V182 H420 V206" marker-end="url(#md4)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-a" x="118" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="135" y="228">K₁</text>
<rect class="dg-box-a" x="156" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="173" y="228">K₂</text>
<rect class="dg-box-a" x="194" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="211" y="228">K₃</text>
<rect class="dg-box-a" x="232" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="249" y="228">K₄</text>
<rect class="dg-box-a" x="270" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="287" y="228">K₅</text>
<rect class="dg-box-a" x="308" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="325" y="228">K₆</text>
<rect class="dg-box-a" x="346" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="363" y="228">K₇</text>
<rect class="dg-box-a" x="384" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="401" y="228">K₈</text>
<rect class="dg-box-a" x="422" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="439" y="228">K₉</text>
<rect class="dg-box-a" x="460" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="477" y="228">K₁₀</text>
<rect class="dg-box-a" x="498" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="515" y="228">K₁₁</text>
<rect class="dg-box-a" x="536" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="553" y="228">K₁₂</text>
<rect class="dg-box-a" x="574" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="591" y="228">K₁₃</text>
<rect class="dg-box-a" x="612" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="629" y="228">K₁₄</text>
<rect class="dg-box-a" x="650" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="667" y="228">K₁₅</text>
<rect class="dg-box-a" x="688" y="210" width="34" height="36" rx="4"/><text class="dg-ts" x="705" y="228">K₁₆</text>
<text class="dg-ts" x="420" y="268">生成 16 把各 48 位轮密钥，每轮用一把</text>
<rect class="dg-box-a" x="170" y="284" width="500" height="44" rx="9"/><text class="dg-t" x="420" y="306">解密：结构完全不变，只需把 16 把轮密钥倒序使用</text>
</g>
</svg>
<figcaption>图 4：DES 的密钥编排。64 位密钥去掉 8 位校验后剩 56 位，经 PC-1 置换切成两半，每轮各自循环左移再用 PC-2 挑出 48 位，如此重复 16 次得到 16 把轮密钥。点上面的「播放」可以看轮密钥是怎么被一把把派生出来的。</figcaption>
</figure>

打个比方：如果把 DES 比作一个搅拌机，Feistel 网络就是搅拌桶，F 函数是搅拌叶，S-Box 是不规则形状的刀片，轮密钥是每次加进去的调料。一轮搅拌完，食材已经面目全非，16 轮之后谁也认不出这堆东西原本是什么了。

## 核心特性

| 特性 | 说明 |
|------|------|
| **类型** | 对称分组密码（Feistel 结构） |
| **分组大小** | 64 位（8 字节） |
| **密钥长度** | 56 位（名义 64 位，8 位是校验位） |
| **轮数** | 16 轮 |
| **安全状态** | **已不安全**——24 小时内可暴力破解 |
| **标准化** | FIPS PUB 46（已撤销）、ANSI X3.92 |
| **衍生算法** | 3DES、DES-X |

56 位密钥空间一共是 2^56 ≈ 7.2 × 10^16 种可能。这个数字在上世纪 70 年代听起来很大，但到了 90 年代就撑不住了。

## DES 的陨落：EFF Deep Crack 的故事

DES 从诞生起就一直被质疑——学术界始终认为 56 位太短。1998 年是个转折点。EFF（电子前哨基金会）花了 25 万美元造了一台叫 Deep Crack 的专用破解机，内含 1800 多个定制芯片，每个芯片每秒测试超过 6000 万个密钥。整台机器**不到 24 小时**就暴力搜遍了全部 56 位密钥空间，找出了正确的 DES 密钥。

这相当于对全世界宣布：DES 完了。

到 1999 年，EFF 和 distributed.net 合作，把时间缩短到了 **22 小时 15 分钟**。2006 年，德国两所大学用 COPACOBANA——一台 1 万美元的 FPGA 设备——再次做到了不到 9 天暴力破解 DES。从国家安全级别到被业余爱好者用低成本攻破，DES 的 56 位密钥就像一道把城堡大门锁了却忘了关窗户的防御。

## 3DES：垂死挣扎还是体面退休？

DES 被攻破、但 AES 还没出来之前（1997-2001 年），业界需要一个过渡方案。3DES（Triple DES）就是这个过渡方案。原理粗暴得不像密码学——把 DES 跑三遍：

```
密文 = E(K3, D(K2, E(K1, 明文)))
```

注意中间是**解密**操作——这是故意这么设计的。如果三个密钥都一样（K1=K2=K3），3DES 就退化为普通 DES，保证了向后兼容。三把不同的密钥让有效密钥长度达到 168 位，当时被认为是足够安全的。

不过话说回来，3DES 有一个尴尬的问题：64 位的分组太小了。加密大量数据时，每 32GB 的数据就存在密文块碰撞的风险（生日攻击）。再加上跑三遍 DES 性能本来就慢，AES 出来后 3DES 的使用量迅速下降。NIST 在 2023 年正式宣布 3DES 退役。

我在银行系统里还见过 DES 的遗留代码。有一家银行的内部报文系统，2005 年上线时用的就是 DES，后来升级到 3DES，再后来负责人换了三拨，大家都说"用着没出过问题就别动"。直到有一次安全审计查出风险，才痛下决心切到 AES。类似的故事在通信、嵌入式设备和早期互联网协议里也比比皆是——DES 的代码像幽灵一样飘了几十年。

## 实际应用场景

### 1. 银行业遗留系统

很长一段时间里，银行卡 PIN 码的加密传输用的就是 DES。EMV 芯片卡标准和 ATM 网络协议早期都基于 DES 或 3DES。不少银行的 HSM（硬件安全模块）至今还在同时支持 DES 和 3DES，主要就是给老系统兼容用的。

### 2. 通信协议

早期的 SSL/TLS（2.0 和 3.0 版本）、IPsec、Kerberos 认证协议都支持 DES 作为可选加密算法。现代版本早已把 DES 标记为不安全并移除了支持，但如果你去翻一些古董 VPN 设备的配置页面，可能还能看到 DES 的选项——说实话，看到了也别选。

### 3. 教育和研究

DES 是目前密码学教学中最适合入门的对称加密算法。它的结构足够简单、同时包含了分组密码的所有核心概念（Feistel 网络、S-Box、密钥编排、扩散和混淆），理解了 DES 再去看 AES，门槛会低很多。我们工具保留 DES 主要是出于这个目的——让你亲手试一下历史上最重要的加密算法是怎么运作的。

## 常见误区

### 误区一：DES 是过时了，但 3DES 还很安全

3DES 的安全性比 DES 强，但远不如 AES。核心问题不在密钥长度，在**分组大小**。3DES 的分组还是 64 位，这意味着只要加密约 32GB 的数据，密文内部就存在碰撞风险。还有一个叫 Sweet32 的攻击专门针对 64 位分组密码的长期会话。2023 年 NIST 已经让 3DES 退役了，新系统不该再用它。

### 误区二：56 位不够是因为摩尔定律

表面上看是。但实际上 56 位在 1977 年就有人质疑过——斯坦福大学的 Diffie 和 Hellman（就是发明 Diffie-Hellman 密钥交换那两位）在 DES 发布后马上就论证了，用 1977 年的技术花 2000 万美元可以造出一天破解 DES 的机器。当时 NBS 的回应是"等到能造出那种机器的时候，DES 的周期也该到 15 年了"。他们说到做到——DES 坚持了约 15 年左右，但密码学的更替远比他们预想的要慢。

### 误区三：DES 被破只是因为暴力搜索

其实 DES 还遭受过多种密码分析攻击。差分密码分析和线性密码分析虽然没能实际完全攻破 DES，但它们大幅降低了所需的搜索空间——从 2^56 降到 2^43 左右（线性分析）。只是暴力搜索的成本降得更快，最后是用钱砸死的。这给我一个启发：算法被攻破往往不是一种攻击方法多么精巧，而是多个攻击方法叠加的效果。

## DES vs AES vs 3DES

| | DES | 3DES | AES-128 |
|---|---|---|---|
| **分组大小** | 64 位 | 64 位 | 128 位 |
| **密钥长度** | 56 位 | 168 位（三密钥） | 128 位 |
| **轮数** | 16 | 48（16×3） | 10 |
| **结构** | Feistel 网络 | 三层 Feistel | SPN 结构 |
| **安全状态** | 不安全 | 弱（分组太小） | 安全 |
| **硬件效率** | 低 | 很低 | 高（AES-NI） |
| **适用场景** | 仅教育用途 | 旧系统过渡 | 当前工业标准 |

如果把 DES 比作一张手写门锁，3DES 就是把三张手写门锁串联起来，AES 则是直接换了扇防盗门。

## 常见问题

**Q: DES 和 3DES 现在还能用吗？**

生产环境不要用。NIST 已经在 2018-2023 年间逐步撤销了对 DES 和 3DES 的标准化支持。如果维护的旧系统还依赖 DES，尽早规划迁移到 AES，别等到被审计出来再去补。

**Q: DES 的 8 位校验位是干什么的？**

DES 的 64 位"密钥"里，每 8 位的最后一位是校验位——它是前面 7 位的奇偶校验值（保证每个字节里 1 的个数是奇数）。这是 1970 年代数据传输不可靠的产物，放在今天的网络环境下基本没什么用了。

**Q: 为什么 Feistel 网络解密和加密是一样的？**

因为 XOR 操作的对称性。加密时 R 和 F 的结果 XOR，解密时把相同的 F 结果再 XOR 一次就还原了。数学上就是 (A XOR B) XOR B = A。这个性质让 Feistel 结构的加解密可以复用同一套硬件，这也是它当年被广泛采用的原因之一。

**Q: DES 被暴力破解大概需要多少成本？**

用 2006 年的 COPACOBANA（成本约 1 万美元）不到 9 天就能破解。放到 2026 年的今天，随便一台高端 GPU 服务器配几块显卡，跑一套优化过的密钥搜索程序，几个小时就能搞定。如果上云按需租计算实例，几百美元预算绰绰有余。

**Q: 既然 DES 不安全了，为什么要学它？**

因为 DES 是密码学的"活化石"。理解了 Feistel 网络、S-Box 替换、密钥编排这些 DES 中的概念，再看现在的哈希算法（SHA-2 也用了类似思路）对称加密（AES 的 SPN 是对 Feistel 的演进）就会轻松很多。更何况，你万一要维护一个 2000 年的 COBOL 银行系统呢？懂 DES 至少能读懂那些代码在干什么。
