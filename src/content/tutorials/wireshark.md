---
title: 'Wireshark 实战：从抓第一个包到追踪完整数据流'
toolId: wireshark
category: security
description: '从一次接口偶发 504 的排查讲起，搞懂 Wireshark 的三窗格界面、捕获过滤器与显示过滤器的区别，手把手演示拿到一个原始数据包怎么逐层分析、怎么用 Follow Stream 追踪完整数据流，以及企业里它到底用在哪些场景'
keywords: [Wireshark, 抓包, 网络分析, 数据包分析, 显示过滤器, 捕获过滤器, Follow Stream, TCP流, 流量排查, 协议分析]
author: 开发工具箱
date: 2026-09-16
updated: 2026-09-16
phase: 1
relatedTools: [iptables, nmap, security-ports, linux-commands]
relatedTutorials: [iptables]
---

## 一次"接口偶发 504"的翻车

去年我们有个接口偶发 504，Nginx 日志里看是 upstream timeout，应用日志里却又看不到慢查询，两边都说"不是我的锅"。最后我在网关上抓了 30 秒包，才发现是后端某台机器的 TCP 接收窗口被占满（Zero Window），请求卡在连接里没真正发出去——应用层当然什么日志都打不出来。

这种"日志看不出、但线上就是有问题"的场景，Wireshark（或 `tshark` 命令行版）几乎是最后的真相来源。这篇就把从"怎么抓第一个包"到"怎么把一个原始数据包还原成可读对话"的完整路子讲清楚。

Wireshark 只用于你**有权限、有授权**管理的网络与主机抓包，切勿对未授权网络做任何抓包行为。

## Wireshark 到底能干什么

一句话：它把网卡驱动层收到的每一个**原始数据帧**抓下来，按协议一层层解析给你看——从最底层的以太网帧，到 IP、TCP/UDP，再到 HTTP、DNS、TLS 这些应用层协议，一直到线路上的真实字节。

它不是"网络监控大屏"，而是一个**显微镜**：平时用不上，一旦要回答"线上到底发生了什么"，它就是那把最利的解剖刀。

## 基础使用方法

### 1. 选对网卡，先抓起来

打开 Wireshark，第一件事是选**正确的网卡**。很多人抓不到包，八成是因为选了 Wi‑Fi 网卡却在有线网里测，或者反过来。选中网卡后点左上角鲨鱼鳍图标（或双击网卡名）就开始捕获；想停就点红色方块；抓完了记得 `File → Save` 存成 `.pcapng`，方便事后慢慢分析或发给同事。

抓到的包会在三个窗格里展示，这也是 Wireshark 最该先记住的界面：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"选择网卡并开始捕获","d":"先选对网卡（注意抓 Wi‑Fi 还是有线），再点开始捕获。抓错网卡会什么都看不到。"},{"t":"抓包引擎读取原始帧","d":"Wireshark 通过 libpcap/NPcap 从网卡驱动层直接读取每一个原始帧。"},{"t":"捕获过滤器（抓包前）","d":"可选。在抓包前就按表达式丢弃无关流量，能大幅降低 CPU 与文件体积，适合高流量场景。"},{"t":"包列表区 List","d":"每个包一行：编号、时间、源/目的、协议、长度、摘要。排错时先在这里扫一眼整体。"},{"t":"显示过滤器（抓包后）","d":"可选。抓到之后再按条件筛选，语法灵活、可随时修改，日常分析最常用。"},{"t":"包详情区 Details","d":"选中一行后，用协议树从帧→以太网→IP→TCP→应用层逐层展开，看清每一层字段。"},{"t":"原始字节区 Bytes","d":"最底下显示十六进制 + ASCII，对应报文在线路上的真实字节，定位字段偏移时看这里。"}]'>
<svg viewBox="0 0 840 480" role="img" aria-label="Wireshark 抓包到三窗格展示的全流程" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m1a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="300" y="20" width="240" height="40" rx="9"/><text class="dg-tb" x="420" y="40">① 选择网卡并开始捕获</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,60 V92" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="300" y="94" width="240" height="48" rx="9"/><text class="dg-tb" x="420" y="114">② 抓包引擎</text><text class="dg-ts" x="420" y="132">libpcap / NPcap 读原始帧</text></g>
<g class="dg-pop" data-step="2"><rect class="dg-box-a" x="30" y="94" width="240" height="48" rx="9"/><text class="dg-tb" x="150" y="114">捕获过滤器</text><text class="dg-ts" x="150" y="132">抓包前就丢弃无关流量</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-a" d="M270,118 H296" marker-end="url(#m1a)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="300" y="194" width="240" height="48" rx="9"/><text class="dg-tb" x="420" y="214">③ 包列表区 List</text><text class="dg-ts" x="420" y="232">每行一个包：源/目的/协议</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M420,142 V190" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-a" x="30" y="194" width="240" height="48" rx="9"/><text class="dg-tb" x="150" y="214">显示过滤器</text><text class="dg-ts" x="150" y="232">抓包后再筛选，语法灵活</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-a" d="M270,218 H296" marker-end="url(#m1a)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box" x="300" y="300" width="240" height="52" rx="9"/><text class="dg-tb" x="420" y="320">④ 包详情区 Details</text><text class="dg-ts" x="420" y="338">协议树逐层展开</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M420,242 V296" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="6"><rect class="dg-box" x="300" y="410" width="240" height="48" rx="9"/><text class="dg-tb" x="420" y="430">⑤ 原始字节区 Bytes</text><text class="dg-ts" x="420" y="448">十六进制 + ASCII</text></g>
<g data-step="6" data-flow="1"><path class="dg-line-p" d="M420,352 V406" marker-end="url(#m1p)"/></g>
</svg>
<figcaption>图 1：Wireshark 的工作主线。选对网卡开始捕获后，抓包引擎从驱动层读取每一个原始帧；可选的捕获过滤器在抓包前就丢弃无关流量，显示过滤器则在抓到之后按需筛选。捕获到的包在三大窗格里展示：包列表区（每行一个包）、包详情区（协议树逐层展开）、原始字节区（线路上的真实字节）。点上面的「播放」可以看整条链路。</figcaption>
</figure>

- **包列表区（List）**：每个包一行，列是 `No.` / `Time` / `Source` / `Destination` / `Protocol` / `Length` / `Info`。排错第一步就是在这里扫一眼整体，看有没有大量重传、RST、或某个 IP 异常。
- **包详情区（Details）**：选中一行后，用一棵树把协议从外层到内层展开——这是分析的核心区。
- **原始字节区（Bytes）**：最底下那块十六进制 + 右侧 ASCII，是报文在网线上的真实字节。要定位某个字段在报文里的偏移、或怀疑解析有误时，看这里。

### 2. 两种过滤器：抓包前 vs 抓包后

新手最容易混淆的俩概念，记这一句就够：**捕获过滤器决定"抓哪些"，显示过滤器决定"看哪些"**。

| | 捕获过滤器 (Capture Filter) | 显示过滤器 (Display Filter) |
|---|---|---|
| 生效时机 | 抓包**之前**设置，不关心的包直接不进文件 | 抓到**之后**随时输入，纯前端筛选 |
| 语法 | libpcap 语法（`host 1.1.1.1`、`tcp port 80`） | Wireshark 字段语法（`ip.addr == 1.1.1.1`、`tcp.port == 80`） |
| 性能 | 省 CPU、省磁盘，高流量必备 | 不影响抓包，但包太多时界面会卡 |
| 能否改 | 得停了重抓 | 随时改，可叠加 |

日常分析强烈建议**先宽抓、后用显示过滤器筛**——因为抓的时候你往往还不知道要盯着什么；等存好 `.pcapng`，再用显示过滤器反复试。站内的 [Wireshark 过滤命令生成器](/tools/security/wireshark) 把两种语法都做成了可视化表单，选好 IP/端口/协议/标志位直接生成可复制表达式，还能在"常用过滤命令"里一键拷贝。

几个最常用的：只看某主机 `ip.addr == 192.168.1.1`；只看某端口 `tcp.port == 443`；只看 HTTP `http`；排除本机回环 `ip.addr != 127.0.0.1`；TCP 握手失败 `tcp.flags.syn == 1 && tcp.flags.ack == 0`。

### 3. 最常用的几个起步动作

- **跟着 TCP 流走**：在包上右键 → `Follow` → `TCP Stream`，这是后面要重点讲的"追踪数据流"。
- **着色规则**：`View → Coloring Rules`，重传、RST 等会自动标红，扫包列表时一眼能看见异常。
- **专家信息**：`Analyze → Expert Information`，Wireshark 会替你汇总"重传/乱序/零窗口/可疑"等事件，新手排错先看这里最省力。
- **统计工具**：`Statistics → IO Graph`（吞吐量曲线）、`Conversations`（会话排行）、`Protocol Hierarchy`（协议占比），快速定位"流量到底耗在哪"。

## 实战：拿到一个原始数据包，怎么分析

这是最常被问的问题。假设你打开抓到的文件，包列表里有一行：

```
No.   Time           Source                Destination           Protocol  Length  Info
12    0.045682       192.168.1.100         93.184.216.34         HTTP      542     GET /api/v1/users HTTP/1.1
```

这就是一个"原始数据包"在列表里的样子——一行摘要。点中它，下面详情区会展开成一棵树。分析一个包的标准动作，就是**从最外层往里逐层剥**：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"在包列表点中目标包","d":"包列表里一行就是一个原始数据包，点中它，详情区会展开成协议树。"},{"t":"Frame 帧层","d":"最外层：捕获时间、帧长度、封装协议。先看长度和时间戳是否异常。"},{"t":"Ethernet II 二层","d":"源/目的 MAC 地址。跨网段通信时，目的 MAC 是下一跳网关而非最终主机。"},{"t":"IPv4 三层","d":"源 IP、目的 IP、TTL、协议号（6=TCP，17=UDP）。确认包确实去了该去的地方。"},{"t":"TCP 四层","d":"源/目的端口、标志位 [SYN/ACK/FIN/RST]、序列号与窗口大小。连接状态全看这里。"},{"t":"HTTP 应用层","d":"最内层：请求行、Header、Body。一个原始包就这样被还原成可读的请求。"},{"t":"结合原始字节区","d":"有疑问时回到 Bytes 面板对照十六进制偏移，确认字段真实取值，不被解析误导。"}]'>
<svg viewBox="0 0 840 460" role="img" aria-label="逐层下钻分析一个原始数据包" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m2a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="120" y="20" width="600" height="40" rx="9"/><text class="dg-tb" x="176" y="40" text-anchor="start">原始数据包（包列表一行）：192.168.1.100:54321 → 93.184.216.34:80</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,60 V78" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="160" y="80" width="520" height="44" rx="9"/><text class="dg-tb" x="176" y="98" text-anchor="start">Frame 1</text><text class="dg-ts" x="176" y="118" text-anchor="start">捕获时间 0.045682s · 帧长 542 字节 · 协议 HTTP</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M420,124 V138" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="160" y="140" width="520" height="44" rx="9"/><text class="dg-tb" x="176" y="158" text-anchor="start">Ethernet II</text><text class="dg-ts" x="176" y="178" text-anchor="start">源 MAC 00:1a:2b:3c:4d:5e → 目的 MAC 00:0c:29:ab:cd:ef</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M420,184 V198" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="160" y="200" width="520" height="44" rx="9"/><text class="dg-tb" x="176" y="218" text-anchor="start">IPv4</text><text class="dg-ts" x="176" y="238" text-anchor="start">192.168.1.100 → 93.184.216.34 · TTL 64 · 协议号 6(TCP)</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M420,244 V258" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box" x="160" y="260" width="520" height="44" rx="9"/><text class="dg-tb" x="176" y="278" text-anchor="start">TCP</text><text class="dg-ts" x="176" y="298" text-anchor="start">54321 → 80 · 标志 [PSH,ACK] · Seq 1 · Ack 1 · Win 64240</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M420,304 V318" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box" x="160" y="320" width="520" height="44" rx="9"/><text class="dg-tb" x="176" y="338" text-anchor="start">HTTP</text><text class="dg-ts" x="176" y="358" text-anchor="start">GET /api/v1/users HTTP/1.1 · Host: api.example.com</text></g>
<g class="dg-pop" data-step="6"><rect class="dg-box-g" x="160" y="386" width="520" height="44" rx="9"/><text class="dg-tb" x="420" y="408">逐层展开 + 对照原始字节，一行包就被还原成完整请求</text></g>
</svg>
<figcaption>图 2：分析一个原始数据包的标准动作——从最外层往里逐层剥。Frame 看时间与长度，Ethernet 看 MAC，IPv4 看源/目的 IP 与协议号，TCP 看端口与标志位，最内层的 HTTP 才是真正的请求内容。点上面的「播放」可以看逐层下钻的过程。</figcaption>
</figure>

每一层该看什么，我拆开讲一遍：

1. **Frame（帧）**：最外层信封。先看帧长度合不合理、捕获时间对不对得上你操作的那一刻。
2. **Ethernet II（二层）**：源/目的 MAC。注意跨网段时，目的 MAC 是**下一跳网关**的 MAC，不是最终服务器的 MAC——很多人误以为这里该是目标服务器。
3. **IPv4（三层）**：源 IP、目的 IP、TTL、协议号（`6`=TCP，`17`=UDP）。确认包确实去了该去的地方，没被错误路由。
4. **TCP（四层）**：源/目的端口、标志位、`Seq`/`Ack`、窗口大小。**连接是建不上还是建上了又断**，全看 `SYN`/`ACK`/`FIN`/`RST` 这几个标志位。
5. **HTTP（应用层）**：最里面才是真正内容——请求行、Header、Body。到这一层，一个"原始包"就被还原成了可读的请求。

拿上面那个包举例：源是内网 `192.168.1.100:54321`，目的是公网 `93.184.216.34:80`，TCP 标志是 `[PSH,ACK]`（说明连接已建立、正在传数据），应用层是 `GET /api/v1/users`。三步你就知道：这是一次正常的、已建立的 HTTP GET 请求，方向、端口、状态都对。如果它慢，问题多半在响应侧或网络上，而不是请求本身。

## 追踪数据流：Follow Stream 把会话拼回来

单个包能看一层，但真实的通信是**成百上千个包组成的一次会话**。一个 HTTP 请求可能横跨几十个 TCP 包，光看单行 `GET` 根本看不到响应内容。这时就要用 **Follow Stream**——它把一个连接里的所有包按方向重新组装，让你像看聊天记录一样看完整对话。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"一个会话散落在包列表里","d":"一次 TCP 会话由几十到上千个包组成，在包列表里只是一行行零散记录。"},{"t":"右键 → Follow → TCP Stream","d":"在会话里任一包上右键，选 Follow → TCP Stream，Wireshark 会按连接重组数据。"},{"t":"上行流：客户端 → 服务器","d":"一个方向的全部数据被拼成一段可读文本，蓝色代表客户端发往服务器。"},{"t":"下行流：服务器 → 客户端","d":"另一方向拼成另一段，紫色代表服务器回给客户端，两条流方向清晰分开。"},{"t":"拼成完整对话","d":"上下两段合起来就是一次完整、可读的会话，点其中任意一行还能跳回原包。"},{"t":"实际能用来做什么","d":"看完整请求/响应、发现明文口令、重组文件传输；另有 HTTP Stream / TLS Stream（解密后）可用。"}]'>
<svg viewBox="0 0 840 480" role="img" aria-label="Follow Stream 把分散的包重组成完整会话" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m3a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-frame" x="24" y="24" width="300" height="400" rx="12"/><text class="dg-ts" x="40" y="48" text-anchor="start">包列表（一个 TCP 会话散落各包）</text><rect class="dg-box" x="40" y="70" width="268" height="34" rx="7"/><text class="dg-t" x="56" y="92" text-anchor="start">包 #12  54321→80  [PSH,ACK]</text><rect class="dg-box" x="40" y="118" width="268" height="34" rx="7"/><text class="dg-t" x="56" y="140" text-anchor="start">包 #13  80→54321  [ACK]</text><rect class="dg-box" x="40" y="166" width="268" height="34" rx="7"/><text class="dg-t" x="56" y="188" text-anchor="start">包 #14  54321→80  [PSH,ACK]</text><rect class="dg-box" x="40" y="214" width="268" height="34" rx="7"/><text class="dg-t" x="56" y="236" text-anchor="start">包 #15  80→54321  [PSH,ACK]</text><rect class="dg-box" x="40" y="262" width="268" height="34" rx="7"/><text class="dg-t" x="56" y="284" text-anchor="start">包 #16  54321→80  [FIN,ACK]</text></g>
<g class="dg-pop" data-step="1"><rect class="dg-box-p" x="360" y="40" width="456" height="44" rx="9"/><text class="dg-tb" x="376" y="62" text-anchor="start">右键任一包 → Follow → TCP Stream</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M324,62 H356" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box-p" x="360" y="120" width="456" height="80" rx="9"/><text class="dg-tb" x="376" y="144" text-anchor="start">↑ 客户端 → 服务器（上行）</text><text class="dg-ts" x="376" y="168" text-anchor="start">GET /index.html HTTP/1.1 ↵ Host: example.com</text><text class="dg-ts" x="376" y="186" text-anchor="start">User-Agent: curl/8.0</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M588,84 V118" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box-a" x="360" y="220" width="456" height="80" rx="9"/><text class="dg-tb" x="376" y="244" text-anchor="start">↓ 服务器 → 客户端（下行）</text><text class="dg-ts" x="376" y="268" text-anchor="start">HTTP/1.1 200 OK ↵ Content-Length: 612</text><text class="dg-ts" x="376" y="286" text-anchor="start">{"users":[...]}</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M588,200 V218" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box" x="360" y="320" width="456" height="44" rx="9"/><text class="dg-tb" x="588" y="342">两条流拼起来 = 一次完整、可读的对话</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M588,300 V318" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box-g" x="360" y="396" width="456" height="56" rx="9"/><text class="dg-tb" x="588" y="418">用途：看完整请求/响应、发现明文凭据、重组文件传输</text><text class="dg-ts" x="588" y="436">另有 HTTP Stream / TLS Stream（解密后）</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M588,364 V394" marker-end="url(#m3p)"/></g>
</svg>
<figcaption>图 3：Follow Stream 把一个 TCP 会话里散落的包，按方向重组成两段可读文本（蓝=客户端发服务器，紫=服务器回客户端）。两段拼起来就是一次完整对话，点其中任意一行还能跳回原始包。点上面的「播放」可以看重组过程。</figcaption>
</figure>

具体操作（以 TCP 为例）：

1. 在包列表里**随便选中这个会话的任一包**（请求包或响应包都行）。
2. 右键 → `Follow` → `TCP Stream`（HTTP 流量也可选 `HTTP Stream`；TLS 解密后选 `TLS Stream`）。
3. Wireshark 弹出一整个窗口，用**两种颜色**区分方向：一种颜色是客户端发给服务器的，另一种反过来。
4. 想看某一句对应的原始包？在流窗口里点那一行，主界面会自动跳回并选中对应的原始包。

这招在企业里特别好用：

- **看完整的 HTTP 请求与响应**：不用再一个个包拼，直接看到 `GET` 和 `200 OK` 的全文，定位接口为什么慢、返回了什么。
- **揪出明文凭据**：有些内部系统还在用 HTTP 传密码、Token，Follow 一下立刻原形毕露——这也是安全自查的常用手段。
- **重组文件传输**：FTP、邮件附件这类大文件被拆成很多包，Follow 后能按流另存为原始文件。

## 企业里 Wireshark 到底用在哪

别把它想成"黑客工具"。在正规企业里，它是运维、网络、安全、甚至开发都在用的**排障标配**。下面这张决策流，对应了最常见的几类场景：

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"线上现象","d":"接口慢、连不通、流量异常——先明确你到底在排查什么现象。"},{"t":"在相关主机/网段抓包","d":"在出问题的主机、网关或镜像端口抓包，尽量贴近故障点。"},{"t":"用显示过滤器缩小范围","d":"抓到后用显示过滤器按 IP/端口/协议收敛，别在几万包里裸眼找。"},{"t":"故障类：看 TCP 健康度","d":"TCP 重传、Dup ACK、RTT 增大、Zero Window——定位丢包、拥塞、对端处理慢。"},{"t":"安全类：看异常与明文","d":"异常外联 IP、明文口令/凭据、可疑 DNS 查询——做安全自查与入侵排查。"},{"t":"性能类：看吞吐与时延","d":"IO Graph 看吞吐量、TCP 流图看瓶颈、应用层看请求/响应时延分布。"},{"t":"排障闭环","d":"抓包→过滤→分析→验证修复。Wireshark 是看清线上到底发生了什么的最后一招。"}]'>
<svg viewBox="0 0 840 470" role="img" aria-label="企业排障决策流：现象到根因" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m4" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m4p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker><marker id="m4a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-accent);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="280" y="20" width="280" height="44" rx="9"/><text class="dg-tb" x="420" y="42">线上现象：慢 / 不通 / 异常</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M420,64 V92" marker-end="url(#m4p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="280" y="96" width="280" height="44" rx="9"/><text class="dg-tb" x="420" y="118">在相关主机或网段抓包</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M420,140 V168" marker-end="url(#m4p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="280" y="172" width="280" height="44" rx="9"/><text class="dg-tb" x="420" y="194">用显示过滤器缩小范围</text></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="30" y="280" width="240" height="84" rx="9"/><text class="dg-tb" x="150" y="304">故障排查</text><text class="dg-ts" x="46" y="326" text-anchor="start">· TCP 重传 / Dup ACK</text><text class="dg-ts" x="46" y="346" text-anchor="start">· RTT 增大 / Zero Window</text></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-a" x="300" y="280" width="240" height="84" rx="9"/><text class="dg-tb" x="420" y="304">安全分析</text><text class="dg-ts" x="316" y="326" text-anchor="start">· 异常外联 IP</text><text class="dg-ts" x="316" y="346" text-anchor="start">· 明文口令 / 可疑 DNS</text></g>
<g class="dg-pop" data-step="5"><rect class="dg-box" x="570" y="280" width="240" height="84" rx="9"/><text class="dg-tb" x="690" y="304">性能分析</text><text class="dg-ts" x="586" y="326" text-anchor="start">· IO Graph 吞吐</text><text class="dg-ts" x="586" y="346" text-anchor="start">· TCP 流图 / 应用时延</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M420,216 V250 H150 V276" marker-end="url(#m4p)"/></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M420,216 V276" marker-end="url(#m4p)"/></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M420,216 V250 H690 V276" marker-end="url(#m4p)"/></g>
<g class="dg-pop" data-step="6"><rect class="dg-box-g" x="30" y="404" width="780" height="46" rx="9"/><text class="dg-tb" x="420" y="428">排障闭环：抓包 → 过滤 → 分析 → 验证修复；Wireshark 是看清「线上到底发生了什么」的最后一招</text></g>
</svg>
<figcaption>图 4：企业排障决策流。先明确现象，在贴近故障点的主机或网段抓包，用显示过滤器收敛范围，再按故障类（TCP 健康度）、安全类（异常/明文）、性能类（吞吐/时延）三个方向下钻定位根因。点上面的「播放」可以看决策路径。</figcaption>
</figure>

### 1. 网络故障排查

连接时通时断、文件传一半卡住、VPN 老掉线——这类问题日志往往无能为力。抓包后重点看 TCP 的"健康指标"：

- **重传（Retransmission）**和 **重复 ACK（Dup ACK）**：说明链路在丢包，网络质量或中间设备有问题。
- **RTT 突然变大**：某一跳延迟飙升，结合 `ping`/`mtr` 能锁定是哪段链路。
- **Zero Window / Window Full**：对端接收窗口被占满，发送方被迫停等——开头那次 504 就是它。常见于后端处理慢、或应用没及时读 socket。

### 2. 应用层 / 接口问题定位

"接口很慢"到底是慢在哪？抓包 + Follow Stream 能直接看到：请求什么时候发出、服务器多久才回 `200 OK`、响应体多大。TLS 流量若配置了密钥（或浏览器 `SSLKEYLOGFILE`），还能解密后看应用层。结合 [安全常见端口](/tools/security/security-ports) 先确认服务跑在哪个端口，过滤起来更快。

### 3. 安全分析与入侵排查

- **异常外联**：某台内网机器频繁连陌生公网 IP？抓包看它到底在和谁通信、传了什么。
- **明文凭据**：内部系统用 HTTP 传密码、Token，Follow 一下原形毕露，是合规自查的高频动作。
- **可疑 DNS / 协议**：恶意软件常借 DNS 隧道外泄数据，看 DNS 查询的域名与频次能发现苗头。

排查时配合 [Iptables 命令生成器](/tools/security/iptables) 在边界做丢包/限流策略、[Nmap](/tools/security/nmap) 做主机发现，能形成"发现→阻断→验证"的闭环。

### 4. 协议 / 自研协议调试

自研的私有 TCP 协议、硬件设备的私有报文，没有现成解析器时，就靠原始字节区对着协议文档一个个字段对偏移。Wireshark 还支持用 Lua 写 dissector，把私有协议也变成可展开的树。

### 5. 性能与容量分析

- **IO Graph**：看吞吐量随时间的变化曲线，一眼找到流量尖峰。
- **TCP 流图（Flow Graph）**：把一次连接的状态跃迁画成时间线，SYN 慢、握手后空等，都看得见。
- **协议层级（Protocol Hierarchy）**：确认流量到底耗在哪个协议上，决定优化方向。

## 排错 FAQ

**Q：抓不到任何包？**
先确认网卡选对了（无线/有线别搞混）；在云服务器上要抓对应的虚拟网卡（如 `eth0`），且往往需要在有流量的那一侧抓；Linux 上普通用户可能没权限，加 `sudo` 或给 dumpcap 设 capability。

**Q：包太多卡死界面？**
别一上来就全抓。要么抓之前设**捕获过滤器**（如 `host 1.2.3.4`）缩小范围，要么先宽抓一小段时间（几十秒）存盘，再用显示过滤器慢慢筛。

**Q：TLS/HTTPS 流量全是密文看不了？**
需要服务端私钥，或客户端导出 `SSLKEYLOGFILE` 给 Wireshark 配置（`Preferences → Protocols → TLS → (Pre)-Master-Secret log`）。没有密钥，应用层内容天然不可见——这正是 HTTPS 的设计目的。

**Q：Follow Stream 出来的内容是乱码？**
大概率那一路不是文本协议（比如是图片、压缩包、二进制 RPC），或者方向混在一起。可在流窗口切换"仅看一个方向"，或把流另存为原始文件用专门工具打开。

**Q：命令行环境怎么用？**
用 `tshark`（Wireshark 的终端版），例如 `tshark -i eth0 -Y "http" -T fields -e http.request.uri` 直接提取 HTTP 请求路径，适合写进脚本做自动化分析。

## 相关工具

- [Wireshark 过滤命令生成器](/tools/security/wireshark)：可视化生成显示过滤器与捕获过滤器，并内置常用过滤命令速查。
- [Iptables 命令生成器](/tools/security/iptables)：在边界做丢包、限流、端口转发的命令生成与速查。
- [Nmap 命令生成器](/tools/security/nmap)：主机发现与端口扫描，和抓包配合做"发现→验证"。
- [安全常见端口](/tools/security/security-ports)：排错时快速确认服务跑在哪个端口、对应什么风险。
- [Linux 常用命令](/tools/security/linux-commands)：抓包主机上的系统/网络/权限等配套运维命令。
