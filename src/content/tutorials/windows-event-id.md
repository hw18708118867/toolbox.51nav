---
title: 'Windows 事件 ID 速查：从一条 4624 开始，把安全日志读明白'
toolId: 'windows-event-id'
category: 'security'
description: '讲清 Windows 事件日志的通道、事件 ID 与字段三件事：用一段真实的 4624 记录逐字段拆解，给出 Logon Type 对照、高频 ID 分组、审计策略前提与日志被清后的旁路取证，附 wevtutil 与 Get-WinEvent 命令，仅用于授权范围内的安全排查'
keywords: [Windows事件ID, 事件ID速查, 安全日志, '4624', '4625', '4688', '7045', '1102', LogonType, wevtutil, Get-WinEvent, 应急响应, 日志分析, Sysmon]
author: 开发工具箱
date: 2026-11-04
updated: 2026-11-04
phase: 1
relatedTools: [system-log-analyzer, emergency-response, windows-commands, powershell-commands, windows-patch-audit]
relatedTutorials: [system-log-analyzer, windows-patch-audit, emergency-response]
---

## 一条告警，翻了四十分钟日志才明白自己看错了地方

上周帮同事看一台文件服务器，监控说凌晨三点有异常登录。他打开事件查看器，Security 里几千条记录，从头拉到尾也没找出「哪条是攻击」。我让他别翻了，先回答三个问题：这条告警落在哪个日志通道？事件 ID 是多少？ID 下面那些字段写了什么？

十分钟就定位完了：3:12 有一批 4625，3:14 同一个源 IP 出现一条 4624，LogonType 是 3，紧接着一条 4672。他之前一直在 System 日志里找，方向就错了。

站里的 [Windows 事件 ID 速查](/tools/security/windows-event-id) 就是为这种时刻做的：把 ID 输进去，立刻告诉你它叫什么、在哪个通道、关键字段有哪些、该用什么命令去查。这篇把背后的读法讲清楚，下次不用靠死记编号。

> 以下操作只可用于你拥有合法授权的资产排查。日志里常有账号、IP、内部主机名，导出和转发都要走合规流程。

## 先分清三件事：通道、ID、字段

新手最容易卡在「我搜了 4624，为什么什么都没有」，答案通常是通道选错了。

| 概念 | 是什么 | 常踩的坑 |
|---|---|---|
| 日志通道 | 事件存在哪个 LogName 里 | 「Windows 日志」下的 Security / System / Application，和「应用程序和服务日志」里那一堆 `Microsoft-Windows-*/Operational` 是两套东西 |
| 事件 ID | 某个通道内的一类事件的编号 | **不是全局唯一**，换个通道同一个数字含义可能完全不同 |
| 字段 | 事件消息 / XML 里的具体内容 | 结论全在字段里，光知道 ID 等于什么都没查 |

举个我见过的真实误会：有人看到 `21` 就以为是「RDP 会话登录成功」，结果那台机器上装了 Sysmon，21 在 Sysmon 通道里是 WMI 使用者绑定筛选器——完全是另一回事。同理 `104` 在 System 是日志文件被清除，`1102` 在 Security 是安全日志被清除，别混着查。

通道名要写全。`Get-WinEvent` 认的是 `Microsoft-Windows-TerminalServices-LocalSessionManager/Operational` 这种完整字符串，写个 `RDP` 它不认识。

完整流程见下图，从收到告警到能下结论，一共六步：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"收到告警","d":"一条凌晨异常登录提示，或者一个从没见过的事件 ID。先别急着翻日志。"},{"t":"确认日志通道","d":"判断该去 Security、System、Application，还是某个 Operational 通道找。找错通道是最常见的白费功夫。"},{"t":"按事件 ID 筛选","d":"4624 成功登录、4625 失败、1102 日志被清；用 ID 把范围缩到几十条。"},{"t":"读关键字段","d":"账户、LogonType、源 IP、进程命令行。研判依据在这里，不在 ID 里。"},{"t":"关联其它 ID","d":"成功登录后紧跟着的 4672、4688、7045，才是判断有没有失陷的重点。"},{"t":"结论与处置","d":"先只读导出保全日志，再判断是正常运维还是入侵；别在目标机上反复翻查覆盖证据。"}]'>
<svg viewBox="0 0 820 540" role="img" aria-label="Windows 事件日志分析流程：收到告警、确认通道、按 ID 筛选、读字段、关联其它 ID、结论与处置" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="130" y="24" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="46" r="15"/><text class="dg-op" x="165" y="46">1</text>
<text class="dg-tb" text-anchor="start" x="195" y="42">收到告警</text><text class="dg-ts" text-anchor="start" x="195" y="60">凌晨异常登录提示，或一个没见过的事件 ID</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M410,68 V107" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="130" y="110" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="132" r="15"/><text class="dg-op" x="165" y="132">2</text>
<text class="dg-tb" text-anchor="start" x="195" y="128">确认日志通道</text><text class="dg-ts" text-anchor="start" x="195" y="146">Security / System / Application，还是某个 Operational 通道</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M410,154 V193" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="130" y="196" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="218" r="15"/><text class="dg-op" x="165" y="218">3</text>
<text class="dg-tb" text-anchor="start" x="195" y="214">按事件 ID 筛选</text><text class="dg-ts" text-anchor="start" x="195" y="232">4624 登录成功 · 4625 失败 · 1102 日志被清</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M410,240 V279" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="130" y="282" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="304" r="15"/><text class="dg-op" x="165" y="304">4</text>
<text class="dg-tb" text-anchor="start" x="195" y="300">读关键字段</text><text class="dg-ts" text-anchor="start" x="195" y="318">账户 · LogonType · 源 IP · 进程命令行，答案都在这里</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M410,326 V365" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="130" y="368" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="390" r="15"/><text class="dg-op" x="165" y="390">5</text>
<text class="dg-tb" text-anchor="start" x="195" y="386">关联其它 ID</text><text class="dg-ts" text-anchor="start" x="195" y="404">成功登录后的 4672 / 4688 / 7045 才是重点</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M410,412 V451" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="130" y="454" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="476" r="15"/><text class="dg-op" x="165" y="476">✓</text>
<text class="dg-tb" text-anchor="start" x="195" y="472">结论与处置</text><text class="dg-ts" text-anchor="start" x="195" y="490">先只读导出保全日志，再判断是运维操作还是失陷</text>
</g>
</svg>
<figcaption>图 1：读一条 Windows 事件日志的完整流程。从告警出发，先定通道、再按 ID 缩小范围、逐字段研判，最后关联其它事件得出结论。点上面的「播放」可以看每一步是怎么推进的。</figcaption>
</figure>

## 亲手拆一条 4624

把事件 XML 里的关键字段挑出来，那条凌晨的登录长这样：

```text
TimeCreated      : 2026/11/4 3:14:07
Id               : 4624
LogName          : Security
TargetUserName   : backupsvc
SubjectUserName  : WIN-FILE01$
LogonType        : 3
IpAddress        : 10.20.8.77
WorkstationName  : WIN-AD01
```

一个字段一个字段看：

- `TargetUserName` 是**被登录的账号**，这里是备份服务账号。
- `SubjectUserName` 是发起方，`WIN-FILE01$` 结尾带 `$` 说明是本机机器账户，这种写法本身正常。
- `LogonType = 3` 最关键：网络登录。来源通常是 SMB 共享、WinRM、psexec、wmic 这一类，**不是有人坐到键盘前**。
- `IpAddress` 和 `WorkstationName` 是溯源用的一组信息，拿它去反查同时间段的 4625，就能看出前面有没有爆破。

Logon Type 建议直接背下来，它决定了「这条登录到底算什么」：

| 类型 | 名称 | 典型场景 |
|---|---|---|
| 2 | Interactive | 本地键盘 / 控制台登录 |
| 3 | Network | SMB 共享、IPC$、psexec、wmic、WinRM |
| 4 | Batch | 计划任务以批处理方式启动 |
| 5 | Service | 服务以服务账户启动 |
| 7 | Unlock | 解锁锁屏 |
| 8 | NetworkCleartext | 明文口令网络登录（如 IIS 基本认证） |
| 9 | NewCredentials | `runas /netonly` 等凭据替换 |
| 10 | RemoteInteractive | RDP / 远程桌面 |
| 11 | CachedInteractive | 域控不可达时用缓存凭据离线登录 |

Type 5 我曾经误判过一次：一堆 4624 看着吓人，其实全是服务启动。把 Type 和账户名一起看，基本就能把这类噪音筛掉。

接下来查后续动作，这里又有个坑——**7045 不在 Security 里，在 System 里**，一条命令跨通道查是查不到的：

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security'; Id=4672,4688} -MaxEvents 20 | Format-List TimeCreated, Id, Message
wevtutil qe System /q:"*[System[(EventID=7045)]]" /f:text /c:10
```

前者看这个会话有没有拿到特权、起了什么进程；后者看有没有新服务被装上。三分钟之内出现这三条，基本就不是误报了。

## 高频 ID 按场景记，比按编号记快得多

工具里收了 130 条、分成 13 类，现场真正反复用的其实就这些：

| 场景 | 事件 ID | 日志通道 | 一眼要看的字段 |
|---|---|---|---|
| 登录成功 / 失败 | 4624 / 4625 | Security | LogonType、IpAddress、Status |
| 显式凭据、横向移动 | 4648 | Security | TargetServerName、ProcessName |
| 高权限登录 | 4672 | Security | PrivilegeList |
| 新建账号 / 加入管理员组 | 4720 / 4732 | Security | SubjectUserName、TargetUserName |
| 进程创建 | 4688 | Security | CommandLine、ParentProcessName |
| 服务安装 | 7045 | System | ServiceFileName |
| 计划任务创建 / 被改 | 4698 / 4702 | Security | TaskContent 里的命令行 |
| PowerShell 脚本内容 | 4104 | PowerShell/Operational | ScriptBlockText |
| 安全日志被清 | 1102 | Security | SubjectUserName（谁清的） |
| 审计策略被改 | 4719 | Security | AuditPolicyChanges |
| MSI 软件安装 | 1033 / 11707 | Application | Product Name、状态 |
| 补丁安装结果 | 19 / 20 | WindowsUpdateClient/Operational | KB 号、错误码 |
| 进程 / 网络连接 | 1 / 3 | Sysmon/Operational | Image、DestinationIp |

搜索的时候不必只输数字。工具里输「清除」能带出 1102、104、4719 一整组；输 `logon` 能带出英文原名里带这个词的条目；输 `Sysmon 注入` 这种两个词的组合，会要求两个词都命中，范围一下就收窄了。

## 主日志没了，还有哪些地方留着痕迹

攻击者清日志，通常只清 Security。下面这张图左边是我见过最常混淆的两组编号，右边是 Security 被清之后还能查的旁路通道：

<figure class="dg-figure">
<svg viewBox="0 0 820 370" role="img" aria-label="事件 ID 不全局唯一，以及 Security 日志被清后仍可查的旁路通道" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g>
<rect class="dg-box-p" x="24" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="204" y="80">编号不全局唯一，先看通道</text>
<text class="dg-ts" x="44" y="112" text-anchor="start">104 → System 日志被清除</text>
<text class="dg-ts" x="44" y="136" text-anchor="start">1102 → Security 日志被清除</text>
<text class="dg-ts" x="44" y="160" text-anchor="start">21 → RDP 会话登录成功（TS 通道）</text>
<text class="dg-ts" x="44" y="184" text-anchor="start">21 → WMI 订阅绑定（Sysmon 通道）</text>
<text class="dg-ts" x="44" y="216" text-anchor="start">同一个数字，换个 LogName 含义就变了</text>
</g>
<g>
<rect class="dg-box-a" x="436" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="616" y="80">Security 被清，旁路还在</text>
<text class="dg-ts" x="456" y="112" text-anchor="start">RDP 会话通道：21 / 25 / 1149</text>
<text class="dg-ts" x="456" y="136" text-anchor="start">PowerShell：4104 脚本块原文</text>
<text class="dg-ts" x="456" y="160" text-anchor="start">Sysmon：1 进程 / 3 连接 / 13 注册表</text>
<text class="dg-ts" x="456" y="184" text-anchor="start">WMI-Activity、TaskScheduler、DNS</text>
<text class="dg-ts" x="456" y="216" text-anchor="start">1102 本身会记下是谁清的日志</text>
</g>
<g><path class="dg-line" d="M204,260 V292" marker-end="url(#m2)"/><path class="dg-line" d="M616,260 V292" marker-end="url(#m2)"/></g>
<g>
<rect class="dg-box-g" x="170" y="296" width="480" height="44" rx="9"/>
<text class="dg-tb" x="410" y="314">先导出保全，再换通道继续查</text>
<text class="dg-ts" x="410" y="332">wevtutil epl Security C:\Temp\Security.evtx</text>
</g>
</svg>
<figcaption>图 2：事件 ID 必须和日志通道一起看，同一个数字在不同通道含义可能完全不同；而 Security 被清空（1102）时，RDP、PowerShell、Sysmon 等旁路通道往往还留有证据。</figcaption>
</figure>

`wevtutil epl` 那条是只读导出，不会有写操作干扰原件。我习惯先把 evtx 拷出来再分析，理由很实在：在目标机上反复查询本身会产生新日志，还可能推动日志覆盖旧记录。

## 这些 ID 默认不一定有，别白找

查不到记录，先怀疑审计没开，再怀疑「没发生」。

- **4688 的命令行**：默认不记录。组策略里要开两处——`计算机配置 → Windows 设置 → 安全设置 → 高级审核策略 → 详细跟踪 → 审核进程创建`，以及 `管理模板 → 系统 → 审核进程创建 → 在进程创建事件中包含命令行`。
- **4663 对象访问**：要给目标文件 / 目录配 SACL，否则不会有人替你记。
- **4104 脚本块日志**：要单独开启 PowerShell 脚本块日志记录。
- **Sysmon 全系列**：得自己装 Sysmon 并加载配置，系统不会自带。

先看当前状态：

```powershell
auditpol /get /category:*
```

软件安装也是同一个道理：Application 日志里 `MsiInstaller` 的 1033 / 1034 只覆盖 MSI 安装包，绿色软件、自解压 exe、脚本投递压根不会产生安装事件。这类落地只能靠 4688、Sysmon 的 1 / 11、卸载注册表项和 Amcache 一起还原。工具里专门写了这条提示，就是怕有人查完 1033 没结果就下结论说「没装过东西」。

## 常见问题（FAQ）

**Q：出现 4624 就是被入侵了吗？**
远不是。Type 5 是服务启动，Type 3 常来自备份、监控、漏洞扫描，公网机器每天还有大量 4625。要看账户是不是与该 IP 平时匹配、时间段对不对、之后有没有 4688 / 7045 这类动作。单条 ID 定不了案。

**Q：为什么我查 4688 只有进程名，没有命令行？**
命令行默认不进日志，按上一节把「在进程创建事件中包含命令行」打开。已经发生的事没法补，只能事前配置。

**Q：`wevtutil` 和 `Get-WinEvent` 用哪个？**
我两个都用。CMD 里导出、按 XPath 快速筛用 `wevtutil`；需要按账户、按字段过滤、格式化输出时用 `Get-WinEvent` 更顺手。工具把每条 ID 的两种命令都生成好了，直接复制即可。

**Q：事件 ID 会随 Windows 版本变吗？**
ID 本身比较稳定，但字段会增减，个别消息的措辞也会变。碰到对不上的，以本机事件 XML 为准，再去微软文档核对，不要硬套网上抄来的字段表。

**Q：日志被清了还能查什么？**
看图 2 右边那几行。另外 1102 事件本身会记下清除者账号，别把它当成「到此为止」。

**Q：中文系统能查吗？**
事件 ID、通道名、字段名跟显示语言无关，消息正文可能变成中文，但 ID 和字段结构不变。工具里的中文说明和英文原名都参与了搜索，输哪种都能命中。

**Q：这跟系统日志分析器有什么区别？**
这里解决「这个 ID 是什么意思」；[系统日志分析器](/tools/security/system-log-analyzer) 解决「按什么顺序把一堆日志串成一条攻击链」。查完编号接着走流程，正好接上，[那篇教程](/tutorials/system-log-analyzer) 里有个完整的爆破例子。

## 相关工具

- [Windows 事件 ID 速查](/tools/security/windows-event-id)：本篇配套工具，按 ID / 中英文关键词查含义、字段与命令
- [系统日志分析器](/tools/security/system-log-analyzer)：把 Windows 与 Linux 日志按场景串成分步分析流程
- [应急响应工具箱](/tools/security/emergency-response)：授权排查时的分阶段命令清单
- [Windows 常用命令](/tools/security/windows-commands) / [PowerShell 命令参考](/tools/security/powershell-commands)：命令语法速查
- [Windows 补丁漏洞审计](/tools/security/windows-patch-audit)：从 systeminfo 反推缺失补丁，[教程在这里](/tutorials/windows-patch-audit)
