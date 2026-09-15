---
title: 'Firewalld 入门：概念、原理与常用命令实战'
toolId: firewalld
category: security
description: '从一次真实翻车讲起，搞懂 firewalld 的区域（Zone）、运行时与永久配置、数据包匹配流程与端口转发原理，并附配合站内 Firewalld 命令生成器可直接复制的常用命令'
keywords: [firewalld, 防火墙, firewall-cmd, 端口开放, 端口转发, 富规则, 区域 Zone, Linux防火墙, 服务器安全, firewalld原理]
author: 开发工具箱
date: 2026-09-15
updated: 2026-09-15
phase: 1
relatedTools: [security-ports, linux-commands]
relatedTutorials: []
---

## 一次真实的翻车

我第一次用 firewalld，是在一台新上线的 CentOS 服务器上开放 8080 端口。照着网上的命令敲了 `firewall-cmd --add-port=8080/tcp`，本地 `curl 127.0.0.1:8080` 通了，信心满满地以为搞定。结果同事在外网怎么都连不上。

查了半天才发现：那条命令只改了**运行时**，我手滑重启了一次服务，规则就没了；而且我压根没分清"开放端口"和"开放服务"的区别。后来我把命令改成带 `--permanent` 的版本，再 `--reload`，外网才真正通。这篇教程就是把当时踩的坑一次性讲清楚。

firewalld 只管理你**有权限、有授权**的服务器，切勿用于任何未授权的设备。

## 什么是 firewalld？

firewalld 是 Red Hat 系（CentOS / Rocky / Alma / Fedora）默认的**动态防火墙管理器**，底层还是调用内核的 netfilter/nftables，只是它在上面包了一层更易用的"区域（Zone）"模型。

和老式 iptables 直接写规则不同，firewalld 的核心思想是：**把网络接口和流量按"信任等级"分到不同区域，每个区域预置一套放行策略**。你不用去记复杂的数据包匹配语法，只要告诉防火墙"这块网卡属于 public 区域、开放 80 和 443"即可。

它有两个容易踩坑的特性，也是本文重点：
- 配置分**运行时（Runtime）**和**永久（Permanent）**两套，互不影响直到你主动同步；
- 规则按**区域 → 富规则 → 服务 → 端口**的顺序匹配，理解这个顺序才能预测一条流量到底放不放行。

## 原理一：数据包是怎么被处理的

这是 firewalld 最该先理解的一张图。一个数据包进来，firewalld 先决定它**属于哪个区域**，再在该区域内按优先级依次检查三层规则，最后才给出放行或拒绝的裁决。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"数据包到达","d":"来自公网或内网的流量进入服务器网卡，firewalld 开始接管。"},{"t":"判定区域","d":"先按源地址绑定、再按网卡绑定、最后用默认区域，决定该流量归属哪个 Zone。"},{"t":"匹配富规则","d":"在 Zone 内，富规则优先级最高，可精确到来源 IP、端口与动作（allow/reject/drop）。"},{"t":"匹配服务","d":"其次检查 Zone 开放的预定义服务（如 http、ssh），命中即放行。"},{"t":"匹配端口","d":"再检查手动开放的裸端口（如 8080/tcp），命中即放行。"},{"t":"默认策略裁决","d":"若富规则、服务、端口都未命中，则按该 Zone 的默认策略（public 默认拒绝）裁决。"},{"t":"放行或拒绝","d":"最终流量被 accept 或丢弃。注意：只有命中规则才会放行，这正是 firewalld 默认安全的设计。"}]'>
<svg viewBox="0 0 760 560" role="img" aria-label="firewalld 数据包处理流程：区域判定与规则链" text-anchor="middle" dominant-baseline="central">
<defs><marker id="f1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="f1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="140" y="24" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="47">数据包到达网卡</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M260,70 V92" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="140" y="96" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="119">判定所属区域 Zone</text><text class="dg-ts" x="400" y="110" text-anchor="start">源地址 → 网卡 → 默认区域</text><text class="dg-ts" x="400" y="128" text-anchor="start">按此顺序依次判定</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M260,142 V164" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="140" y="168" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="191">① 富规则 Rich Rules</text><text class="dg-ts" x="400" y="184" text-anchor="start">优先级最高，可精确到源 IP</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M260,214 V236" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="140" y="240" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="263">② 服务 Services</text><text class="dg-ts" x="400" y="256" text-anchor="start">http / https / ssh 等预定义</text></g>
<g data-step="4" data-flow="1"><path class="dg-line-p" d="M260,286 V308" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="4"><rect class="dg-box" x="140" y="312" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="335">③ 端口 Ports</text><text class="dg-ts" x="400" y="328" text-anchor="start">如 8080/tcp 这类裸端口</text></g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M260,358 V380" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="5"><rect class="dg-box" x="140" y="384" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="407">accept / reject / drop</text><text class="dg-ts" x="400" y="400" text-anchor="start">按区域默认策略裁决</text></g>
<g data-step="6" data-flow="1"><path class="dg-line-p" d="M260,430 V452" marker-end="url(#f1p)"/></g>
<g class="dg-pop" data-step="6"><rect class="dg-box-g" x="140" y="456" width="240" height="46" rx="9"/><text class="dg-tb" x="260" y="479">流量放行或拒绝</text><text class="dg-ts" x="400" y="472" text-anchor="start">⚠ 都未命中则执行区域默认策略</text></g>
</svg>
<figcaption>图 1：firewalld 的数据包处理流程。流量先被判定归属哪个 Zone，再在 Zone 内依次经过富规则、服务、端口三层匹配，最后按默认策略放行或拒绝。点上面的「播放」可以看每一步。</figcaption>
</figure>

记住这个顺序：**富规则 > 服务 > 端口 > 区域默认策略**。比如你既开放了 `ssh` 服务，又写了一条"拒绝某个 IP 的 22 端口"的富规则，那该 IP 依然会被拒——因为富规则优先级更高。

## 原理二：区域（Zone）到底是什么

Zone 本质上是一组**预定义的信任模板**。把网卡或来源 IP 关联到某个 Zone，就等于套用了那套模板里的放行策略。常用 Zone 的信任度从低到高大致是：

| Zone | 信任度 | 典型用途 |
|---|---|---|
| `drop` | 最低 | 丢弃所有入站包，只出不进，像"隐形" |
| `block` | 很低 | 拒绝入站（回 `icmp-host-prohibited`） |
| `public` | 默认 | 公开网络，只开放你显式放行的服务 |
| `internal` | 较高 | 内网，默认放行更多服务 |
| `home` / `work` | 高 | 可信的家用/办公网络 |
| `trusted` | 最高 | 接受所有流量，几乎不设防 |

判定一条流量属于哪个 Zone，顺序是：**先看源地址绑定 → 再看网卡绑定 → 最后用默认区域**。这就是为什么有时候你"明明开放了 public 的端口却不通"——那块网卡可能根本不在 public 里。

```bash
# 看默认区域、活跃区域、所有区域
firewall-cmd --get-default-zone
firewall-cmd --get-active-zones
firewall-cmd --get-zones
# 把某 IP 网段绑定到指定区域（常用在区分内外网信任度）
firewall-cmd --zone=public --add-source=192.168.1.0/24 --permanent
```

## 原理三：运行时配置 vs 永久配置

这是新人翻车最多的地方。firewalld 把配置存在**两个地方**：运行时（内存）和永久（磁盘）。不带 `--permanent` 的改动只活在内存里，立刻生效但重启即丢；带 `--permanent` 的写入磁盘，重启后保留，但**不会立刻生效**，必须 `--reload` 同步进运行时。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"执行命令","d":"你在终端敲下一条 firewall-cmd 规则。"},{"t":"不带 --permanent","d":"规则只写进运行时（内存），立即生效，但服务器重启后消失。"},{"t":"带 --permanent","d":"规则写入磁盘配置文件，重启后依然保留，但不会立刻生效。"},{"t":"--reload 同步","d":"执行 firewall-cmd --reload，把永久配置加载到运行时，使改动当前生效。"},{"t":"常见坑","d":"改了规则重启却没生效？多半是漏了 --permanent，或改完忘了 --reload。"}]'>
<svg viewBox="0 0 760 420" role="img" aria-label="firewalld 运行时与永久配置的区别以及 reload 同步" text-anchor="middle" dominant-baseline="central">
<defs><marker id="f2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="f2p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="270" y="20" width="240" height="44" rx="9"/><text class="dg-tb" x="390" y="42">你执行 firewall-cmd 命令</text></g>
<g data-step="1" data-flow="1"><path class="dg-line-p" d="M390,64 C 320,120 280,160 250,198" marker-end="url(#f2p)"/></g>
<g class="dg-pop" data-step="1"><rect class="dg-box" x="130" y="200" width="220" height="80" rx="9"/><text class="dg-tb" x="240" y="224">运行时 Runtime</text><text class="dg-ts" x="240" y="246">内存，立刻生效</text><text class="dg-ts" x="240" y="266">重启后丢失</text></g>
<g data-step="2" data-flow="1"><path class="dg-line-p" d="M390,64 C 460,120 500,160 530,198" marker-end="url(#f2p)"/></g>
<g class="dg-pop" data-step="2"><rect class="dg-box" x="410" y="200" width="220" height="80" rx="9"/><text class="dg-tb" x="520" y="224">永久 Permanent</text><text class="dg-ts" x="520" y="246">磁盘配置文件</text><text class="dg-ts" x="520" y="266">重启后保留</text></g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M410,240 H360" marker-end="url(#f2)"/><text class="dg-ts" x="385" y="226" text-anchor="middle">--reload 同步</text></g>
<g class="dg-pop" data-step="4"><rect class="dg-box-w" x="200" y="330" width="360" height="54" rx="9"/><text class="dg-tb" x="380" y="352">⚠ 漏写 --permanent 或忘 --reload</text><text class="dg-ts" x="380" y="372">重启后规则就丢了</text></g>
</svg>
<figcaption>图 2：运行时配置与永久配置。不带 --permanent 的改动只活在内存里，重启即失；带 --permanent 写入磁盘，再 --reload 才生效。点上面的「播放」可以看区别。</figcaption>
</figure>

**实战建议**：生产环境养成习惯——所有持久化规则都加 `--permanent`，然后用一条 `firewall-cmd --reload` 统一生效；临时排障想立刻试效果又不污染配置时，才用不带 `--permanent` 的版本。

## 原理四：端口转发是怎么工作的

端口转发（Port Forwarding）常用于"公网只暴露 80，内部实际跑在 8080"的场景。firewalld 通过 `--add-forward-port` 把进来的流量重定向，而**跨主机**转发还需要 `--add-masquerade`（IP 伪装）来正确改写地址，否则后端回包时源地址不对，连接起不来。

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"外部请求","d":"公网客户端向防火墙的公网 IP:80 发起请求。"},{"t":"命中转发规则","d":"firewalld 命中 --add-forward-port=port=80:proto=tcp:toport=8080，决定把流量转到 8080。"},{"t":"开启 IP 伪装","d":"跨主机转发需要 --add-masquerade，否则回包地址会错、连接建立不起来。"},{"t":"转发到后端","d":"流量被送到内网后端 192.168.1.100:8080 处理。"},{"t":"响应回包","d":"后端响应经防火墙 NAT 改写后原路返回客户端。"},{"t":"效果","d":"外部只看到 :80，内网服务被安全地暴露出来，无需在公网直接开放后端端口。"}]'>
<svg viewBox="0 0 840 360" role="img" aria-label="firewalld 端口转发流程：公网 80 转发到内网 8080" text-anchor="middle" dominant-baseline="central">
<defs><marker id="f3" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="f3p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0"><rect class="dg-box-p" x="40" y="150" width="150" height="70" rx="9"/><text class="dg-tb" x="115" y="174">公网客户端</text><text class="dg-ts" x="115" y="194">发起请求</text></g>
<g data-step="0" data-flow="1"><path class="dg-line-p" d="M190,185 H318" marker-end="url(#f3p)"/></g>
<g class="dg-pop" data-step="0"><rect class="dg-box" x="320" y="130" width="200" height="90" rx="9"/><text class="dg-tb" x="420" y="156">防火墙主机</text><text class="dg-ts" x="420" y="178">公网 IP :80</text><text class="dg-ts" x="420" y="198">↓ 转发到 :8080</text></g>
<g class="dg-pop" data-step="1"><text class="dg-tb" x="420" y="108">① 命中 forward-port：80 → 8080</text></g>
<g class="dg-pop" data-step="2"><text class="dg-ts" x="420" y="240">② 需 --add-masquerade（IP 伪装）改写地址</text></g>
<g class="dg-pop" data-step="3"><rect class="dg-box" x="650" y="150" width="150" height="70" rx="9"/><text class="dg-tb" x="725" y="174">内网后端</text><text class="dg-ts" x="725" y="194">192.168.1.100:8080</text></g>
<g data-step="3" data-flow="1"><path class="dg-line-p" d="M520,175 H648" marker-end="url(#f3p)"/></g>
<g data-step="4" data-flow="1"><path class="dg-dash" d="M725,220 V295 H115 V205" marker-end="url(#f3)"/><text class="dg-ts" x="420" y="315">③ 响应经 NAT 回包</text></g>
<g class="dg-pop" data-step="5"><rect class="dg-box-g" x="250" y="40" width="340" height="44" rx="9"/><text class="dg-tb" x="420" y="62">外部只看到 :80，内网服务被安全暴露</text></g>
</svg>
<figcaption>图 3：端口转发流程。公网请求打到防火墙 :80，firewalld 按 forward-port 转到内网后端 :8080（需配合 --add-masquerade），响应再经 NAT 回包。点上面的「播放」可以看全过程。</figcaption>
</figure>

## 常见使用方法（配合工具）

前面这些参数（`--zone`、`--add-port`、`--add-service`、`--add-forward-port`、`--add-rich-rule`、`--permanent`）一个个记很容易错。站内的 [Firewalld 命令生成器](/tools/security/firewalld) 把这些做成可视化表单，选好区域、协议、端口、是否永久，直接生成可复制的命令，还能在"常用命令速查"里一键拷贝。下面几个场景都是高频需求：

**开放 / 关闭端口**

```bash
# 永久开放 8080/tcp（最常用）
firewall-cmd --zone=public --add-port=8080/tcp --permanent
# 临时开放，重启失效
firewall-cmd --zone=public --add-port=8080/tcp
# 关闭端口
firewall-cmd --zone=public --remove-port=8080/tcp --permanent
# 开放一段端口
firewall-cmd --zone=public --add-port=8000-9000/tcp --permanent
# 改完必须重载
firewall-cmd --reload
```

**开放 / 关闭服务**（等价于一堆预定义端口，比如 `http` 就是 80/tcp）

```bash
firewall-cmd --zone=public --add-service=http --permanent
firewall-cmd --zone=public --add-service=https --permanent
firewall-cmd --zone=public --remove-service=http --permanent
# 看看有哪些内置服务名可用
firewall-cmd --get-services
```

**端口转发**

```bash
# 把公网 80 转到本机 8080
firewall-cmd --zone=public --add-forward-port=port=80:proto=tcp:toport=8080 --permanent
# 转到另一台机器的 8080（必须开 masquerade）
firewall-cmd --zone=public --add-forward-port=port=80:proto=tcp:toport=8080:toaddr=192.168.1.100 --permanent
firewall-cmd --zone=public --add-masquerade --permanent
firewall-cmd --reload
```

## 富规则：精细到 IP 的访问控制

当"开放整个端口给所有人"太危险时，用富规则（Rich Rule）可以精确到**哪个来源 IP、哪个端口、允许还是拒绝**。它的优先级高于服务和端口，适合做白名单。

```bash
# 只允许 192.168.1.100 访问 3306
firewall-cmd --zone=public --add-rich-rule='rule family="ipv4" source address="192.168.1.100" port port="3306" protocol="tcp" accept' --permanent
# 拒绝某个 IP 的所有流量
firewall-cmd --zone=public --add-rich-rule='rule family="ipv4" source address="10.0.0.5" reject' --permanent
# 查看 / 移除富规则
firewall-cmd --zone=public --list-rich-rules
firewall-cmd --zone=public --remove-rich-rule='rule family="ipv4" source address="192.168.1.100" port port="3306" protocol="tcp" accept' --permanent
```

## 排错 FAQ

**Q：命令敲了外网还是连不上？**
先确认两点：规则是否带了 `--permanent` 且已 `--reload`；网卡到底在哪个 Zone（`firewall-cmd --get-active-zones`）。再 `firewall-cmd --zone=public --list-ports` 看端口确实在里面。

**Q：改完重启规则没了？**
漏了 `--permanent`，或改了永久配置没 `--reload`。运行时配置重启即失，这是设计如此。

**Q：端口转发不生效？**
跨主机转发忘开 `--add-masquerade` 是最常见的坑，回包地址不对导致三次握手失败。

**Q：怎么应急锁死所有入站？**
`firewall-cmd --panic-on` 会拒绝一切入站（仅本机可操作），`--panic-off` 解除。

**Q：服务和端口有什么区别？**
服务是 firewalld 预定义的"一组端口 + 辅助配置"的别名（如 `http`=80/tcp），端口是裸的协议/端口号。开放 `http` 服务比手动写 `80/tcp` 更语义化，也便于统一管理。

## 相关工具

- [Firewalld 命令生成器](/tools/security/firewalld)：可视化生成上述所有命令，并内置常用命令速查。
- [安全常见端口](/tools/security/security-ports)：排错时快速确认端口对应的服务与风险。
- [Linux 常用命令](/tools/security/linux-commands)：系统/网络/权限等配套运维命令。
