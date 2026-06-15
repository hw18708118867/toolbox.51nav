---
title: "XML 解析实战：从 SOAP 到现代 API 的迁移"
toolId: xml-to-json
category: data-format
description: "掌握 XML 到 JSON 的转换挑战：属性 vs 子元素的映射困境、命名空间的丢失问题、CDATA 的处理方式、以及为什么说 XML 到 JSON 的转换永远不是无损的"
keywords: [XML转JSON, XML解析, SOAP迁移, XML属性, JSON转换, 数据格式, API迁移]
author: 开发工具箱
date: 2026-06-15
phase: 1
relatedTools: [json-to-xml, json-format, yaml-to-json]
relatedTutorials: [json-to-xml, json-format]
---

## 什么是 XML 转 JSON？

把 XML 转成 JSON，表面上看只是换了个外壳——尖括号换成花括号，闭标签换成逗号。但实际上，这不是一个简单的格式切换，而是一个**信息取舍**的过程。

XML 和 JSON 的数据模型根本不同。XML 是**文档模型**——有元素、属性、命名空间、注释、处理指令、CDATA 区段，甚至同一个元素里可以混合文本和子元素。JSON 呢？JSON 的数据模型只有六种类型：对象、数组、字符串、数字、布尔值和 null。

这就好比把一本带有页边批注、脚注、高亮和下划线的纸质书转成纯文本文件——一部分信息注定会丢掉。问题的核心不是"能不能转"，而是"你愿意舍弃什么"。

我第一次做 XML 转 JSON 是在对接一个老旧的 SOAP 支付接口。对方的 XML 响应带了四层嵌套、两个命名空间、还有一堆 `xsi:type` 属性。我用了一个网上的"一行代码"转换函数，结果命名空间前缀全丢了，属性值变成了莫名其妙的嵌套对象，连 SOAP Body 里的实际数据都找不到了。那次之后我才明白，这件事远没有看起来那么简单。

## XML 转 JSON 的工作原理

先看一个最简单的例子，感受一下歧义从哪里来。

假设有这样一段 XML：

```xml
<book isbn="978-3-16-148410-0">
  <title>Clean Code</title>
  <author>Robert C. Martin</author>
</book>
```

转换成 JSON，你可能期望得到：

```json
{
  "book": {
    "isbn": "978-3-16-148410-0",
    "title": "Clean Code",
    "author": "Robert C. Martin"
  }
}
```

看起来很自然，对吧？属性变成了平级的键值对。但这里已经做了一个**不可逆的假设**：属性和子元素可以放在同一个层级里。问题是——如果子元素的名字恰好也叫 `isbn` 呢？

```xml
<book isbn="978-3-16-148410-0">
  <isbn>978-3-16-148410-0</isbn>
</book>
```

这时候，JSON 对象里不能有两个同名的 `isbn` 键。不同的转换器有不同的处理方式：有的用 `@isbn` 表示属性，有的把属性塞进 `$` 或 `_attributes` 子对象，有的直接覆盖——后解析的 wins。没有一个标准答案。

### 常见的转换约定

正因为 XML 的复杂性，社区演化出了几套"约定"，但没有任何一套是官方标准：

**1. 属性前缀约定（`@`）**

属性和子元素用前缀区分：

```json
{
  "book": {
    "@isbn": "978-3-16-148410-0",
    "title": "Clean Code"
  }
}
```

BadgerFish、xml2js（默认模式）都走这条路。好处是简单，坏处是 JSON 的键里带 `@`，不符合大多数 API 的命名习惯。

**2. 属性容器约定（`$` 或 `_attributes`）**

属性放进专门的子对象：

```json
{
  "book": {
    "$": { "isbn": "978-3-16-148410-0" },
    "title": "Clean Code"
  }
}
```

这种方式的代表是 xml-js 库的 compact 模式。结构性更好，但路径变深了——访问一个属性要从 `book.isbn` 变成 `book.$.isbn` 或 `book._attributes.isbn`。

**3. 文本内容约定（`#text` 或 `_`）**

XML 元素可以同时包含文本和子元素——这叫混合内容（mixed content）：

```xml
<description>This book is about <topic>software craftsmanship</topic>.</description>
```

JSON 没有原生方式表示"这里有一段文本，中间嵌了一个子元素"。转换器通常把文本放进 `#text` 或 `_` 键：

```json
{
  "description": {
    "#text": "This book is about .",
    "topic": "software craftsmanship"
  }
}
```

文本被拆散了，位置信息也丢了——你只知道文本在元素里，但不知道它在子元素之前还是之后。

### CDATA 的处理

CDATA 区段（`<![CDATA[...]]>`）是 XML 里一种特殊的文本节点，用于包裹含有 `<`、`>`、`&` 等特殊字符的文本，避免被解析器当成标签。比如：

```xml
<script><![CDATA[if (a < b && b > c) { return true; }]]></script>
```

大多数 JSON 转换器会直接把 CDATA 的内容提取为字符串，丢掉"这原本是 CDATA"的标记。对你的业务代码来说，这通常没关系——你要的是 `if (a < b && b > c) { return true; }` 这个字符串，不是 CDATA 包装。但如果你需要**原样还原** XML（比如做 XML 编辑器），这个信息就丢了。

### 命名空间的宿命

XML 命名空间是另一个几乎没有 JSON 转换器处理得好的东西：

```xml
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <ns1:GetPrice xmlns:ns1="urn:example:pricing">
      <ns1:ItemID>12345</ns1:ItemID>
    </ns1:GetPrice>
  </soap:Body>
</soap:Envelope>
```

转成 JSON 后，大多数工具会直接丢掉 `xmlns` 声明，把 `soap:Body` 变成键名 `soap:Body` 或者干脆去掉前缀只留 `Body`。命名空间 URI —— `http://schemas.xmlsoap.org/soap/envelope/` —— 丢了。如果接收方恰好依赖命名空间来区分语义（比如同一个 `Body` 在不同命名空间下含义不同），你就会踩到一个很难排查的坑。

### 数组歧义

这是 XML 转 JSON 里最经典的坑。看这段 XML：

```xml
<order>
  <item>Apple</item>
</order>
```

`item` 是单数还是只有一个元素的数组？转换器不知道。于是出现了两种行为：

- **保守做法**：全都当单数处理，`item: "Apple"`。但如果后续 XML 里多了一个 `<item>Orange</item>`，JSON 结构就从字符串变成了数组，类型变了。
- **激进做法**：凡是能当数组的都当数组，`item: ["Apple"]`。这样解决了类型变化问题，但单元素场景下多了一层不必要的数组嵌套。

xml2js 的 `explicitArray` 选项就是用来控制这个行为的。可惜，没有一种选择能让所有人满意。

## 核心特性

| 特性 | 说明 |
|------|------|
| **不可逆性** | XML 转 JSON 几乎都是有损的——属性/元素的区分、命名空间、CDATA、混合内容、注释、处理指令都会不同程度丢失 |
| **多约定并存** | 没有统一的转换标准；`@`前缀、`$`容器、`#text`容器三足鼎立，选择哪个取决于你的下游消费者 |
| **数组不确定** | 单子元素是该作为对象还是单元素数组，转换器无法自动判断 |
| **体积缩减** | JSON 格式通常比同等 XML 小 20%-40%，因为少了闭标签和属性引号 |
| **解析性能** | 浏览器原生 `JSON.parse()` 比 `DOMParser` 快得多，这也是 API 从 XML 向 JSON 迁移的动力之一 |

## 实际应用场景

### 1. SOAP / XML-RPC 接口迁移

这是 XML 转 JSON 最常见的诉求。很多老旧的企业服务（特别是金融、保险、政府系统）还在跑 SOAP。你如果想在一个现代前端或移动端里调用它们，中间就需要一层转换——后端从 SOAP 拿到 XML，转成 JSON 再返回给客户端。

我之前对接某银行的支付网关就是这个方案。Node.js 中间层用 `soap` 库调对方的 SOAP 服务，拿到 XML 后在服务端转 JSON，前端完全不用知道后面还有个 XML 接口在跑。坏处也很实在：复杂 SOAP 响应的命名空间嵌套深到发指，转换质量很大程度上决定了你的调试体验。

### 2. 配置文件格式升级

Java 生态里 XML 配置遍地——Maven 的 `pom.xml`、Spring 的 `beans.xml`、Tomcat 的 `server.xml`。现在越来越多的工具转向 JSON/YAML 配置（比如 GitHub Actions、ESLint）。把旧项目的 XML 配置转成 JSON，不仅格式更紧凑，也更容易用 `jq` 这类命令行工具做自动化处理。

### 3. RSS / Atom Feed 解析

RSS 是窄众但长尾的场景。博客的 RSS 输出本质上是 XML，但很多现代的 RSS 阅读器前端其实在用 JSON 做内部状态。拿一个 RSS URL，fetch 到 XML，转成 JSON，之后所有的 UI 逻辑都只和 JSON 打交道。

## 常见误区

### 误区一：XML 转 JSON 是无损的

做后端的同事最容易掉进这个坑。JSON 的数据模型比 XML 小——XML 有 7 种节点类型（元素、属性、文本、CDATA、注释、处理指令、命名空间），JSON 严格来说只有 2 种复合类型（对象和数组）。多出来的那 5 种，要么丢弃，要么硬塞进 JSON 结构里——怎么塞都是折中，不存在完美映射。

有一回重构一个老旧 CMS，需求是把所有 XML 模板转 JSON。我写了个全自动脚本跑了一遍，看着输出没什么问题就提交了。两周后编辑反馈：一篇文章的 `<content>` 里嵌了 `<note type="editor">` 注释标记，转换后全没了。原来那些处理指令和注释在生产环境是有业务语义的。教训就是：**转之前，先搞清楚源 XML 里哪些东西是业务关心的，哪些真的可以扔。**

### 误区二：选一个转换库就完事了

不同库的默认行为差异巨大。就拿 Node.js 生态来说：

- **xml2js**：默认把属性变成 `$` 子对象，子元素全当数组，文本节点放 `_` 里
- **fast-xml-parser**：默认把属性当前缀 `@`，不强制数组，文本节点就地展开
- **xml-js**：compact 模式输出类似 xml2js，非 compact 模式输出的是逐节点的 AST

同一个 XML 输入，三个库产出的 JSON 结构完全不同。选库的时候，实际上是在选一种转换世界观。

### 误区三：XML 属性就应该是 JSON 的平级字段

看起来自然，但回不去了。当 JSON 需要再转回 XML 时，你无法判断一个字段原来是属性还是子元素——因为 JSON 里它们长得一模一样。这就是为什么很多转换约定会用 `@` 或 `$` 区分：不是为了好看，是为了**保留回程信息**。

## XML vs JSON vs YAML

| | XML | JSON | YAML |
|---|---|---|---|
| **数据模型复杂度** | 高（7种节点类型） | 低（6种值类型） | 中（支持引用、标签） |
| **人类可读性** | 标签噪音大 | 干净但冗长 | 最简洁 |
| **属性支持** | 原生 | 无（需约定模拟） | 无 |
| **命名空间** | 原生 | 无 | 无 |
| **注释** | 原生 | 无（JSON5/JSONC 非标） | 原生 |
| **混合内容** | 原生 | 不支持 | 不支持 |
| **解析性能** | 最慢 | 最快 | 比 JSON 慢 |

说到底，选哪种格式取决于"你的数据是更像一个文档，还是更像一个对象"。XML 的设计背景是标记文档——SGML 的血统决定了它擅长描述带结构的文本。JSON 的设计背景是 JavaScript 对象字面量——它天生适合描述键值对和列表。如果你需要表达的是一份有段落的、有内嵌标记的文章，XML 可能更好；如果表达的是一个 API 返回的产品列表，JSON 明显更合适。

## 常见问题

**Q: 有没有无损的 XML 到 JSON 转换？**

严格意义上的无损转换没有一个得到广泛采用的实现。如果你必须保留所有信息（命名空间、CDATA、注释、处理指令、属性/元素的精确区分），最接近的方案是用 xml-js 的**非 compact 模式**——它把 XML 的每种节点类型都映射为一种特定的 JSON 对象结构，相当于用 JSON 语法写了一份 XML AST。不过这产出的 JSON 冗长且不适合业务使用，更适合做 XML 编辑器或格式转换中间态。

**Q: 属性前缀用 `@` 还是 `_attributes`？**

取决于你的下游。如果生成的 JSON 直接给前端 UI 消费，`@` 前缀会让键名在 JavaScript 里访问起来有点别扭——`obj['@attr']` 而不是 `obj.attr`。如果用 `_attributes` 子对象则多一层嵌套。我个人在 API 网关场景下倾向于用 fast-xml-parser 并关掉属性前缀，让属性和子元素平级——因为前端同事不需要关心原数据是属性还是元素。但如果后续要从 JSON 还原 XML，就必须保留区分标记。

**Q: 单个子元素要不要包裹成数组？**

如果你无法控制 XML 源的结构（比如第三方接口），**开数组包裹**会更安全。这样当另一个接口调用返回两个同名元素时，你的代码不会崩——它本来就在迭代一个数组，哪怕只有一个元素。xml2js 的 `explicitArray: true` 就是这个思路。代价是 JSON 输出看起来啰嗦一点。

**Q: 怎么处理 XML 里的二进制数据（base64Binary）？**

SOAP 和一些老协议里，`xsd:base64Binary` 类型的元素会包含一大段 Base64 编码的二进制。转换时不要对这坨字符串做额外处理——原样映射到 JSON 字符串字段里就好。真正需要 Base64 解码的环节应该在你的业务逻辑里显式完成，不要在格式转换层隐式解码，否则调用方会困惑"这字段到底还要不要自己 decode"。

**Q: 大文件 XML 转 JSON 会不会爆内存？**

会。XML 解析器通常分两种：DOM 式和 SAX/流式。大多数 JSON 转换器底层用的是 DOM 式解析——把整个 XML 文档构建成一个树形对象，然后再遍历转成 JSON。如果你要转换一个 500MB 的 XML dump，DOM 解析器会直接撑爆内存。处理大文件时，需要用流式 XML 解析器（如 Node.js 的 `sax` 或 Python 的 `xml.etree.ElementTree.iterparse`）逐节点读取，应用层手动构建 JSON 输出。没有捷径，这跟你把一个巨大的 CSV 文件转成 JSON 时面临的问题是同一类。
