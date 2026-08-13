---
title: "Google Hacking 语法与实战：资产暴露面自查"
toolId: google-hacking
category: security
description: "理解 Google Hacking（GHDB）常用运算符与工作逻辑，掌握 site/inurl/intitle/filetype 等限定组合，并用常见 dork 对自有资产做暴露面自查，及时收敛泄露"
keywords: [Google Hacking, GHDB, google dork, 信息收集, 资产暴露面, 搜索引擎语法, 网络安全, 侦察, 目录列表, 文件泄露, 敏感文件]
author: 开发工具箱
date: 2026-08-13
phase: 3
relatedTools: [nmap, sqlmap, security-ports, subdomain]
relatedTutorials: [nmap, sqlmap]
---

> ⚠️ 本教程仅用于**授权信息收集、对自有或已书面授权资产的暴露面自查**。对他人组织进行大规模、自动化或恶意的 dork 检索，可能触发目标防护、违反搜索引擎服务条款，甚至触及法律红线。理解 Google Hacking 的意义，是**作为防御者去发现自己无意中泄露的敏感信息，并尽快收敛**。

## 什么是 Google Hacking

Google Hacking（又称 GHDB，Google Hacking Database）不是"黑进 Google"，而是**利用搜索引擎的高级运算符，把本就该公开、却不该被轻易找到的敏感信息从海量结果里筛出来**。

原理很简单：很多文件、目录、错误信息、管理后台**本来就存在于公网**、被搜索引擎抓取收录了，只是它们不在显眼位置。攻击者用 `site:`、`filetype:`、`intitle:` 等限定符精准定位，就能在几秒内找到别人花几小时扫不出的东西——比如：

- 暴露在公网的 `.env` 配置文件（含数据库密码、API Key）；
- 目录列表（"Index of"）里裸露的备份、日志；
- 后台管理入口（`/admin`、`phpMyAdmin`）；
- 代码仓库泄露（`.git`、`.svn`）；
- 数据库备份（`.sql`）、源码打包（`.zip`、`.tar`）。

搜索引擎在这里充当了"免费、快、不触发告警"的侦察工具。这正是它危险也值得学习的地方：**防御者要先学会用同样的手法，才能发现自己的暴露面**。

## 核心运算符

Google Hacking 的全部威力来自一组搜索运算符。掌握这几个就够覆盖 90% 场景：

| 运算符 | 含义 | 示例 |
|--------|------|------|
| `关键词` | 同时包含所有词（AND） | `admin login` |
| `"短语"` | 精确匹配整句 | `"admin login"` |
| `OR` | 匹配任一词 | `php OR asp` |
| `-词` | 排除含该词的结果 | `admin -forum` |
| `site:` | 限定域名 | `site:example.com` |
| `inurl:` | URL 中含该词 | `inurl:admin` |
| `intitle:` | 页面标题含该词 | `intitle:"index of"` |
| `intext:` | 页面正文含该词 | `intext:"confidential"` |
| `filetype:` | 限定文件后缀 | `filetype:pdf` |
| `cache:` | 查看缓存页 | `cache:example.com` |
| `link:` | 链向该 URL 的页 | `link:example.com` |
| `related:` | 相似站点 | `related:example.com` |

### 组合逻辑
运算符可以叠加，关系是**逻辑与**：

```
site:example.com filetype:env "DB_PASSWORD"
```

含义：在 `example.com` 域下，找 `.env` 类型文件，且正文含 `DB_PASSWORD`。这三个条件同时成立才返回。

## 实战分类：常见暴露面 dork

下面按"攻击链上的用途"分类列出最常见的 dork。它们是自查清单的核心——把你自己的域名替换进去跑一遍。

### 1. 配置文件 / 密钥泄露
```
site:example.com filetype:env
site:example.com filetype:.env
site:example.com intext:"DB_PASSWORD" filetype:env
site:example.com filetype:yml "password"
```
`.env` 往往含数据库密码、云服务 AK/SK、JWT 密钥。**泄露即沦陷**，优先级最高。

### 2. 数据库与备份文件
```
site:example.com filetype:sql
site:example.com filetype:sql "CREATE TABLE"
site:example.com filetype:bak
site:example.com filetype:dump
```
`.sql` 导出、`.bak` 备份、`.dump` 都可能含完整业务数据。

### 3. 目录列表（Index of）
```
site:example.com intitle:"index of"
site:example.com intitle:"index of" "backup"
site:example.com intitle:"index of" "logs"
```
当目录没有默认页且未禁列目录，服务器会返回文件列表，里面可能躺着源码、日志、密钥。

### 4. 后台 / 管理入口
```
site:example.com inurl:admin
site:example.com inurl:login
site:example.com inurl:phpmyadmin
site:example.com intitle:"admin login"
```
管理后台一旦被找到，下一步就是撞库/弱口令/已知漏洞利用。

### 5. 代码仓库泄露
```
site:example.com inurl:".git"
site:example.com inurl:"/.git/HEAD"
site:example.com inurl:"/.svn/entries"
```
`.git` 目录若可被公网访问，攻击者可拖下整个仓库历史（`git-dumper` 之类工具），源码与密钥全泄露。这是近年最高危的暴露面之一。

### 6. 日志 / 临时文件
```
site:example.com filetype:log
site:example.com filetype:txt "password"
site:example.com ext:xml inurl:"/backup/"
```
日志里常含内部 IP、Token、Session，临时文件常被遗忘在公网。

### 7. 摄像头 / 网络设备
```
site:example.com intitle:"webcam"
intitle:"Live View" inurl:viewerframe
```
很多暴露在公网的 IoT/摄像头默认弱口令，可被直接访问。

## 手工进阶技巧

- **用排除词收窄**：`site:example.com filetype:pdf -menu -brochure` 排除营销资料，聚焦真实文档。
- **多文件类型**：`site:example.com (filetype:sql OR filetype:bak OR filetype:dump)` 一次覆盖多种备份。
- **模糊路径**：`inurl:".git"` 比 `inurl:"/.git/HEAD"` 更宽，先宽后窄。
- **换引擎验证**：Bing、DuckDuckGo 的索引与 Google 不同，有时能补出 Google 没收录的页面。我们的 [Google Hacking 语法生成器](/tools/security/google-hacking/) 支持一键切换平台并直接打开搜索。

⚠️ 注意：搜索引擎结果**有延迟、有遗漏**。dork 没搜到 ≠ 资产安全。真正的资产自查还要配合 `nmap` 端口扫描、子域名枚举、云存储桶遍历等手段，dork 只是其中一环。

## 作为防御者：用 dork 自查并收敛

把上面每个 dork 的 `example.com` 换成**你负责/拥有的域名**，逐个跑一遍。发现泄露后按优先级处理：

1. **立刻下线/移除非必要公网文件**：`.env`、`.sql`、`.bak`、日志、备份——直接从 web 根目录移除或放到非 web 路径。
2. **禁目录列表**：web 服务器配置 `Options -Indexes`（Apache）或 `autoindex off`（Nginx）。
3. **堵仓库目录**：`.git`/`.svn` 不要部署到 web 可访问目录；用 `.gitignore` + 部署脚本排除。
4. **改密钥**：凡泄露过的 `.env`/配置文件，**假设密钥已失窃**，立即轮换数据库密码、API Key、JWT 密钥。
5. **后台加保护**：管理入口加 IP 白名单、SSO、强口令、WAF，不要裸奔在公网。
6. **监控复发**：把关键 dork 存成定时任务（或接入告警），下次再出现泄露能第一时间发现。

这正是我们做 [Google Hacking 语法生成器](/tools/security/google-hacking/) 的初衷——**把攻击者的侦察手法，变成防御者的自查清单**，降低安全运营门槛。

## 常见问题

**Q1：Google Hacking 算"黑客攻击"吗？会违法吗？**
A：单纯用搜索引擎检索公开信息本身不是攻击，但**对未授权组织**进行系统性、大规模、或带有恶意目的（如找弱点入侵）的检索，可能违反搜索引擎服务条款、触发目标告警，严重时涉及非法侵入相关法律责任。只对自有或已授权的资产使用。

**Q2：为什么我搜不到教程里说的那些结果？**
A：几个原因——搜索引擎索引有延迟；目标已修复；Google 对 dork 类查询有频率限制/去噪；不同区域/账号结果不同。dork 没结果**不代表资产安全**，需结合其他手段。

**Q3：`site:example.com` 只能搜主域名吗？子域算吗？**
A：`site:example.com` 会覆盖 `example.com` 及其子域（如 `api.example.com`）。要限定特定子域可写 `site:api.example.com`。想排除某子域可用 `-site:dev.example.com`。

**Q4：Bing / DuckDuckGo 的语法一样吗？**
A：核心运算符（`site:`、`filetype:`、`intitle:`、`inurl:`）基本通用，但各引擎对部分运算符（如 `link:`、`cache:`）支持和行为有差异，索引覆盖也不同。多平台交叉验证能补盲区。

**Q5：`.git` 目录暴露为什么特别危险？**
A：`.git` 含完整版本库元数据，攻击者可下载后本地 `git checkout` 还原全部源码与历史提交，密钥、注释里的内网地址、未上线的漏洞代码全都暴露。且很多人不知道它会被爬取。务必确保 web 根目录下不存在可访问的 `.git`/`.svn`。

**Q6：filetype: 和 ext: 有区别吗？**
A：`filetype:` 是 Google 官方运算符，按 MIME/后缀过滤；部分场景 `ext:` 也能用但支持不稳定。建议优先用 `filetype:`，生成器也以 `filetype:` 为准。

**Q7：发现泄露后第一步该做什么？**
A：按"止血→轮换→加固"顺序：**先让泄露文件从公网不可达**，再**轮换其中所有密钥/密码**（假设已泄露），最后做长期收敛（禁列目录、改部署流程、加监控）。不要只删文件不换密钥——日志里可能已被记录。

**Q8：dork 能代替漏洞扫描器吗？**
A：不能。dork 只解决"信息收集/暴露面发现"这一环，且依赖搜索引擎索引。它看不到未收录的资产、内网资产、实时端口状态。应作为 `nmap`、子域枚举、DAST 等主动扫描的补充，而非替代。

## 小结

Google Hacking 的本质是**用搜索引擎运算符把公网上的敏感信息精准筛出来**：`site:` 圈定域、`inurl:/intitle:/intext:` 定位特征、`filetype:` 锁定文件类型、`-` 与 `OR` 收敛范围。常见高危 dork 集中在配置文件（`.env`）、数据库备份（`.sql`）、目录列表、后台入口、代码仓库（`.git`）几类。把它当成**自查清单**定期对自有资产跑一遍，发现泄露立即下线文件、轮换密钥、禁目录列表、堵仓库目录，就能在攻击者之前把暴露面收敛掉——安全工具的价值，始终是知攻善守。
