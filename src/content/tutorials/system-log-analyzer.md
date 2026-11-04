---
title: '系统日志分析：把 Windows 和 Linux 的日志串成一条时间线'
toolId: 'system-log-analyzer'
category: 'security'
description: '以暴力破解、WebShell、横向移动等真实排查场景为线索，讲清 Windows 事件通道与 Linux /var/log 文件的对应关系、按步骤推进的日志分析流程、多源日志关联方法，以及时区、日志轮转与常见误报这些现场最容易踩的坑'
keywords: [系统日志分析, Windows日志, Linux日志, auth.log, secure, auditd, journalctl, 应急响应, 时间线, 关联分析, 日志溯源, 暴力破解, WebShell]
author: 开发工具箱
date: 2026-11-04
updated: 2026-11-04
phase: 1
relatedTools: [windows-event-id, emergency-response, windows-commands, linux-commands, tcpdump]
relatedTutorials: [windows-event-id, windows-patch-audit, emergency-response]
---

## 两台机器各查各的，三天后才发现是同一件事

去年碰到一桩挺典型的：一台 Linux Web 服务器半夜 CPU 飙高，运维那边盯着 `/var/log` 查；同一时间域控告警说有账号从内网 IP 登录 Windows 文件服务器，安全那边查 Security 日志。两边各写各的报告，三天没对上。

最后把时间统一到 UTC 再看，Linux 上那条 `Accepted publickey` 和 Windows 上的 4624 差了不到两分钟，中间只隔一个八小时时区的误会。日志都在，谁也没漏查，缺的是把它们串起来的方法。

站里的 [系统日志分析器](/tools/security/system-log-analyzer) 做的就是这件事：不是给你一堆命令，而是按场景给出「先看哪个日志、再查哪条记录、读到什么算异常、下一步往哪走」的完整流程，Windows 和 Linux 两侧始终并排放着。这篇讲清楚流程为什么要这么排。

> 以下操作只可用于你拥有合法授权的主机。日志里有账号、源 IP、内部主机名，导出和转发请按单位规定走。

## 找到一条记录，不等于查明白了

4624 只说明有人登录成功。auth.log 里的 `Accepted` 只说明 SSH 通了。这两条本身既不能证明入侵，也不能排除入侵。

真正要回答的是三个问题：这个会话**从哪来**、**之前发生了什么**、**之后做了什么**。翻译成日志语言就是「进入 → 动作 → 结果 / 清理」，每一段都落在不同文件里。所以现场别抱着一个日志翻到底，要按场景剧本推进：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"发现迹象","d":"告警、CPU 异常、陌生账号、一个说不清的时间点。先把现象和大致时间记下来。"},{"t":"选场景剧本","d":"按迹象选：爆破、异常登录、后门账户、WebShell、持久化、清痕、外连、勒索。"},{"t":"锁定日志源","d":"确定这台机器该查哪些通道 / 文件，并确认这些日志覆盖了案发时间。"},{"t":"双平台按步取数","d":"Windows 用 Get-WinEvent 读事件通道，Linux 用 grep、journalctl、ausearch 读日志文件。"},{"t":"关联成时间线","d":"统一时区，把两侧记录按分钟对齐，看动作是否接得上。"},{"t":"结论与处置","d":"先只读导出保全证据，再判断是运维操作还是失陷，最后决定遏制与恢复。"}]'>
<svg viewBox="0 0 820 540" role="img" aria-label="系统日志场景化分析流程：发现迹象、选剧本、锁定日志源、双平台取数、关联时间线、结论与处置" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="130" y="24" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="46" r="15"/><text class="dg-op" x="165" y="46">1</text>
<text class="dg-tb" text-anchor="start" x="195" y="42">发现迹象</text><text class="dg-ts" text-anchor="start" x="195" y="60">告警 · CPU 异常 · 陌生账号 · 一个说不清的时间点</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M410,68 V107" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="130" y="110" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="132" r="15"/><text class="dg-op" x="165" y="132">2</text>
<text class="dg-tb" text-anchor="start" x="195" y="128">选场景剧本</text><text class="dg-ts" text-anchor="start" x="195" y="146">爆破 · 异常登录 · WebShell · 持久化 · 清痕 · 外连</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M410,154 V193" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="130" y="196" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="218" r="15"/><text class="dg-op" x="165" y="218">3</text>
<text class="dg-tb" text-anchor="start" x="195" y="214">锁定日志源</text><text class="dg-ts" text-anchor="start" x="195" y="232">确认通道 / 文件，以及日志是否覆盖案发时间</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M410,240 V279" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box-a" x="130" y="282" width="270" height="44" rx="9"/>
<text class="dg-tb" x="265" y="300">Windows 侧取数</text><text class="dg-ts" x="265" y="318">Get-WinEvent 读事件通道</text>
<rect class="dg-box-a" x="420" y="282" width="270" height="44" rx="9"/>
<text class="dg-tb" x="555" y="300">Linux 侧取数</text><text class="dg-ts" x="555" y="318">grep / journalctl 读日志</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M410,326 V365" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="130" y="368" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="390" r="15"/><text class="dg-op" x="165" y="390">5</text>
<text class="dg-tb" text-anchor="start" x="195" y="386">关联成时间线</text><text class="dg-ts" text-anchor="start" x="195" y="404">统一时区，按分钟对齐，看动作是否接得上</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M410,412 V451" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="130" y="454" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="476" r="15"/><text class="dg-op" x="165" y="476">✓</text>
<text class="dg-tb" text-anchor="start" x="195" y="472">结论与处置</text><text class="dg-ts" text-anchor="start" x="195" y="490">先保全证据，再判断误报或失陷，最后遏制与恢复</text>
</g>
</svg>
<figcaption>图 1：场景化日志分析的六步流程。第 4 步是双平台并行的，Windows 查事件通道、Linux 查日志文件，之后必须汇到同一条时间线上。点上面的「播放」可以看每一步是怎么推进的。</figcaption>
</figure>

## 两套日志，其实是一一对应的

不用背两套体系，记住「想问的问题」就行：

| 要回答什么 | Windows | Linux |
|---|---|---|
| 谁登录成功 / 失败了 | Security：4624 / 4625 | `auth.log`（Debian）或 `secure`（RHEL）里的 Accepted / Failed |
| 失败登录有没有被删 | — | `/var/log/btmp`，用 `lastb` 读，二进制文件常被忽略 |
| 会话与重启历史 | 6005 / 6006 / 1074，RDP 通道 21 / 25 | `/var/log/wtmp`（`last`）、`lastlog` |
| 跑了什么命令 | Security 4688（需开命令行审计）、Sysmon 1 | `~/.bash_history`、`audit.log` 的 EXECVE |
| 连了哪里 | Sysmon 3 / 22（需装 Sysmon） | 默认不记录，靠 `ss -tunap` 抓现场或 auditd connect 规则 |
| 账号与组变了没 | 4720 / 4732 | auth.log 的 useradd / usermod、`/etc/passwd` 的 mtime |
| 有没有提权 | 4672 / 4732 | auth.log 的 sudo / su、`/etc/sudoers.d/` |
| 有没有留持久化 | 7045 / 4698 / 4702、Sysmon 13 | crontab、systemd unit、`authorized_keys` |
| 日志被动过吗 | 1102 / 104 / 4719 | 日志出现时间缺口、history 被清、auditd 被停 |
| 统一查询入口 | `Get-WinEvent`、`wevtutil` | `journalctl -u sshd --since ...` |

有件事得说在前面：**Linux 默认不记录进程命令行、网络连接和文件改写**。没有 auditd 规则的机器，事后能查的基本只有认证日志。Windows 的 4688 命令行、4663 对象访问、Sysmon 全系列同样要额外开启。事前配置比事后补救有用得多，这也是我每次做完复盘都要提的一条。

## 完整走一遍：暴力破解

拿工具里第一个剧本举例。现象是凌晨收到大量登录失败告警，目标是判断有没有得手。

**第一步，确认规模。** 两侧都先做聚合，别一上来就看明细：

```powershell
wevtutil qe Security /q:"*[System[(EventID=4625)]]" /f:text /c:20
```

```bash
grep -E "Failed password|Invalid user" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | head -10
```

Linux 那条聚合出来大概长这样：

```text
    412 10.20.8.77
     87 185.220.101.4
      3 10.20.8.12
```

412 次集中在 3:05 到 3:13，来源单一，是明确的爆破而不是零星输错。Windows 侧要读的是 `TargetUserName`、`IpAddress` 和 `Status`——`0xC000006A` 是密码错，`0xC0000234` 是账号已锁定。

**第二步，找失败之后的成功。** 整个剧本最关键的就是这一步：

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4624} -MaxEvents 100 | Where-Object { $_.Message -like "*10.20.8.77*" } | Format-List TimeCreated, Message
```

```bash
grep -E "Accepted (password|publickey)" /var/log/auth.log | tail -20
```

命中一条：

```text
Nov  4 03:14:07 web01 sshd[22841]: Accepted password for backupsvc from 10.20.8.77 port 54322 ssh2
```

3:14:07，正好是失败洪流结束前一分钟，账号是备份服务账号，IP 就是刚才那个爆破源。Windows 那边同一分钟的 4624 是 `LogonType=3`，后面紧跟 4672。**到这一步性质就变了**：从「有人在试密码」变成「凭据已经失陷」。

**第三步，看登录后做了什么。** Windows 查 4672、4688 和 System 里的 7045；Linux 查 sudo、audit.log 和 `lastlog`：

```bash
last -a | head -30; lastlog | grep -v "Never logged in"
```

`lastlog` 能揪出长期不用的账号突然登录。别急着改密码或删账号——先看清楚这个会话装了服务、建了任务还是加了组，否则清完一遍它还会回来。

**第四步，收口。** 输出三张清单：爆破源 IP、起止时间、被针对的账号；复核那条「最后一次失败紧跟着成功」；改口令、禁账号、限制来源；再看有没有扩散到同网段其它主机。工具把这个剧本的 Windows / Linux 命令打包成一个按钮，可以整段复制带走。

## 一条攻击链，在两套日志里长什么样

同一个动作会同时落在多个日志里，只看一个文件永远拼不出全貌。下面这张图把最常见的链路左右对照：

<figure class="dg-figure">
<svg viewBox="0 0 820 370" role="img" aria-label="同一条攻击链在 Windows 事件日志与 Linux 日志文件中的对应关系" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g>
<rect class="dg-box-p" x="24" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="204" y="80">Windows 事件链</text>
<text class="dg-ts" x="44" y="112" text-anchor="start">进入：4625 失败 → 4624 / 4672</text>
<text class="dg-ts" x="44" y="136" text-anchor="start">提权：4732 加组 → 4648 横向</text>
<text class="dg-ts" x="44" y="160" text-anchor="start">执行：4688 进程 → 4104 脚本</text>
<text class="dg-ts" x="44" y="184" text-anchor="start">驻留：7045 服务 → 4698 任务</text>
<text class="dg-ts" x="44" y="216" text-anchor="start">收尾：4719 关审计 → 1102 清日志</text>
</g>
<g>
<rect class="dg-box-a" x="436" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="616" y="80">Linux 日志链</text>
<text class="dg-ts" x="456" y="112" text-anchor="start">进入：Failed → Accepted（auth.log）</text>
<text class="dg-ts" x="456" y="136" text-anchor="start">提权：sudo / su → passwd 变更</text>
<text class="dg-ts" x="456" y="160" text-anchor="start">执行：EXECVE → 外连（audit.log）</text>
<text class="dg-ts" x="456" y="184" text-anchor="start">驻留：crontab → authorized_keys</text>
<text class="dg-ts" x="456" y="216" text-anchor="start">收尾：日志缺口 → history 被清</text>
</g>
<g><path class="dg-line" d="M204,260 V292" marker-end="url(#m2)"/><path class="dg-line" d="M616,260 V292" marker-end="url(#m2)"/></g>
<g>
<rect class="dg-box-g" x="170" y="296" width="480" height="44" rx="9"/>
<text class="dg-tb" x="410" y="314">对齐到同一时区，才是一条时间线</text>
<text class="dg-ts" x="410" y="332">journalctl --utc -u sshd --since "2026-11-04 00:00"</text>
</g>
</svg>
<figcaption>图 2：同一条攻击链在 Windows 事件日志和 Linux 日志文件里的对应形态。两侧各自都只是半张图，按时间对齐之后才能看出「进入 → 提权 → 执行 → 驻留 → 收尾」的完整过程。</figcaption>
</figure>

## 时间线对齐：现场最容易翻车的地方

开头那个三天没对上的例子，问题就出在这里。几条我踩过的：

**时区先统一。** 事件查看器显示本地时间，但导出的 evtx 和 `Get-WinEvent` 的 `TimeCreated` 是 UTC；`journalctl` 可以加 `--utc` 强制按 UTC 显示。跨主机关联前，把所有时间归一到同一时区，否则先后顺序会反过来。

**确认日志还在不在。** Linux 有 `auth.log.1`、`*.gz` 这些轮转文件，Windows 的 evtx 默认按大小覆盖旧记录。分析前先看一眼：

```bash
ls -la /var/log/auth.log*
```

「没查到记录」和「没发生过」是两回事，尤其案发在几周前的时候。

**别把正常行为当入侵。** 4624 的 `LogonType=5` 是服务启动；Type=3 常来自备份、监控、漏洞扫描；公网主机的 SSH 失败日志常年不断。要结合账户、来源 IP、时间段和后续动作一起看，单条日志定不了案。

**先保全，再分析。** 在目标机上反复查询本身会产生新日志、改动文件时间，甚至推动日志覆盖。我习惯第一步就只读导出：

```powershell
wevtutil epl Security C:\Temp\Security.evtx
```

```bash
tar czf /tmp/log_backup.tgz /var/log/ 2>/dev/null
```

**主日志被清，换旁路。** Security 被清（1102）时，RDP 会话通道、PowerShell 4104、Sysmon、TaskScheduler 往往还在；Linux 那边看 journald、`btmp` / `wtmp`、DNS 和防火墙日志。日志「突然变少」本身就是信号，把缺口的起止时间当作攻击窗口去查。

## 常见问题（FAQ）

**Q：这个工具能直接上传日志文件帮我分析吗？**
不能，也不打算这么设计。它是纯前端的流程与命令参考，日志不出本机——粘贴、检索、执行都在你自己的机器上完成。要查某个 ID 的含义，用配套的 [Windows 事件 ID 速查](/tools/security/windows-event-id)，[教程在这](/tutorials/windows-event-id)。

**Q：没装 Sysmon、没配 auditd，还能查出什么？**
能查认证与会话：谁在什么时候登录、失败了几次、有没有长期不用的账号突然活跃。但进程命令行、网络连接、文件改写基本查不到，这时要用 `ss -tunap` 抓现场、用文件 mtime 和备份对比，并补网络侧日志。事后能做的有限，所以事前配置更值钱。

**Q：Windows 和 Linux 的时间为什么总对不上？**
八成是时区。evtx 导出的 `TimeCreated` 是 UTC，syslog 多为本机本地时间，`journalctl` 默认也是本地时间但可 `--utc`。同一台机器还可能因为 NTP 漂移差几分钟，先拿一条双方都有的事件（比如同一个 NAT 出口的扫描记录）校准。

**Q：一个场景跑完就够了吗？**
按迹象选，通常要两三个剧本交叉。比如「爆破」查到成功登录后，接着要跑「异常登录与横向移动」看它去了哪，再跑「持久化排查」看留了什么。工具里八个场景就是按这个衔接关系排的。

**Q：和应急响应工具箱有什么区别？**
[应急响应工具箱](/tools/security/emergency-response) 是「选系统 → 选场景 → 分阶段处置命令清单」，偏处置动作和报告导出；这里偏**日志本身**：日志源地图、按步骤的研判流程、多源关联成时间线。排查时先按流程把事实查清楚，再去那边找处置命令。

**Q：日志被清空了怎么办？**
按图 2 右边那列换通道，加网络侧证据（DNS、防火墙、NetFlow、EDR）。另外 1102 事件本身会记下是谁清的，别把它当成终点。必要时上内存取证。

## 相关工具

- [系统日志分析器](/tools/security/system-log-analyzer)：本篇配套工具，八个场景的双平台分步流程与日志源速查
- [Windows 事件 ID 速查](/tools/security/windows-event-id)：查单个事件 ID 的含义、字段与查询命令
- [应急响应工具箱](/tools/security/emergency-response)：分阶段处置命令清单与报告导出
- [Windows 常用命令](/tools/security/windows-commands) / [Linux 常用命令](/tools/security/linux-commands)：命令语法速查
- [Windows 补丁漏洞审计](/tools/security/windows-patch-audit)：从 systeminfo 反推缺失补丁，[教程在这](/tutorials/windows-patch-audit)
