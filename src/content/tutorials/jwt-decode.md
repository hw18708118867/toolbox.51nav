---
title: "JWT 深度解析：Token 里的三个部分分别藏着什么"
toolId: jwt-decode
category: encoding
description: "深度剖析 JWT（JSON Web Token）的结构：Header、Payload 和 Signature 各部分的含义与解码、Base64URL 编码在 JWT 中的应用、以及 JWT 不等于加密这个常被误解的事实"
keywords: [JWT, JSON Web Token, Base64URL, Token解码, 身份认证, JWT Header, JWT Payload, JWT Signature]
author: 开发工具箱
date: 2026-06-15
phase: 1
relatedTools: [base64, aes, hmac]
relatedTutorials: [base64, aes, hmac]
---

## 什么是 JWT？

先别急着看定义。来看一个真实的 JWT Token：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

一眼看过去，就是三段用点号（`.`）隔开的乱码。但如果你把第一段和第二段用 Base64 解码，会发现它们其实是 JSON。

JWT，全称 JSON Web Token，是一种**开放标准（RFC 7519）**，用来在双方之间安全地传递 JSON 格式的信息。说"安全"，不是因为它把数据藏起来了——恰恰相反，JWT 的绝大部分内容是**明文**的，任何人都可以解码查看。它安全的逻辑在于：你可以验证这个 Token 有没有被人改过，因为第三段是个签名校验值。

打个比方。JWT 就像一张加了防伪标识的登机牌。登机牌上写的姓名、航班号、座位号，谁看了一清二楚——这不是秘密。但登机牌的防伪水印（签名）保证了它是航空公司开的，不是你在家用打印机伪造的。你拿给安检人员看，人家一扫就知道真假。

## JWT 的工作原理

JWT 的核心机制是**签名验证**。完整流程分两步：签发和验证。

签发时，服务端把 Header 和 Payload 分别做 Base64URL 编码，拼起来，再用约定好的密钥对这两段做签名（比如 HMAC-SHA256），得到第三段。三段拼在一起，就是你要的 Token。

验证时，服务端取出前两段，用同样的密钥再算一次签名，然后跟第三段对比。一致，说明 Token 完好无损；不一致——哪怕 Payload 里只改了一个字符——签名就会对不上，Token 作废。

### 第一段：Header — 描述这个 Token 是谁、怎么签的

把上例的第一段解码，拿到的是这个：

```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

两个字段。`alg` 告诉你签名用的是哪个算法——HS256 就是 HMAC-SHA256，除此之外常见的还有 RS256（RSA-SHA256）、ES256（ECDSA-SHA256），甚至 `none`（对，不签名的 JWT 也是合法的，后面再说这坑）。`typ` 就简单了，固定是 `JWT`，表个身份。

我之前对接一个第三方 SSO 的时候，对方给的文档里只写了"JWT Token"，没说是哪种签名算法。结果我按 HS256 生成，他们那边一直报验签失败。翻了三遍文档没找到线索，最后把 Header 解码一看——用的是 RS256，公钥藏在他们的 jwks.json 里。这个小插曲让我意识到，别偷懒，拿到一个 JWT 先把 Header 解了，省得猜半天。

### 第二段：Payload — 这次通信的具体内容

第二段也叫 Claims（声明）。解码后长这样：

```json
{
  "sub": "1234567890",
  "name": "John Doe",
  "iat": 1516239022
}
```

Claims 分三种：

| 类型 | 说明 | 例子 |
|------|------|------|
| **Registered（注册声明）** | 标准里预定义的字段，非强制，但大家都这么用 | `iss`（签发者）、`sub`（主题）、`exp`（过期时间）、`iat`（签发时间）、`aud`（受众） |
| **Public（公开声明）** | 你自己定义的字段，但建议在 IANA 注册避免冲突 | `name`、`email`、`role` |
| **Private（私有声明）** | 两方之间约定好的自定义字段，不用注册 | `user_id`、`tenant_id`、`permissions` |

这里有一个关键认知：**Payload 是明文的**。Base64URL 只是一个编码，不是加密。任何人拿到你的 Token，把中间那段解码出来，里面有什么就全看见了。所以，绝对不要把密码、身份证号、银行卡号塞进 Payload。

说回正题——`iat` 那个字段，1516239022，看着像乱数，其实它是个 Unix 时间戳。转成日期就是 2018 年 1 月 18 日。JWT 里的时间全都是这种数字格式，做前端展示的话别忘了 `new Date(iat * 1000)`。

### 第三段：Signature — 防篡改的最后一道防线

签名的计算方式如下（以 HS256 为例）：

```
HMAC-SHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

关键在这里：签名的输入是**前两段编码后的内容加一个点号连接**，而不是原始 JSON。

这意味着什么？意味着如果你在 Payload 里把 `name` 从 "John Doe" 改成 "Jane Doe"，哪怕重新 Base64URL 编码，签名也会立刻对不上——因为签名计算时用的是整个 `header.payload` 字符串，换里面任何一个字符都会产生完全不同的 HMAC 输出。这就是 JWT 防篡改的根本：篡改必然破坏签名。

不过话说回来，这个机制有个前提：密钥不能泄露。如果是 HS256，签发和验证用的是同一把密钥，密钥一旦泄露，攻击者可以自己签发任何 Token。如果是 RS256 这种非对称算法，私钥（签发方）和公钥（验证方）是分开的，安全性高一个数量级。

## Base64URL —— JWT 专属的编码方案

可能你已经发现了，JWT 的前两段用的是 Base64URL，不是标准的 Base64。区别只有两点：

| | 标准 Base64 | Base64URL（JWT 使用） |
|---|---|---|
| **第 62 个字符** | `+` | `-` |
| **第 63 个字符** | `/` | `_` |
| **填充符 =** | 保留 | **去掉** |

为什么不用标准 Base64？因为 JWT 经常放在 HTTP Header（`Authorization: Bearer <token>`）和 URL 参数里。`+` 在 URL 里会被解析成空格，`/` 有路由歧义，`=` 在查询参数里有特殊含义。换成 `-` 和 `_`，再去掉填充符，这些问题全解决了。

老实说，我刚开始手写 JWT 解码的时候，直接用 `atob()` 解那段字符串，有时报错有时正常，百思不得其解。后来才知道，浏览器原生 `atob()` 只认标准 Base64，碰到 `-_` 字符就会翻车。正确做法是先手动把 `-_` 换回 `+/`，补齐 `=` 填充再丢给 `atob()`：

```js
function jwtDecodeBase64Url(str) {
  // 替换 URL-safe 字符为标准 Base64，补齐填充
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.xxx';
const rawPayload = jwtDecodeBase64Url(token.split('.')[1]);
const payload = JSON.parse(rawPayload);
```

## 核心特性

| 特性 | 说明 |
|------|------|
| **自包含** | Token 本身携带了所有需要的信息，不需要服务端查数据库验证用户身份 |
| **明文内部** | Header 和 Payload 只是 Base64URL 编码，不是加密，所有人都能解码 |
| **无状态** | 服务端不需要保存 Session，Token 自己就是通行证。适合分布式/微服务架构 |
| **签名保护** | 第三段签名保证了 Token 的完整性，防止篡改 |
| **紧凑格式** | 三段文本，比 XML/SAML 小得多，适合在 HTTP 头里传输 |
| **跨语言** | JSON 格式，所有语言都有成熟的解析库 |

"无状态"这一点是把双刃剑。好处是服务端不用维护 Session，水平扩展很简单——多台服务器之间不需要共享 Session 存储。坏处是服务端没法主动把某个 Token 废掉，因为它不存任何状态。你只能等它自然过期，或者用黑名单之类的额外机制补救。

## 实际应用场景

### 1. 单点登录（SSO）

用户在认证中心登录一次，拿一个 JWT，之后访问各个子系统都带着这个 Token。各个子系统只需验证签名，不用再去认证中心确认身份。Token 的 `sub` 字段告诉系统"这是哪个用户"，`exp` 告诉系统"这个 Token 还有没有效"。

我做的一个后台项目就是这么搞的——登录服务签 JWT，网关层做验签拦截，内部微服务之间不再传用户密码，只传 Token。省掉了大量的内网认证往返。

### 2. API 鉴权

这可能是目前 JWT 最常见的场景。API 在请求头里收到 Token：

```
Authorization: Bearer eyJhbGciOi...
```

中间件验签，解析 Payload 拿到用户 ID 和角色，决定放不放行。整个过程只需要一次 HMAC 运算，不需要查数据库，延迟极低。

### 3. 一次性验证链接

比如"重置密码"邮件里的链接，可以在 URL 里带一个 JWT，Token 的 Payload 里存用户 ID 和操作类型，`exp` 设成 15 分钟。用户点击链接，服务端验签通过后展示重置密码页面。过了 15 分钟，Token 自动失效。

### 4. OAuth 2.0 / OpenID Connect

OAuth 2.0 标准本身不限定 Token 格式，但实践中绝大多数实现都在用 JWT 作为 Access Token 和 ID Token 的载体。OpenID Connect 更是直接把 ID Token 定义为 JWT。

### 5. 微服务间调用的身份传递

请求穿过网关进入服务 A，服务 A 调用服务 B 时，带上原始的 JWT，服务 B 自己验签，知道是谁在操作。这样在整个调用链上，身份信息不丢失，也不用每个服务都去查用户库。

## 常见误区

### 误区一：JWT 是加密的，Payload 里的数据是安全的

这是最普遍的误解，没有之一。JWT 默认**不加密**，Payload 只是 Base64URL 编码。编码和加密是天壤之别——编码是把一种格式换成另一种格式，不涉及密钥，想解码随时解。加密是真正的数学保护，没有密钥解不出来。

有一次我审一个项目代码，发现他们把用户的手机号明文塞进 JWT Payload，然后一脸确信地说"JWT 是加密的"。吓得我让他们立刻改——任何拿到 Token 的人都能看到这些信息（浏览器开发者工具、HTTP 代理、中间人攻击），除非你上了 JWE（JSON Web Encryption），但那是 JWT 的加密扩展，绝大多数项目都没用。

### 误区二：Token 越长越安全

Token 的安全不取决于长度，取决于签名算法的强度和密钥的管理。你用 HS256 加一个 4 位密钥，签名算出来就只有 4 位的搜索空间——暴力破解连秒都不用。安全的核心是密钥的随机性和私密性，不是 Token 本身长短。

有过一个搞笑的事：我在面试中遇到一个候选人，他自豪地说他的系统 Token 特别长、有 800 多个字符，"没人能猜到"。我问他 Token 里存了什么，他说把用户信息全塞进去了——头像 Base64、简历 JSON、甚至权限树。Token 倒是长了，但是全都是明文，签名依然是固定的 HS256，安全性一点没增加，就是体积比别人的大两倍而已。

### 误区三：`alg: none` 只是理论问题

JWT 标准允许 `alg` 设为 `none`——表示不签名。严格来说这是一个合法配置，用来表示 Token 的完整性由其他方式保证（比如在 TLS 加密通道里传输）。

问题是，如果服务端的 JWT 库没有明确过滤掉 `none` 算法，攻击者可以把 Header 改成 `{"alg": "none", "typ": "JWT"}`，然后随便编一个 Payload，签名段留空或者填任意值，发过去——服务端竟然就接受了。2018 年这漏洞被大规模曝光，好几个流行的 JWT 库都中过招。

说白了，你用的 JWT 库在初始化时必须显式指定允许哪些签名算法。别依赖库的默认行为——安全不能靠默认。

### 误区四：Token 存 localStorage 就行了

前端收到 JWT 之后存哪里，是另一个典型的分歧。存 localStorage 方便，但容易受 XSS 攻击——注入一个脚本就能读走 Token。存 httpOnly Cookie 更安全（脚本读不到），但带来了 CSRF 风险。

没有完美的方案，只能根据你的威胁模型选。我的习惯是：如果这个 Token 的有效期比较短（比如 15 分钟）且主要用来调用内部 API，存 localStorage 可以接受。如果是高敏感操作或者长期有效的 Token，走 httpOnly Cookie 加 CSRF token 双重保护更稳妥。

## JWT vs Session vs OAuth Token

| | JWT | 服务端 Session | OAuth Access Token |
|---|---|---|---|
| **状态** | 无状态 | 有状态 | 取决于实现（通常不透明） |
| **存储位置** | 客户端 | 服务端（Redis / DB） | 客户端 + 资源服务器 |
| **信息可见性** | 明文（Base64），客户端可读 | 不可见 | 通常不透明 |
| **水平扩展** | 天然支持 | 需要共享 Session 存储 | 需要 Token 内省端点 |
| **吊销难度** | 高（需要黑名单） | 低（删除 Session 即可） | 中（取决于授权服务器） |
| **体积** | 小 | 极小的 Session ID | 可变 |

Session 方案最大的优势就是可控——服务端想踢人就踢人，想改权限就改权限。代价是每次请求都要查一次 Session 存储，分布式场景下还要跨实例同步。

JWT 反过来了，速度快但控制弱。所以很多实践是把两者结合：用 JWT 做短生命周期的验证（例如 5-15 分钟的 Access Token），再配一个长生命周期的 Refresh Token 存在服务端，便于吊销。

## 常见问题

**Q: JWT Token 到底能不能被解码？**

能。而且是任何人、任何工具都能。前两段就是 Base64URL 编码，你把那段字符串往我们工具的 Base64 解码器里一贴，或者直接浏览器控制台 `atob()`，JSON 原文就出来了。解码 JWT 不需要任何密钥——只有验证签名才需要。

**Q: 怎么防止 JWT Payload 被他人读取？**

如果你确实需要在 Token 里传敏感数据，有两个选择：一是别传——把敏感信息留在服务端，Token 里只存一个用户 ID，需要的时候后端自己去查；二是用 JWE——把整个 JWT 加密，变成五段式结构，真正做到机密性。不过 JWE 的复杂度和性能开销都高不少，绝大多数项目不值得上。

**Q: HS256 和 RS256 怎么选？**

HS256 用同一个密钥签发和验证，适合单服务或者内部微服务场景——简单，快，够用。RS256 用私钥签发、公钥验证，适合多方验签的场景（比如多个服务都要验证 Token，但只有认证中心能签发）。简单记：如果只有签发方自己验证，HS256 够了。如果需要对外暴露公钥让别人验证，用 RS256。

**Q: Token 过期了怎么办？**

两个方案，各有利弊。一是用 Refresh Token——Access Token 过期后，拿着 Refresh Token 去换新的 Access Token。Refresh Token 生命周期长，存在服务端，可以被吊销。二是直接让用户重新登录，但这体验差。实际项目中绝大多数用的是 Refresh Token 方案。

需要注意一点：如果 Access Token 设置太长（比如 7 天），万一被泄露了，这 7 天内攻击者可以任意冒充用户。这就是为什么一般建议 Access Token 有效期设为 5-15 分钟，再靠 Refresh Token 自动续期。

**Q: 怎么拿到一个 JWT 并解析它看里面有什么？**

用我们站上的 JWT 解码工具就行。把完整 Token 粘进去，它能自动识别 Base64URL 编码，把 Header 和 Payload 还原成可读 JSON，同时标注签名算法和是否过期。手写的话，注意三件事：Base64URL 转标准 Base64 再解码、Unix 时间戳转日期、签名验证需要密钥——前两步是纯计算，最后一步需要密钥才能做。

**Q: JWT 能用在非 HTTP 场景吗？**

能。JWT 本质就是一段字符串，只要能传文本的地方就能传 JWT——WebSocket 消息头、MQTT 连接认证、gRPC metadata。不过要注意，非 HTTP 场景传输通常没有 TLS 保护，JWT 容易被截获，建议结合通道加密一起用。
