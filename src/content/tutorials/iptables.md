---
title: 'iptables 入门：原理、常用命令与和 firewalld 的关系'
toolId: iptables
category: security
description: '从一次"改了规则却连不上"的翻车讲起，搞懂 iptables 的 netfilter 五链四表、规则匹配与 NAT 原理，并附配合站内 Iptables 命令生成器可直接复制的常用命令，以及与 firewalld 的底层关系对照'
keywords: [iptables, 防火墙, Linux防火墙, netfilter, 端口开放, 端口转发, DNAT, SNAT, 规则链, 服务器安全, firewalld关系]
author: 开发工具箱
date: 2026-09-15
updated: 2026-09-15
phase: 1
relatedTools: [firewalld, security-ports, linux-commands]
relatedTutorials: [firewalld]
---

## 一次"改了规则却连不上"的翻车

我第一次手工配 iptables，是在一台跳板机上想只放行公司出口 IP 的 SSH。我信心满满敲了 `iptables -A INPUT -p tcp --dport 22 -s 10.20.0.0/16 -j ACCEPT`，本地测试没问题，结果同事一重启网络就全连不上了——因为我忘了：INPUT 链的默认策略是 `DROP`，而我只在链尾追加了一条放行规则，前面那些历史 `DROP` 规则早就把包拦了；更糟的是我还没保存，重启后连这条都没了。

这篇教程就是把当时踩的坑一次性讲清楚：iptables 到底是怎么处理一个包的、规则为什么"顺序即一切"、NAT 是怎么把内网藏起来的，以及它和我们之前讲过的 firewalld 到底是什么关系。

iptables 只用于你**有权限、有授权**管理的服务器，切勿对未授权设备做任何操作。

## 什么是 iptables？

一句话：iptables 是 Linux 内核里 **netfilter** 框架的**用户态配置工具**。真正干活的是内核里的 netfilter 钩子（hook），iptables 只是让你能往这些钩子上挂规则的命令行接口。

它和 firewalld 是"同一套内核机制的不同接口"——这点后面专门讲。先记住：iptables 直接面对的是**表（table）**和**链（chain）**，理解这两个词，后面所有命令都有迹可循。

## 原理一：一个包在内核里走了哪几条链

这是 iptables 最该先理解的一张图。内核为数据包预设了 5 个"检查点"（链），按流量方向串起来。包从网卡进来，先过 `PREROUTING`，再经路由判定决定它是发给本机还是被转发；发给本机的走 `INPUT` 交给进程，转发的走 `FORWARD`，本机出站的走 `OUTPUT`，最后在 `POSTROUTING` 离场。涉及地址改写时，由 nat 表在 `PREROUTING`（DNAT）和 `POSTROUTING`（SNAT）两处动手。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"数据包进入网卡","d":"流量经网卡进入内核，iptables 通过 netfilter 钩子接管处理。"},{"t":"PREROUTING 链","d":"最先触发的链，nat 表在此做 DNAT（改写目的地址），常用于端口转发。"},{"t":"路由判定","d":"内核判断包是发给本机还是需转发：本机走 INPUT，转发走 FORWARD。"},{"t":"INPUT 链","d":"filter 表在此过滤入站流量，决定是否允许访问本机服务。"},{"t":"本机进程处理","d":"放行的入站包交给本机应用（如 Nginx、SSH）处理。"},{"t":"FORWARD 链","d":"filter 表在此过滤被转发（路由）的流量，是网关/路由器的核心。"},{"t":"OUTPUT 链","d":"本机发出的包先经 OUTPUT（filter / nat 表）过滤，再决定能否出站。"},{"t":"POSTROUTING 链","d":"nat 表在此做 SNAT / MASQUERADE（改写源地址），让内网机器共用公网 IP 出网。"},{"t":"从网卡发出","d":"处理完的包从网卡发出，完成一次完整的 netfilter 旅程。"}]'>
<svg viewBox="0 0 840 430" role="img" aria-label="iptables/netfilter 数据包处理全景：五条链与四张表" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="30" y="24" width="210" height="44" rx="9"/><text class="dg-tb" x="135" y="46">数据包进入网卡</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M135,70 V102" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="30" y="104" width="210" height="48" rx="9"/><text class="dg-tb" x="135" y="124">PREROUTING</text><text class="dg-ts" x="135" y="142">nat 表：DNAT</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M135,154 V182" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="30" y="184" width="210" height="48" rx="9"/><text class="dg-tb" x="135" y="204">路由判定</text><text class="dg-ts" x="135" y="222">本机 / 转发</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M135,234 V268" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="30" y="270" width="210" height="48" rx="9"/><text class="dg-tb" x="135" y="290">INPUT</text><text class="dg-ts" x="135" y="308">filter 表（入站）</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M135,320 V348" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-p" x="30" y="350" width="210" height="44" rx="9"/><text class="dg-tb" x="135" y="372">本机进程处理</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M240,208 H328" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box" x="330" y="184" width="210" height="48" rx="9"/><text class="dg-tb" x="435" y="204">FORWARD</text><text class="dg-ts" x="435" y="222">filter 表（转发）</text></g>
<g data-step="6" data-flow="1"><path class="dg-line-p" d="M240,372 H328" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="6"><rect class="dg-box" x="330" y="350" width="210" height="48" rx="9"/><text class="dg-tb" x="435" y="370">OUTPUT</text><text class="dg-ts" x="435" y="388">filter / nat 表</text></g>
<g data-step="7" data-flow="1"><path class="dg-line-p" d="M435,234 V254 H705 V268" marker-end="url(#m1p)"/><path class="dg-line-p" d="M540,374 H596 V296" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="7"><rect class="dg-box-a" x="600" y="270" width="210" height="48" rx="9"/><text class="dg-tb" x="705" y="290">POSTROUTING</text><text class="dg-ts" x="705" y="308">nat 表：SNAT</text></g>
<g data-step="8" data-flow="1"><path class="dg-line-p" d="M705,320 V348" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="8"><rect class="dg-box-p" x="600" y="350" width="210" height="44" rx="9"/><text class="dg-tb" x="705" y="372">从网卡发出</text></g>
</svg>
<figcaption>图 1：iptables/netfilter 的数据包处理全景。一个包从网卡进入后，依次经过 PREROUTING、路由判定；发给本机的走 INPUT，转发的走 FORWARD，本机出站的走 OUTPUT；涉及地址改写时由 nat 表的 PREROUTING（DNAT）与 POSTROUTING（SNAT）处理。点上面的「播放」可以看完整路径。</figcaption>
</figure>

### 四张表分别管什么

链是"检查点"，表是"功能分类"。同一条链上可能挂着不同表的规则，内核按固定顺序依次走各表。最常用的四张表：

| 表（table） | 作用 | 主要出现的链 |
|---|---|---|
| `filter` | 过滤，决定放行/丢弃（最常用） | INPUT、FORWARD、OUTPUT |
| `nat` | 网络地址转换（DNAT / SNAT / 伪装） | PREROUTING、POSTROUTING、OUTPUT |
| `mangle` | 修改包头部（TTL、TOS、MARK 等） | 所有链 |
| `raw` | 绕过连接追踪（提升性能） | PREROUTING、OUTPUT |

日常 90% 的需求只用 `filter` 和 `nat` 两张表。命令里用 `-t nat` 指定 nat 表，不写 `-t` 默认就是 `filter` 表——这也是新手最容易漏的一点。

## 原理二：一条链里，规则"顺序即一切"

这是 iptables 和 firewalld 最大的思维差异。firewalld 里你说"开放 8080"，它帮你排好序；而 iptables 里，**规则是严格自上而下逐条匹配的，命中即终止，后面的规则不再看**。

下面这张图演示了一条 INPUT 链：包从链顶进入，依次比对规则①→②→③→④；一旦某条规则的全部条件满足，就执行它的动作（target）并立刻停止匹配（比如规则③命中 `DROP` 后，规则④根本不会被执行）；如果整条链走完都没命中，就交给链的**默认策略（Policy）**裁决。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"数据包进入链","d":"一个包进入某条链（如 INPUT），从第一条规则开始判断。"},{"t":"逐条自上而下匹配","d":"规则按顺序比对；先检查规则①，条件不符则继续往下。"},{"t":"继续比对下一条","d":"规则②同样从上到下检查，符合才触发其动作。"},{"t":"命中规则③","d":"一旦某条规则全部条件匹配，立即执行它的 target（如 DROP），并终止本链匹配。"},{"t":"后续规则不再执行","d":"命中后包已决断，规则④及更靠后的规则都不会再看——这就是顺序的重要性。"},{"t":"默认策略兜底","d":"若一条都没命中，包将执行链的默认策略 Policy（设为 DROP 更安全，但别忘了先放行 SSH）。"}]'>
<svg viewBox="0 0 760 470" role="img" aria-label="iptables 链内规则自上而下匹配与默认策略" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="300" y="20" width="160" height="36" rx="9"/><text class="dg-tb" x="380" y="38">数据包进入链</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M380,56 V90" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="150" y="92" width="460" height="44" rx="9"/><text class="dg-t" x="380" y="114">① -p tcp --dport 22 -j ACCEPT</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M380,136 V158" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="150" y="160" width="460" height="44" rx="9"/><text class="dg-t" x="380" y="182">② -m state --state ESTABLISHED,RELATED -j ACCEPT</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M380,204 V226" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="150" y="228" width="460" height="44" rx="9"/><text class="dg-t" x="380" y="250">③ -s 10.0.0.5 -j DROP</text></g>
<g class="dg-pop" data-step="3"><rect class="dg-box-w" x="620" y="232" width="140" height="36" rx="8"/><text class="dg-t" x="690" y="250">命中→终止</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M380,272 V294" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box" x="150" y="296" width="460" height="44" rx="9"/><text class="dg-t" x="380" y="318">④ -p tcp --dport 80 -j ACCEPT</text><text class="dg-ts" x="620" y="318" text-anchor="start">（未执行）</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M380,340 V382" marker-end="url(#m2p)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box-g" x="150" y="384" width="460" height="44" rx="9"/><text class="dg-tb" x="380" y="406">Chain Policy（默认动作）：DROP</text></g>
</svg>
<figcaption>图 2：一条链内的匹配逻辑。包从链顶进入，规则自上而下逐条比对；一旦某条规则全部条件命中，立即执行它的 target 并终止本链（如规则③命中 DROP 后，规则④不再看）；若整条链都没命中，则执行链的默认策略 Policy。点上面的「播放」可以看包是怎么一步步走下来的。</figcaption>
</figure>

**实战结论**：写规则时，把"放行已建立连接""放行管理端口（SSH）"这类高优先级规则放在前面，把"拒绝/默认丢弃"放在最后。常用 target 含义：

- `ACCEPT`：放行
- `DROP`：静默丢弃（对方无响应，像石沉大海）
- `REJECT`：拒绝并回包通知（如 `icmp-port-unreachable`）
- `LOG`：记录到内核日志后**继续**往下匹配（常配合后续 DROP 做审计）

## 原理三：NAT 是怎么把内网藏起来的

NAT 解决的是"内网一堆机器，怎么共用一个公网 IP 上网/被访问"。核心技术点在两张 nat 表链上：入站时在 `PREROUTING` 做 **DNAT**（改目的地址，把公网 :80 映射到内网 :8080），出站时在 `POSTROUTING` 做 **SNAT / MASQUERADE**（改源地址，把内网私有地址改成公网 IP）。下面这张图把一次完整的端口转发串起来——它和 firewalld 的 `--add-forward-port` 做的是同一件事，只是写法不同。

<figure class="dg-figure" data-interval="2200" data-steps='[{"t":"外部请求到达","d":"公网客户端向防火墙公网 IP:80 发起请求。"},{"t":"PREROUTING 做 DNAT","d":"在 PREROUTING 链改写目的地址，把 :80 映射到内网后端 :8080。"},{"t":"转发到内网后端","d":"路由判定后，包被转发到内网真实服务 192.168.1.100:8080。"},{"t":"后端回包","d":"后端响应原路返回防火墙，准备做源地址转换。"},{"t":"POSTROUTING 做 SNAT","d":"在 POSTROUTING 链改写源地址为公网 IP（或 MASQUERADE），否则回包地址错误。"},{"t":"响应返回外部","d":"外部客户端只看到与防火墙公网 IP 的通信，内网拓扑被隐藏。这正对应 firewalld 的端口转发。"}]'>
<svg viewBox="0 0 840 400" role="img" aria-label="iptables NAT 流程：DNAT 入站与 SNAT 出站" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<rect class="dg-frame" x="312" y="78" width="236" height="244" rx="12"/><text class="dg-ts" x="320" y="72" text-anchor="start">防火墙主机</text>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="40" y="150" width="150" height="70" rx="9"/><text class="dg-tb" x="115" y="174">外部客户端</text><text class="dg-ts" x="115" y="194">访问 :80</text></g>
<g data-step="0" data-flow="1"><path class="dg-line-p" d="M190,185 H328" marker-end="url(#m3p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="330" y="100" width="200" height="60" rx="9"/><text class="dg-tb" x="430" y="124">PREROUTING</text><text class="dg-ts" x="430" y="144">nat：DNAT 改写目的地址</text></g>
<g class="dg-pop" data-step="2"><rect class="dg-box-a" x="650" y="150" width="150" height="70" rx="9"/><text class="dg-tb" x="725" y="174">内网后端</text><text class="dg-ts" x="725" y="194">192.168.1.100:8080</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M530,170 H648" marker-end="url(#m3p)"/></g>
<g data-step="3" data-flow="1"><path class="dg-dash" d="M725,222 V296 H432 V299" marker-end="url(#m3)"/><text class="dg-ts" x="560" y="318" text-anchor="start">③ 后端回包</text></g>
<g class="dg-pop" data-step="4"><rect class="dg-box" x="330" y="240" width="200" height="60" rx="9"/><text class="dg-tb" x="430" y="264">POSTROUTING</text><text class="dg-ts" x="430" y="284">nat：SNAT / MASQUERADE</text></g>
<g data-step="5" data-flow="1"><path class="dg-dash" d="M330,270 H190 V185" marker-end="url(#m3)"/><text class="dg-ts" x="115" y="300" text-anchor="start">⑤ 响应返回外部</text></g>
</svg>
<figcaption>图 3：NAT 端口转发流程。外部请求到达防火墙后，在 PREROUTING 链做 DNAT 把目的地址改写为内网后端 :8080，转发过去；后端回包经 POSTROUTING 链做 SNAT（或 MASQUERADE）把源地址改回公网 IP，再返回外部。这正好对应 firewalld 的 --add-forward-port 端口转发。点上面的「播放」可以看全程。</figcaption>
</figure>

注意：跨主机转发（把流量转到另一台内网机器）时，必须同时配 `POSTROUTING` 的 `MASQUERADE` 或 `SNAT`，否则后端回包的源地址还是内网地址，客户端收不到正确响应，三次握手直接失败——这和 firewalld 里"转发必须开 `--add-masquerade`"是同一个坑。

## 常用命令实战（配合工具）

上面这些 `-A` / `-t nat` / `-j` 参数一个个敲很容易拼错。站内的 [Iptables 命令生成器](/tools/security/iptables) 把它们做成可视化表单，选好表、链、协议、端口、动作，直接生成可复制命令，还能在"常用命令速查"里一键拷贝。下面几个场景都是高频需求：

**查看 / 清空规则**

```bash
iptables -L                      # 列出 filter 表规则
iptables -L -n -v               # 数字格式 + 计数，排错最常用
iptables -L --line-numbers      # 带行号，删规则时定位用
iptables -t nat -L -n -v        # 看 nat 表（端口转发都在这）
iptables -F                     # 清空 filter 表（不删默认策略）
iptables -Z                     # 重置计数器
```

**开放端口 / 放行连接**

```bash
# 开放 8080/tcp（最常用）
iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
# 允许已建立的连接（务必靠前放，否则自己都被挡）
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
# 只允许某 IP 段访问 22
iptables -A INPUT -p tcp -s 10.20.0.0/16 --dport 22 -j ACCEPT
# 开放ping（ICMP）
iptables -A INPUT -p icmp -j ACCEPT
```

**限制来源 / 拒绝 IP**

```bash
iptables -A INPUT -s 10.0.0.5 -j DROP        # 拒绝单个 IP
iptables -A INPUT -s 10.0.0.0/8 -j DROP      # 拒绝整个网段
iptables -A OUTPUT -d 8.8.8.8 -j ACCEPT      # 只允许访问特定目标
```

**设置默认策略（高危！）**

```bash
iptables -P INPUT DROP     # 默认丢弃所有入站
```

⚠️ 设 `DROP` 前**一定先**放行 SSH 和管理端口，否则下一秒你就被挡在门外。建议顺序：先 `ACCEPT` 已建立连接和管理端口，复查无误后再把 Policy 改成 `DROP`。

**NAT 端口转发（DNAT）**

```bash
# 开启内核转发（DNAT 的前提）
sysctl -w net.ipv4.ip_forward=1
# 公网 :80 → 内网 192.168.1.100:8080
iptables -t nat -A PREROUTING -p tcp --dport 80 -j DNAT --to-destination 192.168.1.100:8080
# 跨主机转发必须配源地址改写
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
```

**限速 / 防爆破**

```bash
# 限制单 IP 对 22 端口的新连接速率
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --set
iptables -A INPUT -p tcp --dport 22 -m state --state NEW -m recent --update --seconds 60 --hitcount 4 -j DROP
# 限制并发连接数
iptables -A INPUT -p tcp --dport 22 -m connlimit --connlimit-above 5 -j REJECT
# SYN 洪水防护
iptables -A INPUT -p tcp --syn -m limit --limit 1/s -j ACCEPT
```

**保存 / 恢复规则（否则重启即失）**

```bash
iptables-save > /etc/iptables/rules.v4     # 导出（Debian/Ubuntu）
iptables-restore < /etc/iptables/rules.v4   # 导入
# CentOS 可用：service iptables save
```

和 firewalld 不同，iptables 本身**不自动持久化**，规则存在于内核内存，重启就丢——必须靠 `iptables-save` 接管，或用 `netfilter-persistent` / `iptables-services` 这类机制在开机时恢复。

## iptables 和 firewalld 到底什么关系

一句话总结：**firewalld 是 iptables（或新版 nftables）的上层封装**。你用 firewalld 敲的 `firewall-cmd --add-port=8080/tcp`，背后最终都会变成 netfilter 里的一条条 iptables 规则。两者是同一套内核机制的不同接口。

| 维度 | iptables | firewalld |
|---|---|---|
| 定位 | 底层规则工具，直接操作 netfilter | Red Hat 系默认的动态防火墙管理器 |
| 后端 | 传统 iptables（也可切 nftables） | 新版默认 nftables，旧版调用 iptables |
| 配置方式 | 手写链 / 表 / 匹配条件，精细但陡 | 区域 / 服务 / 富规则 / 端口，直观 |
| 持久化 | 需 `iptables-save` 自行接管 | 内建 `--permanent` + `--reload` |
| 学习曲线 | 较陡，要懂链、表、匹配顺序 | 平缓，概念贴近运维直觉 |
| 适用场景 | 脚本化、精细控制、老系统、容器网络 | 服务器/桌面快速管理、默认防火墙 |

同一件事，两边的写法对照：

| 需求 | firewalld | iptables 等价 |
|---|---|---|
| 开放 8080/tcp | `firewall-cmd --add-port=8080/tcp --permanent` | `iptables -A INPUT -p tcp --dport 8080 -j ACCEPT` |
| 端口转发 80→8080 | `--add-forward-port=...:toport=8080` + `--add-masquerade` | `PREROUTING` 的 DNAT + `POSTROUTING` 的 MASQUERADE |
| 拒绝某 IP | `--add-rich-rule='... source reject'` | `iptables -A INPUT -s 10.0.0.5 -j DROP` |

两个**重要提醒**：

1. **别混用**。在开了 firewalld 的机器上又手工 `iptables -A`，两边规则会互相打架，排错时一头雾水。要么统一用 firewalld（推荐大多数场景），要么停用 firewalld 后纯用 iptables。
2. **CentOS 8+ 的后端是 nftables**。这时你 `iptables -L` 看到的，其实是 nftables 兼容层"翻译"出来的视图，部分语义和老 iptables 略有差异。想要纯正 iptables 行为，需要确认后端模式。

我的经验：日常运维、快速开端口，用 firewalld 省心；要做端口复用、复杂 NAT、容器网络策略、或者写自动化脚本，iptables 更可控。两者懂一个，另一个自然就通了。

## 排错 FAQ

**Q：命令敲了外网还是连不上？**
先确认三件事：规则是否加到了正确的链（`iptables -L INPUT -n -v` 看计数有没有增长）；如果是 nat 转发，检查 `PREROUTING` 和 `POSTROUTING` 是否都配了；跨主机转发别忘了 `MASQUERADE` 和 `net.ipv4.ip_forward=1`。

**Q：设了默认 DROP 后把自己锁外面了？**
这是经典事故。救急方法：通过带外管理（云控制台 / KVM / 串口）登录，把 Policy 改回 `ACCEPT`，或 `iptables -F` 清空后重配。所以改 Policy 前务必保留一个已验证的管理会话。

**Q：规则重启就没了？**
iptables 不自动持久化，必须 `iptables-save` 落盘并配置开机恢复（Debian 用 `netfilter-persistent`，CentOS 用 `iptables-services`）。

**Q：DROP 和 REJECT 该用哪个？**
对外网扫描，用 `DROP` 更"安静"（对方不知道端口是否存在）；对内部合规审计，用 `REJECT` 能立刻让合法用户知道被拒。没有绝对答案，看场景。

**Q：iptables 和 nftables 怎么选？**
新系统默认 nftables，性能更好、语法更统一；老脚本和大量现成资料还是 iptables。CentOS 8+/RHEL 8+ 上 firewalld 默认走 nftables 后端，纯 iptables 命令只是兼容视图。

## 相关工具

- [Iptables 命令生成器](/tools/security/iptables)：可视化生成过滤规则、NAT 转发、限速防护命令，并内置常用命令速查。
- [Firewalld 命令生成器](/tools/security/firewalld)：上层的区域/服务/富规则管理，适合快速开端口与端口转发。
- [安全常见端口](/tools/security/security-ports)：排错时快速确认端口对应的服务与风险。
- [Linux 常用命令](/tools/security/linux-commands)：系统/网络/权限等配套运维命令。
