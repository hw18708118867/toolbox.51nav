---
title: "sqlmap 常用命令与参数详解"
toolId: sqlmap
category: security
description: "从零理解 sqlmap 的工作流程，掌握目标指定、注入技术、检测等级与风险、绕过 WAF、数据库枚举与拖库、OS 命令执行等核心参数，并能组合出实战命令"
keywords: [sqlmap, sqlmap命令, sqlmap参数, SQL注入, 脱库, 数据库枚举, 渗透测试, WAF绕过, 注入工具]
author: 开发工具箱
date: 2026-08-13
phase: 3
relatedTools: [sql-inject, nmap, msfvenom, reverse-shell, csp-generator]
relatedTutorials: [nmap]
---

> ⚠️ 本教程仅用于**授权渗透测试、漏洞验证和自身资产的安全自查**。对未授权系统进行 SQL 注入扫描与拖库可能违反法律法规并构成犯罪。sqlmap 是攻击者常用的自动化注入工具——理解它的意义，是为了**作为防御者去发现注入点、验证修复是否生效、及时收敛风险**。

## sqlmap 是什么

sqlmap 是最流行的**自动化 SQL 注入**工具。它把一个原本需要手工试探、反复构造 payload 的过程自动化：自动探测目标是否存在注入点、识别后端数据库类型（MySQL / PostgreSQL / MSSQL / Oracle…）、然后进一步**枚举数据库结构、拖取数据，甚至执行系统命令**。

它之所以强大，是因为集成了多种注入技术：

- **布尔盲注（Boolean-based blind）**：根据页面返回真假差异推断数据；
- **时间盲注（Time-based blind）**：用 `SLEEP()`/`BENCHMARK()` 让数据库延时，靠响应时间判断；
- **报错注入（Error-based）**：故意触发数据库报错，从错误信息里带出数据；
- **联合查询（UNION query）**：用 `UNION SELECT` 直接把数据拼进页面返回；
- **堆叠查询（Stacked queries）**：一次执行多条 SQL（视数据库/权限而定）。

理解这些技术，有助于看懂 sqlmap 参数、也理解"为什么防御要分情况"。

## 基本结构：一条 sqlmap 命令长什么样

```
sqlmap [目标] [检测选项] [注入技术] [枚举动作] [其他]
```

最简一条：

```bash
sqlmap -u "http://example.com/page.php?id=1"
```

这条命令会让 sqlmap 自动对 `id` 参数做探测。下面按"从定位到深入"的顺序拆解常用参数。

## 第一步：指定目标

sqlmap 不止能扫一个 URL，支持多种输入源：

- `-u / --url`：直接给带参数的 URL。`sqlmap -u "http://test.com/vuln.php?id=1"`。**注意 URL 必须包含可注入参数**（如 `?id=1`），否则要配合 `-p`。
- `-r <文件>`：从一个 **HTTP 请求文件**（Burp/ZAP 右键"Save item"导出）读取完整请求。最适合 POST、带复杂 Header/Cookie 的接口——比手动拼 `--data`/`--cookie` 省事得多。
- `-l <文件>`：从代理（Burp/ZAP）的**日志文件**批量提取所有请求逐个测，适合跑完一轮站点收集。
- `-g "<dork>"`：用 **Google dork** 批量搜目标，如 `sqlmap -g "inurl:\".php?id=\""`。⚠️ 这种"广撒网"扫描他人站点风险极高，仅授权资产或自家资产用。

### 指定注入点

默认 sqlmap 会测 URL 里所有参数。要精确控制：

- `-p id,name`：只对 `id`、`name` 参数测；
- `--skip`：跳过某些参数；
- `--prefix` / `--suffix`：在注入点前后加固定字符，用于闭合原本的 SQL 语法（如 `--prefix="')"` 闭合 `('` 和 `)`）。

## 第二步：控制请求与连接

实战目标往往不是裸 GET，需要带上下文：

- `--data="username=admin&password=1"`：发送 **POST 数据**，配合 `-u` 的 URL；
- `--cookie="PHPSESSID=abc; auth=1"`：带登录态，测**需要登录**的接口；
- `--user-agent="..."` / `--random-agent`：自定义或随机 UA。很多 WAF 会拦默认 `sqlmap` UA，`--random-agent` 是基本反检测手段；
- `--proxy="http://127.0.0.1:8080"`：把流量转给 Burp，方便观察 sqlmap 实际发了什么；
- `--method=POST`、`--timeout=10`、`--retries=3`：控制方法、超时、重试。

## 第三步：检测强度——level 与 risk

这是 sqlmap 最常被问的两个旋钮：

| 参数 | 取值 | 含义 |
|------|------|------|
| `--level` | 1–5 | 测试**哪些地方**会被注入。1 只测 GET/POST；2 加 Cookie；3 加 User-Agent/Referer；4 加 Host；5 全部 |
| `--risk` | 1–3 | 测试**哪些危险 payload**。1 无风险；2 加时间盲注；3 加 `OR` 堆叠/报错注入 |

经验：

- 默认 `--level=1 --risk=1` 漏掉很多点（如注入在 Cookie/UA 里，或需要时间盲注才显形）。
- 实战常用 `--level=3 --risk=2`：既覆盖常见隐藏参数位，又会尝试时间盲注，又不至于太激进打挂库。
- `--risk=3` 含 `OR`/堆叠，可能对目标数据产生写操作，**慎用于生产库**。

## 第四步：注入技术——technique

用 `--technique=<字母>` 限定用的技术，加速或精确化：

```bash
sqlmap -u "..." --technique=BU   # 只用布尔盲注 + 联合查询
```

字母含义：**B** 布尔、**E** 报错、**U** 联合、**S** 堆叠、**T** 时间。不指定则全部尝试。当已知目标只能用某种技术（比如页面无回显、只能时间盲注），指定 `--technique=T` 能省大量试探时间。

## 第五步：绕 WAF——tamper 与识别

很多站点有 WAF/IDS，会拦 sqlmap 的特征 payload。常用手段：

- `--identify-waf` / `--check-waf`：先探测目标是否有 WAF 及其类型（sqlmap 据此调整）。
- `--tamper=<脚本>`：用 tamper 脚本**改写 payload** 绕过过滤/拦截。常见：
  - `space2comment`：把空格变 `/**/`，绕空格过滤；
  - `charencode`：URL 编码；
  - `between`：用 `BETWEEN` 替换 `>`、`<` 等被拦符号；
  - `randomcase`：随机大小写绕大小写敏感的规则。

多个用逗号：`--tamper="space2comment,charencode"`。我们的 [SQLMap 命令生成器](/tools/security/sqlmap/) 里直接填 tamper 名即可。

⚠️ tamper 只改"语法特征"，绕不过行为检测；且 WAF 绕过本身属于攻防升级，仅用于授权测试。

## 第六步：进入数据库后——枚举与拖库

确认注入点存在、且 sqlmap 识别出 DBMS 后，下一步就是"看里面有什么"。枚举参数：

| 参数 | 作用 |
|------|------|
| `--banner` | 数据库版本横幅 |
| `--current-user` | 当前连接用户 |
| `--current-db` | 当前数据库名 |
| `--is-dba` | 当前用户是否 DBA（是否高权限，决定能否 `--os-shell`） |
| `--dbs` | 列出所有数据库 |
| `--tables` | 列出表（配合 `-D 库名`） |
| `--columns` | 列出列（配合 `-D 库 -T 表`） |
| `--dump` | 拖取数据（配合 `-D -T -C` 指定范围，或单独用拖整表） |
| `--dump-all` | 拖取**全部**库表数据（极慢、极敏感，慎用） |
| `--users` / `--passwords` | 列出数据库用户及密码哈希（可配合 sqlmap 自带字典破解） |
| `--privileges` / `--roles` | 列出权限/角色 |
| `--schema` | 导出完整库结构 |
| `--count` | 各表行数统计 |

典型流程：

```bash
# 1. 先看当前库
sqlmap -u "..." --current-db

# 2. 列该库的表
sqlmap -u "..." -D myapp --tables

# 3. 列 users 表的列
sqlmap -u "..." -D myapp -T users --columns

# 4. 拖用户名+密码列
sqlmap -u "..." -D myapp -T users -C username,password --dump
```

`-D`/`-T`/`-C` 逐级缩小范围，**避免一上来 `--dump-all`**——既慢又容易触发行号巨大的敏感数据导出告警。

## 高危动作：OS 命令与读文件

如果当前数据库用户权限足够（常需 `--is-dba` 且数据库支持如 `xp_cmdshell`/UDF），sqlmap 能进一步跳出数据库：

- `--os-shell`：尝试拿到一个**交互式系统 shell**（如通过 `xp_cmdshell` 或写 webshell 再调用）。
- `--os-cmd="whoami"`：直接执行一条系统命令。
- `--file-read="/etc/passwd"`：读取服务器文件（需 `FILE` 权限）。
- `--file-write` / `--file-dest`：写文件（如写 webshell，极高危）。

⚠️ 这些动作**等价于拿下服务器**，是授权红线内才允许的操作。生成器提供了这些选项的开关，是为了让你**理解攻击链**，而不是鼓励对未授权目标使用。

## 提速与稳定：threads、batch、session

- `--threads=10`：并发线程，大幅加速（但太高易被 WAF 限流/封 IP，建议 ≤10）。
- `--batch`：**非交互模式**，所有询问自动选默认，适合脚本化/批量跑。
- `--flush-session`：清空之前的会话缓存重测（改了参数想重跑时用）。
- `--fresh-queries`：忽略缓存、重新发每个查询。
- `--output-dir=<路径>` / `--session=<名>`：把结果存到指定目录/会话名，方便多目标管理。

## 常见组合命令速查

| 目的 | 命令 |
|------|------|
| 自动探测 URL | `sqlmap -u "http://t.com/vuln.php?id=1"` |
| 带登录态 + level3/risk2 | `sqlmap -u "..." --cookie="PHPSESSID=x" --level=3 --risk=2` |
| 从 Burp 请求测 POST | `sqlmap -r request.txt --level=3` |
| 绕过 WAF | `sqlmap -u "..." --tamper="space2comment,charencode" --random-agent` |
| 列出所有库 | `sqlmap -u "..." --dbs` |
| 拖指定表 | `sqlmap -u "..." -D app -T users -C id,pass --dump` |
| 非交互自动扫 | `sqlmap -u "..." --batch --level=2` |
| 仅时间盲注加速 | `sqlmap -u "..." --technique=T --time-sec=5` |

## 作为防御者：用它验证修复

sqlmap 最好的用法是**打自己的应用**：

- 在测试环境对被测接口跑一遍，确认**不存在注入点**（sqlmap 报告 "not vulnerable"）；
- 修复（参数化查询/ORM/输入校验/最小化 DB 权限）后**再跑一遍**，确认注入消失；
- 用 `--identify-waf` 验证 WAF 规则是否真拦住了特征 payload。

真正能根治 SQL 注入的只有**参数化查询（Prepared Statement）**——把 SQL 结构和数据分开传，让数据库无法把用户输入当指令执行。任何 tamper/转义都只是缓解，不是根治。

## 常见问题

**Q1：为什么 sqlmap 提示 "all tested parameters appear to be not injectable"？**
A：可能确实没注入点；也可能注入在 Cookie/UA/Referer 等位置而 `--level` 不够（调到 3+），或只有时间盲注显形而 `--risk` 不够（调到 2+）。还可能是目标有 WAF 拦了默认 payload，可加 `--random-agent` 和 `--tamper` 再试。

**Q2：`-u` 和 `-r` 该用哪个？**
A：简单 GET 用 `-u` 最快；POST 接口、带复杂 Header/Cookie/JSON body 的，直接 `-r` 导一份 Burp 请求文件最省事，比手拼 `--data`/`--cookie`/`--headers` 可靠。

**Q3：`--level` 和 `--risk` 调太高会怎样？**
A：`--level` 高 → 测更多参数位、更慢；`--risk` 高（3）→ 会发 `OR`/堆叠等可能改数据的 payload，**有打挂生产库或触发写操作的风险**。授权测试里常用 `--level=3 --risk=2` 作为平衡。

**Q4：时间盲注特别慢怎么办？**
A：用 `--technique=T` 限定只跑时间盲注并设 `--time-sec=5`（响应判定阈值，越大越准但越慢）；同时确保网络稳定。`--threads` 适当提高（≤10）也能加速，但高并发易被 WAF 封。

**Q5：tamper 脚本有哪些常用的？怎么组合？**
A：常用有 `space2comment`（空格转注释）、`charencode`（URL 编码）、`between`（用 BETWEEN 替换比较符）、`randomcase`（随机大小写）、`equaltolike` 等。多个逗号分隔：`--tamper="space2comment,charencode"`。具体哪些对你的目标有效，需要结合 WAF 类型试探。

**Q6：`--dump` 和 `--dump-all` 有什么区别？危险在哪？**
A：`--dump` 配 `-D/-T/-C` 拖**指定范围**数据；`--dump-all` 拖**全部库表**。后者极慢、且会导出海量敏感数据，既容易触发告警，也加大你手上"敏感数据"的合规风险。实践中应先逐级缩小范围再拖。

**Q7：用 sqlmap 扫别人网站犯法吗？**
A：对**未授权**的系统做注入探测、拖库，在多数司法管辖区构成非法侵入计算机信息系统/窃取数据，是刑事犯罪。只对你拥有或已书面授权的资产使用，且最好在隔离的测试环境进行。

**Q8：sqlmap 能绕过所有 WAF 吗？**
A：不能。tamper 只改语法特征，行为特征（突然大量查询、时间盲注延时模式、高频报错）现代 WAF/EDR 仍能识别。WAF 是缓解层，根治靠参数化查询。

## 小结

sqlmap 把 SQL 注入从手工活变成自动化流水线：**定位目标 → 带上下文请求 → 调 level/risk 与技术 → 必要时 tamper 绕 WAF → 枚举库表列 → 精准拖取 →（极端情况）OS 命令**。记住三个关键旋钮：`--level` 决定测多广、`--risk` 决定测多狠、`--technique` 决定用哪种注入。把它用在**授权自查**上，反向验证"参数化查询是否真生效、WAF 是否真拦住"，才是安全工具的正确价值——知攻，方能善守。
