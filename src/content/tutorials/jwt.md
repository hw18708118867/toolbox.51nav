---
title: 'JWT 原理全解：JWS、JWK、JKU、KID 与签名验证'
toolId: jwt
category: security
description: '从 JWS 紧凑序列化讲起，搞懂 JWT 的三段结构、Base64Url 编码、HS256 与 RS256 签名、JWK/JWK Set 如何用 JSON 表达密钥、jku/jwk/kid 如何定位验证密钥，以及算法混淆攻击与防御，并配可播放原理图'
keywords: [JWT, JWS, JWK, JKU, KID, JWT签名, JWT验证, JSON Web Token, HS256, RS256, 算法混淆攻击, 公钥, JWK Set]
author: 开发工具箱
date: 2026-07-09
updated: 2026-09-10
phase: 1
relatedTools: [jwt-decode, rsa, rsa-keygen, hmac, cert-parser, base64, totp]
relatedTutorials: [jwt-decode, hmac, rsa]
---

## 一次"验签永远通过"的联调事故

前阵子联调一个登录接口，后端同学说"你这个 JWT 验不过"。我把 token 贴进验证脚本，居然每次都返回 true。排查半天才发现，那脚本是用公钥验证的，而我手贱把 `alg` 改成了 `HS256`，后端的验证代码看到 `HS256` 就拿公钥当 HMAC 密钥去算——公钥是公开的，等于没设防。

这就是 JWT 最经典的坑：算法混淆攻击。但 `alg` 只是冰山一角。很多人把 JWT 当成一个黑盒字符串，其实它背后是一整套叫 **JOSE**（JavaScript Object Signing and Encryption）的标准族：

- **JWS**（JSON Web Signature）：签名标准，JWT 本质上就是一段 JWS
- **JWE**（JSON Web Encryption）：加密标准（JWT 的 Payload 默认不加密！）
- **JWK**（JSON Web Key）：用 JSON 描述一把密钥
- **JWK Set / JWKS**：一组 JWK，常通过 `jku` 指向的 URL 分发
- **Header 里的 `kid` / `jku` / `jwk`**：告诉验证方"该用哪把钥匙"

本文把这条关系链一次讲清，并配几张可播放的原理图。看完你应该能回答：JWT 到底签了什么、密钥从哪来、为什么那段 `alg` 这么危险。

## JWT 是什么：它其实就是带声明的 JWS

一句话：**JWT（JSON Web Token）= 把业务声明（claims）当作 payload，按 JWS 的紧凑序列化（compact serialization）写出来的一段字符串**。

所以你天天用的 `eyJhbGci...` 那串东西，本质是一段 JWS，只不过规范约定它的 payload 必须是 claims 集合、Header 的 `typ` 写 `JWT`。理解到这一层，后面所有概念都顺了：JWS 定义"怎么签名"，JWT 定义"签的是什么"。

## 三段结构：Header、Payload、Signature

一个典型的 JWT 长这样（小数点分隔的三段）：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

| 段 | 名称 | 内容 | 是否可篡改 |
|----|------|------|-----------|
| 第 1 段 | Header | 算法、令牌类型，如 `{"alg":"HS256","typ":"JWT"}` | 能改，但改了签名就对不上 |
| 第 2 段 | Payload | 业务声明（claims），如用户 ID、过期时间 | 能改，同样签名会对不上 |
| 第 3 段 | Signature | 对前两段的签名值 | 由密钥/私钥算出，别人算不出 |

**关键认知：这三段用的都是 Base64Url，不是标准 Base64。** 区别有两点：去掉了结尾的 `=` 填充，把 `+` 换成 `-`、`/` 换成 `_`。正是这个改动，让 JWT 能安全地塞进 URL 的 query 或 Authorization 头里而不被破坏。我们的 [Base64 编解码工具](/tools/encoding/base64) 也提供 URL-safe 变体，可以用来手动验证。

下面这张图把"一段 JWT 是怎么签出来的"完整走一遍：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"准备 Header 与 Payload","d":"Header 写算法与类型，Payload 写业务声明（claims），两者都是普通 JSON 文本。"},{"t":"Base64Url 编码","d":"两段 JSON 各自做 Base64Url：去掉等号填充，把加号斜杠换成减号下划线。这一步只是编码，不是加密。"},{"t":"拼接签名输入","d":"用小数点把两段拼起来：header_b64 点 payload_b64，这就是待签名的数据。"},{"t":"用密钥签名","d":"HS256 用 HMAC-SHA256 加密钥，RS256 用 RSA 私钥，对签名输入签名；结果再做 Base64Url 得到第三段。"},{"t":"组装成 JWT","d":"三段用小数点连接成 header.payload.signature。验证方拿同样数据重算一遍即可比对。"}]'>
<svg viewBox="0 0 820 470" role="img" aria-label="JWT 生成与签名流程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="40" y="28" width="230" height="46" rx="9"/><text class="dg-tb" x="155" y="48">Header（JSON）</text><text class="dg-ts" x="155" y="68">{"alg":"HS256","typ":"JWT"}</text>
<rect class="dg-box-p" x="550" y="28" width="230" height="46" rx="9"/><text class="dg-tb" x="665" y="48">Payload（JSON）</text><text class="dg-ts" x="665" y="68">{"sub":"123","exp":...}</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M155,74 V108" marker-end="url(#m1p)"/><path class="dg-line-p" d="M665,74 V108" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="40" y="110" width="230" height="44" rx="9"/><text class="dg-tb" x="155" y="132">Header Base64Url</text>
<rect class="dg-box" x="550" y="110" width="230" height="44" rx="9"/><text class="dg-tb" x="665" y="132">Payload Base64Url</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M155,154 V178 H270" marker-end="url(#m1p)"/><path class="dg-line-p" d="M665,154 V178 H550" marker-end="url(#m1p)"/><text class="dg-op" x="410" y="178">.</text></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-p" x="270" y="180" width="280" height="46" rx="9"/><text class="dg-tb" x="410" y="200">签名输入 signingInput</text><text class="dg-ts" x="410" y="220">header_b64 . payload_b64</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M410,226 V260" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="300" y="262" width="220" height="64" rx="9"/><text class="dg-tb" x="410" y="282">密钥 / 私钥</text><text class="dg-ts" x="410" y="302">HS256：共享密钥</text><text class="dg-ts" x="410" y="320">RS256：RSA 私钥</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M410,326 V362" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-g" x="170" y="364" width="480" height="54" rx="9"/><text class="dg-tb" x="410" y="386">JWT = header.payload.signature</text><text class="dg-ts" x="410" y="406">三段用小数点连接，Payload 仅编码未加密</text>
</g>
</svg>
<figcaption>图 1：JWT 的签发流程。Header 和 Payload 先各自 Base64Url 编码，用小数点拼成签名输入，再用密钥（HS256）或私钥（RS256）签名，最后三段连成 token。注意 Base64Url 只是编码，Payload 里的内容谁都能解码看到。点上面的「播放」可以看一步步的演示。</figcaption>
</figure>

## JWS：签名标准本身

JWT 把"怎么序列化"这件事交给了 JWS。JWS 定义了两种写法：
- **紧凑序列化（compact）**：就是我们用的 `header.payload.signature` 三点式，只能放一个签名、不能加密、不能多个签名。
- **JSON 序列化**：把签名、密钥、多签名都包进一个 JSON 对象，灵活但臃肿，生产里少见。

JWS 的签名值是这么算出来的（RFC 7515）：

```
 signingInput = ASCII( BASE64URL( UTF8( Header ) ) || "." || BASE64URL( UTF8( Payload ) ) )
 Signature    = BASE64URL( sign( signingInput, key, alg ) )
```

注意 Header 在这里是**已经 Base64Url 过**的那一段，所以算签名时不会再编码一次。这就是前面图 1 里"签名输入"的来历。

### Header 里那些关键字段

除了最熟悉的 `alg`（算法，必填）和 `typ`（类型，写 `JWT`），JWS Header 还有一组**和密钥定位有关**的字段，正是本文的重点：

| 字段 | 作用 |
|------|------|
| `alg` | 签名算法，如 `HS256` / `RS256` / `ES256` / `none` |
| `typ` | 类型声明，JWT 写 `JWT` |
| `cty` | 内容类型，嵌套 JWT 时会用 |
| `kid` | **Key ID**，指向用哪一把密钥 |
| `jku` | **JWK Set URL**，去这个地址拉公钥集合 |
| `jwk` | **JWK**，直接把公钥内联在 Header 里 |
| `x5c` / `x5u` / `x5t` | X.509 证书链 / 证书 URL / 证书指纹 |

`alg` 决定"用什么算"，`kid` / `jku` / `jwk` 决定"用哪把钥匙算"。下面先讲验证方拿 token 之后到底验了什么。

## 验签到底验什么

验证方收到 token，做的第一件事是按小数点切成三段，然后**拿前两段重新签名一次，和第三段比**。关键是：第三段的签名必须由"正确的密钥"算出才算数。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"收到 JWT","d":"拿到一段 header.payload.signature，先按小数点拆成三段。"},{"t":"拆成三段","d":"分别得到 header_b64、payload_b64、sig_b64；前两段可立即 Base64Url 解码查看内容。"},{"t":"重算签名","d":"按 Header 里的 alg，对 header_b64.payload_b64 重新签名：HS256 用密钥，RS256 用公钥。"},{"t":"比对签名","d":"把重算出的签名和 token 里的 sig_b64 做恒定时间比较，避免时序攻击。"},{"t":"给出结论","d":"一致则签名有效且未被篡改；不一致则内容被改过或密钥/公钥不对。"}]'>
<svg viewBox="0 0 820 440" role="img" aria-label="JWT 验证流程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="250" y="28" width="320" height="46" rx="9"/><text class="dg-tb" x="410" y="51">JWT：header.payload.signature</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M410,74 V96 H155 V118" marker-end="url(#m2p)"/><path class="dg-line-p" d="M410,74 V118" marker-end="url(#m2p)"/><path class="dg-line-p" d="M410,74 V96 H665 V118" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="40" y="120" width="230" height="44" rx="9"/><text class="dg-tb" x="155" y="142">Header Base64Url</text>
<rect class="dg-box" x="295" y="120" width="230" height="44" rx="9"/><text class="dg-tb" x="410" y="142">Payload Base64Url</text>
<rect class="dg-box" x="550" y="120" width="230" height="44" rx="9"/><text class="dg-tb" x="665" y="142">Signature Base64Url</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M155,164 V206 H180" marker-end="url(#m2p)"/><path class="dg-line-p" d="M410,164 V206" marker-end="url(#m2p)"/><text class="dg-ts" x="700" y="200" text-anchor="start">sig 暂存待用</text><path class="dg-line-p" d="M665,164 V196 H560" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="90" y="208" width="420" height="48" rx="9"/><text class="dg-tb" x="300" y="230">重算签名：alg + 密钥/公钥</text><text class="dg-ts" x="300" y="250">对 header_b64.payload_b64 签名</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M300,256 V298" marker-end="url(#m2p)"/><path class="dg-line-p" d="M665,206 V322 H620" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-p" x="300" y="300" width="320" height="48" rx="9"/><text class="dg-tb" x="460" y="322">恒定时间比对</text><text class="dg-ts" x="460" y="342">重算值 vs token 内的 sig</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M380,348 V382" marker-end="url(#m2p)"/><path class="dg-line-p" d="M540,348 V382" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-g" x="110" y="384" width="260" height="46" rx="9"/><text class="dg-tb" x="240" y="407">签名有效 ✓</text>
<rect class="dg-box-w" x="450" y="384" width="260" height="46" rx="9"/><text class="dg-tb" x="580" y="407">签名无效 ✗</text>
</g>
</svg>
<figcaption>图 2：JWT 的验证流程。先按小数点拆成三段，用 Header 里的 alg 对前两段重算签名，再和 token 自带的 sig 做恒定时间比对。一致才说明签名有效且内容没被改过。点上面的「播放」可以看整个过程。</figcaption>
</figure>

这里有个工程细节：**比对签名要用恒定时间比较函数**（如 Node 的 `crypto.timingSafeEqual`），不能用普通的 `==`。因为 `==` 是短路比较，第一个字符不同就返回，攻击者可以借响应时间差做时序攻击。`[JWT 解码工具](/tools/encoding/jwt-decode)` 和本站 JWT 工具都帮你做好了这层，但你自己在服务端实现时一定要记得。

## 密钥从哪来：kid / jku / jwk

验签的难点从来不是"怎么比"，而是"**用哪把公钥比**"。尤其是 RS256，一个服务可能轮换过多把密钥，验证方得先知道该用哪把。JWS 给了三种机制：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"读取 JWS Header","d":"验证方先读 Header，确定 alg 以及该用哪种方式找到验证密钥：kid、jku 还是 jwk。"},{"t":"jku：远程拉取","d":"Header 含 jku 时，按它指向的 URL 拉取 JWK Set（一组公钥），再按 kid 选出要用的那把。"},{"t":"jwk：内联公钥","d":"Header 含 jwk 时，公钥直接写在 Header 里，无需任何额外网络请求。"},{"t":"kid：本地查找","d":"只有 kid 时，在本地或配置维护的 JWK Set 里按 id 查到对应的公钥。"},{"t":"拿到公钥验签","d":"无论走哪条路，最终都要拿到正确的公钥，才能安全地验证签名。"}]'>
<svg viewBox="0 0 820 470" role="img" aria-label="验证方如何定位验证密钥：kid、jku、jwk" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="270" y="24" width="280" height="44" rx="9"/><text class="dg-tb" x="410" y="46">JWS Header</text><text class="dg-ts" x="410" y="64">alg / kid / jku / jwk</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M410,68 V90 H155 V118" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="40" y="120" width="230" height="54" rx="9"/><text class="dg-tb" x="155" y="142">jku：JWK Set URL</text><text class="dg-ts" x="155" y="162">远程拉取公钥集合</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M410,68 V118" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="295" y="120" width="230" height="54" rx="9"/><text class="dg-tb" x="410" y="142">jwk：内联公钥</text><text class="dg-ts" x="410" y="162">公钥就在 Header 里</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M410,68 V90 H665 V118" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="550" y="120" width="230" height="54" rx="9"/><text class="dg-tb" x="665" y="142">kid：密钥标识</text><text class="dg-ts" x="665" y="162">本地按 id 查找</text>
</g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-p" x="295" y="250" width="230" height="46" rx="9"/><text class="dg-tb" x="410" y="273">拿到正确公钥</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-a" d="M155,174 V248 H295" marker-end="url(#m3a)"/><path class="dg-line-a" d="M410,174 V248" marker-end="url(#m3a)"/><path class="dg-line-a" d="M665,174 V248 H545" marker-end="url(#m3a)"/><path class="dg-line-p" d="M410,296 V328" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-g" x="270" y="330" width="280" height="46" rx="9"/><text class="dg-tb" x="410" y="353">用于验签</text><text class="dg-ts" x="410" y="371">公钥正确才有意义</text>
</g>
</svg>
<figcaption>图 3：验证方怎么找到正确的公钥。Header 里可能带 jku（去 URL 拉公钥集合）、jwk（公钥直接内联）或只有 kid（在本地密钥表里查）。三条路最终都指向同一件事：拿到正确的公钥去验签。点上面的「播放」可以看选择过程。</figcaption>
</figure>

逐个说明：

### kid：只是一张"钥匙标签"

`kid` 本身**不含任何密钥**，它只是一个字符串标识，告诉验证方"请用我这一把"。真正的工作是：验证方维护一个"密钥 id → 公钥"的映射表，收到 token 后读 `kid`，去表里查对应的公钥。

这就带来一个常见错误：有人以为 `kid` 能防止伪造——不能。`kid` 只是个索引，攻击者如果同时能控制 `kid` 指向的密钥库（或验证端不校验 `kid` 是否预期），照样能用自己的密钥签。`kid` 的价值是**密钥轮换**：旧密钥 `kid=2026-01`、新密钥 `kid=2026-07`，客户端无感切换。

### jku：把公钥放在一个 URL 上

`jku`（JWK Set URL）指向一个 HTTPS 地址，那里返回一组公钥（JWK Set）。验证方现拉现用，特别适合多服务、多租户、频繁轮换的场景——OIDC / 微信/Google 的 `/jwks` 端点就是这么干的。

**安全风险**：`jku` 必须做域名白名单校验。如果验证端见 `jku` 就无脑去拉，攻击者把 `jku` 改成自己控制的服务器、返回一把自己私钥对应的公钥，验证端就会用攻击者的公钥去验攻击者的 token——直接伪造成功。

### jwk：公钥直接内联

`jwk` 把公钥以 JWK 形式直接写进 Header。好处是零额外请求、自包含；坏处是增大了 token 体积，而且**轮换困难**（公钥写死在 token 里了）。一般只用于一次性、短命的 token。

## JWK：用 JSON 描述一把密钥

JWK（JSON Web Key）就是把密码学里的"公钥/私钥"用 JSON 字段表达出来。你不用再和 PEM 那一坨 `-----BEGIN PUBLIC KEY-----` 打交道，一行 JSON 就够。

<figure class="dg-figure">
<svg viewBox="0 0 820 360" role="img" aria-label="JWK 与 JWK Set 的结构" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<text class="dg-tb" x="250" y="30" text-anchor="middle">RSA 公钥的 JWK 表示</text>
<rect class="dg-box" x="40" y="48" width="420" height="210" rx="9"/>
<text class="dg-ts" x="60" y="78" text-anchor="start">{"kty": "RSA",</text>
<text class="dg-ts" x="60" y="102" text-anchor="start"> "use": "sig",</text>
<text class="dg-ts" x="60" y="126" text-anchor="start"> "kid": "2026-01",</text>
<text class="dg-ts" x="60" y="150" text-anchor="start"> "n": "0vx7ago...（模数）",</text>
<text class="dg-ts" x="60" y="174" text-anchor="start"> "e": "AQAB",</text>
<text class="dg-ts" x="60" y="198" text-anchor="start"> "alg": "RS256"}</text>
<rect class="dg-box-p" x="480" y="150" width="300" height="46" rx="9"/><text class="dg-tb" x="630" y="173">kid 对应 Header 里的 kid</text>
<path class="dg-dash" d="M460,150 H478" marker-end="url(#m5)"/>
<text class="dg-tb" x="630" y="30" text-anchor="middle">EC 公钥的 JWK 表示</text>
<rect class="dg-box" x="480" y="48" width="300" height="150" rx="9"/>
<text class="dg-ts" x="500" y="78" text-anchor="start">{"kty": "EC",</text>
<text class="dg-ts" x="500" y="102" text-anchor="start"> "crv": "P-256",</text>
<text class="dg-ts" x="500" y="126" text-anchor="start"> "x": "tFNu...",</text>
<text class="dg-ts" x="500" y="150" text-anchor="start"> "y": "POmR..."}</text>
<rect class="dg-box-a" x="40" y="290" width="740" height="48" rx="9"/><text class="dg-tb" x="410" y="312">多个 JWK 组成 JWK Set：{"keys":[ ... ]}，jku 指向的就是它</text><text class="dg-ts" x="410" y="330">kid 用于在 Set 里唯一标识某一把密钥</text>
</svg>
<figcaption>图 5：JWK 用 JSON 描述一把密钥。RSA 看 kty/n/e，EC 看 kty/crv/x/y；kid 是这把密钥的标识，对应 JWS Header 里的 kid。把多把 JWK 放进一个 {"keys":[...]} 就是 JWK Set，jku 指向的 URL 返回的就是这个集合。这张图是静态结构示意。</figcaption>
</figure>

常用字段：

| 字段 | 含义 |
|------|------|
| `kty` | 密钥类型：`RSA` / `EC` / `OKP` |
| `crv` | 椭圆曲线，如 `P-256` / `P-384` / `Ed25519` |
| `n` / `e` | RSA 的公钥模数 / 指数 |
| `x` / `y` | EC 公钥的 X / Y 坐标 |
| `d` | 私钥值（**只在服务端出现，绝不下发**） |
| `use` | 用途：`sig`（签名）或 `enc`（加密） |
| `alg` | 建议使用的算法，如 `RS256` |
| `kid` | 这把密钥的标识 |

把多把 JWK 放进一个对象 `{"keys":[...]}` 就是 **JWK Set**（也叫 JWKS）。OIDC 的 `/jwks` 端点返回的就是它，而 `jku` 指向的也正是它。要生成 RSA 密钥对来构造 JWK，可以用 [RSA 密钥对生成工具](/tools/encryption/rsa-keygen)；手里的 X.509 证书想看清楚结构，可以丢进 [证书解析工具](/tools/security/cert-parser)。

## HS256 vs RS256：对称还是非对称

讲完密钥体系，回到最常被问的选型问题：

| 对比 | HS256（HMAC） | RS256（RSA） |
|------|--------------|--------------|
| 密钥 | 一个共享密钥（secret） | 一对：私钥签名、公钥验证 |
| 签名方 | 服务端持有密钥 | 用私钥签名 |
| 验证方 | 也用同一个密钥 | 用公开的公钥验证 |
| 适用 | 自己签发自己验证的单体服务 | 多服务/第三方需要验证的场景 |
| 风险点 | 密钥泄露=可随意伪造 | 私钥泄露才危险，公钥本就可公开 |

RS256 的好处是：签发服务的私钥可以严格保管，验证方只需要拿到公钥，公钥泄露不会让任何人伪造 token。这正是对抗算法混淆攻击的基础——验证端必须固定死只允许 RS256，并只用公钥验。

底层算法上，HS256 就是 HMAC-SHA256，[HMAC 计算工具](/tools/hashing/hmac) 可以让你直观看到它怎么算；RS256 则依赖 [RSA 加解密工具](/tools/encryption/rsa) 里的签名/验签能力。

## 三个时间声明：iat / nbf / exp

Payload 里经常看到这组时间戳，单位是**秒**（不是毫秒），从 1970-01-01 算：

- `iat`（issued at）：签发时间。用来判断 token 是不是"未来才签发"的。
- `nbf`（not before）：生效时间。在此之前 token 不可用，常用于"预约生效"。
- `exp`（expiration）：过期时间。最常见的，登录态失效就靠它。

本站 JWT 工具解码后会自动把这三个字段转成可读时间，并标出状态：已过期 / 还剩多久 / 尚未生效。注意**比对时务必用秒级时间戳**，很多人拿毫秒往 `exp` 里塞，结果 token 在 1970 年附近就"过期"了。

## 攻击面：算法混淆、none、弱密钥

### 算法混淆攻击（图 4）

前面那次事故的本质：验证端**信任了 Header 里的 `alg`**。当攻击者把 `alg` 从 `RS256` 改成 `HS256`，而验证端又傻傻地用"公钥"去当 HMAC 密钥，公钥是公开的，等于任何人都能算出合法签名。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"两种 Header","d":"同一份 token，左边 Header 写 alg=RS256（正常），右边被攻击者改成了 alg=HS256。"},{"t":"验证端取密钥的方式","d":"左边用公钥验签；右边有漏洞的验证端把公钥当成了 HMAC 密钥。"},{"t":"谁能算出正确签名","d":"左边只有持有私钥的服务端能签；右边因为公钥是公开的，任何人都能算。"},{"t":"结果","d":"左边签名有效、确实可信；右边验签被伪造成了通过，非常危险。"},{"t":"正确防御","d":"验证端固定算法白名单，只接受预期的 alg，绝不用公钥当 HMAC 密钥。"}]'>
<svg viewBox="0 0 820 500" role="img" aria-label="JWT 算法混淆攻击对比" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box" x="50" y="60" width="320" height="54" rx="9"/><text class="dg-tb" x="210" y="82">Header：alg=RS256</text><text class="dg-ts" x="210" y="102">正常签发</text>
<rect class="dg-box-w" x="450" y="60" width="320" height="54" rx="9"/><text class="dg-tb" x="610" y="82">Header：alg=HS256</text><text class="dg-ts" x="610" y="102">攻击者篡改</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M210,114 V158" marker-end="url(#m4)"/><path class="dg-line-a" d="M610,114 V158" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="50" y="160" width="320" height="54" rx="9"/><text class="dg-tb" x="210" y="182">验证端：用公钥验签</text><text class="dg-ts" x="210" y="202">publicKey.verify</text>
<rect class="dg-box-w" x="450" y="160" width="320" height="54" rx="9"/><text class="dg-tb" x="610" y="182">验证端：公钥当 HMAC 密钥</text><text class="dg-ts" x="610" y="202">HMAC(publicKey, data)</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M210,214 V258" marker-end="url(#m4)"/><path class="dg-line-a" d="M610,214 V258" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="50" y="260" width="320" height="54" rx="9"/><text class="dg-tb" x="210" y="282">能签名的：私钥持有者</text><text class="dg-ts" x="210" y="302">只有服务端</text>
<rect class="dg-box-w" x="450" y="260" width="320" height="54" rx="9"/><text class="dg-tb" x="610" y="282">能签名的：任何人</text><text class="dg-ts" x="610" y="302">公钥公开可得</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M210,314 V358" marker-end="url(#m4)"/><path class="dg-line-a" d="M610,314 V358" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-g" x="50" y="360" width="320" height="54" rx="9"/><text class="dg-tb" x="210" y="382">签名有效 ✓</text><text class="dg-ts" x="210" y="402">确实可信</text>
<rect class="dg-box-w" x="450" y="360" width="320" height="54" rx="9"/><text class="dg-tb" x="610" y="382">验签通过 ✗</text><text class="dg-ts" x="610" y="402">被伪造，危险</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M210,414 V436" marker-end="url(#m4)"/><path class="dg-line-a" d="M610,414 V436" marker-end="url(#m4a)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box-w" x="180" y="438" width="460" height="46" rx="9"/><text class="dg-tb" x="410" y="461">防御：固定算法白名单，拒绝意外 alg，绝不用公钥当 HMAC 密钥</text>
</g>
</svg>
<figcaption>图 4：算法混淆攻击对比。左边正常 RS256 用公钥验签，只有私钥持有者能伪造；右边脆弱的验证端把 alg 改成 HS256 后，竟用公钥当 HMAC 密钥，而公钥人人可得，于是任何人都能算出合法签名，验签被伪造成通过。点上面的「播放」可以看左右两边的演化差异。</figcaption>
</figure>

**防御三件事**：① 验证端把允许的 `alg` 写死成白名单，拒绝任何非预期值；② 绝不用公钥当 HMAC 密钥；③ 如果支持 RS256，校验 `alg` 字段与本地配置一致，而不是"Header 说啥就是啥"。

### none 算法攻击

比算法混淆更粗暴：把 `alg` 设成 `none`，Signature 段留空。一些老旧或不严谨的库看到 `none` 会直接认为"已认证、无需验签"。正规实现必须显式拒绝 `none`（除非你真的在做不签名的场景，而那根本不该叫信任）。

### 弱 HS256 密钥

HS256 的安全性完全取决于那个 `secret`。如果 secret 是 `123456` 这种，攻击者可以离线暴力枚举或查彩虹表直接还原，然后随意签发合法 token。建议 secret 至少 32 字节的随机串，别用任何字典词。

## JWE 一句话：JWT 不是加密

回到那个经典误解——**JWT 的 Payload 只是 Base64Url 编码，谁都能解码看到里面的内容**。它解决的是"认证"和"完整性"，不是"保密"。

如果你确实需要把敏感数据塞进 token 且不让别人看见，得用 **JWE（JSON Web Encryption）**，它的结构变成 5 段（受保护的头、加密密钥、IV、密文、认证标签）。但在绝大多数业务里，正确做法是：**JWT 里只放用户 ID 这类非敏感标识，敏感数据存在服务端按 ID 查**，传输层再套 HTTPS。

## 配套工具

本站与安全认证相关的工具，可以配合本文一起用：

- [JWT 创建/签名/验证工具](/tools/security/jwt)：选 HS256/RS256 签名，或粘贴 token 验签，自动解析 `exp/nbf/iat`，纯前端运算不上传密钥
- [JWT 解码工具](/tools/encoding/jwt-decode)：只想快速看 Header/Payload 和时间声明时最快
- [RSA 密钥对生成](/tools/encryption/rsa-keygen)：生成 RS256 用的公私钥对
- [RSA 加解密 / 签名](/tools/encryption/rsa)：底层 RSA 签名验签验证
- [HMAC 计算](/tools/hashing/hmac)：理解 HS256 背后的 HMAC-SHA256 怎么算
- [证书解析](/tools/security/cert-parser)：查看 `x5c` 里 X.509 证书链的内容
- [Base64 编解码](/tools/encoding/base64)：手动验证 Base64Url 的 `-`/`_` 与 `+`/`/` 差异
- [TOTP 动态验证码](/tools/security/totp)：另一种常见的无状态认证思路

## 常见问题

**Q：JWT 和 JWS 到底什么关系？**
JWT 是 JWS 的一个具体应用：把 claims 当 payload，按 JWS 紧凑序列化写成 `header.payload.signature`。所以"JWT 的三段结构"其实就是 JWS 的紧凑序列化格式。

**Q：kid 必须全局唯一吗？**
不需要全局唯一，只要在**你这套密钥体系内**能唯一标识一把密钥即可。多个服务共用一个 JWK Set 时，最好让 `kid` 不冲突，否则验证端会查错钥匙。

**Q：jku 和 jwk 该用哪个？**
需要频繁轮换、跨服务共享公钥（如 OIDC），用 `jku` 指向 `/jwks` 最省心；一次性、短命、自包含的 token，可以用 `jwk` 内联。但 `jku` 一定要做域名白名单，`jwk` 要校验 `kid` 是否预期。

**Q：为什么验签要用恒定时间比较？**
普通字符串 `==` 比较是短路的，第一个字符不同就返回，响应时间差会泄露前缀匹配信息，理论上可被时序攻击。恒定时间比较（如 `crypto.timingSafeEqual`）无论内容如何都花一样的时间。

**Q：JWT 能当加密用吗？**
不能，Payload 只是 Base64Url 编码，明文可见。要保密用 JWE，或更简单——token 里只放非敏感 ID，敏感数据存在服务端。

**Q：RS256 验签需要私钥吗？**
不需要，公钥就够了。私钥只在签发时用，务必保管好；公钥本来就该公开分发。这也正是为什么算法混淆攻击这么危险：验证端一旦误把公钥当 HMAC 密钥，等于把"公开信息"当成了"秘密"。
