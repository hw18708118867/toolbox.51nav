---
title: "RSA 加密原理：从大数分解到 HTTPS 的基石"
toolId: rsa
category: encryption
description: "从数学直觉理解 RSA 非对称加密的核心原理：为什么两个大素数相乘容易、分解难、公钥与私钥的数学关系、RSA 签名与加密的区别、以及在 HTTPS 和 SSH 中的应用"
keywords: [RSA加密, 非对称加密, 公钥私钥, 大数分解, 欧拉定理, HTTPS, RSA签名, 加密原理]
author: 开发工具箱
date: 2026-06-15
updated: 2026-08-31
phase: 1
relatedTools: [aes, des, rsa-keygen]
relatedTutorials: [aes, des, rsa-keygen]
---

## 什么是 RSA？

RSA 是目前应用最广泛的**非对称加密算法**。非对称的意思是：加密和解密用两把不同的钥匙——公钥加密，私钥解密。公钥可以随便分发，私钥必须死守。

打个比方：RSA 就像街边的公共邮筒。任何人都能把信投进去（公钥加密），但只有邮递员手里的钥匙能打开取信（私钥解密）。这个比喻虽然老套，但确实抓到了 RSA 最核心的设计意图。

我第一次真正理解 RSA 是在配置 GitHub SSH 密钥的时候。当时照着教程生成了一个 `id_rsa` 文件和一个 `id_rsa.pub` 文件，把 `.pub` 上传到 GitHub 就行了。我心想：这不就等于把钥匙的一半公开了吗？后来才明白——私钥在我电脑里，公钥在 GitHub 上，我拿私钥签名，GitHub 拿公钥验证。整个过程里私钥从来没出过我的机器。

RSA 这个名字取自三位发明者的姓氏首字母：Ron Rivest、Adi Shamir 和 Leonard Adleman。1977 年，他们在 MIT 实验室里提出了这个方案。值得一提的是，英国 GCHQ 的数学家 Clifford Cocks 其实在 1973 年就独立发现了等价的算法，但因为军事保密直到 1997 年才解密——密码学史上这类"被埋没的第一发现者"故事还有很多。

## RSA 的工作原理

坦白讲，RSA 背后的数学不算浅。但如果你愿意花十分钟跟着我走一遍下面这个小数字的例子，你会发现核心思路其实就一句话：**两个大素数相乘容易，把乘积分解回去难，这个不对称性就是 RSA 的全部根基。**

### 先用小数字走一遍完整流程

假设我们选了这两个素数（专业术语：p 和 q）：

```
p = 3, q = 11
```

下面这五步就是上面这行数学生成密钥的全过程，点「播放」可以一步步看：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"选两个素数 p、q","d":"随机挑选两个大素数。实际使用中它们各约 1024 位；这里为了能手算，取 p=3、q=11。"},{"t":"算模数 n","d":"n = p × q = 33。这个 n 会同时出现在公钥和私钥里，是可以公开的。"},{"t":"算欧拉函数 φ(n)","d":"φ(n) = (p-1)(q-1) = 20，含义是 1 到 32 中与 33 互质的数有 20 个。这个值必须严格保密——泄露它就等于泄露私钥。"},{"t":"选公钥指数 e","d":"e 要满足 1 < e < φ(n) 且与 φ(n) 互质，这里取 e=3。实际通用的取值是 65537。"},{"t":"算私钥指数 d","d":"d 是 e 关于模 φ(n) 的乘法逆元，即 e × d ≡ 1 (mod φ(n))。3 × 7 = 21 ≡ 1 (mod 20)，所以 d=7。"},{"t":"得到密钥对","d":"公钥是 (n, e) = (33, 3)，可以公开发布；私钥是 (n, d) = (33, 7)，必须死守。两者共用同一个模数 n。"}]'>
<svg viewBox="0 0 840 510" role="img" aria-label="RSA 密钥生成流程：从两个素数到公钥私钥" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mr1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mr1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="300" y="40" width="80" height="40" rx="8"/><text class="dg-tb" x="340" y="60">p = 3</text>
<rect class="dg-box-p" x="460" y="40" width="80" height="40" rx="8"/><text class="dg-tb" x="500" y="60">q = 11</text>
<text class="dg-ts" x="560" y="60" text-anchor="start">随机挑选的两个素数（实际各 1024 位）</text>
</g>
<g data-step="1" data-flow="1">
<path class="dg-dash" d="M340,80 V96 H500"/>
<path class="dg-line-p" d="M420,96 V108" marker-end="url(#mr1p)"/>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="320" y="112" width="200" height="44" rx="9"/><text class="dg-tb" x="420" y="126">n = p × q = 33</text><text class="dg-ts" x="420" y="146">公钥和私钥共用的模数</text>
<text class="dg-ts" x="540" y="134" text-anchor="start">这个可以公开</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M420,156 V172" marker-end="url(#mr1p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="320" y="176" width="200" height="44" rx="9"/><text class="dg-tb" x="420" y="190">φ(n) = (p-1)(q-1) = 20</text><text class="dg-ts" x="420" y="210">1 到 32 中与 33 互质的数的个数</text>
<text class="dg-ts" x="540" y="198" text-anchor="start">⚠ 必须严格保密</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M420,220 V252" marker-end="url(#mr1p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="320" y="256" width="200" height="44" rx="9"/><text class="dg-tb" x="420" y="270">e = 3</text><text class="dg-ts" x="420" y="290">1 &lt; e &lt; φ(n) 且与 φ(n) 互质</text>
<text class="dg-ts" x="540" y="278" text-anchor="start">实际通用取值 65537</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M420,300 V332" marker-end="url(#mr1p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="320" y="336" width="200" height="44" rx="9"/><text class="dg-tb" x="420" y="350">d = 7</text><text class="dg-ts" x="420" y="370">e × d ≡ 1 (mod φ(n))</text>
<text class="dg-ts" x="540" y="358" text-anchor="start">3 × 7 = 21 ≡ 1 (mod 20)</text>
</g>
<g data-step="5" data-flow="1">
<path class="dg-line-p" d="M420,380 V408 H265 V432" marker-end="url(#mr1p)"/>
<path class="dg-line-p" d="M420,380 V408 H575 V432" marker-end="url(#mr1p)"/>
</g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-p" x="170" y="436" width="190" height="48" rx="9"/><text class="dg-tb" x="265" y="452">公钥 (n=33, e=3)</text><text class="dg-ts" x="265" y="472">可以公开发布</text>
<rect class="dg-box-a" x="480" y="436" width="190" height="48" rx="9"/><text class="dg-tb" x="575" y="452">私钥 (n=33, d=7)</text><text class="dg-ts" x="575" y="472">必须严格保密</text>
</g>
<text class="dg-ts" x="24" y="500" text-anchor="start">实际使用中 p、q 各约 1024 位，n 是 2048 位的大整数</text>
</svg>
<figcaption>图 1：RSA 密钥生成。两个素数相乘得到模数 n，由 n 推出欧拉函数 φ(n)（必须保密），再选公钥指数 e 并求出它的模逆元 d。公钥 (n, e) 公开，私钥 (n, d) 保密。点上面的「播放」可以看每一步。</figcaption>
</figure>

**第一步：算 n。** n = p × q = 3 × 11 = 33。这个 33 会成为公钥和私钥的公共部分。

**第二步：算 φ(n)。** 这是欧拉函数值，对于两个素数的乘积，φ(n) = (p-1) × (q-1) = 2 × 10 = 20。它的含义是：1 到 33 之间有多少个数和 33 互质。这个 20 不能公开。

**第三步：选公钥指数 e。** e 要满足两个条件：1 < e < φ(n)，且 e 和 φ(n) 互质。φ(n) = 20，我们选 e = 3（3 和 20 互质，满足条件）。公钥就是 (n=33, e=3)。

**第四步：算私钥指数 d。** d 是 e 关于模 φ(n) 的乘法逆元，也就是 e × d ≡ 1 (mod φ(n))。3 × d ≡ 1 (mod 20)，穷举一下 d=7 成立（3×7=21 ≡ 1 mod 20）。私钥就是 (n=33, d=7)。

**加解密验证：** 假设我们要加密的消息 m = 8（要求 m < n）：

```
加密：c = m^e mod n = 8^3 mod 33 = 512 mod 33 = 17
解密：m = c^d mod n = 17^7 mod 33
```

17^7 手动算有点大，但你可以拿工具验证：17^7 = 410338673，410338673 / 33 的余数等于 8。解密成功！

把上面这串计算画成图，就是一次完整的 RSA 加解密：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"生成密钥对","d":"接收方先算出公钥 (33, 3) 和私钥 (33, 7)，把公钥发给发送方，私钥自己留着。"},{"t":"准备明文","d":"要加密的消息 m = 8。RSA 要求明文必须小于模数 n，这里 8 < 33，满足条件。"},{"t":"用公钥加密","d":"发送方执行 c = m^e mod n，也就是 8^3 mod 33 = 17。这一步任何人都能做，因为公钥是公开的。"},{"t":"密文传输","d":"密文 17 在不安全的信道上传输，谁都能截获到这个数字。"},{"t":"用私钥解密","d":"接收方执行 m = c^d mod n，也就是 17^7 mod 33 = 8。这一步只有持有私钥的人能做。"},{"t":"还原出明文","d":"明文 m = 8 被完整还原。整个过程中私钥从未离开过接收方的机器。"},{"t":"窃听者为什么解不开","d":"窃听者手里有 n=33、e=3、c=17，想解出 m 就必须先求 d=7；求 d 需要先知道 φ(n)=20；而求 φ(n) 必须把 33 分解成 3×11。这就是大数分解难题。"}]'>
<svg viewBox="0 0 840 480" role="img" aria-label="RSA 加解密完整流程：公钥加密私钥解密" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mr2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mr2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mr2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-a" x="220" y="24" width="400" height="44" rx="9"/><text class="dg-tb" x="420" y="40">接收方生成密钥对</text><text class="dg-ts" x="420" y="58">公钥 (n=33, e=3) 公开　私钥 (n=33, d=7) 自留</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,68 V84" marker-end="url(#mr2p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-p" x="320" y="88" width="200" height="40" rx="8"/><text class="dg-tb" x="420" y="108">明文 m = 8</text>
<text class="dg-ts" x="540" y="108" text-anchor="start">要求 m &lt; n（本例 8 &lt; 33）</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M420,128 V144" marker-end="url(#mr2p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="320" y="148" width="200" height="48" rx="9"/><text class="dg-tb" x="420" y="166">加密 c = m^e mod n</text><text class="dg-ts" x="420" y="186">c = 8^3 mod 33 = 17</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-p" x="580" y="148" width="170" height="48" rx="8"/><text class="dg-tb" x="665" y="166">公钥 (n=33, e=3)</text><text class="dg-ts" x="665" y="186">公开给全世界</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M576,172 H524" marker-end="url(#mr2p)"/></g>
<g data-step="3" data-flow="1">
<path class="dg-line-a" d="M420,196 V212" marker-end="url(#mr2a)"/>
<path class="dg-dash" d="M470,236 H700 V404" marker-end="url(#mr2)"/>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="320" y="216" width="200" height="40" rx="8"/><text class="dg-tb" x="420" y="236">密文 c = 17</text>
<text class="dg-ts" x="100" y="236" text-anchor="end">在不安全信道上传输</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M420,256 V272" marker-end="url(#mr2p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="320" y="276" width="200" height="48" rx="9"/><text class="dg-tb" x="420" y="294">解密 m = c^d mod n</text><text class="dg-ts" x="420" y="314">m = 17^7 mod 33 = 8</text>
</g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-a" x="580" y="276" width="170" height="48" rx="8"/><text class="dg-tb" x="665" y="294">私钥 (n=33, d=7)</text><text class="dg-ts" x="665" y="314">只有接收方持有</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M576,300 H524" marker-end="url(#mr2p)"/></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M420,324 V340" marker-end="url(#mr2p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="320" y="344" width="200" height="40" rx="8"/><text class="dg-tb" x="420" y="364">明文 m = 8（还原成功）</text>
</g>
<g class="dg-pop" data-step="6">
<rect class="dg-box-w" x="120" y="404" width="600" height="52" rx="9"/>
<text class="dg-t" x="420" y="422">窃听者知道 n=33、e=3、c=17，但要求出 d 必先分解 n = 3 × 11</text>
<text class="dg-ts" x="420" y="442">n 若是 2048 位，分解它需要的时间比宇宙年龄还长</text>
</g>
</svg>
<figcaption>图 2：RSA 的一次完整加解密。发送方用公开的公钥做加密，密文即使被截获也无妨，只有持有私钥的接收方能还原。点上面的「播放」可以看数据是怎么变化的。</figcaption>
</figure>

### 为什么别人破解不了？

你公开发布了 n=33 和 e=3。攻击者想要算出 d=7，唯一的办法是先算出 φ(n) = 20。要算 φ(n) 就得知道 p 和 q——而要知道 p 和 q，就必须把 33 分解成 3 × 11。

33 当然一秒钟就分解了。但如果 p 和 q 是两颗各 300 多位的素数呢？它们的乘积 n 是一个 600 多位的大整数。以目前已知最好的分解算法（数域筛法）和全球算力总和，分解一个 2048 位的 RSA 模数需要的时间比宇宙年龄还长。这就是 RSA 安全性的全部底气。

这个"单向性"是整个 RSA 的地基，值得单独画一张图：

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"两个大素数","d":"随机挑选两个各约 1024 位的素数 p 和 q。它们是私钥的核心秘密。"},{"t":"正向：相乘很容易","d":"p × q = n 只是一次大数乘法，计算机毫秒级就能算完。乘法在正向永远都是容易的。"},{"t":"逆向：分解极难","d":"从 n 反推 p 和 q 没有任何捷径。已知最好的数域筛法，配上全球算力，分解 2048 位 n 也要数万亿年。"},{"t":"攻击者的死路","d":"攻击者手里只有公钥 (n, e)。想求私钥 d 就得先求 φ(n)，求 φ(n) 就得先分解 n——每一步都是死胡同。"},{"t":"安全性只靠这一条","d":"RSA 的安全性不来自任何巧妙隐藏，而完全建立在「大数分解在计算上不可行」这一条假设上。算法完全公开，别人就是解不开。"}]'>
<svg viewBox="0 0 840 440" role="img" aria-label="RSA 单向性：大数相乘容易、分解极难" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mr3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mr3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="290" y="40" width="110" height="44" rx="8"/><text class="dg-tb" x="345" y="54">p</text><text class="dg-ts" x="345" y="72">1024 位大素数</text>
<rect class="dg-box-p" x="440" y="40" width="110" height="44" rx="8"/><text class="dg-tb" x="495" y="54">q</text><text class="dg-ts" x="495" y="72">1024 位大素数</text>
</g>
<g data-step="1" data-flow="1">
<path class="dg-dash" d="M345,84 V100 H495"/>
<path class="dg-line-p" d="M420,100 V112" marker-end="url(#mr3p)"/>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="290" y="116" width="260" height="52" rx="9"/><text class="dg-tb" x="420" y="132">n = p × q（2048 位）</text><text class="dg-ts" x="420" y="154">相乘：毫秒级，计算机最擅长的事</text>
<text class="dg-ts" x="570" y="142" text-anchor="start">✓ 容易，这就是 RSA 的正向</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-dash" d="M420,168 V184" marker-end="url(#mr3)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-w" x="290" y="188" width="110" height="44" rx="8"/><text class="dg-tb" x="345" y="210">p = ?</text>
<rect class="dg-box-w" x="440" y="188" width="110" height="44" rx="8"/><text class="dg-tb" x="495" y="210">q = ?</text>
<text class="dg-ts" x="570" y="202" text-anchor="start">✗ 极难：数域筛法 + 全球算力</text>
<text class="dg-ts" x="570" y="218" text-anchor="start">也要数万亿年</text>
</g>
<g data-step="3" data-flow="1">
<path class="dg-dash" d="M420,232 V262" marker-end="url(#mr3)"/>
<path class="dg-line" d="M170,294 H197" marker-end="url(#mr3)"/>
<path class="dg-line" d="M325,294 H352" marker-end="url(#mr3)"/>
<path class="dg-line" d="M480,294 H507" marker-end="url(#mr3)"/>
<path class="dg-line" d="M635,294 H662" marker-end="url(#mr3)"/>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="50" y="270" width="120" height="48" rx="8"/><text class="dg-tb" x="110" y="288">攻击者已知</text><text class="dg-ts" x="110" y="306">公钥 (n, e)</text>
<rect class="dg-box" x="205" y="270" width="120" height="48" rx="8"/><text class="dg-tb" x="265" y="288">想求</text><text class="dg-ts" x="265" y="306">私钥 d</text>
<rect class="dg-box" x="360" y="270" width="120" height="48" rx="8"/><text class="dg-tb" x="420" y="288">需先求</text><text class="dg-ts" x="420" y="306">φ(n)</text>
<rect class="dg-box" x="515" y="270" width="120" height="48" rx="8"/><text class="dg-tb" x="575" y="288">需先分解</text><text class="dg-ts" x="575" y="306">n → p, q</text>
<rect class="dg-box-w" x="670" y="270" width="120" height="48" rx="8"/><text class="dg-tb" x="730" y="288">结论</text><text class="dg-ts" x="730" y="306">走不通</text>
</g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-g" x="50" y="344" width="740" height="52" rx="9"/>
<text class="dg-t" x="420" y="362">RSA 的全部安全性，就建立在「大数分解在计算上不可行」这一条假设上</text>
<text class="dg-ts" x="420" y="382">算法完全公开，攻击者知道你在用什么数学，就是解不开</text>
<text class="dg-ts" x="420" y="416">768 位：2009 年被分解　1024 位：已不建议使用　2048 位：目前安全</text>
</g>
</svg>
<figcaption>图 3：RSA 依赖的单向性。两个大素数相乘只要毫秒，反过来把乘积分解回素数却要数万亿年——这个不对称就是全部安全性的来源。点上面的「播放」可以看攻击者为什么走投无路。</figcaption>
</figure>

说白了，RSA 的安全性不来自任何"巧妙隐藏"，而完全建立在"大数分解在计算上不可行"这一条假设上。这很反直觉——一个外人完全知道你在用什么数学做加密，他就是解不开。这也是密码学和日常"秘密"最大的区别。

### 数学灵魂：欧拉定理

上面 d 的求法不是随便来的。RSA 的正确性依赖欧拉定理：如果 m 和 n 互质，则 m^φ(n) ≡ 1 (mod n)。

加密是 m^e mod n，解密是再对密文做 d 次幂：(m^e)^d = m^(ed) = m^(kφ(n) + 1) = (m^φ(n))^k × m ≡ 1^k × m ≡ m (mod n)。严谨的证明要处理 m 和 n 不互质的情况，但借助中国剩余定理可以证明那个场景下照样成立。

说实话，我第一次看到这个证明的时候也感觉像变魔术——明明是做了模指数运算，绕了一圈又回到了原点。但把 e 和 d 代入那个等式中一步步化简之后，就觉得这设计真的特别干净。

上面那段推导拆成一步步，是这样走的：

<figure class="dg-figure" data-interval="2400" data-steps='[{"t":"加密：c = m^e mod n","d":"把明文 m 做 e 次幂再取模。本例 8^3 mod 33 = 17，明文变成了看起来毫无关系的 17。"},{"t":"解密并合并指数","d":"解密是 c^d，代入 c = m^e 得到 (m^e)^d = m^(e·d)。指数相乘：e·d = 3 × 7 = 21。"},{"t":"关键恒等式","d":"因为 d 是 e 关于模 φ(n) 的逆元，所以 e·d = k·φ(n) + 1。本例 21 = 1 × 20 + 1，即 k=1、φ(n)=20。"},{"t":"把指数拆开","d":"m^(e·d) = m^(k·φ(n)+1) = (m^φ(n))^k × m。本例 8^21 = (8^20)^1 × 8。"},{"t":"欧拉定理登场","d":"欧拉定理说 m^φ(n) ≡ 1 (mod n)（要求 m 与 n 互质）。本例 8^20 ≡ 1 (mod 33)。m 与 n 不互质的情况可用中国剩余定理证明同样成立。"},{"t":"回到原点","d":"(m^φ(n))^k × m ≡ 1^k × m ≡ m (mod n)。本例 1^1 × 8 = 8，明文完好无损地回来了。绕了一大圈，全靠 e 和 d 互为模逆元。"}]'>
<svg viewBox="0 0 840 472" role="img" aria-label="欧拉定理推导：为什么 RSA 解密能还原明文" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mr4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mr4p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<circle class="dg-xor" cx="200" cy="64" r="14"/><text class="dg-tl" x="200" y="64">1</text>
<rect class="dg-box-p" x="220" y="40" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="56">加密 c = m^e mod n</text><text class="dg-ts" x="420" y="76">本例：c = 8^3 mod 33 = 17</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,88 V108" marker-end="url(#mr4p)"/></g>
<g class="dg-pop" data-step="1">
<circle class="dg-xor" cx="200" cy="136" r="14"/><text class="dg-tl" x="200" y="136">2</text>
<rect class="dg-box" x="220" y="112" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="128">解密 c^d = (m^e)^d = m^(e·d) mod n</text><text class="dg-ts" x="420" y="148">指数相乘：e·d = 3 × 7 = 21</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M420,160 V180" marker-end="url(#mr4p)"/></g>
<g class="dg-pop" data-step="2">
<circle class="dg-xor" cx="200" cy="208" r="14"/><text class="dg-tl" x="200" y="208">3</text>
<rect class="dg-box-a" x="220" y="184" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="200">关键：e·d = k·φ(n) + 1</text><text class="dg-ts" x="420" y="220">21 = 1 × 20 + 1，即 k = 1、φ(n) = 20</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M420,232 V252" marker-end="url(#mr4p)"/></g>
<g class="dg-pop" data-step="3">
<circle class="dg-xor" cx="200" cy="280" r="14"/><text class="dg-tl" x="200" y="280">4</text>
<rect class="dg-box" x="220" y="256" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="272">m^(e·d) = m^(k·φ(n)+1) = (m^φ(n))^k × m</text><text class="dg-ts" x="420" y="292">本例：8^21 = (8^20)^1 × 8</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M420,304 V324" marker-end="url(#mr4p)"/></g>
<g class="dg-pop" data-step="4">
<circle class="dg-xor" cx="200" cy="352" r="14"/><text class="dg-tl" x="200" y="352">5</text>
<rect class="dg-box-a" x="220" y="328" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="344">欧拉定理：m^φ(n) ≡ 1 (mod n)</text><text class="dg-ts" x="420" y="364">8^20 ≡ 1 (mod 33)，于是 (1)^1 × 8 = 8</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M420,376 V396" marker-end="url(#mr4p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="220" y="400" width="400" height="48" rx="9"/><text class="dg-tb" x="420" y="416">≡ 1^k × m ≡ m (mod n)，明文还原</text><text class="dg-ts" x="420" y="436">绕了一圈回到原点：m = 8 ✓</text>
</g>
</svg>
<figcaption>图 4：RSA 正确性的推导。加密解密合起来是 m^(e·d)，而 e·d = k·φ(n) + 1，拆开后由欧拉定理 m^φ(n) ≡ 1 (mod n) 消掉多余项，明文就回到了原点。点上面的「播放」可以看这个化简过程。</figcaption>
</figure>

## 核心特性

| 特性 | 说明 |
|------|------|
| **类型** | 非对称加密（公钥密码） |
| **安全性基础** | 大整数因数分解的计算困难性 |
| **常用密钥长度** | 2048 位、3072 位、4096 位 |
| **速度** | 比 AES 慢 100-1000 倍，不适合加密大量数据 |
| **密钥对** | 公钥 (n, e) + 私钥 (n, d) |
| **应用** | 密钥交换、数字签名、证书体系 |
| **标准化** | PKCS#1、RFC 8017、FIPS 186-4 |

有一回我在一个低配 VPS 上用纯软件 RSA（没有硬件加速）加密一个 1MB 的文件，等了快两分钟才跑完。再用 AES-256-GCM 试试同一台机器——不到 0.01 秒。从那以后我对"RSA 只用来加密会话密钥"这件事有了血肉层面的理解。

## 实际应用场景

### 1. HTTPS / TLS 握手

这是 RSA 最常见的出场舞台。你在浏览器里打开 `https://` 网站时，TLS 握手阶段浏览器拿到服务器的 RSA 公钥（写在证书里），然后随机生成一个临时的对称加密密钥（会话密钥），用 RSA 公钥加密后传给服务器。服务器用私钥解密拿到这个会话密钥，之后双方切 AES-GCM 高速通信。

不过话说回来，TLS 1.3 已经逐步废弃了 RSA 密钥交换（改用 ECDHE 做前向保密），RSA 在 TLS 1.3 里主要剩下签名证书这一项职责。

### 2. SSH 免密登录

生成过 SSH 密钥的人都不会陌生。你本地的 `~/.ssh/id_rsa` 是私钥，`~/.ssh/id_rsa.pub` 是公钥。公钥上传到服务器后，每次登录时服务端发一段随机数据让你用私钥签名，服务端拿公钥验证。私钥全程留在本地。

我同事的私钥权限设成了 644（所有人可读），SSH 直接拒绝使用——这个报错其实是在保护你，不是刁难你。

### 3. 数字签名

RSA 加密和签名是同一对数学操作的两种用法：加密是用公钥加密、私钥解密；签名是用私钥签名、公钥验证。签名时对消息的哈希值（比如 SHA-256 输出）做一次"私钥加密"，验证方用公钥"解密"得到哈希值然后比对。

代码签名（Windows 的 .exe 签名）、JWT 的 RS256 算法、PDF 电子签章，底层都是 RSA 签名。

### 4. PGP / GPG 邮件加密

你在 Thunderbird 里装上 Enigmail，或者直接用 `gpg` 命令行，就能给邮件做端到端加密。发件人拿收件人的 RSA 公钥加密邮件内容，只有收件人的私钥能解开。这跟邮筒模式的比喻严丝合缝。

### 5. 硬件安全模块与智能卡

银行卡芯片、U 盾、YubiKey 这些硬件里大多内置了 RSA 密钥对。私钥从出厂起就锁在芯片里，连操作系统都读不到。外部只能请芯片"帮我签一下这段数据"，芯片在内部完成签名运算后只返回结果。

## 常见误区

### 误区一：RSA 密钥越长就一定越安全

对暴力分解来说，是的。但密钥长度不能无限堆——4096 位 RSA 的运算量是 2048 位的约 8 倍（不是 2 倍），解密延迟在移动设备上会非常感人。对绝大多数场景，2048 位足够。NIST 的建议是 2030 年之前 2048 位都算安全，2030 年之后建议迁移到 3072 位。

老实说，如果你的私钥管理不合规（比如硬编码在代码仓库里），密钥再长也没用。安全事故里泄露和弱密码占了绝大多数，真正被别人分解 RSA 模数反而不是最常见的攻击路径。

### 误区二：RSA 可以替代 AES 直接加密大文件

不行，而且永远不应该这么做。RSA 能加密的消息长度有严格的数学限制：明文必须小于模数 n，实际中还要减去填充开销，2048 位 RSA 最多加密约 245 字节的数据。RSA 的正确用途是加密对称密钥（所谓"混合加密"），让 AES 去做大数据量的实际加解密。

### 误区三：RSA 签名和 RSA 加密是同一回事

操作上看似一样，但语义完全不同。加密是为了机密性，签名是为了认证和不可否认性。更关键的是，现实中不能直接把"私钥加密"当签名用——没有填充的 RSA 签名（教科书式 RSA）极其脆弱，必须用 PSS 或 PKCS#1 v1.5 签名方案。我早年写过一个"签名"功能直接拿裸 RSA 操作拼接，被做安全的朋友一顿批评——那段代码如果上生产环境，攻击者可以轻松伪造签名。

同一对密钥，两个方向，目的完全相反：

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"同一对密钥","d":"公钥 (n, e) 和私钥 (n, d) 是同一对，数学上 e 和 d 互为模逆元。"},{"t":"加密：公钥加密，私钥解密","d":"任何持有公钥的人都能加密，但只有私钥持有者能解开。密文只给收件人看，目的是保证机密性——不让别人看懂。"},{"t":"签名：私钥签名，公钥验证","d":"只有私钥持有者能签出有效签名，签名值跟着原文一起公开发布，任何持有公钥的人都能验证。目的是认证与不可否认——证明是谁签的。"},{"t":"为什么是相反的两件事","d":"加密解决「别人看不到」，签名解决「赖不掉」。一个求机密性，一个求身份认证，语义完全不同，填充方案也不同（OAEP 用于加密，PSS 用于签名）。"}]'>
<svg viewBox="0 0 840 472" role="img" aria-label="RSA 加密与签名的方向对比" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mr5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mr5p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mr5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box" x="320" y="24" width="200" height="44" rx="9"/><text class="dg-tb" x="420" y="40">RSA 密钥对</text><text class="dg-ts" x="420" y="58">公钥 (n, e) · 私钥 (n, d)</text>
</g>
<g data-step="1" data-flow="1">
<path class="dg-line-p" d="M420,68 V78 H215 V104" marker-end="url(#mr5p)"/>
<text class="dg-ts" x="300" y="70" text-anchor="start">加密方向</text>
</g>
<g data-step="2" data-flow="1">
<path class="dg-line-a" d="M420,68 V78 H625 V104" marker-end="url(#mr5a)"/>
<text class="dg-ts" x="460" y="70" text-anchor="start">签名方向</text>
</g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-p" x="145" y="104" width="140" height="38" rx="8"/><text class="dg-tb" x="215" y="123">明文 m</text>
<rect class="dg-box" x="145" y="162" width="140" height="42" rx="8"/><text class="dg-tb" x="215" y="177">公钥加密</text><text class="dg-ts" x="215" y="195">任何人都能做</text>
<rect class="dg-box-a" x="145" y="224" width="140" height="38" rx="8"/><text class="dg-tb" x="215" y="243">密文 c</text>
<rect class="dg-box" x="145" y="282" width="140" height="42" rx="8"/><text class="dg-tb" x="215" y="297">私钥解密</text><text class="dg-ts" x="215" y="315">只有持有者能做</text>
<rect class="dg-box-g" x="145" y="344" width="140" height="38" rx="8"/><text class="dg-tb" x="215" y="363">还原明文</text>
<path class="dg-line" d="M215,142 V158" marker-end="url(#mr5)"/>
<path class="dg-line" d="M215,204 V220" marker-end="url(#mr5)"/>
<path class="dg-line" d="M215,262 V278" marker-end="url(#mr5)"/>
<path class="dg-line" d="M215,324 V340" marker-end="url(#mr5)"/>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-p" x="555" y="104" width="140" height="38" rx="8"/><text class="dg-tb" x="625" y="123">消息哈希 h</text>
<rect class="dg-box" x="555" y="162" width="140" height="42" rx="8"/><text class="dg-tb" x="625" y="177">私钥签名</text><text class="dg-ts" x="625" y="195">只有持有者能做</text>
<rect class="dg-box-a" x="555" y="224" width="140" height="38" rx="8"/><text class="dg-tb" x="625" y="243">签名值 s</text>
<rect class="dg-box" x="555" y="282" width="140" height="42" rx="8"/><text class="dg-tb" x="625" y="297">公钥验证</text><text class="dg-ts" x="625" y="315">任何人都能验</text>
<rect class="dg-box-g" x="555" y="344" width="140" height="38" rx="8"/><text class="dg-tb" x="625" y="363">一致则通过</text>
<path class="dg-line" d="M625,142 V158" marker-end="url(#mr5)"/>
<path class="dg-line" d="M625,204 V220" marker-end="url(#mr5)"/>
<path class="dg-line" d="M625,262 V278" marker-end="url(#mr5)"/>
<path class="dg-line" d="M625,324 V340" marker-end="url(#mr5)"/>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="120" y="400" width="600" height="48" rx="9"/>
<text class="dg-t" x="420" y="416">加密 = 公钥加密、私钥解密 → 保证机密性</text>
<text class="dg-ts" x="420" y="436">签名 = 私钥签名、公钥验证 → 保证身份认证与不可否认性</text>
</g>
</svg>
<figcaption>图 5：RSA 加密与签名用的是同一对密钥，但方向完全相反。加密是公钥进私钥出，为的是不让别人看懂；签名是私钥进公钥出，为的是证明是谁签的。点上面的「播放」可以看两条路径的差异。</figcaption>
</figure>

## RSA vs ECC vs AES

| | RSA | AES | ECC (ECDSA/ECDH) |
|---|---|---|---|
| **类型** | 非对称 | 对称 | 非对称 |
| **密钥长度** | 2048-4096 位 | 128/256 位 | 256 位 |
| **速度** | 慢 | 极快 | 比 RSA 快（同等安全强度） |
| **主要用途** | 签名、密钥协商 | 数据加密 | 签名、密钥协商 |
| **安全基础** | 大数分解 | 混淆扩散 | 椭圆曲线离散对数 |
| **量子抗性** | 弱（Shor 算法可多项式破解） | 中等（Grover 减半） | 弱（Shor 同样适用） |

ECC 的崛起是个值得说的话题：达到 128 位安全强度，RSA 需要 3072 位密钥，而 ECC 只需要 256 位。在存储空间和带宽都紧张的移动端，ECC 的优势非常明显。但 RSA 胜在基础设施成熟——目前互联网证书里有半数以上还是 RSA 签名的。

不过说回正题，无论是 RSA 还是 ECC，后量子密码（PQC）的标准化都在推进中了。NIST 在 2024 年正式发布了第一批后量子标准（CRYSTALS-Kyber 等），未来 RSA 的江湖地位大概率会逐步让渡给这些新算法。

## 常见问题

**Q: "2048 位 RSA" 的 2048 指的是什么？**

指的是模数 n 的长度，也就是两个大素数的乘积有多少个二进制位。2048 位约等于 617 个十进制位——你可以脑补一下一个 617 位的整数有多大。p 和 q 各占一半，大概各 1024 位。

**Q: 公钥里的 e 为什么大家都用 65537？**

因为 65537 = 2^16 + 1，二进制是 `10000000000000001`，只有两个 1 位。用这个数做模幂运算时乘法次数最少，加密和验证签名都很快。同时 65537 是一个素数，满足和 φ(n) 互质。3 也曾经流行过，但后来发现有低指数攻击的风险，65537 成了通用的默认值。

**Q: RSA 公钥和私钥可以互换使用吗？**

数学上 e 和 d 确实是对称的——拿 d 加密的东西用 e 可以解开。但实践中绝不推荐这样做：私钥文件里往往包含了 CRT 加速参数（p、q、d mod(p-1) 等）可以加速解密，公钥文件不包含这些；直接拿私钥加密还会引入安全漏洞（没有正确的填充方案）。签名和加密请用各自规范定义的流程。

**Q: 如果我丢了私钥，能从公钥推导出来吗？**

不能。从公钥 (n, e) 推导私钥 d，唯一的已知路径是分解 n 得到 p 和 q。这恰好是大数分解难题——没法绕过。私钥丢了，加密数据等同于消失了。

**Q: RSA 和 RSA-PSS、RSA-OAEP 是什么关系？**

RSA 是核心数学运算（模幂），RSA-PSS 和 RSA-OAEP 是填充方案：OAEP（Optimal Asymmetric Encryption Padding）用于加密，PSS（Probabilistic Signature Scheme）用于签名。填充的目的有三：加入随机性保证语义安全、防御选择密文攻击、适配不同长度的消息。简单说，你永远不应该用"裸 RSA"——必须套上一个经过验证的填充方案。

**Q: 中国国密 SM2 和 RSA 相比怎么样？**

SM2 基于椭圆曲线，非对称结构类似 ECDSA。安全强度上 SM2（SM2 是 256 位曲线）和 RSA-3072 大致同级。主要区别是 SM2 采用了国产密码标准，在国内政务、金融系统里有合规要求。性能上 SM2 作为 ECC 族算法明显快于同安全强度的 RSA。
