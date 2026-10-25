---
title: 'Windows 补丁漏洞审计：贴一段 systeminfo，立刻看出缺了哪些提权补丁'
toolId: 'windows-patch-audit'
category: 'security'
description: '讲解如何用 systeminfo 的输出来反推一台 Windows 主机缺失的提权 / 远程代码执行补丁：解析 OS 名称、Build 号与已装 KB 列表，比对漏洞库，列出仍暴露在已知 CVE 下的风险点，并说明它和 PowerUp / winpeas 配置类排查的互补关系，仅用于授权安全评估'
keywords: [Windows补丁, 漏洞审计, systeminfo, 提权漏洞, CVE, KB补丁, 补丁缺失, EoP, RCE, 权限提升, 安全自查]
author: 开发工具箱
date: 2026-10-25
updated: 2026-10-25
phase: 1
relatedTools: [intranet-pentest, windows-commands, linux-privesc, emergency-response]
relatedTutorials: [intranet-pentest]
---

## 一台 Windows 主机，怎么 30 秒看出它缺了哪些提权补丁？

前阵子帮朋友看一台老服务器，他只知道「好像很久没更新了」，但说不清到底缺哪几个补丁。其实只要一条 `systeminfo` 的输出，就能反推出这台机器暴露在哪些已知提权漏洞下。这篇就讲怎么把这条命令变成一份「漏洞体检报告」。

站里对应的 [Windows 补丁漏洞审计](/tools/security/windows-patch-audit) 工具干的正是这件事：把 systeminfo 粘进去，它自动解析已安装的补丁（KB）列表和系统版本，比对内置漏洞库，列出仍缺失的已知提权 / 远程代码执行补丁。这篇负责把背后的逻辑讲清楚。

> 再次强调：以下一切操作，**只可用于你拥有合法授权的资产自查与授权安全评估**。把漏洞审计用于未授权目标是违法的，本教程与工具不承担任何滥用后果。

## systeminfo 里到底藏着什么

在目标 Windows 上跑一条 `systeminfo`（或 `systeminfo > si.txt` 存成文件），输出里最关键的就三样东西：

| 字段 | 中英文表头 | 审计里的用处 |
|---|---|---|
| 操作系统名称 | `OS 名称` / `OS Name` | 判断是 Win10 / Win11 / Server，决定哪些 CVE 适用 |
| 版本与 Build 号 | `OS 版本` / `OS Version` | 如 `10.0.18363 … Build 18363`，用于更精细的版本过滤 |
| 已装修补程序 | `修补程序` / `Hotfix(s)` | 列出形如 `KB5001234` 的补丁，这是比对的核心 |

一段真实的输出长这样（节选）：

```text
Host Name:                 DESKTOP-TEST
OS Name:                   Microsoft Windows 10 Pro
OS Version:                10.0.18363 N/A Build 18363
System Type:               x64-based PC
Hotfix(s):                 2 Hotfix(s) Installed.
                           [01]: KB4498523
                           [02]: KB4507455
```

注意最后两行：这台机器**只装了两个 KB**。这意味着大量修复提权漏洞的补丁它都没打——下面我们就是用这个信号来反推风险。

## 核心思路：没装的补丁 = 没堵上的洞

微软每个安全更新都对应一个或多个 CVE，而更新又用一个 KB 编号来标识。于是存在一条链路：

**CVE → 修复它的 KB → 这台机器装没装这个 KB → 没装就还暴露在该漏洞下**

只要有一份「CVE ↔ 修复 KB ↔ 适用系统/版本」的映射库，就能从 systeminfo 反推出：哪些已知漏洞的补丁这台机器没装。这正是社区工具 wesng（Windows Exploit Suggester - Next Generation）的思路，本工具把它搬到了浏览器里，数据不出本机。

整个流程见下图——从输入到输出一共五步：

<figure class="dg-figure" data-interval="2100" data-steps='[{"t":"① 输入 systeminfo","d":"把目标的 systeminfo 输出粘贴进来，或上传 .txt，中英文都认。"},{"t":"② 解析提取","d":"拆出三样东西：操作系统名称、OS Build 号、已安装的补丁 KB 列表。"},{"t":"③ 按系统过滤","d":"用 OS 名称 + Build 号，先把明显不适用本机的 CVE 筛掉。"},{"t":"④ 逐条比对补丁","d":"对剩下的每条 CVE，看它的修复 KB 有没有在已装列表里；任意一个已装即视为已修补。"},{"t":"⑤ 输出命中漏洞","d":"没装补丁的漏洞被列出，并按「有公开 EXP」优先排序，给出建议安装的补丁号。"},{"t":"结论：潜在提权 / RCE 点","d":"这些就是补丁维度上的可乘之机；配置类弱点交给 PowerUp / winpeas，两者互补。"}]'>
<svg viewBox="0 0 820 540" role="img" aria-label="Windows 补丁漏洞审计流程：systeminfo 输入、解析、按系统过滤、逐条比对补丁、输出命中漏洞" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker><marker id="m1p" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" style="fill:var(--color-primary);fill-opacity:.85"/></marker></defs>
<g class="dg-pop" data-step="0">
<rect class="dg-box-p" x="130" y="24" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="46" r="15"/><text class="dg-op" x="165" y="46">1</text>
<text class="dg-tb" text-anchor="start" x="195" y="42">输入 systeminfo</text><text class="dg-ts" text-anchor="start" x="195" y="60">粘贴命令输出或上传 .txt，中英文均可</text>
</g>
<g data-step="1" data-flow="1"><path class="dg-line" d="M410,68 V107" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="1">
<rect class="dg-box" x="130" y="110" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="132" r="15"/><text class="dg-op" x="165" y="132">2</text>
<text class="dg-tb" text-anchor="start" x="195" y="128">解析提取</text><text class="dg-ts" text-anchor="start" x="195" y="146">拆出 OS 名称 · Build 号 · 已装 KB 列表</text>
</g>
<g data-step="2" data-flow="1"><path class="dg-line" d="M410,154 V193" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="2">
<rect class="dg-box" x="130" y="196" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="218" r="15"/><text class="dg-op" x="165" y="218">3</text>
<text class="dg-tb" text-anchor="start" x="195" y="214">按系统过滤</text><text class="dg-ts" text-anchor="start" x="195" y="232">用 OS 名称 + Build 筛掉不适用本机的 CVE</text>
</g>
<g data-step="3" data-flow="1"><path class="dg-line" d="M410,240 V279" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="3">
<rect class="dg-box" x="130" y="282" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="304" r="15"/><text class="dg-op" x="165" y="304">4</text>
<text class="dg-tb" text-anchor="start" x="195" y="300">逐条比对补丁</text><text class="dg-ts" text-anchor="start" x="195" y="318">某 CVE 的修复 KB 任意一个已装 → 视为已修补</text>
</g>
<g data-step="4" data-flow="1"><path class="dg-line" d="M410,326 V365" marker-end="url(#m1)"/></g>
<g class="dg-pop" data-step="4">
<rect class="dg-box" x="130" y="368" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="390" r="15"/><text class="dg-op" x="165" y="390">5</text>
<text class="dg-tb" text-anchor="start" x="195" y="386">输出命中漏洞</text><text class="dg-ts" text-anchor="start" x="195" y="404">未装补丁者列出，按「有公开 EXP」优先排序</text>
</g>
<g data-step="5" data-flow="1"><path class="dg-line-p" d="M410,412 V451" marker-end="url(#m1p)"/></g>
<g class="dg-pop" data-step="5">
<rect class="dg-box-g" x="130" y="454" width="560" height="44" rx="9"/>
<circle class="dg-xor" cx="165" cy="476" r="15"/><text class="dg-op" x="165" y="476">✓</text>
<text class="dg-tb" text-anchor="start" x="195" y="472">结论：潜在提权 / RCE 点</text><text class="dg-ts" text-anchor="start" x="195" y="490">配置类弱点交给 PowerUp / winpeas，两者互补</text>
</g>
</svg>
<figcaption>图 1：Windows 补丁漏洞审计的完整流程。从 systeminfo 输入开始，依次解析、按系统过滤、逐条比对补丁，最后输出仍缺失的提权 / 远程代码执行补丁，并按「有公开 EXP」优先排序。点上面的「播放」可以看每一步是怎么推进的。</figcaption>
</figure>

逐步说明：

1. **输入**：粘贴或上传 systeminfo。中英文输出都认，KB 号按 `KB\d+` 正则提取。
2. **解析**：拆出操作系统名称、Build 号、已装 KB 集合。Build 号优先取 `Build 18363` 这种写法，其次退而取 `10.0.18363` 里的第三段。
3. **过滤**：用 OS 名称 + Build 把明显不适用本机的 CVE 先剔除。比如 SMBGhost 只影响 Build 18362/18363（Win10 1903/1909），Zerologon 只命中域控（Windows Server）。
4. **比对**：对剩下的每条 CVE，看它的修复 KB 列表里有没有任意一个已在已装集合里——只要装了一个，就认为该漏洞已修补。
5. **输出**：没装补丁的漏洞被列出，并标出类型（提权 EoP / 远程代码执行 RCE）、是否有公开利用、以及建议安装的补丁号，按「有公开 EXP」优先排序。

## 补丁缺失型，不等于全部 —— 它和 PowerUp 是什么关系

很多人会问：那无引号服务路径、可写服务、AlwaysInstallElevated 这些，工具怎么不报？答案是——它们根本不在 systeminfo 里，属于另一条排查路径。两者关系见下图：

<figure class="dg-figure">
<svg viewBox="0 0 820 360" role="img" aria-label="补丁缺失型漏洞与本工具、配置类弱点与 PowerUp/winpeas 的互补关系" text-anchor="middle" dominant-baseline="central">
<defs><marker id="m2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 Z" fill="currentColor" fill-opacity=".55"/></marker></defs>
<g>
<rect class="dg-box-p" x="24" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="204" y="80">补丁缺失型漏洞</text>
<text class="dg-ts" x="44" y="108" text-anchor="start">代表：SMBGhost / PrintNightmare / EternalBlue</text>
<text class="dg-ts" x="44" y="130" text-anchor="start">检测：比对已装 KB 是否缺了修复补丁</text>
<text class="dg-ts" x="44" y="152" text-anchor="start">触发：补丁没打，漏洞就还在</text>
<text class="dg-ts" x="44" y="174" text-anchor="start">工具：Windows 补丁漏洞审计</text>
</g>
<g>
<rect class="dg-box-a" x="436" y="50" width="360" height="210" rx="10"/>
<text class="dg-tb" x="616" y="80">配置类弱点</text>
<text class="dg-ts" x="456" y="108" text-anchor="start">代表：无引号服务路径 / 可写服务 / AlwaysInstallElevated</text>
<text class="dg-ts" x="456" y="130" text-anchor="start">检测：枚举系统配置与权限</text>
<text class="dg-ts" x="456" y="152" text-anchor="start">触发：配置不当，与补丁无关</text>
<text class="dg-ts" x="456" y="174" text-anchor="start">工具：PowerUp / winpeas</text>
</g>
<g><path class="dg-line" d="M204,260 V292" marker-end="url(#m2)"/><path class="dg-line" d="M616,260 V292" marker-end="url(#m2)"/></g>
<g>
<rect class="dg-box-g" x="170" y="296" width="480" height="44" rx="9"/>
<text class="dg-tb" x="410" y="314">两者互补：补丁维度 + 配置维度都查</text>
<text class="dg-ts" x="410" y="332">才是完整的 Windows 提权面排查</text>
</g>
</svg>
<figcaption>图 2：补丁缺失型漏洞与配置类弱点是两条不同的排查路径。前者看「补丁打没打」，后者看「配置对不对」，互不替代。本工具覆盖前者，PowerUp / winpeas 覆盖后者，组合起来才完整。</figcaption>
</figure>

简单说：本工具负责「**补丁维度**」——哪些已知 CVE 因为没打补丁还敞着口；PowerUp（Windows）/ linpeas（Linux）负责「**配置维度**」——服务路径、计划任务、SUID 这些写错的地方。打点提权时两条路都要走，缺一个都可能漏掉最顺手的那个口子。如果你对 PowerUp 和 linpeas 里那些检查函数到底是干什么的感兴趣，可以看 [内网渗透实战手册](/tutorials/intranet-pentest) 里「③ 权限提升」那一节。

## 亲手跑一遍：示例 systeminfo 会报出什么

回到开头那段 Win10 1909（Build 18363）、只装了 `KB4498523` 和 `KB4507455` 的输出。把它贴进工具点「开始分析」，会命中的典型漏洞包括：

- **CVE-2020-0796 SMBGhost**（RCE）：只影响 1903/1909（Build 18362/18363），修复补丁是 `KB4551762`，这台没装 → 命中。
- **CVE-2021-34527 PrintNightmare**（RCE）：影响全部受支持 Windows，修复补丁如 `KB5004945` 等，这台都没装 → 命中。
- **CVE-2021-36934 HiveNightmare**（EoP）：SAM 配置单元权限过宽，普通用户可读出哈希，修复补丁如 `KB5004945` / `KB5004238`，这台没装 → 命中。
- **CVE-2017-0143 EternalBlue**（RCE）：SMBv1 远程代码执行，修复补丁如 `KB4012212`，这台没装 → 命中。
- 以及 **MSHTML（CVE-2021-40444）、CLFS 系列、Win32k 系列** 等多个提权 / RCE——它们各自的修复 KB 这台机器全都没装。

工具不会把 13 个一股脑甩给你，而是按「有公开 EXP」优先排序，并把每个漏洞**建议安装的补丁号**直接列出来，一个按钮就能复制。这样你拿到结果的第一反应不是「这都啥」，而是「先去装 KB4551762、KB5004945……」。

想自己试，把下面这段存成 `si.txt` 直接上传，或粘进工具点「填入示例」即可（工具自带示例就是它）：

```text
Host Name:                 DESKTOP-TEST
OS Name:                   Microsoft Windows 10 Pro
OS Version:                10.0.18363 N/A Build 18363
System Type:               x64-based PC
Hotfix(s):                 2 Hotfix(s) Installed.
                           [01]: KB4498523
                           [02]: KB4507455
```

## 怎么用这个工具（三步）

1. **取数据**：在目标 Windows 上运行 `systeminfo` 或 `systeminfo > si.txt`，把输出拿回来。
2. **粘进去**：打开 [Windows 补丁漏洞审计](/tools/security/windows-patch-audit)，粘贴 / 上传 / 点「填入示例」，点「开始分析」。
3. **读结果 + 更新库**：看命中的 CVE、点官方公告链接确认细节、按「建议安装」的补丁号去打；库过期时点「更新数据」刷新。

工具的「更新数据」给你三种刷新方式：填一个最新数据库 JSON 地址直接拉取、导入本地 JSON 文件、或一键「恢复内置」。数据库格式和内置结构一致（每条含 CVE 编号、标题、类型、修复 KB 列表、适用系统），你也可以自己维护一份更全的库。

## 数据从哪来、准不准

内置库是一份**精选静态快照**，只收录「有公开提权 / 远程代码执行利用」且「能凭 systeminfo 的 KB 列表判断是否缺失」的 Windows 操作系统级漏洞（内核、打印后台处理、SMB、CLFS、Win32k 等）。之所以聚焦这一类，是因为它们对「打点拿权限」最直接，也最容易被 systeminfo 这一个输入就识别出来。

但有两件事它**做不到**，要心里有数：

- 它查不出**配置类弱点**（无引号服务路径、可写服务等）——那是 PowerUp 的活，见上文图 2。
- 它不能替代完整漏扫器，只是「补丁维度」的快速体检。

## 常见问题（FAQ）

**Q：工具说「缺 KB」就一定是漏洞吗？**
不一定。两种情况下会误报：①某些累积更新 / 服务栈更新把多个修复合在一起，KB 号不同但已包含该修复；②漏洞仅在特定配置下可利用（比如需要某个服务开启）。所以结果要结合官方公告判断，工具给出的是「疑似未修补」清单，不是板上钉钉的利用点。

**Q：为什么只报提权（EoP）和 RCE，不报别的？**
因为这两类对拿权限最直接、危害最大，也是红队 / 蓝队最关心的。信息泄露、拒绝服务类通常不在「打点提权」的考量里，报了反而淹没重点。

**Q：配置类弱点（无引号服务路径、可写服务）为什么查不到？**
那是配置维度，不是补丁维度。systeminfo 看不出服务路径有没有空格、注册表里有没有 AlwaysInstallElevated。这类交给 PowerUp / winpeas（[内网渗透教程](/tutorials/intranet-pentest) 有详解）。本工具和它们互补，不是取代。

**Q：中文版 systeminfo 能识别吗？**
能。解析时同时兼容中英文表头（`OS 名称` / `OS Name`、`修补程序` / `Hotfix`），KB 号按 `KB\d+` 提取，跟输出语言无关。

**Q：数据库多久更新一次？怎么保持新？**
内置是精选快照。点「更新数据」可填入最新数据库 JSON 地址拉取，或导入本地 JSON；红队也可以自己维护一份更全的库，格式与内置结构一致。

**Q：这跟 wesng、Windows-Exploit-Suggester 什么关系？**
思路一样——「吃 systeminfo，吐缺失补丁」。区别是它跑在浏览器里、数据不出本机，且只聚焦有公开 EXP 的提权 / RCE，避免被一堆低相关 CVE 淹没。

## 相关工具

- [Windows 补丁漏洞审计](/tools/security/windows-patch-audit)：本篇配套工具，粘 systeminfo 出缺失补丁清单
- [内网渗透命令生成器](/tools/security/intranet-pentest)：提权阶段的 PowerUp / linpeas 用法与命令库（含权限提升章节）
- [Windows 常用命令](/tools/security/windows-commands) / [Linux 提权枚举](/tools/security/linux-privesc)：命令语法速查
- [应急响应工具箱](/tools/security/emergency-response)：授权测试结束后的复盘与加固参考
