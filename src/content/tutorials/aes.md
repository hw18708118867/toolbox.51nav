---
title: "AES 加密详解：对称加密的工业标准"
toolId: aes
category: encryption
description: "深入理解 AES 加密算法的工作原理、分组模式和填充方案，以及为什么它能成为全球加密标准，替代老旧的 DES"
keywords: [AES加密, AES-256, AES-128, CBC模式, GCM模式, 对称加密原理, 分组密码, 密钥扩展]
author: 开发工具箱
date: 2026-06-15
updated: 2026-08-29
phase: 1
relatedTools: [des, rsa, rsa-keygen]
relatedTutorials: [des, rsa]
---

## 什么是 AES？

AES（Advanced Encryption Standard，高级加密标准）是目前全球使用最广泛的**对称加密**算法。说白了，就是加密和解密用同一把钥匙。

你每天上网时，HTTPS 连接里的数据加密、WiFi 的 WPA2/WPA3、文件加密工具（如 VeraCrypt 和 BitLocker），乃至你手机的全盘加密，大概率都在用 AES。

把 AES 放进历史坐标里来看——它的前身是 DES（数据加密标准），DES 出生于 1977 年，搞了 20 多年后，56 位的密钥长度在当时的计算能力面前已经撑不住了。1997 年，NIST（美国国家标准与技术研究院）发起了 AES 算法征集，最终来自比利时的 Rijndael 算法胜出，2002 年正式成为标准。

值得一提的是，Rijndael 的两位设计者——Joan Daemen 和 Vincent Rijmen，他们把算法设计得非常优雅：硬件上高效、软件上灵活，而且能抵抗当时已知的所有攻击方法。说实话，一个 1998 年设计的算法到现在还能扛住攻击，说明它是真的扎实。

## AES 的工作原理

AES 属于**分组密码**（Block Cipher），它不是对数据流按位加密，而是把数据切成固定大小的块——每个块正好 128 位（16 字节），然后对每一块独立加密。

### 加密轮数

AES 有三种密钥长度，对应的加密轮数也不同：

| 密钥长度 | 轮数 | 常见称呼 |
|---------|------|---------|
| 128 位（16 字节） | 10 轮 | AES-128 |
| 192 位（24 字节） | 12 轮 | AES-192 |
| 256 位（32 字节） | 14 轮 | AES-256 |

轮数越多安全性越高，但性能也越低。一般来说 AES-128 已经足够安全（2^128 的暴力搜索空间在可预见的未来都不现实），AES-256 主要用于合规要求或特别敏感的场景。

上面那张表只说了轮数，下面这张图把整个过程从头到尾串起来——从分块、初始轮密钥加、N 轮变换、密钥扩展，一直到密文拼接输出：

<figure class="dg-figure" data-interval="1900" data-steps='[{"t":"输入明文","d":"任意长度的明文数据进入 AES。"},{"t":"按 128 位分块","d":"数据被切成固定 128 位（16 字节）的块，最后一块不足则按 PKCS#7 填充。"},{"t":"密钥扩展","d":"主密钥经单向扩展，一次性派生出 K₀ 到 K₁₀ 共 11 把轮密钥，泄露其中任何一把都推不回主密钥。"},{"t":"取出第 1 块 + 初始轮密钥加","d":"明文块按列填进 4×4 状态矩阵，先与 K₀ 逐位异或，白送一层混淆。"},{"t":"Round 1","d":"SubBytes 替换字节 → ShiftRows 行移位 → MixColumns 列混合 → 与轮密钥 K₁ 异或。"},{"t":"Round 2","d":"结构完全相同，只是换成轮密钥 K₂。每多搅一轮，明文的统计特征就淡一分。"},{"t":"Round 3 ~ Round 9","d":"重复同样的四步，逐轮替换轮密钥。AES-192 做 12 轮，AES-256 做 14 轮。"},{"t":"Round 10（最后轮）","d":"省略 MixColumns，只做 SubBytes → ShiftRows → 与 K₁₀ 异或。"},{"t":"输出密文块 C₁","d":"第 10 轮的输出，就是 P₁ 对应的那个 128 位密文块。"},{"t":"逐块重复","d":"P₂ 到 Pₙ 走完全相同的流程，得到 C₂ 到 Cₙ。能不能并行，取决于分组模式。"},{"t":"拼接成密文","d":"所有密文块按顺序拼接，就是最终的 AES 密文。"}]'>
<svg viewBox="0 0 820 650" role="img" aria-label="AES 加密原理总览：明文分块、轮变换与密钥扩展" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<text class="dg-ts" x="24" y="628" text-anchor="start">AES-128：10 轮　AES-192：12 轮　AES-256：14 轮</text>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="24" y="24" width="150" height="44" rx="9"/><text class="dg-tb" x="99" y="46">明文（任意长度）</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M174,46 H202" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="210" y="24" width="70" height="44" rx="9"/><text class="dg-tb" x="245" y="46">P₁</text>
<rect class="dg-box" x="290" y="24" width="70" height="44" rx="9"/><text class="dg-tb" x="325" y="46">P₂</text>
<rect class="dg-box" x="370" y="24" width="70" height="44" rx="9"/><text class="dg-tb" x="405" y="46">P₃</text>
<text class="dg-t" x="452" y="46">…</text>
<rect class="dg-box" x="470" y="24" width="70" height="44" rx="9"/><text class="dg-tb" x="505" y="46">Pₙ</text>
<text class="dg-ts" x="566" y="40" text-anchor="start">每个块固定 128 位（16 字节）</text>
<text class="dg-ts" x="566" y="58" text-anchor="start">最后一块不足则按 PKCS#7 填充</text>
<path class="dg-dash" d="M245,68 V88 M325,68 V88 M405,68 V88 M505,68 V88 M245,88 H505"/>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="600" y="110" width="190" height="44" rx="9"/><text class="dg-tb" x="695" y="126">主密钥 K</text><text class="dg-ts" x="695" y="144">128 / 192 / 256 位</text>
<path class="dg-line-p" d="M695,154 V162" marker-end="url(#m1p)"/>
<rect class="dg-box-a" x="600" y="166" width="190" height="44" rx="9"/><text class="dg-tb" x="695" y="186">密钥扩展 Key Expansion</text><text class="dg-ts" x="695" y="204">单向派生，推不回主密钥</text>
<path class="dg-dash" d="M695,210 V454"/>
<text class="dg-t" x="695" y="398">⋮</text>
<text class="dg-ts" x="600" y="486" text-anchor="start">每一轮使用不同的轮密钥，</text>
<text class="dg-ts" x="600" y="502" text-anchor="start">全部由主密钥单向派生</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M350,88 V104" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-p" x="240" y="110" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="130">明文块 P（128 位）</text>
<path class="dg-line" d="M350,150 V160" marker-end="url(#m1)"/>
<rect class="dg-box-a" x="240" y="164" width="220" height="34" rx="8"/><text class="dg-t" x="350" y="181">⊕ K₀（初始轮密钥加）</text>
<text class="dg-t" x="90" y="214">状态矩阵 State</text>
<rect class="dg-cell" x="50" y="228" width="80" height="80" rx="3"/>
<rect class="dg-cell-p" x="50" y="228" width="20" height="20"/><rect class="dg-cell-p" x="50" y="248" width="20" height="20"/><rect class="dg-cell-p" x="50" y="268" width="20" height="20"/><rect class="dg-cell-p" x="50" y="288" width="20" height="20"/>
<path class="dg-cell" d="M70,228 V308 M90,228 V308 M110,228 V308 M50,248 H130 M50,268 H130 M50,288 H130"/>
<text class="dg-ts" x="90" y="326">16 字节按列填入</text>
<text class="dg-ts" x="90" y="342">每轮都在这 16 个字节上</text>
<text class="dg-ts" x="90" y="358">反复做替换与置换</text>
<path class="dg-dash" d="M130,268 H176" marker-end="url(#m1)"/>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M598,181 H468" marker-end="url(#m1p)"/><text class="dg-ts" x="610" y="174">K₀</text></g>
<g class="dg-pop" data-step="4">
<path class="dg-line" d="M350,198 V206" marker-end="url(#m1)"/>
<rect class="dg-frame" x="180" y="210" width="340" height="68" rx="10"/><text class="dg-ts" x="188" y="226" text-anchor="start">Round 1</text>
<rect class="dg-box" x="186" y="232" width="78" height="36" rx="7"/><text class="dg-t" x="225" y="250">SubBytes</text>
<rect class="dg-box" x="269" y="232" width="78" height="36" rx="7"/><text class="dg-t" x="308" y="250">ShiftRows</text>
<rect class="dg-box" x="352" y="232" width="78" height="36" rx="7"/><text class="dg-t" x="391" y="250">MixColumns</text>
<rect class="dg-box-a" x="435" y="232" width="78" height="36" rx="7"/><text class="dg-t" x="474" y="250">⊕ K₁</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M691,250 H520" marker-end="url(#m1p)"/><text class="dg-ts" x="606" y="243">K₁</text></g>
<g class="dg-pop" data-step="5">
<path class="dg-line" d="M350,278 V288" marker-end="url(#m1)"/>
<rect class="dg-frame" x="180" y="292" width="340" height="68" rx="10"/><text class="dg-ts" x="188" y="308" text-anchor="start">Round 2</text>
<rect class="dg-box" x="186" y="314" width="78" height="36" rx="7"/><text class="dg-t" x="225" y="332">SubBytes</text>
<rect class="dg-box" x="269" y="314" width="78" height="36" rx="7"/><text class="dg-t" x="308" y="332">ShiftRows</text>
<rect class="dg-box" x="352" y="314" width="78" height="36" rx="7"/><text class="dg-t" x="391" y="332">MixColumns</text>
<rect class="dg-box-a" x="435" y="314" width="78" height="36" rx="7"/><text class="dg-t" x="474" y="332">⊕ K₂</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M691,332 H520" marker-end="url(#m1p)"/><text class="dg-ts" x="606" y="325">K₂</text></g>
<g class="dg-pop" data-step="6">
<path class="dg-line" d="M350,360 V370" marker-end="url(#m1)"/>
<text class="dg-t" x="350" y="386">⋮</text>
<text class="dg-ts" x="350" y="404">（Round 3 ~ Round 9，结构完全相同）</text>
</g>
<g class="dg-pop" data-step="7">
<rect class="dg-frame" x="180" y="414" width="340" height="68" rx="10"/><text class="dg-ts" x="188" y="430" text-anchor="start">Round 10（最后轮）</text>
<rect class="dg-box" x="186" y="436" width="104" height="36" rx="7"/><text class="dg-t" x="238" y="454">SubBytes</text>
<rect class="dg-box" x="298" y="436" width="104" height="36" rx="7"/><text class="dg-t" x="350" y="454">ShiftRows</text>
<rect class="dg-box-a" x="410" y="436" width="104" height="36" rx="7"/><text class="dg-t" x="462" y="454">⊕ K₁₀</text>
<text class="dg-ts" x="524" y="476" text-anchor="start">最后一轮省略 MixColumns</text>
</g>
<g data-step="7" data-flow="1"><path class="dg-line-p" d="M691,454 H520" marker-end="url(#m1p)"/><text class="dg-ts" x="606" y="447">K₁₀</text></g>
<g class="dg-pop" data-step="8">
<path class="dg-line" d="M350,482 V492" marker-end="url(#m1)"/>
<rect class="dg-box-p" x="240" y="492" width="220" height="40" rx="9"/><text class="dg-tb" x="350" y="512">密文块 C（128 位）</text>
</g>
<g class="dg-pop" data-step="9">
<path class="dg-dash" d="M350,532 V546 M250,546 H515"/>
<path class="dg-line" d="M250,546 V562" marker-end="url(#m1)"/>
<path class="dg-line" d="M330,546 V562" marker-end="url(#m1)"/>
<path class="dg-line" d="M410,546 V562" marker-end="url(#m1)"/>
<path class="dg-line" d="M515,546 V562" marker-end="url(#m1)"/>
<rect class="dg-box" x="215" y="566" width="70" height="44" rx="9"/><text class="dg-tb" x="250" y="588">C₁</text>
<rect class="dg-box" x="295" y="566" width="70" height="44" rx="9"/><text class="dg-tb" x="330" y="588">C₂</text>
<rect class="dg-box" x="375" y="566" width="70" height="44" rx="9"/><text class="dg-tb" x="410" y="588">C₃</text>
<text class="dg-t" x="452" y="588">…</text>
<rect class="dg-box" x="480" y="566" width="70" height="44" rx="9"/><text class="dg-tb" x="515" y="588">Cₙ</text>
</g>
<g class="dg-pop" data-step="10">
<path class="dg-line-p" d="M550,588 H586" marker-end="url(#m1p)"/>
<rect class="dg-box-p" x="590" y="566" width="170" height="44" rx="9"/><text class="dg-tb" x="675" y="588">密文</text>
</g>
</svg>
<figcaption>图 1：AES 完整加密流程。明文按 128 位切块，每块先与初始轮密钥异或，再经过 N 轮变换（SubBytes → ShiftRows → MixColumns → ⊕ 轮密钥，最后一轮省略 MixColumns）；每一轮的轮密钥都来自主密钥的单向扩展。点上面的「播放」可以看一步步的演示。</figcaption>
</figure>

### 每轮做了些什么？

每一轮加密包含四个操作（第 10 轮省略 MixColumns）：

1. **SubBytes**：用 S-Box 做字节替换，这是 AES 的核心非线性变换。简单说就是把每个字节映射到另一个字节，让明文和密文之间的关系极度混乱
2. **ShiftRows**：按行循环移位。第 0 行不动，第 1 行左移 1 个字节，第 2 行左移 2 个字节，第 3 行左移 3 个字节
3. **MixColumns**：对列做矩阵乘法（在有限域 GF(2^8) 上运算），进一步打散
4. **AddRoundKey**：把当前状态和轮密钥做 XOR（异或）

四步加起来的目的只有一个：让明文和密文的统计关系完全消失。攻击者哪怕知道加密算法，也没法从密文推断出密钥或明文。

我把这个过程想象成是一个**多层搅拌机**——SubBytes 是把食材打散，ShiftRows 和 MixColumns 是横向和纵向搅拌，AddRoundKey 是加入新的调料。每多搅拌一轮，原始食材的痕迹就更少一分。

用状态矩阵的视角看这一轮，会更直观。下面这张图里，我用蓝色方块跟踪 4 个字节，看它们在四步操作里怎么被搬来搬去：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"输入状态矩阵","d":"16 字节明文按列填进 4×4 矩阵，这就是每一轮的操作对象。"},{"t":"SubBytes","d":"逐字节查 S-Box 做替换：位置一个不动，值全变。这是 AES 里唯一的非线性步骤。"},{"t":"ShiftRows","d":"第 0 行不动，第 n 行循环左移 n 字节，让每一列的字节跑到别的列去。"},{"t":"MixColumns","d":"每列 4 个字节在 GF(2⁸) 上做矩阵乘法，一个字节的变化会扩散到整列。"},{"t":"AddRoundKey","d":"整个状态矩阵与本轮轮密钥 Kᵢ 逐位异或，把密钥材料拌进状态里。"},{"t":"进入下一轮","d":"输出直接作为下一轮的输入，如此重复 N 轮，最后一块输出就是密文块。"}]'>
<svg viewBox="0 0 820 190" role="img" aria-label="AES 单轮加密四步：SubBytes、ShiftRows、MixColumns、AddRoundKey" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-cell" x="26" y="56" width="72" height="72" rx="3"/>
<rect class="dg-cell-p" x="26" y="56" width="18" height="18"/><rect class="dg-cell-p" x="26" y="74" width="18" height="18"/><rect class="dg-cell-p" x="26" y="92" width="18" height="18"/><rect class="dg-cell-p" x="26" y="110" width="18" height="18"/>
<path class="dg-cell" d="M44,56 V128 M62,56 V128 M80,56 V128 M26,74 H98 M26,92 H98 M26,110 H98"/>
<text class="dg-tb" x="62" y="148">输入状态</text><text class="dg-ts" x="62" y="166">16 字节明文块</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M102,92 H170" marker-end="url(#m2)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-cell" x="174" y="56" width="72" height="72" rx="3"/>
<rect class="dg-cell-p" x="174" y="56" width="18" height="18"/><rect class="dg-cell-p" x="174" y="74" width="18" height="18"/><rect class="dg-cell-p" x="174" y="92" width="18" height="18"/><rect class="dg-cell-p" x="174" y="110" width="18" height="18"/>
<path class="dg-cell" d="M192,56 V128 M210,56 V128 M228,56 V128 M174,74 H246 M174,92 H246 M174,110 H246"/>
<text class="dg-tl" x="136" y="78">SubBytes</text><text class="dg-ts" x="136" y="110">字节替换</text>
<text class="dg-tb" x="210" y="148">替换后</text><text class="dg-ts" x="210" y="166">位置不变值全变</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M250,92 H318" marker-end="url(#m2)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-cell" x="322" y="56" width="72" height="72" rx="3"/>
<rect class="dg-cell-p" x="322" y="56" width="18" height="18"/><rect class="dg-cell-p" x="376" y="74" width="18" height="18"/><rect class="dg-cell-p" x="358" y="92" width="18" height="18"/><rect class="dg-cell-p" x="340" y="110" width="18" height="18"/>
<path class="dg-cell" d="M340,56 V128 M358,56 V128 M376,56 V128 M322,74 H394 M322,92 H394 M322,110 H394"/>
<text class="dg-tl" x="284" y="78">ShiftRows</text><text class="dg-ts" x="284" y="110">行移位</text>
<text class="dg-tb" x="358" y="148">移位后</text><text class="dg-ts" x="358" y="166">第 n 行左移 n</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M398,92 H466" marker-end="url(#m2)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-cell" x="470" y="56" width="72" height="72" rx="3"/>
<rect class="dg-cell-a" x="488" y="56" width="18" height="18"/><rect class="dg-cell-a" x="488" y="74" width="18" height="18"/><rect class="dg-cell-a" x="488" y="92" width="18" height="18"/><rect class="dg-cell-a" x="488" y="110" width="18" height="18"/>
<path class="dg-cell" d="M488,56 V128 M506,56 V128 M524,56 V128 M470,74 H542 M470,92 H542 M470,110 H542"/>
<text class="dg-tl" x="432" y="78">MixColumns</text><text class="dg-ts" x="432" y="110">列混合</text>
<text class="dg-tb" x="506" y="148">混合后</text><text class="dg-ts" x="506" y="166">每列 4 字节混合</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M546,92 H614" marker-end="url(#m2)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-cell-x" x="618" y="56" width="72" height="72" rx="3"/>
<rect class="dg-cell" x="618" y="56" width="72" height="72" rx="3"/>
<path class="dg-cell" d="M636,56 V128 M654,56 V128 M672,56 V128 M618,74 H690 M618,92 H690 M618,110 H690"/>
<text class="dg-tl" x="580" y="78">AddRoundKey</text><text class="dg-ts" x="580" y="110">⊕ 轮密钥</text>
<text class="dg-tb" x="654" y="148">本轮输出</text><text class="dg-ts" x="654" y="166">整块 ⊕ 轮密钥 Kᵢ</text>
<rect class="dg-cell" x="636" y="2" width="40" height="40" rx="2"/>
<path class="dg-cell" d="M646,2 V42 M656,2 V42 M666,2 V42 M636,12 H676 M636,22 H676 M636,32 H676"/>
<path class="dg-line" d="M656,42 V52" marker-end="url(#m2)"/>
<text class="dg-ts" x="686" y="24" text-anchor="start">轮密钥 Kᵢ</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line" d="M694,92 H730" marker-end="url(#m2)"/><text class="dg-ts" x="740" y="92" text-anchor="start">进入下一轮</text></g>
</svg>
<figcaption>图 2：一轮加密的四个步骤。128 位明文排成 4×4 的状态矩阵，依次做字节替换（位置不动、值全变）、行移位（第 n 行循环左移 n 字节）、列混合（每列在 GF(2⁸) 上做矩阵乘），最后与本轮轮密钥逐位异或，输出即下一轮的输入。点上面的「播放」可以看四个字节是怎么被一步步搬动的。</figcaption>
</figure>

### 密钥扩展

加密用的每一轮密钥都不一样，但都来源于你输入的那把主密钥。AES 通过密钥扩展算法，从一把 128/192/256 位的种子密钥生成所有轮密钥。这个扩展算法是单向的——即使你知道某几轮的密钥也推不出原始密钥。

## 分组模式：不止是加密算法

AES 只定义了对一个 128 位块的加密方法，真实的数据远比 16 个字节长。怎么把 AES 用在长数据上？这就要靠**分组密码模式**（Mode of Operation）了。

### ECB（电子密码本模式）

直接把数据切成 128 位块，每块独立用 AES 加密。**同一个明文块永远产生同一个密文块。**

如果你用 ECB 加密一张图片，像素模式会在密文里原样浮现出来——多年前那个"Linux 企鹅 ECB 加密后还能看清轮廓"的实验至今还在教科书里被引用。说白了，ECB 对大多数实际场景来说几乎等于没加密。我们工具里虽然支持 ECB 模式，但那更多是为了让你验证某种历史遗留系统，不是推荐你用它。

原因看这张图就明白了：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"准备明文块","d":"数据按规定切成 128 位的块。注意这里 P₁ 和 P₃ 的内容完全一样，都为 AAAAAAAA。"},{"t":"逐块独立加密","d":"每个块都用同一把密钥 K 独立加密，块与块之间没有任何联系，因此可以并行计算。"},{"t":"相同明文出相同密文","d":"P₁ 与 P₃ 明文相同，于是 C₁ 与 C₃ 也一模一样，密文里完整保留了明文的重复规律。"},{"t":"致命缺陷：结构泄露","d":"整张图用 ECB 加密后只是换了个颜色，企鹅的轮廓依旧清晰可辨——等于没加密。"}]'>
<svg viewBox="0 0 840 350" role="img" aria-label="ECB 模式原理：每个块独立加密，相同明文块得到相同密文块" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g class="dg-pop" data-step="0">
<path class="dg-dash" d="M130,44 V22 H550 V44"/>
<text class="dg-ts" x="340" y="12">P₁ 与 P₃ 的明文完全相同</text>
<rect class="dg-box-p" x="40" y="44" width="180" height="56" rx="10"/><text class="dg-tb" x="130" y="66">明文块 P₁</text><text class="dg-ts" x="130" y="86">内容：AAAAAAAA</text>
<rect class="dg-box" x="250" y="44" width="180" height="56" rx="10"/><text class="dg-tb" x="340" y="66">明文块 P₂</text><text class="dg-ts" x="340" y="86">内容：BBBBBBBB</text>
<rect class="dg-box-p" x="460" y="44" width="180" height="56" rx="10"/><text class="dg-tb" x="550" y="66">明文块 P₃</text><text class="dg-ts" x="550" y="86">内容：AAAAAAAA</text>
</g>
<g data-step="1" data-flow="1">
<path class="dg-line" d="M130,100 V136" marker-end="url(#m3)"/>
<path class="dg-line" d="M340,100 V136" marker-end="url(#m3)"/>
<path class="dg-line" d="M550,100 V136" marker-end="url(#m3)"/>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="40" y="140" width="180" height="56" rx="10"/><text class="dg-tb" x="130" y="162">AES 加密</text><text class="dg-ts" x="130" y="182">密钥 K（同一把）</text>
<rect class="dg-box" x="250" y="140" width="180" height="56" rx="10"/><text class="dg-tb" x="340" y="162">AES 加密</text><text class="dg-ts" x="340" y="182">密钥 K（同一把）</text>
<rect class="dg-box" x="460" y="140" width="180" height="56" rx="10"/><text class="dg-tb" x="550" y="162">AES 加密</text><text class="dg-ts" x="550" y="182">密钥 K（同一把）</text>
</g>
<g data-step="2" data-flow="1">
<path class="dg-line" d="M130,196 V232" marker-end="url(#m3)"/>
<path class="dg-line" d="M340,196 V232" marker-end="url(#m3)"/>
<path class="dg-line" d="M550,196 V232" marker-end="url(#m3)"/>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="40" y="236" width="180" height="56" rx="10"/><text class="dg-tb" x="130" y="258">密文块 C₁</text><text class="dg-ts" x="130" y="278">7f3a9c…（与 C₃ 相同）</text>
<rect class="dg-box" x="250" y="236" width="180" height="56" rx="10"/><text class="dg-tb" x="340" y="258">密文块 C₂</text><text class="dg-ts" x="340" y="278">b21e40…</text>
<rect class="dg-box-a" x="460" y="236" width="180" height="56" rx="10"/><text class="dg-tb" x="550" y="258">密文块 C₃</text><text class="dg-ts" x="550" y="278">7f3a9c…（与 C₁ 相同）</text>
<path class="dg-dash" d="M130,292 V314 H550 V292"/>
<text class="dg-ts" x="340" y="330">→ 密文块也完全相同：明文的重复结构被完整保留下来</text>
</g>
<g class="dg-pop" data-step="3">
<g transform="translate(716,44) scale(11)">
<rect x="0" y="0" width="6" height="6" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width=".09"/>
<path d="M2,0h2v1h-2z M1,1h4v1h-4z M1,2h4v1h-4z M0,3h6v1h-6z M1,4h4v1h-4z M2,5h2v1h-2z" style="fill:var(--color-primary);fill-opacity:.6"/>
<path d="M1,0v6 M2,0v6 M3,0v6 M4,0v6 M5,0v6 M0,1h6 M0,2h6 M0,3h6 M0,4h6 M0,5h6" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".09"/>
</g>
<path class="dg-line" d="M749,110 V126" marker-end="url(#m3)"/>
<g transform="translate(716,130) scale(11)">
<rect x="0" y="0" width="6" height="6" fill="none" stroke="currentColor" stroke-opacity=".32" stroke-width=".09"/>
<path d="M2,0h2v1h-2z M1,1h4v1h-4z M1,2h4v1h-4z M0,3h6v1h-6z M1,4h4v1h-4z M2,5h2v1h-2z" style="fill:var(--color-accent);fill-opacity:.55"/>
<path d="M1,0v6 M2,0v6 M3,0v6 M4,0v6 M5,0v6 M0,1h6 M0,2h6 M0,3h6 M0,4h6 M0,5h6" fill="none" stroke="currentColor" stroke-opacity=".25" stroke-width=".09"/>
</g>
<text class="dg-ts" x="790" y="77" text-anchor="start">原图</text>
<text class="dg-ts" x="790" y="163" text-anchor="start">ECB 后</text>
<text class="dg-ts" x="749" y="216">图案结构完整保留</text>
<text class="dg-ts" x="749" y="232">只是换了个颜色</text>
</g>
</svg>
<figcaption>图 3：ECB 模式。每个块用同一把密钥独立加密、互不影响，于是相同的明文块必然得到相同的密文块。右边就是教科书里那个著名的实验：整张图用 ECB 加密后，颜色变了，企鹅的轮廓却依然清晰可见。点上面的「播放」可以看这个过程。</figcaption>
</figure>

### CBC（密码块链接模式）

CBC 改进了一个关键点：**每个块的加密结果会影响下一个块**。在加密当前块之前，先把前一个块的密文和当前块的明文做 XOR。第一个块没有前一个密文怎么办？用一个叫 IV（初始化向量）的随机数顶替。

这样，哪怕两个块明文完全一样，只要位置不同，密文就不同。

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"生成 IV","d":"随机生成 128 位 IV。它无需保密，但在同一把密钥下不能重用、也不能被预测。"},{"t":"第 1 块：P₁ ⊕ IV","d":"第一块没有前序密文，用 IV 顶替。异或之后送进 AES，得到 C₁。"},{"t":"第 2 块：C₁ 反馈回来","d":"P₂ 先与 C₁ 异或再加密。链式反馈就此形成，加密必须串行、无法并行。"},{"t":"第 3 块：继续往后链接","d":"即便 P₃ 与 P₁ 的明文相同，因为前序密文不同，C₃ 与 C₁ 也完全不同。"},{"t":"解密（可以并行）","d":"解密时密文块是已知的，可并行做 AES 解密，再与上一个密文块异或还原明文。代价是一个块损坏会波及相邻两块。"},{"t":"风险：没有完整性校验","d":"CBC 只保证机密性。攻击者能篡改密文而你毫无察觉，padding oracle 就是这么来的——要么改用 GCM，要么额外套一层 HMAC。"}]'>
<svg viewBox="0 0 840 690" role="img" aria-label="CBC 模式原理图：加密与解密的链式结构" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m4p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<text class="dg-tb" x="24" y="22" text-anchor="start">（a）CBC 加密</text>
<path class="dg-dash" d="M24,318 H816"/>
<text class="dg-tb" x="24" y="342" text-anchor="start">（b）CBC 解密</text>
<g class="dg-pop" data-step="0">
<rect class="dg-box" x="24" y="110" width="90" height="40" rx="8"/><text class="dg-tb" x="69" y="130">IV</text>
<text class="dg-ts" x="69" y="158">随机、不可预测</text>
<text class="dg-ts" x="69" y="174">无需保密但不能重用</text>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-p" x="150" y="40" width="90" height="40" rx="8"/><text class="dg-tb" x="195" y="60">明文块 P₁</text>
<circle class="dg-xor" cx="195" cy="130" r="16"/><text class="dg-op" x="195" y="130">⊕</text>
<rect class="dg-box" x="150" y="170" width="90" height="44" rx="8"/><text class="dg-tb" x="195" y="186">AES 加密</text><text class="dg-ts" x="195" y="202">密钥 K</text>
<rect class="dg-box-a" x="150" y="250" width="90" height="40" rx="8"/><text class="dg-tb" x="195" y="270">密文块 C₁</text>
<path class="dg-line-p" d="M118,130 H178" marker-end="url(#m4p)"/>
<path class="dg-line" d="M195,80 V112" marker-end="url(#m4)"/>
<path class="dg-line" d="M195,146 V166" marker-end="url(#m4)"/>
<path class="dg-line" d="M195,214 V246" marker-end="url(#m4)"/>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-p" x="390" y="40" width="90" height="40" rx="8"/><text class="dg-tb" x="435" y="60">明文块 P₂</text>
<circle class="dg-xor" cx="435" cy="130" r="16"/><text class="dg-op" x="435" y="130">⊕</text>
<rect class="dg-box" x="390" y="170" width="90" height="44" rx="8"/><text class="dg-tb" x="435" y="186">AES 加密</text><text class="dg-ts" x="435" y="202">密钥 K</text>
<rect class="dg-box-a" x="390" y="250" width="90" height="40" rx="8"/><text class="dg-tb" x="435" y="270">密文块 C₂</text>
<path class="dg-line" d="M435,80 V112" marker-end="url(#m4)"/>
<path class="dg-line" d="M435,146 V166" marker-end="url(#m4)"/>
<path class="dg-line" d="M435,214 V246" marker-end="url(#m4)"/>
<text class="dg-ts" x="332" y="196" text-anchor="start">上一块密文</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-a" d="M240,270 H330 V130 H415" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-p" x="630" y="40" width="90" height="40" rx="8"/><text class="dg-tb" x="675" y="60">明文块 P₃</text>
<circle class="dg-xor" cx="675" cy="130" r="16"/><text class="dg-op" x="675" y="130">⊕</text>
<rect class="dg-box" x="630" y="170" width="90" height="44" rx="8"/><text class="dg-tb" x="675" y="186">AES 加密</text><text class="dg-ts" x="675" y="202">密钥 K</text>
<rect class="dg-box-a" x="630" y="250" width="90" height="40" rx="8"/><text class="dg-tb" x="675" y="270">密文块 C₃</text>
<path class="dg-line" d="M675,80 V112" marker-end="url(#m4)"/>
<path class="dg-line" d="M675,146 V166" marker-end="url(#m4)"/>
<path class="dg-line" d="M675,214 V246" marker-end="url(#m4)"/>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-a" d="M480,270 H570 V130 H655" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-a" x="150" y="360" width="90" height="40" rx="8"/><text class="dg-tb" x="195" y="380">密文块 C₁</text>
<rect class="dg-box-a" x="390" y="360" width="90" height="40" rx="8"/><text class="dg-tb" x="435" y="380">密文块 C₂</text>
<rect class="dg-box-a" x="630" y="360" width="90" height="40" rx="8"/><text class="dg-tb" x="675" y="380">密文块 C₃</text>
<rect class="dg-box" x="150" y="430" width="90" height="44" rx="8"/><text class="dg-tb" x="195" y="446">AES 解密</text><text class="dg-ts" x="195" y="462">密钥 K</text>
<rect class="dg-box" x="390" y="430" width="90" height="44" rx="8"/><text class="dg-tb" x="435" y="446">AES 解密</text><text class="dg-ts" x="435" y="462">密钥 K</text>
<rect class="dg-box" x="630" y="430" width="90" height="44" rx="8"/><text class="dg-tb" x="675" y="446">AES 解密</text><text class="dg-ts" x="675" y="462">密钥 K</text>
<circle class="dg-xor" cx="195" cy="520" r="16"/><text class="dg-op" x="195" y="520">⊕</text>
<circle class="dg-xor" cx="435" cy="520" r="16"/><text class="dg-op" x="435" y="520">⊕</text>
<circle class="dg-xor" cx="675" cy="520" r="16"/><text class="dg-op" x="675" y="520">⊕</text>
<rect class="dg-box" x="24" y="500" width="90" height="40" rx="8"/><text class="dg-tb" x="69" y="520">IV</text>
<rect class="dg-box-p" x="150" y="560" width="90" height="40" rx="8"/><text class="dg-tb" x="195" y="580">明文块 P₁</text>
<rect class="dg-box-p" x="390" y="560" width="90" height="40" rx="8"/><text class="dg-tb" x="435" y="580">明文块 P₂</text>
<rect class="dg-box-p" x="630" y="560" width="90" height="40" rx="8"/><text class="dg-tb" x="675" y="580">明文块 P₃</text>
<path class="dg-line" d="M195,400 V426" marker-end="url(#m4)"/>
<path class="dg-line" d="M435,400 V426" marker-end="url(#m4)"/>
<path class="dg-line" d="M675,400 V426" marker-end="url(#m4)"/>
<path class="dg-line" d="M195,474 V502" marker-end="url(#m4)"/>
<path class="dg-line" d="M435,474 V502" marker-end="url(#m4)"/>
<path class="dg-line" d="M675,474 V502" marker-end="url(#m4)"/>
<path class="dg-line-p" d="M118,520 H178" marker-end="url(#m4p)"/>
<path class="dg-line" d="M195,536 V556" marker-end="url(#m4)"/>
<path class="dg-line" d="M435,536 V556" marker-end="url(#m4)"/>
<path class="dg-line" d="M675,536 V556" marker-end="url(#m4)"/>
<path class="dg-line-a" d="M240,380 H330 V520 H415" marker-end="url(#m4a)"/>
<path class="dg-line-a" d="M480,380 H570 V520 H655" marker-end="url(#m4a)"/>
<text class="dg-ts" x="332" y="485" text-anchor="start">上一块密文</text>
<text class="dg-ts" x="69" y="556" text-anchor="start">同一个 IV</text>
</g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-w" x="150" y="622" width="540" height="46" rx="9"/><text class="dg-t" x="420" y="645">⚠ 只保证机密性：密文可被篡改而你毫无察觉，建议改用 GCM 或补一层 HMAC</text>
</g>
</svg>
<figcaption>图 4：CBC 模式。加密时每块先与上一个密文块（第一块用 IV）异或再走 AES，所以加密必须串行、无法并行；解密时密文块是已知的，可以并行计算，代价是一个块损坏会波及相邻两个块。注意它只保证机密性，没有任何完整性校验。点上面的「播放」可以看链条是怎么一节节搭起来的。</figcaption>
</figure>

但 CBC 有一个致命问题：它没有内置完整性校验，可以被 padding oracle 攻击。换句话说，别人可以篡改你的 CBC 密文，而你解密时毫无察觉。

### GCM（伽罗瓦计数器模式）

我个人推荐的生产级选择。GCM 内部用 CTR（计数器）模式做加密，同时利用 GHASH 算法计算认证标签，提供**认证加密**（AEAD，Authenticated Encryption with Associated Data）。

翻译成人话：GCM 不仅能保证机密性，还能检测密文是否被篡改。如果有人动了你的密文哪怕一个字节，认证标签就对不上了，你能立刻知道数据被改过。

这也是为什么 TLS 1.3 强制使用 AEAD 模式——光加密不够，还得验证完整性。

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"构造计数器块","d":"CTRᵢ = Nonce ‖ 32 位计数器，每处理一个块计数器加 1。同一把密钥下 Nonce 绝对不可重用。"},{"t":"生成密钥流","d":"用密钥 K 加密每个计数器块，得到密钥流 Sᵢ。各块互不依赖，可以充分并行。"},{"t":"异或得到密文","d":"Cᵢ = Pᵢ ⊕ Sᵢ。GCM 的加密部分本质是流密码，所以不需要任何填充。"},{"t":"GHASH 认证计算","d":"把 H、AAD（只认证不加密的附加数据）、所有密文块和长度一起，在 GF(2¹²⁸) 上算出中间值。"},{"t":"输出认证标签 Tag","d":"中间值与 S₀ 异或得到 Tag。接收方先验 Tag，不匹配就直接拒绝解密——密文只要被改动一个字节就会被发现。"}]'>
<svg viewBox="0 0 840 520" role="img" aria-label="GCM 模式原理图：CTR 加密与 GHASH 认证标签计算" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m5p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box" x="24" y="24" width="190" height="44" rx="9"/><text class="dg-tb" x="119" y="42">Nonce / IV</text><text class="dg-ts" x="119" y="60">12 字节，绝对不可重用</text>
<rect class="dg-box-p" x="24" y="100" width="190" height="44" rx="9"/><text class="dg-tb" x="119" y="118">密钥 K</text><text class="dg-ts" x="119" y="136">所有块共用同一把</text>
<text class="dg-ts" x="270" y="10" text-anchor="start">CTRᵢ = Nonce ‖ 32 位计数器（每块 +1）</text>
<rect class="dg-box" x="270" y="24" width="110" height="40" rx="8"/><text class="dg-tb" x="325" y="44">CTR₁</text>
<rect class="dg-box" x="445" y="24" width="110" height="40" rx="8"/><text class="dg-tb" x="500" y="44">CTR₂</text>
<rect class="dg-box" x="620" y="24" width="110" height="40" rx="8"/><text class="dg-tb" x="675" y="44">CTR₃</text>
<path class="dg-dash" d="M380,44 H441" marker-end="url(#m5)"/>
<path class="dg-dash" d="M555,44 H616" marker-end="url(#m5)"/>
<path class="dg-line-p" d="M214,46 H266" marker-end="url(#m5p)"/>
<path class="dg-line-p" d="M214,122 H240 V96 H266" marker-end="url(#m5p)"/>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-p" x="270" y="86" width="110" height="40" rx="8"/><text class="dg-tb" x="325" y="106">AES 加密 K</text>
<rect class="dg-box-p" x="445" y="86" width="110" height="40" rx="8"/><text class="dg-tb" x="500" y="106">AES 加密 K</text>
<rect class="dg-box-p" x="620" y="86" width="110" height="40" rx="8"/><text class="dg-tb" x="675" y="106">AES 加密 K</text>
<path class="dg-dash" d="M380,116 H441" marker-end="url(#m5)"/>
<path class="dg-dash" d="M555,116 H616" marker-end="url(#m5)"/>
<text class="dg-ts" x="620" y="78" text-anchor="start">各块互不依赖，可并行计算</text>
<rect class="dg-box-a" x="270" y="148" width="110" height="34" rx="8"/><text class="dg-tb" x="325" y="165">S₁</text>
<rect class="dg-box-a" x="445" y="148" width="110" height="34" rx="8"/><text class="dg-tb" x="500" y="165">S₂</text>
<rect class="dg-box-a" x="620" y="148" width="110" height="34" rx="8"/><text class="dg-tb" x="675" y="165">S₃</text>
<text class="dg-ts" x="752" y="165" text-anchor="start">密钥流</text>
</g>
<g class="dg-pop" data-step="2">
<circle class="dg-xor" cx="325" cy="222" r="15"/><text class="dg-op" x="325" y="222">⊕</text>
<circle class="dg-xor" cx="500" cy="222" r="15"/><text class="dg-op" x="500" y="222">⊕</text>
<circle class="dg-xor" cx="675" cy="222" r="15"/><text class="dg-op" x="675" y="222">⊕</text>
<rect class="dg-box" x="270" y="252" width="110" height="34" rx="8"/><text class="dg-tb" x="325" y="269">P₁</text>
<rect class="dg-box" x="445" y="252" width="110" height="34" rx="8"/><text class="dg-tb" x="500" y="269">P₂</text>
<rect class="dg-box" x="620" y="252" width="110" height="34" rx="8"/><text class="dg-tb" x="675" y="269">P₃</text>
<text class="dg-ts" x="752" y="269" text-anchor="start">明文块</text>
<rect class="dg-box-p" x="370" y="205" width="110" height="34" rx="8"/><text class="dg-tb" x="425" y="222">C₁</text>
<rect class="dg-box-p" x="545" y="205" width="110" height="34" rx="8"/><text class="dg-tb" x="600" y="222">C₂</text>
<rect class="dg-box-p" x="720" y="205" width="110" height="34" rx="8"/><text class="dg-tb" x="775" y="222">C₃</text>
<text class="dg-ts" x="775" y="190" text-anchor="start">密文块</text>
<path class="dg-line" d="M325,182 V204" marker-end="url(#m5)"/>
<path class="dg-line" d="M500,182 V204" marker-end="url(#m5)"/>
<path class="dg-line" d="M675,182 V204" marker-end="url(#m5)"/>
<path class="dg-line" d="M325,250 V240" marker-end="url(#m5)"/>
<path class="dg-line" d="M500,250 V240" marker-end="url(#m5)"/>
<path class="dg-line" d="M675,250 V240" marker-end="url(#m5)"/>
<path class="dg-line-p" d="M342,222 H366" marker-end="url(#m5p)"/>
<path class="dg-line-p" d="M517,222 H541" marker-end="url(#m5p)"/>
<path class="dg-line-p" d="M692,222 H716" marker-end="url(#m5p)"/>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="24" y="176" width="190" height="44" rx="9"/><text class="dg-tb" x="119" y="194">H = AES(K, 0¹²⁸)</text><text class="dg-ts" x="119" y="212">GHASH 子密钥</text>
<rect class="dg-box" x="24" y="252" width="190" height="44" rx="9"/><text class="dg-tb" x="119" y="270">AAD 附加数据</text><text class="dg-ts" x="119" y="288">可选，只认证不加密</text>
<rect class="dg-box-a" x="270" y="330" width="560" height="44" rx="9"/><text class="dg-tb" x="550" y="348">GHASH(H)：AAD ‖ C₁ ‖ C₂ ‖ C₃ ‖ 长度</text><text class="dg-ts" x="550" y="366">在 GF(2¹²⁸) 上做带密钥的认证计算</text>
<path class="dg-line-a" d="M214,198 H236 V352 H266" marker-end="url(#m5a)"/>
<path class="dg-line-a" d="M214,274 H226 V362 H266" marker-end="url(#m5a)"/>
</g>
<g data-step="3" data-flow="1">
<path class="dg-line" d="M425,239 V326" marker-end="url(#m5)"/>
<path class="dg-line" d="M600,239 V326" marker-end="url(#m5)"/>
<path class="dg-line" d="M775,239 V326" marker-end="url(#m5)"/>
</g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-a" x="430" y="406" width="140" height="34" rx="8"/><text class="dg-tb" x="500" y="423">⊕ S₀</text>
<text class="dg-ts" x="500" y="456">S₀ = 计数器 0 的密钥流</text>
<rect class="dg-box-g" x="400" y="462" width="200" height="44" rx="9"/><text class="dg-tb" x="500" y="484">认证标签 Tag</text>
<text class="dg-ts" x="620" y="478" text-anchor="start">解密时先验 Tag，</text>
<text class="dg-ts" x="620" y="494" text-anchor="start">不匹配直接拒绝解密</text>
</g>
<g data-step="4" data-flow="1">
<path class="dg-line" d="M550,374 V402" marker-end="url(#m5)"/>
<path class="dg-line" d="M500,440 V458" marker-end="url(#m5)"/>
</g>
</svg>
<figcaption>图 5：GCM 模式。计数器块经 AES 加密产生密钥流，与明文块异或得到密文——各块互不依赖，可以并行；同时用 GHASH 把 AAD、所有密文块和长度一起算出认证标签。密文被改动一个字节，标签就对不上，解密方立刻能发现。点上面的「播放」可以看加密与认证两条线是怎么同时跑的。</figcaption>
</figure>

## 核心特性

| 特性 | 说明 |
|------|------|
| **类型** | 对称分组密码 |
| **分组大小** | 128 位（固定） |
| **密钥长度** | 128 / 192 / 256 位 |
| **安全性** | 无已知的有效密钥恢复攻击（旁路攻击除外） |
| **性能** | 现代 CPU 大多有硬件 AES-NI 指令集加速 |
| **标准化** | FIPS PUB 197、ISO/IEC 18033-3 |

特别说一句 AES-NI。Intel 和 AMD 从 2010 年前后开始在 CPU 里集成了专门的 AES 硬件指令。开了 AES-NI 之后，AES 加密吞吐量能提升好几倍，甚至几十倍。你在服务器上跑加密操作的时候，其实大部分时间开销不在加密本身，在网络或 I/O 上。

## 实际应用场景

### 1. TLS/HTTPS

TLS 1.3 把对称加密算法选项精简到了只剩 AEAD 模式。AES-GCM 和 AES-CCM 是其中最常见的两种。你访问任何一个 HTTPS 网页，浏览器和服务器握手时会协商使用哪种对称加密，AES-GCM 往往是首选。

### 2. 全盘加密

BitLocker（Windows）、FileVault（macOS）、LUKS/dm-crypt（Linux）都用到了 AES。这个场景里，加密和I/O 要同时进行，AES-NI 硬件加速就特别关键。

### 3. 数据库字段加密

像身份证号、银行卡号这类敏感字段，很多合规要求里要求"静态加密"。应用层先 AES-GCM 加密再存库，即使数据库泄露了，数据也是密文状态。

不过说实话，密钥管理才是这个场景里最难的部分——密钥放配置文件里有泄露风险，放密钥管理服务里又增加运维负担。很多人实现字段加密时，把密钥和密文存在同一个数据库里，这跟没加密没什么两样。

### 4. 无线安全

WPA2 用 AES-CCMP（CCM 模式），WPA3 强制使用 AES。你连 WiFi 输入密码之后的所有通信，都是由 AES 在硬件层面保护的。

### 5. AWS S3 服务端加密

S3 的 SSE-S3 模式在写入数据之前自动用 AES-256 加密。对用户完全透明——你照常读写，加密发生在存储层。

## 常见误区

### 误区一：AES-256 一定比 AES-128 更安全

对暴力搜索来说，是的。但 AES-256 的密钥扩展更复杂，在某些微架构攻击场景下反而可能**更弱**（比如相关密钥攻击）。对于绝大多数应用来说 AES-128 绰绰有余，AES-256 更多是为了满足严格的合规标准。

### 误区二：选对算法就行了，模式不重要

一个选了 ECB 模式的 AES-256 加密，安全性不如选了 CBC 模式的 AES-128。算法和模式要一起考虑。我之前审一个外包项目的代码，发现他们用 AES-256-ECB 来加密用户密码——密钥倒是够强，但 ECB 的问题让攻击者可以重放和替换密文块。

### 误区三：AES 加密后不需要完整性校验

CBC 和 ECB 模式下，攻击者可以修改密文而不被发现。你的解密程序会"成功"解出点什么——只不过已经被篡改过了。这就是为什么密码学里的共识是：加密一定要配认证。要么用 GCM/CCM，要么在加密模式之外套一个 HMAC。

## AES vs DES vs ChaCha20

| | AES | DES | ChaCha20 |
|---|---|---|---|
| **类型** | 分组密码 | 分组密码 | 流密码 |
| **密钥长度** | 128/192/256 位 | 56 位 | 256 位 |
| **分组大小** | 128 位 | 64 位 | 无（流密码） |
| **安全强度** | 高 | 低（可暴力破解） | 高 |
| **硬件加速** | AES-NI | 无 | 无 |
| **主要场景** | TLS、全盘加密、数据库加密 | 遗留系统 | 移动端、TLS 备用 |

ChaCha20 是 Google 在移动设备上推的替代方案。因为很多移动 CPU 没有 AES-NI 指令集，跑 AES 比较吃力，而 ChaCha20 是专门为软件实现优化设计的，性能反而更好。

## 常见问题

**Q: AES 密钥到底要多长才够？**

128 位对于 99% 的应用场景已经够了。2^128 次尝试，就算用地球上所有计算力并行，也要耗尽宇宙的寿命。选 256 位更多是商业合规需求（比如 FIPS 140-2 某些级别要求 AES-256），而非实际安全需要。

**Q: 初始化向量 IV 可以重用吗？**

对于 CBC 模式，IV 可以公开但不能预测、不能重用。对于 GCM 模式，IV（也叫 nonce）**绝对不可以重用**——一旦重用，攻击者可以直接恢复认证密钥。如果有任何概率发生 nonce 重复（比如用随机 nonce 又高频调用），建议用 AES-GCM-SIV 这类抗 nonce 重用的变体。

**Q: 自己实现 AES 安全吗？**

千万别。算法虽然公开，但实现中的旁路攻击（时序攻击、缓存攻击、功耗分析）防不胜防。用经过审计的库（OpenSSL、libsodium、Web Crypto API），不要自己写 AES 实现，除非你的目的就是学习和研究。

**Q: 密码学里说的"语义安全"是什么意思？**

简单讲：同一个明文加密两次，得到的密文要不一样，否则攻击者就能通过比较密文推断明文。CBC 和 GCM 模式的随机 IV 就保证了这一点，ECB 不满足语义安全就是因为同一个明文块永远出同一个密文块。

**Q: 为什么 Web Crypto API 中 AES-CBC 不推荐了？**

Chrome 从某个版本起对 `SubtleCrypto.encrypt` 使用 AES-CBC 时打出了控制台警告。原因是 CBC 没有内置认证，容易出 padding oracle 漏洞。现在推荐用 AES-GCM 或者 AES-CTR + HMAC 的组合（Encrypt-then-MAC）。工具的加密工具也保留了 CBC 模式，但建议优先选 GCM。
