---
title: "HTTP 与 HTTPS 详解：从三次握手到 TLS 1.3 的完整链路"
toolId: http-headers
category: network
description: "从输入 URL 到页面渲染的完整链路讲起，拆解 TCP 三次握手与四次挥手、HTTP 报文结构、HTTP/1.1 到 HTTP/3 的演进，以及 HTTPS 的 TLS 1.2 与 1.3 握手全流程"
keywords: [HTTP协议, HTTPS原理, TLS握手, TCP三次握手, 四次挥手, HTTP2多路复用, 混合加密, 请求头, TLS1.3]
author: 开发工具箱
date: 2026-08-30
updated: 2026-08-30
phase: 1
relatedTools: [user-agent, security-headers, curl-generator, url-parser, cert-parser, websocket-test]
relatedTutorials: [cert-parser, url-parser, rsa]
---

## 一次"网站打不开"，牵出了七层协议

去年帮同事排查一个诡异问题：网站在公司的 WiFi 下打不开，换成手机流量就好了。他第一反应是"服务器挂了"，我让他打开浏览器开发者工具看了一眼——请求卡在 TLS 握手阶段，服务端证书链不完整，公司网络的中间设备校验证书失败就直接掐断了连接。

这件事挺能说明问题：**用户眼里的"打开一个网页"，底下是 DNS、TCP、TLS、HTTP 四套协议接力跑完的结果**。任何一环出问题，表现都是同一个——白屏。

这篇就把这条链路从头到尾捋一遍，把 HTTP 和 HTTPS 到底在干什么讲清楚。

## 先说清楚：HTTP 到底是什么

HTTP（HyperText Transfer Protocol，超文本传输协议）是应用层协议，规定了客户端和服务器之间**对话的格式**。它只管两件事：客户端怎么问，服务器怎么答。至于数据怎么从一台机器传到另一台机器，那不是 HTTP 的活，是 TCP 的活。

### 请求-响应模型

HTTP 永远是客户端先开口。一次交互就是一问一答：

```
客户端：GET /api/user?id=42 HTTP/1.1
        Host: example.com
        Accept: application/json

服务器：HTTP/1.1 200 OK
        Content-Type: application/json
        Content-Length: 38

        {"id": 42, "name": "张三", "vip": true}
```

服务器不会主动给客户端推消息（HTTP/2 的 Server Push 和 WebSocket 是另一回事）。这个单向发起的特性，让 HTTP 天然适合做缓存、做代理、做负载均衡——中间设备只要看懂请求和响应，就能决定要不要拦下来。

### 无状态，以及 Cookie 怎么补的位

HTTP 是**无状态**的：服务器不会记住你上一次请求做了什么。第 2 次请求对服务器来说，跟第 1 次请求毫无关系。

这么设计是为了让服务器好扩展——任何一台机器都能处理任何请求，不用同步会话状态。但现实是登录态必须记住，于是有了 Cookie：

1. 登录后服务器在响应里塞一个 `Set-Cookie: sessionid=abc123`
2. 浏览器把这个 Cookie 存起来
3. 之后每次请求自动带上 `Cookie: sessionid=abc123`
4. 服务器靠这个 sessionid 去查会话数据

也就是说，**状态其实被挪到了客户端保存**。这带来了一个直接后果：Cookie 会自动跟着请求发出去，也就成了 CSRF 攻击的载体，所以后来才有了 SameSite 属性这个补丁。

## 从输入 URL 到页面出现：完整流程

把上面这些串起来，一次 HTTPS 请求在浏览器地址栏敲下回车后，实际经历的是这样一条链路：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"输入 URL","d":"浏览器解析出协议、域名、端口和路径，准备发起请求。"},{"t":"DNS 解析","d":"向 DNS 服务器查询域名对应的 IP 地址，本机 DNS 缓存和 hosts 文件可能直接命中。"},{"t":"TCP 三次握手","d":"与服务器的 80 端口（HTTPS 是 443）建立 TCP 连接，确认双方收发能力正常。"},{"t":"TLS 握手","d":"仅 HTTPS 需要这一步：协商加密套件、验证证书、算出会话密钥。HTTP 直接跳过。"},{"t":"发送 HTTP 请求","d":"把请求行、请求头和请求体按顺序发给服务器。"},{"t":"服务端处理","d":"服务器执行应用逻辑、查数据库、渲染模板，生成响应内容。"},{"t":"返回 HTTP 响应","d":"把状态行、响应头和响应体发回浏览器。"},{"t":"浏览器渲染","d":"解析 HTML/CSS/JS 并绘制页面；遇到图片、脚本等子资源，会重新走一遍请求流程。"},{"t":"关闭连接","d":"四次挥手关闭 TCP 连接。如果启用了 Keep-Alive，连接会被复用，跳过握手和挥手。"}]'>
<svg viewBox="0 0 840 650" role="img" aria-label="客户端与服务端完整交互流程：DNS、TCP、TLS、HTTP 请求响应" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="90" y="24" width="120" height="36" rx="8"/><text class="dg-tb" x="150" y="42">客户端</text>
<rect class="dg-box" x="630" y="24" width="120" height="36" rx="8"/><text class="dg-tb" x="690" y="42">服务端</text>
<path class="dg-dash" d="M150,60 V620 M690,60 V620"/>
<g class="dg-pop" data-step="0">
<circle class="dg-xor" cx="42" cy="92" r="14"/><text class="dg-tl" x="42" y="92">1</text>
<rect class="dg-box-p" x="90" y="74" width="120" height="36" rx="8"/><text class="dg-t" x="150" y="92">输入 URL</text>
<text class="dg-ts" x="300" y="92" text-anchor="start">浏览器解析出协议、域名、端口、路径</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M154,148 H376" marker-end="url(#mh1)"/><path class="dg-line" d="M504,148 H686" marker-end="url(#mh1)"/></g>
<g class="dg-pop" data-step="1">
<circle class="dg-xor" cx="42" cy="148" r="14"/><text class="dg-tl" x="42" y="148">2</text>
<rect class="dg-box" x="380" y="130" width="120" height="36" rx="8"/><text class="dg-t" x="440" y="148">DNS 服务器</text>
<text class="dg-ts" x="265" y="138">查询域名 IP</text>
<text class="dg-ts" x="595" y="138">返回 IP 地址</text>
</g>
<g data-step="2" data-flow="1">
<path class="dg-line-p" d="M154,212 H686" marker-end="url(#mh1p)"/>
<path class="dg-line-a" d="M686,236 H154" marker-end="url(#mh1a)"/>
<path class="dg-line-p" d="M154,260 H686" marker-end="url(#mh1p)"/>
</g>
<g class="dg-pop" data-step="2">
<circle class="dg-xor" cx="42" cy="236" r="14"/><text class="dg-tl" x="42" y="236">3</text>
<text class="dg-ts" x="420" y="202">① SYN　seq=x</text>
<text class="dg-ts" x="420" y="226">② SYN+ACK　seq=y, ack=x+1</text>
<text class="dg-ts" x="420" y="250">③ ACK　ack=y+1</text>
<text class="dg-ts" x="420" y="284">TCP 三次握手完成，连接建立</text>
</g>
<g data-step="3" data-flow="1">
<path class="dg-line-a" d="M154,320 H686" marker-end="url(#mh1a)"/>
<path class="dg-line-a" d="M686,344 H154" marker-end="url(#mh1a)"/>
</g>
<g class="dg-pop" data-step="3">
<circle class="dg-xor" cx="42" cy="332" r="14"/><text class="dg-tl" x="42" y="332">4</text>
<text class="dg-ts" x="420" y="310">ClientHello / 证书 / 密钥交换</text>
<text class="dg-ts" x="420" y="334">ServerHello / ChangeCipherSpec / Finished</text>
<text class="dg-ts" x="420" y="368">（仅 HTTPS 需要，详见后文 TLS 握手一节）</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M154,404 H686" marker-end="url(#mh1p)"/></g>
<g class="dg-pop" data-step="4">
<circle class="dg-xor" cx="42" cy="404" r="14"/><text class="dg-tl" x="42" y="404">5</text>
<text class="dg-ts" x="420" y="394">GET /index.html HTTP/1.1</text>
</g>
<g class="dg-pop" data-step="5">
<circle class="dg-xor" cx="42" cy="448" r="14"/><text class="dg-tl" x="42" y="448">6</text>
<rect class="dg-box" x="630" y="430" width="120" height="36" rx="8"/><text class="dg-t" x="690" y="448">服务端处理</text>
<text class="dg-ts" x="610" y="448" text-anchor="end">应用逻辑、查库、渲染模板</text>
</g>
<g data-step="6" data-flow="1"><path class="dg-line-a" d="M686,492 H154" marker-end="url(#mh1a)"/></g>
<g class="dg-pop" data-step="6">
<circle class="dg-xor" cx="42" cy="492" r="14"/><text class="dg-tl" x="42" y="492">7</text>
<text class="dg-ts" x="420" y="482">HTTP/1.1 200 OK + HTML 内容</text>
</g>
<g class="dg-pop" data-step="7">
<circle class="dg-xor" cx="42" cy="536" r="14"/><text class="dg-tl" x="42" y="536">8</text>
<rect class="dg-box" x="90" y="518" width="120" height="36" rx="8"/><text class="dg-t" x="150" y="536">浏览器渲染</text>
<text class="dg-ts" x="228" y="536" text-anchor="start">解析 HTML/CSS/JS，遇到新资源则重复第 4~6 步</text>
</g>
<g data-step="8" data-flow="1"><path class="dg-line" d="M154,580 H686" marker-end="url(#mh1)"/><path class="dg-line" d="M686,604 H154" marker-end="url(#mh1)"/></g>
<g class="dg-pop" data-step="8">
<circle class="dg-xor" cx="42" cy="592" r="14"/><text class="dg-tl" x="42" y="592">9</text>
<text class="dg-ts" x="420" y="570">FIN</text>
<text class="dg-ts" x="420" y="594">ACK + FIN + ACK</text>
<text class="dg-ts" x="420" y="626">四次挥手关闭连接；若是 Keep-Alive 则复用连接跳过 2、3、8</text>
</g>
</svg>
<figcaption>图 1：从输入 URL 到页面渲染的完整链路。DNS 解析拿到 IP，TCP 三次握手建立连接，HTTPS 还要额外做一次 TLS 握手，之后才轮到 HTTP 请求与响应。点上面的「播放」可以看每一步。</figcaption>
</figure>

图里第 8 步之后往往还有第 4~6 步的循环——页面里的每个 CSS、JS、图片都要单独请求一次，一个普通网页动辄几十上百个请求。

## HTTP 跑在 TCP 之上

HTTP 自己不管数据怎么可靠送达，它把报文交给 TCP，TCP 负责把字节流完整、有序地送到对端。所以**每次 HTTP 通信之前，都必须先建立 TCP 连接**。

### TCP 三次握手

建立连接要三个包来回，目的是让双方都确认"你能收到我发的、我能收到你发的"。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"初始：CLOSED 与 LISTEN","d":"客户端处于 CLOSED，服务端监听端口处于 LISTEN，双方还没开始通信。"},{"t":"第一次：SYN","d":"客户端发送 SYN=1、seq=x，告诉服务端「我要连你，我的初始序号是 x」，自己进入 SYN-SENT。"},{"t":"第二次：SYN + ACK","d":"服务端回 SYN=1、ACK=1、seq=y、ack=x+1，既确认收到客户端的序号，也把自己的初始序号 y 带过去，进入 SYN-RCVD。"},{"t":"第三次：ACK","d":"客户端回 ACK=1、seq=x+1、ack=y+1，确认收到服务端的序号。这一步之后双方都进入 ESTABLISHED。"},{"t":"开始传数据","d":"连接建立完成，HTTP 报文就在这条连接上双向流动。"},{"t":"为什么非得三次","d":"两次不够：服务端无法确认自己的序号已被对方收到。三次握手本质是双向各确认一次「我能发、你能收」。若只有两次，一个延迟已久的旧 SYN 突然到达，服务端就会白白建立一条永不使用的连接，白白浪费资源。"}]'>
<svg viewBox="0 0 840 440" role="img" aria-label="TCP 三次握手：SYN、SYN-ACK、ACK 与连接状态变迁" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="140" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="200" y="46">客户端</text>
<rect class="dg-box" x="580" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="640" y="46">服务端</text>
<path class="dg-dash" d="M200,64 V372 M640,64 V372"/>
<g class="dg-pop" data-step="0">
<rect class="dg-box" x="145" y="73" width="110" height="30" rx="6"/><text class="dg-ts" x="200" y="88">CLOSED</text>
<rect class="dg-box" x="585" y="73" width="110" height="30" rx="6"/><text class="dg-ts" x="640" y="88">LISTEN</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M204,120 H636" marker-end="url(#mh2p)"/></g>
<g class="dg-pop" data-step="1">
<text class="dg-tl" x="420" y="108">① SYN=1, seq=x</text>
<rect class="dg-box-a" x="145" y="142" width="110" height="30" rx="6"/><text class="dg-ts" x="200" y="157">SYN-SENT</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-a" d="M636,195 H204" marker-end="url(#mh2a)"/></g>
<g class="dg-pop" data-step="2">
<text class="dg-tl" x="420" y="183">② SYN=1, ACK=1, seq=y, ack=x+1</text>
<rect class="dg-box" x="585" y="217" width="110" height="30" rx="6"/><text class="dg-ts" x="640" y="232">SYN-RCVD</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M204,270 H636" marker-end="url(#mh2p)"/></g>
<g class="dg-pop" data-step="3">
<text class="dg-tl" x="420" y="258">③ ACK=1, seq=x+1, ack=y+1</text>
<rect class="dg-box-g" x="145" y="297" width="110" height="30" rx="6"/><text class="dg-ts" x="200" y="312">ESTABLISHED</text>
<rect class="dg-box-g" x="585" y="297" width="110" height="30" rx="6"/><text class="dg-ts" x="640" y="312">ESTABLISHED</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M204,356 H636" marker-end="url(#mh2p)"/><path class="dg-line-p" d="M636,368 H204" marker-end="url(#mh2p)"/></g>
<g class="dg-pop" data-step="4"><text class="dg-tl" x="420" y="344">HTTP 请求 / 响应数据</text></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-w" x="120" y="392" width="600" height="40" rx="9"/><text class="dg-t" x="420" y="412">两次握手不够：服务端无法确认自己的初始序号已被对方收到</text>
</g>
</svg>
<figcaption>图 2：TCP 三次握手。三个包分别确认「客户端能发」「服务端能收且能发」「客户端能收」，双方各自同步初始序列号后进入 ESTABLISHED。点上面的「播放」可以看状态是怎么一步步迁移的。</figcaption>
</figure>

### TCP 四次挥手

断开连接比建立连接麻烦，因为**TCP 是全双工的**，两个方向要分别关闭。

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"双方 ESTABLISHED","d":"数据传输完毕，准备断开。下面假设客户端主动发起关闭。"},{"t":"第一次：FIN","d":"客户端发 FIN=1、seq=u，表示「我这边没数据要发了」，进入 FIN-WAIT-1。"},{"t":"第二次：ACK","d":"服务端回 ACK=1、ack=u+1，进入 CLOSE-WAIT；客户端收到后进入 FIN-WAIT-2。此时处于半关闭状态——服务端还能继续把剩余数据发完，客户端只收不发。"},{"t":"第三次：FIN","d":"服务端把剩下的数据发完后，发 FIN=1、seq=v，进入 LAST-ACK，表示「我也发完了」。"},{"t":"第四次：ACK","d":"客户端回 ACK=1、ack=v+1，进入 TIME-WAIT；服务端收到后直接进入 CLOSED。"},{"t":"为什么要 TIME-WAIT","d":"客户端还要等 2MSL（约 1~4 分钟）才真正关闭。一是防止最后一个 ACK 丢失时能对重传的 FIN 做出回应，二是让本次连接的残留报文在网络中消散，避免污染后续复用同一四元组的新连接。"}]'>
<svg viewBox="0 0 840 460" role="img" aria-label="TCP 四次挥手：FIN、ACK、FIN、ACK 与 TIME-WAIT 状态" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="140" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="200" y="46">客户端（主动关闭）</text>
<rect class="dg-box" x="580" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="640" y="46">服务端（被动关闭）</text>
<path class="dg-dash" d="M200,64 V440 M640,64 V440"/>
<g class="dg-pop" data-step="0">
<rect class="dg-box-g" x="145" y="73" width="110" height="30" rx="6"/><text class="dg-ts" x="200" y="88">ESTABLISHED</text>
<rect class="dg-box-g" x="585" y="73" width="110" height="30" rx="6"/><text class="dg-ts" x="640" y="88">ESTABLISHED</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M204,128 H636" marker-end="url(#mh3p)"/></g>
<g class="dg-pop" data-step="1">
<text class="dg-tl" x="420" y="116">① FIN=1, seq=u</text>
<text class="dg-ts" x="420" y="144">主动方进入 FIN-WAIT-1</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-a" d="M636,200 H204" marker-end="url(#mh3a)"/></g>
<g class="dg-pop" data-step="2">
<text class="dg-tl" x="420" y="188">② ACK=1, ack=u+1</text>
<text class="dg-ts" x="420" y="216">被动方 CLOSE-WAIT，主动方 FIN-WAIT-2</text>
<text class="dg-ts" x="420" y="238">半关闭：被动方仍可继续发送剩余数据</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-a" d="M636,280 H204" marker-end="url(#mh3a)"/></g>
<g class="dg-pop" data-step="3">
<text class="dg-tl" x="420" y="268">③ FIN=1, seq=v（剩余数据已发完）</text>
<text class="dg-ts" x="420" y="296">被动方进入 LAST-ACK</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M204,340 H636" marker-end="url(#mh3p)"/></g>
<g class="dg-pop" data-step="4">
<text class="dg-tl" x="420" y="328">④ ACK=1, ack=v+1</text>
<text class="dg-ts" x="420" y="356">被动方 CLOSED，主动方进入 TIME-WAIT</text>
</g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-w" x="100" y="384" width="640" height="56" rx="9"/>
<text class="dg-t" x="420" y="402">TIME-WAIT 要等 2MSL（约 1~4 分钟）后才 CLOSED</text>
<text class="dg-ts" x="420" y="424">① 保证最后的 ACK 能到达对端　② 让本次连接的残留报文在网络中消散</text>
</g>
</svg>
<figcaption>图 3：TCP 四次挥手。因为 TCP 是全双工的，两个方向必须分别关闭，所以第二次和第三次挥手之间还夹着一段「被动方继续发剩余数据」的半关闭状态。点上面的「播放」可以看完整过程。</figcaption>
</figure>

### 为什么握手三次、挥手却是四次

建立连接时，服务端收到 SYN 后可以把自己的 SYN 和对客户端的 ACK **合并成一个包**发出去，所以只需要三次。

关闭连接时不行：服务端收到 FIN 后，可能还有数据没发完，只能先回一个 ACK 表示"我知道你要关了"，等数据发完了才能再发自己的 FIN。这一拆，就多了一次。

顺带一提，服务器上出现大量 `CLOSE_WAIT` 通常意味着**应用代码忘了调用 close() 关闭 socket**，连接卡在半关闭状态出不来。这是后端排查连接泄漏时最常见的一个信号。

## HTTP 报文长什么样

HTTP 报文是纯文本（HTTP/2 之后改成了二进制帧，但语义没变），结构上分为三块。

### 请求报文

```
POST /api/login HTTP/1.1          ← 请求行：方法 + 路径 + 版本
Host: example.com                 ← 请求头开始
Content-Type: application/json
Authorization: Bearer eyJhbGci...
User-Agent: Mozilla/5.0 ...
Content-Length: 41
                                  ← 空行，头和体在此分界
{"username": "zhangsan", "pwd": "..."}   ← 请求体
```

### 响应报文

```
HTTP/1.1 201 Created              ← 状态行：版本 + 状态码 + 原因短语
Content-Type: application/json    ← 响应头开始
Set-Cookie: sessionid=abc123; HttpOnly; SameSite=Lax
Cache-Control: no-store
Content-Length: 28
                                  ← 空行
{"ok": true, "userId": 42}        ← 响应体
```

那个空行是硬性规定：头部和体之间必须是 `CRLF CRLF`。很多手搓 HTTP 解析的 bug 都出在这。

### 常用方法

| 方法 | 语义 | 幂等 | 常用场景 |
|------|------|------|---------|
| GET | 获取资源 | 是 | 查询、页面、静态文件 |
| POST | 提交数据 | 否 | 登录、下单、创建资源 |
| PUT | 完整替换资源 | 是 | 整体更新用户信息 |
| PATCH | 部分更新资源 | 否 | 只改某个字段 |
| DELETE | 删除资源 | 是 | 删除 |
| HEAD | 只要响应头 | 是 | 探测资源是否存在、看大小 |
| OPTIONS | 询问支持的方法 | 是 | CORS 预检请求 |

**幂等**的意思是：同一个请求执行一次和执行多次，服务端状态一样。支付接口如果设计成 GET，被浏览器预加载或爬虫碰一下就多扣一笔钱——这就是为什么创建订单必须用 POST。

### 状态码

| 状态码 | 含义 | 典型场景 |
|--------|------|---------|
| 200 | OK | 请求成功 |
| 201 | Created | 资源创建成功 |
| 204 | No Content | 成功但没有响应体 |
| 301 | Moved Permanently | 永久重定向，SEO 权重转移 |
| 302 | Found | 临时重定向 |
| 304 | Not Modified | 缓存还有效，用本地副本 |
| 400 | Bad Request | 请求参数有问题 |
| 401 | Unauthorized | 没登录或 token 失效 |
| 403 | Forbidden | 登录了但没权限 |
| 404 | Not Found | 资源不存在 |
| 405 | Method Not Allowed | 方法不被支持 |
| 429 | Too Many Requests | 触发限流 |
| 500 | Internal Server Error | 服务端代码抛异常 |
| 502 | Bad Gateway | 网关拿不到上游响应 |
| 503 | Service Unavailable | 服务不可用，通常过载或维护 |
| 504 | Gateway Timeout | 网关等上游超时 |

401 和 403 的区别值得记一下：**401 是"你是谁"，403 是"我知道你是谁，但你不能碰"**。

## HTTP 的三次进化

### HTTP/1.1：持久连接

HTTP/1.0 每发一个请求都要新建一条 TCP 连接，用完就关。建一次连接的成本是三次握手加一次慢启动，非常浪费。

HTTP/1.1 默认开启 `Connection: keep-alive`，一条连接可以复用多次请求。但它有个硬伤：**同一条连接上请求必须串行**，前一个响应没回来，后面的请求只能干等。

### HTTP/2：多路复用

一个页面通常要加载几十个资源。串行等待的延迟实在受不了，浏览器的土办法是**同时开 6~8 条 TCP 连接**绕过限制——但每条连接都要握手，服务端压力也大。

HTTP/2 从协议层面解决了这个问题：

<figure class="dg-figure" data-interval="2400" data-steps='[{"t":"浏览器要取 3 个资源","d":"一个页面通常需要 CSS、JS、图片等多个资源，每个都要单独发一次 HTTP 请求。"},{"t":"HTTP/1.1：排队等待","d":"同一条连接上请求必须串行，前一个响应没回来，后面的请求就只能干等——这就是队头阻塞。浏览器通常靠同时开 6~8 条 TCP 连接来缓解，但每条连接都要握手。"},{"t":"HTTP/2：多路复用","d":"同一条连接上可以并行交错传输多个流，请求之间互不影响，不再需要靠多开连接来提速。"},{"t":"HTTP/3 更进一步","d":"HTTP/2 只解决了应用层的队头阻塞，TCP 层一旦丢包，所有流仍要等重传。HTTP/3 改用基于 UDP 的 QUIC，在 QUIC 层做流级重传，彻底解决。"}]'>
<svg viewBox="0 0 840 400" role="img" aria-label="HTTP/1.1 队头阻塞与 HTTP/2 多路复用的对比" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="270" y="22" width="300" height="36" rx="9"/><text class="dg-tb" x="420" y="40">浏览器要取 3 个资源</text>
</g>
<text class="dg-tl" x="215" y="84">HTTP/1.1（队头阻塞）</text>
<text class="dg-tl" x="625" y="84">HTTP/2（多路复用）</text>
<rect class="dg-frame" x="40" y="100" width="350" height="200" rx="10"/>
<rect class="dg-frame" x="450" y="100" width="350" height="200" rx="10"/>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="70" y="126" width="55" height="28" rx="6"/><text class="dg-ts" x="97" y="140">请求1</text>
<rect class="dg-box-a" x="135" y="126" width="90" height="28" rx="6"/><text class="dg-ts" x="180" y="140">响应1</text>
<rect class="dg-frame" x="70" y="176" width="65" height="28" rx="6"/><text class="dg-ts" x="102" y="190">等待</text>
<rect class="dg-box" x="145" y="176" width="55" height="28" rx="6"/><text class="dg-ts" x="172" y="190">请求2</text>
<rect class="dg-box-a" x="210" y="176" width="90" height="28" rx="6"/><text class="dg-ts" x="255" y="190">响应2</text>
<rect class="dg-frame" x="70" y="226" width="130" height="28" rx="6"/><text class="dg-ts" x="135" y="240">等待</text>
<rect class="dg-box" x="210" y="226" width="55" height="28" rx="6"/><text class="dg-ts" x="237" y="240">请求3</text>
<rect class="dg-box-a" x="275" y="226" width="90" height="28" rx="6"/><text class="dg-ts" x="320" y="240">响应3</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="480" y="126" width="55" height="28" rx="6"/><text class="dg-ts" x="507" y="140">请求1</text>
<rect class="dg-box-a" x="545" y="126" width="100" height="28" rx="6"/><text class="dg-ts" x="595" y="140">响应1</text>
<rect class="dg-box" x="480" y="176" width="55" height="28" rx="6"/><text class="dg-ts" x="507" y="190">请求2</text>
<rect class="dg-box-a" x="545" y="176" width="100" height="28" rx="6"/><text class="dg-ts" x="595" y="190">响应2</text>
<rect class="dg-box" x="480" y="226" width="55" height="28" rx="6"/><text class="dg-ts" x="507" y="240">请求3</text>
<rect class="dg-box-a" x="545" y="226" width="100" height="28" rx="6"/><text class="dg-ts" x="595" y="240">响应3</text>
<text class="dg-ts" x="625" y="264">3 条流共用 1 条连接，交错传输</text>
</g>
<path class="dg-line" d="M60,286 H370" marker-end="url(#mh4)"/><text class="dg-ts" x="215" y="300">时间</text>
<path class="dg-line" d="M470,286 H780" marker-end="url(#mh4)"/><text class="dg-ts" x="625" y="300">时间</text>
<g class="dg-pop" data-step="3">
<rect class="dg-box-g" x="40" y="320" width="760" height="56" rx="9"/>
<text class="dg-t" x="420" y="340">HTTP/2 单连接多路复用，解决了应用层队头阻塞</text>
<text class="dg-ts" x="420" y="362">HTTP/3 改用 QUIC（基于 UDP），连 TCP 层的队头阻塞也一并消除</text>
</g>
</svg>
<figcaption>图 4：HTTP/1.1 与 HTTP/2 的请求时序对比。左边请求必须排队等前一个响应，右边三条流在同一条连接上并行交错。点上面的「播放」可以看两者的差异。</figcaption>
</figure>

HTTP/2 还顺带做了头部压缩（HPACK）和二进制分帧。值得注意的是，它虽然叫 HTTP/2，但在浏览器里**必须配合 HTTPS 使用**——所有主流浏览器都只支持 `h2`（基于 TLS），不支持明文版 `h2c`。

### HTTP/3：QUIC

HTTP/2 解决了应用层的队头阻塞，但 TCP 层的还在：TCP 把数据看成单一字节流，丢一个包，后面所有数据都得等重传，不管它属于哪个流。

HTTP/3 干脆把传输层换成了 QUIC——跑在 UDP 之上，自己实现可靠传输和拥塞控制，并且**按流做重传**。一条流丢包不会影响其他流。代价是 UDP 在部分企业网络和中间设备上会被限速甚至阻断，部署时需要额外考虑回退到 HTTP/2。

## HTTPS：给 HTTP 套一层 TLS

HTTPS 不是新协议，它是 **HTTP over TLS**——把 HTTP 报文交给 TLS 加密后再交给 TCP 传输。

### 它要解决三个问题

| 威胁 | 例子 | HTTPS 的对策 |
|------|------|-------------|
| **窃听** | 公共 WiFi 抓包看到你的密码 | 加密，中间人只能看到密文 |
| **篡改** | 运营商往页面里插广告 | 完整性校验，改一个字节就会被发现 |
| **冒充** | DNS 劫持到假银行网站 | 证书验证，证明对方确实是域名的持有者 |

### 混合加密：既安全又快

这里有个看似矛盾的地方：对称加密快但密钥不好传，非对称加密能安全传密钥但慢。HTTPS 的解法是**两个都用**：

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"服务端出示证书","d":"服务器把数字证书发给客户端，证书里包含服务器公钥和 CA 的签名。"},{"t":"客户端加密密钥素材","d":"客户端验证证书有效后，生成一个随机数作为 Pre-Master Secret，用证书里的服务器公钥加密后发回去。只有持有私钥的服务端能解开。"},{"t":"双方算出会话密钥","d":"服务端用私钥解密得到 Pre-Master，双方再结合握手时的两个随机数，各自算出完全相同的会话密钥。整个过程不需要传输会话密钥本身。"},{"t":"对称加密跑完全场","d":"之后的全部应用数据都用这把会话密钥做对称加密。非对称加密只在开头用一次，兼顾了安全性和性能。"}]'>
<svg viewBox="0 0 840 400" role="img" aria-label="HTTPS 混合加密：非对称加密交换会话密钥，对称加密传输数据" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh5" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh5p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh5a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="100" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="160" y="46">客户端</text>
<rect class="dg-box" x="620" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="680" y="46">服务端</text>
<path class="dg-dash" d="M160,64 V350 M680,64 V350"/>
<g data-step="0" data-flow="1"><path class="dg-line-a" d="M684,110 H164" marker-end="url(#mh5a)"/></g>
<g class="dg-pop" data-step="0">
<text class="dg-tl" x="420" y="98">① 证书（内含服务器公钥）</text>
<text class="dg-ts" x="420" y="128">非对称加密：安全但慢</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M164,176 H684" marker-end="url(#mh5p)"/></g>
<g class="dg-pop" data-step="1">
<text class="dg-tl" x="420" y="164">② 用公钥加密的 Pre-Master Secret</text>
<text class="dg-ts" x="420" y="196">只有持有私钥的服务端能解开</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="100" y="217" width="120" height="36" rx="8"/><text class="dg-t" x="160" y="235">算出会话密钥</text>
<rect class="dg-box-a" x="620" y="217" width="120" height="36" rx="8"/><text class="dg-t" x="680" y="235">算出会话密钥</text>
<text class="dg-ts" x="420" y="235">双方各算一次，得到同一把密钥</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M164,290 H684" marker-end="url(#mh5p)"/><path class="dg-line-p" d="M684,306 H164" marker-end="url(#mh5p)"/></g>
<g class="dg-pop" data-step="3">
<text class="dg-tl" x="420" y="278">③ 会话密钥加密的应用数据</text>
</g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-g" x="140" y="334" width="560" height="44" rx="9"/><text class="dg-t" x="420" y="356">对称加密跑完全场：非对称只在开头用一次</text>
</g>
</svg>
<figcaption>图 5：HTTPS 的混合加密。非对称加密负责安全地协商出一把会话密钥，之后的数据传输全部交给对称加密。点上面的「播放」可以看密钥是怎么协商出来的。</figcaption>
</figure>

### TLS 1.2 握手：两个 RTT

握手就是"把上面那套密钥协商流程走一遍"。TLS 1.2 的完整握手需要**两个 RTT**（往返时延）：

<figure class="dg-figure" data-interval="2300" data-steps='[{"t":"ClientHello","d":"客户端告诉服务端：我支持哪些 TLS 版本、哪些密码套件，再附带一个随机数 R1。"},{"t":"ServerHello + 证书","d":"服务端选定版本和套件，回一个随机数 R2，然后发送证书链，最后用 ServerHelloDone 表示「我说完了」。"},{"t":"验证证书 + 交换密钥","d":"客户端检查证书的信任链、域名匹配和有效期，然后生成 Pre-Master Secret，用证书里的公钥加密后发给服务端。"},{"t":"算出会话密钥","d":"双方用 R1、R2 和 Pre-Master Secret 各自推导出 Master Secret，再导出实际用于加密的会话密钥。"},{"t":"切换加密并确认","d":"双方各发一次 ChangeCipherSpec 和 Finished。Finished 是前面所有握手消息的摘要，用来确认握手过程没被篡改。"},{"t":"开始加密通信","d":"握手完成，之后的应用数据全部由会话密钥对称加密传输。TLS 1.2 的完整握手需要 2 个 RTT。"}]'>
<svg viewBox="0 0 840 570" role="img" aria-label="TLS 1.2 握手完整流程：ClientHello 到应用数据加密传输" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh6" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh6p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh6a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="110" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="170" y="46">客户端</text>
<rect class="dg-box" x="610" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="670" y="46">服务端</text>
<path class="dg-dash" d="M170,64 V545 M670,64 V545"/>
<g data-step="0" data-flow="1"><path class="dg-line-p" d="M174,108 H666" marker-end="url(#mh6p)"/></g>
<g class="dg-pop" data-step="0"><text class="dg-tl" x="420" y="96">① ClientHello：TLS 版本 / 密码套件 / 随机数 R1</text></g>
<g data-step="1" data-flow="1">
<path class="dg-line-a" d="M666,158 H174" marker-end="url(#mh6a)"/>
<path class="dg-line-a" d="M666,208 H174" marker-end="url(#mh6a)"/>
<path class="dg-line-a" d="M666,258 H174" marker-end="url(#mh6a)"/>
</g>
<g class="dg-pop" data-step="1">
<text class="dg-tl" x="420" y="146">② ServerHello：选定套件 + 随机数 R2</text>
<text class="dg-tl" x="420" y="196">③ Certificate：证书链（含公钥）</text>
<text class="dg-tl" x="420" y="246">④ ServerHelloDone</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="110" y="283" width="120" height="34" rx="8"/><text class="dg-t" x="170" y="300">验证证书</text>
<text class="dg-ts" x="420" y="290">检查信任链 / 域名匹配 / 有效期 / 吊销状态</text>
<text class="dg-ts" x="420" y="312">生成 Pre-Master Secret</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M174,348 H666" marker-end="url(#mh6p)"/></g>
<g class="dg-pop" data-step="2"><text class="dg-tl" x="420" y="336">⑤ ClientKeyExchange：公钥加密的 Pre-Master</text></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="110" y="373" width="120" height="34" rx="8"/><text class="dg-t" x="170" y="390">算出会话密钥</text>
<rect class="dg-box-a" x="610" y="373" width="120" height="34" rx="8"/><text class="dg-t" x="670" y="390">算出会话密钥</text>
<text class="dg-ts" x="420" y="390">R1 + R2 + Pre-Master → Master Secret → 会话密钥</text>
</g>
<g data-step="4" data-flow="1">
<path class="dg-line-p" d="M174,440 H666" marker-end="url(#mh6p)"/>
<path class="dg-line-a" d="M666,478 H174" marker-end="url(#mh6a)"/>
</g>
<g class="dg-pop" data-step="4">
<text class="dg-tl" x="420" y="428">⑥ ChangeCipherSpec + Finished</text>
<text class="dg-tl" x="420" y="466">⑦ ChangeCipherSpec + Finished</text>
</g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="110" y="502" width="620" height="44" rx="9"/><text class="dg-t" x="420" y="524">握手完成（2-RTT），之后的应用数据全部对称加密传输</text>
</g>
</svg>
<figcaption>图 6：TLS 1.2 的完整握手。双方交换随机数、验证证书、用非对称加密传递 Pre-Master Secret，各自推导出会话密钥，最后用 Finished 互相确认握手没被篡改。点上面的「播放」可以看每一步。</figcaption>
</figure>

### TLS 1.3 握手：一个 RTT

TLS 1.2 那两个 RTT，很大一部分浪费在"先商量用哪种密钥交换算法，再交换密钥"上。TLS 1.3 的思路很直接：**别商量了，我把所有可能的公钥份额一次性全发过去**。

<figure class="dg-figure" data-interval="2400" data-steps='[{"t":"ClientHello 直接带公钥","d":"客户端一次性列出支持的套件，并把每种可能用到的密钥交换算法的公钥份额（key_share）全带上，省掉一轮往返。"},{"t":"ServerHello 一次性回完","d":"服务端选定套件、回自己的 key_share，然后直接把证书、签名和 Finished 都加密发过来。客户端收到时已经能算出会话密钥了。"},{"t":"客户端确认","d":"客户端验证证书、算出会话密钥，回一个 Finished。到这里握手就完成了，应用数据可以立即跟上。"},{"t":"1-RTT 与 0-RTT","d":"TLS 1.3 完整握手只需 1 个 RTT，比 1.2 省一半。会话复用时还能 0-RTT，把数据直接塞进 ClientHello 一起发出去——代价是 0-RTT 数据可能被重放，所以只适合幂等请求。"}]'>
<svg viewBox="0 0 840 440" role="img" aria-label="TLS 1.3 握手流程：1-RTT 与 0-RTT" text-anchor="middle" dominant-baseline="central">
<defs><marker id="mh7" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="mh7p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="mh7a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<rect class="dg-box" x="110" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="170" y="46">客户端</text>
<rect class="dg-box" x="610" y="28" width="120" height="36" rx="8"/><text class="dg-tb" x="670" y="46">服务端</text>
<path class="dg-dash" d="M170,64 V400 M670,64 V400"/>
<g data-step="0" data-flow="1"><path class="dg-line-p" d="M174,108 H666" marker-end="url(#mh7p)"/></g>
<g class="dg-pop" data-step="0">
<text class="dg-tl" x="420" y="96">① ClientHello：套件列表 + key_share（公钥份额）</text>
<text class="dg-ts" x="420" y="128">一次性把可能的密钥交换算法全带上，省掉一轮</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line-a" d="M666,190 H174" marker-end="url(#mh7a)"/></g>
<g class="dg-pop" data-step="1">
<text class="dg-tl" x="420" y="178">② ServerHello + key_share + 加密的证书 + Finished</text>
<text class="dg-ts" x="420" y="212">服务端一次回完，客户端此时已能算出会话密钥</text>
</g>
<g class="dg-pop" data-step="2">
<rect class="dg-box-a" x="110" y="223" width="120" height="34" rx="8"/><text class="dg-t" x="170" y="240">验证 + 算密钥</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M174,290 H666" marker-end="url(#mh7p)"/></g>
<g class="dg-pop" data-step="2"><text class="dg-tl" x="420" y="278">③ Finished（已加密）</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M174,340 H666" marker-end="url(#mh7p)"/></g>
<g class="dg-pop" data-step="3"><text class="dg-tl" x="420" y="328">④ 应用数据（对称加密）</text></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-g" x="110" y="368" width="620" height="48" rx="9"/>
<text class="dg-t" x="420" y="386">TLS 1.3 只需 1-RTT，比 1.2 省一半</text>
<text class="dg-ts" x="420" y="408">会话复用时 0-RTT，数据可随 ClientHello 直接发出（有重放风险，仅适幂等请求）</text>
</g>
</svg>
<figcaption>图 7：TLS 1.3 的握手。客户端在第一个包里就把密钥交换材料带上，服务端一次回完，握手压缩到 1 个 RTT。点上面的「播放」可以看它比 1.2 省在哪。</figcaption>
</figure>

TLS 1.3 还砍掉了一批不安全的老算法（RC4、SHA-1、静态 RSA 密钥交换、CBC 模式），只保留 AEAD 套件。一个重要的副作用是：**TLS 1.3 默认提供前向安全**——即使服务器私钥将来泄露，过去的通信记录也解不开。

### 证书与信任链

客户端凭什么相信证书里的公钥真的属于这个域名？靠的是**信任链**：

1. 操作系统和浏览器内置了一批根 CA 的证书（根证书）
2. 根 CA 给中间 CA 签名，中间 CA 再给你的网站签名
3. 客户端拿到网站的证书后，逐级往上验签，一直验到内置的根证书
4. 验签通过，且证书里的域名与正在访问的域名匹配、证书在有效期内、没被吊销——才认定对方身份可信

想看看一个证书里到底写了什么，可以用本站的[证书解析工具](/tools/security/cert-parser)。

## 请求头与响应头速查

日常调试最常打交道的几个头，可以用本站的[HTTP 请求头查看](/tools/network/http-headers)工具直接看到浏览器实际发出了什么。

**请求头**

| 头 | 作用 |
|---|---|
| `Host` | 目标域名。一台服务器托管多个站点就靠它区分 |
| `User-Agent` | 客户端标识。想看看自己的 UA 里藏了多少信息，用 [UA 解析](/tools/network/user-agent) |
| `Accept` / `Accept-Encoding` / `Accept-Language` | 内容协商：我能接受什么格式、什么压缩、什么语言 |
| `Authorization` | 身份凭证，通常是 `Bearer <token>` |
| `Cookie` | 会话标识，浏览器自动带上 |
| `Referer` | 从哪个页面跳过来的（拼写错误已成历史遗留） |
| `Origin` | 发起请求的源，CORS 判断的关键 |
| `Cache-Control` | 客户端希望的缓存行为 |
| `If-None-Match` / `If-Modified-Since` | 条件请求，命中则返回 304 |

**响应头**

| 头 | 作用 |
|---|---|
| `Content-Type` | 响应体格式，必须带 `charset` 否则可能乱码 |
| `Content-Length` / `Transfer-Encoding` | 响应体长度；分块传输用 `chunked` |
| `Cache-Control` | 缓存策略，`max-age` / `no-store` / `immutable` |
| `ETag` / `Last-Modified` | 配合条件请求实现 304 |
| `Set-Cookie` | 下发 Cookie，可带 `HttpOnly` / `Secure` / `SameSite` |
| `Access-Control-Allow-Origin` | CORS 允许的源 |
| `Strict-Transport-Security` | HSTS，强制后续访问走 HTTPS |
| `Content-Security-Policy` | CSP，限制资源加载来源防 XSS |

安全相关的头配得对不对，可以用[安全头检测](/tools/security/security-headers)扫一遍。

## 常见误区

### 误区一：HTTPS 会拖慢网站

早年是，现在基本不会。TLS 握手多做 1~2 个 RTT，但会话复用和 TLS 1.3 已经把它压到 1 个 RTT，现代 CPU 做对称加密的开销可以忽略。反过来，没有 HTTPS 你就用不了 HTTP/2 和 HTTP/3，**总体上 HTTPS 反而更快**。

### 误区二：用了 HTTPS 就不用管别的了

HTTPS 只保证传输通道安全，不保证应用本身安全。SQL 注入、XSS、越权访问，这些跟 HTTPS 一点关系都没有。它防的是链路上的中间人，不是应用层的漏洞。

### 误区三：证书验证了，对方就一定可信

证书只证明"对方持有这个域名的私钥"，不证明"这个域名是正经网站"。钓鱼网站一样能申请到合法证书。现在的浏览器会在地址栏淡化 HTTPS 标识，就是这个原因——它早就不该被当成"安全"的同义词。

### 误区四：GET 和 POST 的区别是长度限制

HTTP 规范对 GET 的 URL 长度**没有任何限制**，所谓 2KB 限制是老浏览器和服务器的实现约束。真正的区别在语义：GET 是安全且幂等的读操作，POST 是会改变服务端状态的写操作。这个语义决定了 GET 请求可能被预加载、被浏览器历史记住、被爬虫抓走——所以别用 GET 做删除操作。

## HTTP vs HTTPS vs HTTP/2 vs HTTP/3

| | HTTP/1.1 | HTTPS (TLS 1.2) | HTTP/2 | HTTP/3 |
|---|---|---|---|---|
| **传输层** | TCP | TCP + TLS | TCP + TLS | QUIC（UDP） |
| **报文格式** | 文本 | 加密文本 | 二进制分帧 | 二进制分帧 |
| **连接复用** | 串行排队 | 串行排队 | 多路复用 | 多路复用 |
| **队头阻塞** | 应用层严重 | 应用层严重 | 应用层解决 | 传输层也解决 |
| **握手开销** | 1 RTT | 2~3 RTT | 2~3 RTT | 1 RTT（复用 0-RTT） |
| **头部压缩** | 无 | 无 | HPACK | QPACK |
| **必须加密** | 否 | 是 | 事实上是 | 是（内置） |

## 常见问题

**Q: HTTPS 握手到底多了几次往返？**

TLS 1.2 是 2 个 RTT（加上 TCP 握手共 3 个），TLS 1.3 压到 1 个 RTT（加 TCP 共 2 个）。会话复用时两者都能再省一次：TLS 1.2 会话复用是 1-RTT，TLS 1.3 的 0-RTT 则可以把应用数据和 ClientHello 一起发出去。

**Q: 为什么抓包看不到 HTTPS 的内容？**

因为你看到的是 TLS 加密后的密文。想看明文需要让客户端信任你的代理证书（Charles、Fiddler、mitmproxy 就是这个原理），或者配置 `SSLKEYLOGFILE` 让浏览器导出会话密钥给 Wireshark 解密。

**Q: 证书过期会怎样？**

浏览器直接拦截访问，显示"您的连接不是私密连接"，用户必须手动点"继续"才能进——实际上等于网站挂了。所以现在普遍用 Let's Encrypt 配自动化续期，把证书有效期压到 90 天。

**Q: 什么叫前向安全，为什么重要？**

假设攻击者现在把服务器私钥偷走了。如果密钥交换用的是静态 RSA（TLS 1.2 支持，但已不推荐），他就能解开以前录制的所有加密流量；如果用 ECDHE 这类临时密钥交换（TLS 1.3 强制），每次会话的密钥都是临时生成的、用完即弃，私钥泄露也解不开历史流量。这个性质就叫前向安全。

**Q: 本地开发怎么上 HTTPS？**

用 `mkcert` 生成本地可信证书最省事，它会在系统信任库里装一个本地 CA。也可以用 [RSA 密钥对生成工具](/tools/encryption/rsa-keygen) 造自签名证书，只是浏览器会报警告，需要手动信任或加启动参数忽略。

**Q: 三次握手能不能携带数据？**

可以。TCP Fast Open（TFO）允许在第一个 SYN 包里带数据，能省掉一个 RTT。但因为它存在安全性和中间设备兼容性问题，实际部署比例不高，Linux 上默认也是关闭的。

**Q: 为什么服务器上有大量 TIME_WAIT？**

TIME_WAIT 出现在**主动关闭连接的一方**。如果一台机器上有大量 TIME_WAIT，说明它在频繁地主动断开连接——常见于压测客户端、爬虫，或者没启用 Keep-Alive 的短连接服务。解决办法是让对端主动关闭、开启连接复用，或者调 `net.ipv4.tcp_tw_reuse`。
