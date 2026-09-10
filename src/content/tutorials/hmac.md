---
title: "HMAC 消息认证码：如何确保数据没被篡改"
toolId: hmac
category: hashing
description: "搞懂 HMAC（Hash-based Message Authentication Code）的核心原理：为什么单纯的哈希不够用、ipad 和 opad 两个魔术常数的作用、以及 HMAC 在 JWT、AWS API 签名和 Webhook 验证中的关键应用"
keywords: [HMAC, 消息认证码, HMAC-SHA256, JWT签名, API签名, webhook安全, ipad opad]
author: 开发工具箱
date: 2026-06-15
updated: 2026-09-10
phase: 1
relatedTools: [sha256, sha512, jwt, jwt-decode, aes, base64]
relatedTutorials: [sha256, jwt-decode, aes]
---

## 什么是 HMAC？

HMAC（Hash-based Message Authentication Code）直译过来叫"基于哈希的消息认证码"。名字挺长，但核心就两个字：**认证**。

普通的哈希函数（比如 SHA-256）能告诉你数据有没有被改动——你下载一个文件，算一下 SHA-256，和官网公布的值比对，对上了说明文件完整。但这里面藏着一个致命问题：如果有人同时篡改了文件和那个"官网公布的哈希值"呢？你拿着篡改后的文件算出哈希，再跟篡改后的值比对——一模一样。你还以为文件没问题。

说白了，哈希只能保证**完整性**，但它回答不了"这个哈希值本身可信吗"这个问题。HMAC 解决的就是这件事。

我第一次真正用到 HMAC 是在对接一个支付平台的回调接口。他们的文档写得很直接——"每个回调请求都会在 Header 里带一个 `X-Signature`，请用你的 API Secret 对请求体做 HMAC-SHA256 然后比对"。我当时想：这不就是带个密钥的哈希吗，有什么大不了的？后来被人指出我的实现有长度扩展漏洞的隐患，才老老实实去读了 RFC 2104。这一读才发现，HMAC 的 double-hash 设计精妙得让人拍大腿。

## HMAC 的工作原理

先看公式。标准的 HMAC 定义是：

```
HMAC(K, m) = H((K' ⊕ opad) || H((K' ⊕ ipad) || m))
```

别被符号吓跑。拆开来看：

- **K**：你的密钥。如果 K 比哈希函数的分组长度（SHA-256 是 64 字节）长，先对 K 做一次哈希把它缩短；如果 K 比分组长度短，后面补 0 填到 64 字节——这个处理后的结果叫 **K'**
- **ipad**：64 个 `0x36` 字节（0x36 = 00110110）
- **opad**：64 个 `0x5c` 字节（0x5c = 01011100）
- **⊕**：按位异或（XOR）
- **||**：拼接

整个流程分两步走：

**第一步（内层哈希）**：把密钥和 ipad 异或，拼上原始消息，算一次哈希。

```
inner = H( (K' ⊕ ipad) || message )
```

**第二步（外层哈希）**：把密钥和 opad 异或，拼上第一步的结果，再算一次哈希。

```
final = H( (K' ⊕ opad) || inner )
```

所以 HMAC-SHA256 的本质就是：**对消息做两次 SHA-256，但两次之间塞入了不同的密钥扰动**。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"输入密钥与消息","d":"准备共享密钥 K 和待认证的消息 m；K 只有收发双方知道，绝不随请求传输。"},{"t":"规整密钥长度","d":"若 K 比分组长度（SHA-256 为 64 字节）长就先哈希缩短，短则在右侧补 0，得到长度固定的 K′。"},{"t":"内层哈希","d":"把 K′ 与 ipad（64 个 0x36）逐字节异或得到面板，拼接消息 m 后做一次哈希 H，得到中间值 inner。"},{"t":"外层哈希","d":"把 K′ 与 opad（64 个 0x5c）逐字节异或得到面板，拼接 inner 后再做一次哈希 H。"},{"t":"输出 HMAC","d":"外层哈希的结果就是最终 HMAC。两次哈希之间夹着不同的密钥扰动，这就是它抗长度扩展的关键。"}]'>
<svg viewBox="0 0 820 520" role="img" aria-label="HMAC 计算过程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="300" y="28" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="50">密钥 K（共享）</text>
<rect class="dg-box" x="560" y="28" width="180" height="44" rx="9"/><text class="dg-tb" x="650" y="50">消息 m</text><text class="dg-ts" x="650" y="68">待认证内容</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M410,72 V108" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-a" x="300" y="110" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="132">K' 规整密钥</text><text class="dg-ts" x="410" y="150">长则哈希·短则补 0</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M410,154 V172 H155 V188" marker-end="url(#m1p)"/><path class="dg-line-p" d="M650,72 V232 H560" marker-end="url(#m1p)"/><path class="dg-line-p" d="M155,234 V252 H300" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="40" y="190" width="230" height="44" rx="9"/><text class="dg-tb" x="155" y="212">K' ⊕ ipad 面板</text><text class="dg-ts" x="155" y="230">ipad = 64×0x36</text>
<rect class="dg-box" x="300" y="270" width="260" height="46" rx="9"/><text class="dg-tb" x="430" y="292">内层哈希 H</text><text class="dg-ts" x="430" y="310">面板 || m → inner</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M410,154 V172 H665 V188" marker-end="url(#m1p)"/><path class="dg-line-p" d="M665,234 V332 H560" marker-end="url(#m1p)"/><path class="dg-line-p" d="M430,316 V348" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="550" y="190" width="230" height="44" rx="9"/><text class="dg-tb" x="665" y="212">K' ⊕ opad 面板</text><text class="dg-ts" x="665" y="230">opad = 64×0x5c</text>
<rect class="dg-box" x="300" y="350" width="260" height="46" rx="9"/><text class="dg-tb" x="430" y="372">外层哈希 H</text><text class="dg-ts" x="430" y="390">面板 || inner → HMAC</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M430,396 V438" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-g" x="260" y="440" width="340" height="50" rx="9"/><text class="dg-tb" x="430" y="462">HMAC 输出</text><text class="dg-ts" x="430" y="480">两次哈希夹着不同密钥扰动，抗长度扩展</text>
</g>
</svg>
<figcaption>图 1：HMAC 的两次哈希流程。密钥 K 先被规整成固定长度的 K'，分别和 ipad、opad 异或出两块面板；内层把「ipad 面板 ‖ 消息」哈希成 inner，外层再把「opad 面板 ‖ inner」哈希成最终 HMAC。点上面的「播放」可以看数据怎么一步步流动。</figcaption>
</figure>

### ipad 和 opad 为什么是这两个数？

0x36 和 0x5c 不是随便拍的。它们的汉明距离是 4——在二进制层面差得足够远，保证内层和外层哈希的初始状态完全不同。另外 0x36 XOR 0x5c = 0x6a，刚好也是个有足够差异的值。

你可以把 HMAC 想象成是给一个信封封口盖章。普通的哈希相当于你在信封外写了个校验和——别人篡改信纸再把校验和也改了，你根本看不出来。HMAC 则像是用一个只有你和对方才有的印章在封口处盖了个火漆印——改一点蜡就裂，而没印章的人裂了也补不上。

### 为什么 HMAC 能挡住长度扩展攻击？

我在前面 SHA-256 的文章里提到过长度扩展攻击：知道了 `H(message)` 和 message 的长度，哪怕不知道 message 本身，也可以算出 `H(message || padding || extra)`。这对基于 Merkle-Damgard 结构的哈希算法（SHA-256、SHA-1、MD5 等）是通用漏洞。

HMAC 用了双层哈希，让这个攻击彻底失效：外层哈希的输入是 `(K' ⊕ opad) || inner`，攻击者确实可以"扩展"外层哈希，但扩展出来的是 `H( (K' ⊕ opad) || inner || padding || extra )`——这跟正常的 HMAC 结构对不上。而且 K 是保密的，攻击者没办法构造有效的内层哈希。这就是 ipad/opad 这套"双保险"机制的威力。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"两种写法","d":"左边把密钥拼在消息前直接哈希；右边用标准 HMAC 做双层哈希。"},{"t":"攻击者已知什么","d":"基于 Merkle-Damgard 的哈希，只要知道 H(msg) 和 msg 长度，就能推算 H(msg || 填充 || 额外内容)。"},{"t":"朴素实现被破","d":"左边 secret 长度卡在分组边界时，攻击者在不知道 secret 的情况下也能算出合法扩展哈希，伪造通过。"},{"t":"HMAC 免疫","d":"右边外层哈希的输入是 K′ ⊕ opad 再拼接 inner，攻击者构造不出有效内层哈希，扩展结果和正常结构对不上。"},{"t":"结论","d":"永远用 HMAC 这类标准构造，别手写 secret 加 message 的哈希。绿：HMAC 安全；橙：朴素实现有长度扩展漏洞。"}]'>
<svg viewBox="0 0 820 500" role="img" aria-label="朴素哈希与 HMAC 抗长度扩展对比" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-w" x="50" y="50" width="320" height="50" rx="9"/><text class="dg-tb" x="210" y="72">朴素实现</text><text class="dg-ts" x="210" y="90">SHA256(secret || message)</text>
<rect class="dg-box-p" x="450" y="50" width="320" height="50" rx="9"/><text class="dg-tb" x="610" y="72">标准 HMAC</text><text class="dg-ts" x="610" y="90">双层哈希 + 密钥扰动</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M210,100 V138" marker-end="url(#m2)"/><path class="dg-line-p" d="M610,100 V138" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-w" x="50" y="140" width="320" height="50" rx="9"/><text class="dg-tb" x="210" y="162">攻击者已知 H 与长度</text><text class="dg-ts" x="210" y="180">Merkle-Damgard 可扩展</text>
<rect class="dg-box-p" x="450" y="140" width="320" height="50" rx="9"/><text class="dg-tb" x="610" y="162">攻击者同样已知 H 与长度</text><text class="dg-ts" x="610" y="180">但密钥 K 保密</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M210,190 V228" marker-end="url(#m2)"/><path class="dg-line-p" d="M610,190 V228" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-w" x="50" y="230" width="320" height="50" rx="9"/><text class="dg-tb" x="210" y="252">可伪造扩展哈希</text><text class="dg-ts" x="210" y="270">无需知道 secret 也能算</text>
<rect class="dg-box-p" x="450" y="230" width="320" height="50" rx="9"/><text class="dg-tb" x="610" y="252">无法构造内层哈希</text><text class="dg-ts" x="610" y="270">扩展结果结构对不上</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M210,280 V318" marker-end="url(#m2)"/><path class="dg-line-p" d="M610,280 V318" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-w" x="50" y="320" width="320" height="50" rx="9"/><text class="dg-tb" x="210" y="342">✗ 签名被伪造通过</text><text class="dg-ts" x="210" y="360">长度扩展攻击成功</text>
<rect class="dg-box-g" x="450" y="320" width="320" height="50" rx="9"/><text class="dg-tb" x="610" y="342">✓ 免疫长度扩展</text><text class="dg-ts" x="610" y="360">双层哈希挡住攻击</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M210,370 V408" marker-end="url(#m2)"/><path class="dg-line-p" d="M610,370 V408" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-w" x="200" y="410" width="420" height="50" rx="9"/><text class="dg-tb" x="410" y="432">结论：用 HMAC，别手写 secret + message 哈希</text><text class="dg-ts" x="410" y="450">朴素实现对 SHA-256 仍有长度扩展风险</text>
</g>
</svg>
<figcaption>图 2：朴素哈希 vs 标准 HMAC 抗长度扩展对比。左边把密钥拼在消息前直接哈希，攻击者在知道哈希值和长度时就能伪造扩展；右边 HMAC 的双层哈希让扩展结果和正常结构对不上，因此免疫。点上面的「播放」可以看左右两边各自的演化。</figcaption>
</figure>

## 核心特性

| 特性 | 说明 |
|------|------|
| **用途** | 消息认证和完整性校验，不是加密 |
| **底层哈希** | 通常是 SHA-256，也支持 SHA-1、SHA-512、MD5 等 |
| **输出长度** | 和底层哈希相同，HMAC-SHA256 输出 256 位（64 个十六进制字符） |
| **安全性依赖** | 底层哈希的抗碰撞性 + 密钥的保密性 |
| **抗长度扩展** | 天然免疫（双层哈希结构） |
| **标准化** | RFC 2104、FIPS PUB 198-1、NIST SP 800-107 |

有一点值得强调：HMAC 的安全性不要求底层哈希完全抗碰撞。2006 年 Bellare 的论文证明了，即使底层哈希的碰撞抵抗被削弱（比如 MD5），HMAC-MD5 的安全性也不会立即崩溃。这个特性让 HMAC 在面对哈希算法老旧化时有很好的韧性。

## 实际应用场景

### 1. JWT 签名（HS256）

你大概率见过这种 JWT：

```
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.XvLK8Shg7B1z...
```

第三段就是 `HMAC-SHA256(header_base64url + "." + payload_base64url, secret)`。

这里的 secret 是服务端保管的密钥。客户端把 JWT 发给服务端后，服务端用同一个 secret 重新算一遍 HMAC，结果跟附带的签名一致，就说明 Token 确实是自己签发出去的、中间没被篡改。注意 HS256 用的是同一个密钥做签发和验证——这叫**对称认证**。任何持有这个 secret 的人都能签发合法的 JWT。泄露了就是灾难。

我之前做单点登录系统的时候，一个同事不小心把 JWT secret 提交到了公开的 GitHub 仓库。前后不过 15 分钟就有自动化扫描工具发现了——结果是紧急轮换全部 secret，三台服务器一台台重启，折腾到半夜两点。从那以后，HS256 secret 我全是 32 字节以上随机串，而且强制走环境变量注入。

### 2. AWS Signature V4

AWS 的几乎所有 API（S3、EC2、Lambda……）都用了一套叫 SigV4 的签名方案。它的核心就是多次 HMAC：

```
kSecret  = "AWS4" + secret_key
kDate    = HMAC(kSecret,   date)
kRegion  = HMAC(kDate,     region)
kService = HMAC(kRegion,   service)
signing  = HMAC(kService,  "aws4_request")
signature = HMAC(signing,  string_to_sign)
```

这套层层推导的设计很讲究：每一层 HMAC 都限定了签名的范围——日期、区域、服务、请求内容——任何一层变了，最终的签名就对不上。所以即使用同一个 Access Key，攻击者拿到了给 S3 的签名，也伪造不了给 Lambda 的请求。

说实话，我第一次手动实现 SigV4 时对着 AWS 的文档啃了整整一个下午。那堆 `kDate`、`kRegion`、`kService` 的嵌套让我头晕。但理解之后就明白了——这种层层 HMAC 的方案不是故意复杂，而是把"权限范围"编码到了密钥派生链里，是一种很巧妙的最小权限实践。

### 3. Webhook 验证

Github、Stripe、微信支付——几乎所有提供回调的第三方服务，都会在 Webhook 请求里带上一个 HMAC 签名。

典型的流程：

1. 你在平台后台配置一个 Webhook Secret（一段随机字符串）
2. 平台在向你推送事件时，用这个 Secret 对请求体做 HMAC-SHA256，把结果放在 `X-Hub-Signature-256` 请求头里
3. 你的服务端收到请求后，用同一个 Secret 对收到的 Body 同样算一遍 HMAC
4. 两个签名一致 → 请求合法，是平台发的；不一致 → 丢弃或报警

注意这里的**时序比较**有一个陷阱：不能用 `==` 来直接比对两个签名字符串。因为 `==` 在大多数语言里是"短路比较"——第一个字符不同就立即返回 false，时间差异暴露了前缀匹配信息，理论上可以被利用做时序攻击。正确的姿势是用恒定时间比较函数（如 Python 的 `hmac.compare_digest`、Node 的 `crypto.timingSafeEqual`）。

我之前在做一个内部监控系统的时候，对接了好几个第三方 webhook。一开始没太在意签名验证，觉得"HTTPS 就够了嘛"。后来一个安全审计的同事直接演示了一遍——他用 Burp Suite 做了个中间人，把回调的 payload 改了，我的服务端照单全收。加上 HMAC 验证之后这个攻击面才算堵上。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"平台持有 Secret","d":"你在平台后台配置一段随机的 Webhook Secret，只有你和平台知道，不随请求传输。"},{"t":"平台签名","d":"平台用 Secret 对请求体做 HMAC-SHA256，把结果放进 X-Signature 之类的请求头。"},{"t":"传输明文与 MAC","d":"请求体是明文，但随附一个 MAC。攻击者能改明文，却算不出合法的新 MAC。"},{"t":"你重算 MAC","d":"你的服务端用同一个 Secret 对收到的 Body 重算一遍 HMAC-SHA256。"},{"t":"恒定时间比对","d":"把重算的 MAC 和请求头里的 MAC 做恒定时间比较：一致才放行，不一致丢弃并报警。绿：验证通过；橙：被篡改。"}]'>
<svg viewBox="0 0 820 500" role="img" aria-label="Webhook 的 HMAC 验证流程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-a" x="300" y="28" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="50">Webhook Secret</text><text class="dg-ts" x="410" y="68">随机串·收发双方共有</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M410,72 V108" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box-p" x="300" y="110" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="132">平台：HMAC-SHA256 签名</text><text class="dg-ts" x="410" y="150">Secret 对请求体算 MAC</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M410,154 V180 H170 V198" marker-end="url(#m3p)"/><path class="dg-line-p" d="M410,154 V180 H670 V198" marker-end="url(#m3p)"/><text class="dg-ts" x="410" y="222" text-anchor="middle">经网络传输（明文 + MAC）</text></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="60" y="200" width="220" height="44" rx="9"/><text class="dg-tb" x="170" y="222">请求体（明文）</text><text class="dg-ts" x="170" y="240">可被中间人看到/篡改</text>
<rect class="dg-box-a" x="560" y="200" width="220" height="44" rx="9"/><text class="dg-tb" x="670" y="222">MAC（签名）</text><text class="dg-ts" x="670" y="240">附带在请求头里</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M170,244 V270 H300" marker-end="url(#m3p)"/><path class="dg-line-p" d="M670,244 V348 H620" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-p" x="300" y="290" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="312">你：重算 HMAC-SHA256</text><text class="dg-ts" x="410" y="330">对收到的 Body 用同 Secret</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M410,334 V358" marker-end="url(#m3p)"/><path class="dg-line-p" d="M340,404 V428 H270" marker-end="url(#m3p)"/><path class="dg-line-p" d="M480,404 V428 H550" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-w" x="300" y="360" width="220" height="44" rx="9"/><text class="dg-tb" x="410" y="382">恒定时间比对</text><text class="dg-ts" x="410" y="400">timingSafeEqual</text>
<rect class="dg-box-g" x="60" y="430" width="210" height="44" rx="9"/><text class="dg-tb" x="165" y="456">验证通过 ✓</text>
<rect class="dg-box-w" x="550" y="430" width="210" height="44" rx="9"/><text class="dg-tb" x="655" y="456">被篡改 ✗</text>
</g>
</svg>
<figcaption>图 3：Webhook 的 HMAC 验证流程。平台用共享 Secret 对请求体签名，请求体明文随附 MAC 传输；你的服务端用同一个 Secret 重算 MAC，再做恒定时间比对。一致才放行，否则视为被篡改。点上面的「播放」可以看整条链路。</figcaption>
</figure>

### 4. API 请求签名

很多开放 API（交易所的行情接口、银行的开放平台、云服务的 REST API）要求在每个请求里带上时间戳和一个 HMAC 签名。核心思路一样：

```
signature = HMAC-SHA256(secret, method + path + timestamp + body)
```

服务端拿到请求后，先检查时间戳是否在允许范围内（防重放攻击），再用同一个 secret 算一遍签名比对。因为 secret 只在客户端和服务端之间共享、不随请求传输，攻击者即使截获了请求也改不了内容还重新生成签名。

### 5. 密钥派生（HKDF）

TLS 1.3 的密钥派生函数 HKDF 内部其实就是 HMAC-SHA256 的封装。从握手协商出的共享密文里，用 HMAC 一层层派生出会话密钥、IV 等各种材料。说 HMAC 是现代 TLS 的基石毫不夸张。

## 常见误区

### 误区一：HMAC 是加密

这是我见过最多的误解。HMAC **完全不是加密**——它不隐藏数据，只做认证。你用 HMAC 处理的消息仍然是明文，任何人都能读。HMAC 提供的是：接收方可以验证这条消息确实是你发的、而且中途没被改过。

举个例子：你在便签上写"把文件放在会议室"，然后用只有你们俩知道的印章在下面盖个章。便签上的字谁都看得见（不保密），但没人能伪造你的章（有认证）。这就是 HMAC。

### 误区二：HMAC 就是"把密钥拼在消息前面然后哈希"

很多人的直觉实现是 `SHA256(secret + message)`。这种"朴素带盐哈希"有两个问题：

第一，**长度扩展攻击**对 SHA-256 依然有效——如果 secret 长度正好是 64 字节的倍数，攻击者可以在不知道 secret 的情况下构造有效的扩展。

第二，**密钥暴露风险**：`SHA256(secret + message)` 对某些哈希实现来说，如果 message 恰好把 secret 的位置推到了某个分组的末尾，碰撞概率会上升。HMAC 的 ipad/opad 双哈希就是为了从数学上消除这类结构缺陷。

### 误区三：密钥不用太长，反正哈希都一样

HMAC 的安全性上限和密钥长度强相关。如果你用的是一个 4 字节的密钥，攻击者暴力尝试 2^32 次就能找到——这个量级用一台普通 GPU 秒级完成。推荐的 HMAC 密钥长度至少和底层哈希的输出长度一样：HMAC-SHA256 对应 32 字节以上的密钥。

而且密钥的质量也很要紧。我之前见过有团队用 `"company_name_2024"` 当 JWT secret——这类字典词可以被彩虹表秒杀。密钥必须是从密码学安全的随机源生成的，不是人想出来的。

### 误区四：签名验证时用 `==` 就够了

刚才在 Webhook 部分提过了，但值得重复——如果你用普通的字符串比较来验证 HMAC 签名，时序攻击就是理论上可行的。在安全敏感的代码里，永远用恒定时间比较。

## HMAC vs 纯哈希 vs 数字签名

| | 纯哈希（SHA-256） | HMAC | 数字签名（RSA/ECDSA） |
|---|---|---|---|
| **认证能力** | 无 | 有 | 有 |
| **密钥类型** | 无密钥 | 对称密钥（同一个） | 非对称（公钥+私钥） |
| **不可否认性** | 无 | 无 | 有 |
| **验证方** | 任何人 | 持有密钥的人 | 持有公钥的任何人 |
| **性能** | 极高 | 高（两次哈希） | 低（大数运算） |
| **典型场景** | 完整性校验 | API、JWT、Webhook | 证书、电子签名、区块链 |

HMAC 和数字签名之间选哪个，核心看一个点：**签名方和验证方是不是同一个人/系统**。如果请求是你自己签、自己验（比如签发 JWT 给客户端然后自己再验证），HMAC 就够，性能也好。如果需要把签名发给第三方验证、还要证明"这个签名只能是你做的"（不可否认性），那就必须用非对称签名。

## 配套工具

本站这套哈希与认证工具可以配合本文动手验证：

- [HMAC 计算工具](/tools/hashing/hmac)：选 SHA-256/512，填密钥和消息，直接看到 HMAC 结果，支持十六进制与 Base64 输出
- [SHA-256 哈希](/tools/hashing/sha256)：单独看底层哈希，理解 HMAC 内部那两次 SHA-256 是怎么算的
- [SHA-512 哈希](/tools/hashing/sha512)：高安全需求下的底层哈希
- [JWT 创建/签名/验证](/tools/security/jwt)：HS256 本质就是 HMAC-SHA256，可现场签名与验签
- [JWT 解码](/tools/encoding/jwt-decode)：快速查看一段 JWT 的 Header 与 Payload
- [Base64 编解码](/tools/encoding/base64)：HMAC 结果常用十六进制或 Base64 表达，可用来对照

## 常见问题

**Q: HMAC-SHA256 和 HS256 是什么关系？**

HS256 就是 HMAC-SHA256 在 JWT 语境下的别名。JWT 规范（RFC 7518）定义 HS256 = HMAC using SHA-256。对应的还有 HS384（HMAC-SHA384）和 HS512（HMAC-SHA512）。

**Q: HMAC 的结果可以截断吗？**

可以，而且在某些场景下是常见做法。比如 AWS SigV4 的签名输出经常会截断。但截断意味着安全位数的下降——你截到了 128 位，暴力搜索空间就从 2^256 变成了 2^128。截断之前想清楚能不能接受这个安全级别。

**Q: 可以用 MD5 做 HMAC 吗？**

不建议，但 HMAC-MD5 的安全性确实远超 MD5 本身。因为 HMAC 的双层哈希在结构上抵消了 MD5 的部分弱点。不过 MD5 的碰撞在实际中已经可以低成本构造，不要拿线上系统的安全去赌这种"理论上还扛得住"。能换 SHA-256 就换。

**Q: 一个密钥能在多个 HMAC 场景里复用吗？**

最好不要。不同用途用不同密钥是密码学的基本原则。JWT 签名用一个 secret，Webhook 验证用另一个 secret，API 签名用第三个。这样即使一个泄露了，另外两个场景不受影响。可以同时用一个主密钥通过 HKDF 派生出不同的子密钥，但别把同一个 raw secret 到处用。

**Q: HMAC 是不是只能和 SHA-256 搭配？**

不是。HMAC 是一个通用的构造框架，理论上可以搭配任何加密哈希函数。常见的组合有 HMAC-SHA1（遗留系统在用）、HMAC-SHA256（最普及）、HMAC-SHA512（高安全需求）、HMAC-SHA3（逐渐兴起）。选哪个看你的性能预算和安全需求，绝大多数场景下 HMAC-SHA256 就是最佳平衡点。
