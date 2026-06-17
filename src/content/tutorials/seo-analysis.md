---
title: "SEO 综合查询详解：搜索引擎到底看什么"
toolId: seo-analysis
category: network
description: "深入理解 SEO 检测的各个维度：Meta 标签、Open Graph、结构化数据、页面性能，以及为什么 SEO 评分只是参考不是圣旨"
keywords: [SEO, SEO分析, Meta标签, Open Graph, 结构化数据, 页面性能, SEO评分]
author: 开发工具箱
date: 2026-06-17
phase: 2
relatedTools: [dns-lookup, ip-lookup, http-headers, whois]
relatedTutorials: [ip-lookup]
---

## SEO 检测在测什么？

SEO（搜索引擎优化）检测工具抓取一个网页，逐项检查"搜索引擎和社交平台能不能正确理解这个页面"。它不直接决定排名——Google 的排名算法有 200+ 因素且不公开——但它检查的都是**基础健康度**：标题有没有、描述写没写、移动端适配、加载性能……这些做不好，再好的内容也难被收录和呈现。

理解每项检查的含义，比盯着那个"SEO 评分"数字重要得多。

## Meta 标签：页面的"自我介绍"

Meta 标签放在 HTML `<head>` 里，告诉爬虫这个页面是什么。核心几个：

### title

`<title>` 是页面标题，**SEO 里权重最高的单元素**。它同时是搜索结果里那行蓝色可点击的标题。要点：

- 每页唯一、准确描述页面内容
- 长度建议 30~60 字符（中文 15~30 字），太长在搜索结果会被截断
- 关键词靠前放，但别堆砌

### meta description

`<meta name="description" content="...">`，页面的摘要说明。它不直接影响排名，但影响**点击率**——搜索结果标题下面那行灰字就是它。写得吸引人、含关键词，能提升点击率，间接利好 SEO。长度建议 70~155 字符。

### meta keywords

`<meta name="keywords">`，早年靠它堆关键词作弊太多，Google 早在 2009 年就声明**完全不看了**。现在填了也没用，填得过分甚至可能被判作弊。检测工具会提醒你它已失效。

### viewport

`<meta name="viewport" content="width=device-width, initial-scale=1">`，移动端适配的关键。没有它，手机上会显示成缩小的桌面版。Google 优先索引移动版（Mobile-First Indexing），所以 viewport 缺失是严重问题。

## Open Graph 和社交分享

Open Graph（OG）是 Facebook 提出的协议，现在 Twitter、微信、Telegram 等几乎所有社交平台都用它来生成分享卡片。核心标签：

- `og:title` — 卡片标题
- `og:description` — 卡片描述
- `og:image` — 卡片配图（最影响分享点击率）
- `og:url`、`og:type` — 规范 URL 和内容类型

Twitter 另有一套 `twitter:card` 标签，但基本和 OG 重叠，配好 OG 大多数平台就够了。

缺 OG 标签的后果：链接发到群里/朋友圈，预览是一片空白或随便抓的图，点击率暴跌。所以 OG 不只是"社交优化"，是内容传播的基础设施。

## 结构化数据（Schema.org）

结构化数据用 JSON-LD（`<script type="application/ld+json">`）告诉搜索引擎"这是一个产品/文章/活动/FAQ"，让搜索结果能显示富媒体片段（Rich Snippet）——比如菜谱带评分星级、活动带时间、文章带面包屑。

常见类型：`Article`、`Product`、`Recipe`、`FAQPage`、`BreadcrumbList`、`Organization`。配好结构化数据能让你的结果在搜索页更醒目、占用更多空间，显著提升点击率。但要求严格——格式错了 Google 会直接忽略，甚至触发手动操作处罚。检测工具会校验 JSON-LD 是否合法、字段是否完整。

## 页面性能：Core Web Vitals

Google 把页面体验纳入排名，核心是 **Core Web Vitals** 三项：

| 指标 | 含义 | 好的阈值 |
|------|------|---------|
| LCP（Largest Contentful Paint） | 最大内容绘制时间，反映"主要内容多久可见" | < 2.5 秒 |
| INP（Interaction to Next Paint） | 交互响应延迟，反映"操作多快有反馈" | < 200 毫秒 |
| CLS（Cumulative Layout Shift） | 累计布局偏移，反映"页面会不会乱跳" | < 0.1 |

这些是真实用户数据（来自 Chrome 的 CrUX），SEO 工具的"性能检测"通常是**实验室模拟测量**（Lighthouse），和真实用户数据有差异，但能定位明显问题（图太大、JS 太重、字体抖动）。

## 其他常见检查项

- **H 标签结构**：每页一个 `<h1>`，层级递进 `<h2>`/`<h3>`，别跳级。H 标签帮爬虫理解内容结构
- **图片 alt 属性**：每张图要有 alt，既利于图片搜索（Google Images 流量很大），也是无障碍要求
- **canonical 标签**：`<link rel="canonical">` 指向规范 URL，防止重复内容分散权重（如带不带 www、带不带 query 的多版本）
- **robots.txt 和 meta robots**：告诉爬虫哪些能抓、哪些不能，以及是否允许索引
- **HTTPS**：非 HTTPS 站点会被浏览器标"不安全"，Google 也轻度降权
- **sitemap.xml**：列出所有页面 URL，帮爬虫发现内容

## 域名和基础维度

SEO 工具还会顺带查域名相关：DNS 解析、服务器 IP 归属、HTTP 响应头（有没有正确的缓存、安全头）。这些和 SEO 间接相关——服务器响应慢影响爬虫抓取配额，安全头缺失影响体验信号。这部分和 [[dns-lookup]]、[[http-headers]] 工具重叠。

## 怎么看 SEO 评分

几乎所有 SEO 工具都会给一个 0~100 的评分。重要认知：

1. **评分是检查项的加权汇总，不是排名预测**。100 分不等于排第一，50 分也可能因为内容质量高而排名好
2. **不同工具评分标准不同**，分数不可跨工具比较
3. **满分容易，满分意义有限**——基础项修到 80 分以上边际收益就低了，剩下拼的是内容质量、外链、用户行为这些工具测不到的东西
4. **关注"缺什么"，别关注"多少分"**。报告里标红的缺失项（没 title、没 description、性能差）才是要修的

## 小结

SEO 检测本质是"对照搜索引擎的最佳实践清单逐项体检"：Meta 标签管自我介绍、OG 管社交分享、结构化数据管富媒体展示、Core Web Vitals 管体验。这些是 SEO 的"地基"——做好了不会直接让你登顶，但做差了一定拖后腿。把评分当体检报告而不是 KPI，照着缺失项逐个修，才是正确用法。涉及域名和服务器层面的诊断，配合 [[dns-lookup]] 和 [[ip-lookup]] 更全面。
