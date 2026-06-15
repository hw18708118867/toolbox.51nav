---
title: "JSON 格式化：结构化数据的通用语言"
toolId: json-format
category: data-format
description: "理解 JSON 作为数据交换标准的方方面面：从 Douglas Crockford 的一页纸规范到全球 API 的通用语言、JSON.stringify 的隐藏陷阱、以及它如何取代 XML 成为 Web 数据格式的王者"
keywords: [JSON, JSON格式化, JSON.stringify, JSON.parse, JSON Schema, API数据格式, Douglas Crockford]
author: 开发工具箱
date: 2026-06-15
phase: 1
relatedTools: [json-to-yaml, json-to-xml, yaml-to-json]
relatedTutorials: [json-to-yaml, json-to-xml, yaml-to-json]
---

## 什么是 JSON？

JSON（JavaScript Object Notation）是一种用纯文本表示结构化数据的格式。它出身于 JavaScript，但现在独立于任何编程语言。

你可能每天都在用它——前端调后端接口、编辑 VS Code 配置文件、写 package.json 管理依赖。不知不觉，JSON 已经成了互联网数据交换的事实标准。

它的来头相当小。2001 年，JavaScript 语言创始人之一的 Douglas Crockford 发现了一个简化 Web 数据交换的法子——用 JavaScript 的对象字面量语法来序列化数据。他没有发明解析器，直接用了 JavaScript 自带的 `eval()` 来解析。没错，最初的 JSON 解析就是靠 `eval()` 达成的，也难怪那个年代有人直接把 JSON 当 JS 代码往里传。后来 Crockford 自己也意识到安全问题，才指定了严格的语法子集和独立的解析器。

JSON 规范短得离谱——就一页纸。你在 json.org 上见过那张图：左边画一堆 `{ } [ ] : ,` 的语法铁路图，右边写一下支持的数据类型。一张网页，全讲完了。说实话，正是这份"没什么可讲的"简单，成就了它后来的统治地位。

把 JSON 类比成一个通用插座：不管你家里是中国电源插头还是欧洲插头（类比编程语言的数据结构），只要带上一个标准转换器（JSON 序列化），就能插进同一个插座（REST API）工作。

## JSON 的工作原理

JSON 能做的事只有两件——把内存里的对象变成字符串，和把这个字符串恢复成原来的对象。前者叫**序列化**，后者叫**解析**。

它支持六种数据类型：

| 类型 | JavaScript 对应 | 注意事项 |
|------|----------------|---------|
| 字符串 | String | 必须用双引号，单引号不行 |
| 数字 | Number | 十进制，不能有前导零，不支持 Infinity 和 NaN |
| 布尔值 | Boolean | 只认 `true` 和 `false`（小写） |
| 空值 | null | 只认 `null`（小写），`undefined` 不行 |
| 数组 | Array | `[1, "two", true, null, {}]` |
| 对象 | Object | 键必须用双引号包裹 |

这六种类型可以任意嵌套，构成任意复杂的树状结构。当然，循环引用不行。

## JSON 和 JavaScript 对象字面量的区别

很多人以为 JSON 就是 JavaScript 对象字面量的同义词。不是的。JSON 是 JS 对象字面量的一个**严格子集**。以下几个差异足以让一个合法的 JS 对象不是合法的 JSON：

**1. 键名必须加双引号。** 在 JS 里你可以写 `{name: "张三"}`，但 JSON 不允许，必须是 `{"name": "张三"}`。不写引号在 JS 里是靠属性名推断的语法糖，JSON 没有这种待遇。

**2. 不支持尾随逗号。** `{"a": 1, "b": 2,}` 在 JS 的很多实现里是合法的（ES5 之后），在 JSON 里直接报错。这像个严格的食堂阿姨——多出来的那一筷子，不收。

**3. 没有注释。** JS 里有 `//` 和 `/* */`，JSON 里一个都没有。Crockford 在设计时特意去掉了注释，理由是"注释可能包含解析指令"。但说实话，这一决定让 JSON 做配置文件时让很多人抓狂——VS Code 的 `settings.json` 支持注释，那已经是 JSONC（JSON with Comments）了，不是标准 JSON。

**4. 字符串只能用双引号。** JS 里单引号和反引号模板字符串都不行。而且字符串里的控制字符（如换行符）必须转义。

有一次我手写了一个含尾随逗号的 JSON 配置文件，前端页面解析报错，后端却说是合法的（因为他们用的 JSON5 库）。两边为这个来回扯了一个小时，最后还是改了配置文件——**标准 JSON 比宽松 JSON 更安全，虽然用着更烦**。

## JSON.stringify 和 JSON.parse 的隐藏陷阱

`JSON.stringify` 把 JS 对象变成 JSON 字符串，`JSON.parse` 恢复它。这两个函数看起来简单，背后的坑只多不少：

```js
// 这几个值会悄悄丢数据
JSON.stringify(new Date())       // → "2026-06-15T..."
// Date 变成了 ISO 字符串，parse 回来是一个普通字符串，不是 Date 对象

JSON.stringify(undefined)        // → undefined（返回值，不是字符串！）
JSON.stringify({a: undefined})   // → "{}"  —— undefined 的键被静默删除了

const obj = {id: 9007199254740993n};
JSON.stringify(obj)              // → TypeError: Do not know how to serialize a BigInt
```

`BigInt` 直接在 `JSON.stringify` 里炸，因为它不在 JSON 的六种类型里。我之前在一个分页列表接口里用 `BigInt` 做雪花 ID，序列化后端返回数据的时候报了错，排查了半小时才意识到是 `JSON.stringify` 不支持 `BigInt`。最后的解决方案是前端在 `JSON.parse` 之前加了一层替换逻辑，把数字型的 ID 转换成字符串。

还有 `JSON.parse` 本身：它只接受合法的 JSON 格式。任何多出来的东西——注释、尾随逗号、单引号字符串、裸 NaN——都会 `SyntaxError`。这也是为什么 `try { JSON.parse(str) } catch(e) {}` 是判断字符串是否合法 JSON 的最简单手段。

## JSON Schema

数据没问题时 JSON 自由又方便，但一旦数据结构出错了——少了个字段、类型对不上、嵌套不对——你指望它自己告诉你错在哪儿，那是做梦。

JSON Schema 就是为了解决这个问题：用 JSON 来定义 JSON 应该长什么样。它不是 JSON 标准的一部分，但已成生态共识。

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "age": { "type": "integer", "minimum": 0 }
  },
  "required": ["name"]
}
```

这份 Schema 规定了：数据必须是一个对象，必须有 `name` 字段（字符串类型），可以有 `age` 字段（非负整数）。配合 `ajv` 这类校验库，API 的参数校验、配置文件的合法性检查、数据管道的 schema 治理全部可以自动化。

## 实际应用场景

### 1. REST API

这是 JSON 的主战场。统计数据显示，新开发 API 的 JSON 占比超过 95%。RESTful 风格里，请求体和响应体几乎全是 `application/json`。

### 2. 前端状态管理

React、Vue 组件的状态、Redux store 的序列化——全是 JSON。Redux DevTools 能把整个 action 链导出成一个 JSON 文件，方便调试和重现 bug。Pinia 的插件也自带 JSON 持久化支持。

### 3. 服务器配置文件

`package.json`、`tsconfig.json`、`eslint.config.json` 这些不用说了。Docker Compose 的 `docker-compose.yml` 虽然用的是 YAML（JSON 的超集），但经常在做服务间数据交换时转回 JSON。

### 4. NoSQL 数据库

MongoDB 用 BSON（Binary JSON）做内部存储格式，CouchDB 以 JSON 为原生文档格式。键值不固定、结构自由的特点让 JSON 压过 SQL 数据表成为快速迭代场景的天然选择。

### 5. 序列化与日志

微服务分布式链路中，JSON 是日志格式的绝对主流。Elasticsearch 索引的文档就是一个一个 JSON 对象，Logstash/Fluentd 在不同格式之间做转换时，JSON 是中枢格式。

## 为什么 JSON 赢了 XML？

回到 2000 年代初，数据交换的王者是 XML。SOAP 协议套着 XML 信封传数据。每个标签都要一个开一个闭——`<user><name>张三</name></user>`——一层嵌套就要两层标签。

JSON 凭空比 XML 轻了至少一半：

```xml
<!-- XML: 这还只是单条数据 -->
<response>
  <user id="1">
    <name>张三</name>
    <email>zhangsan@example.com</email>
  </user>
</response>
```

```json
// JSON: 同样的信息量
{ "id": 1, "name": "张三", "email": "zhangsan@example.com" }
```

不仅字符少了一半，JSON 和 JavaScript 的内存对象天然对应。`JSON.parse(xhr.responseText)` 直接把服务器返回的字符串变成了可操作的对象，而 XML 要 `DOMParser` 再 `.querySelector` 一层层扒。

让 JSON 起飞的关键事件是 Ajax 的流行——JavaScript 是浏览器的母语，JSON 是 JavaScript 的母语。XML 的结构化能力强过 JSON（有命名空间、有属性、有实体验证），但 Web 开发的世界里，人们更愿意要一个"够用但简单"的东西，而不是一个"完备但麻烦"的标准。

## 核心特性

| 特性 | 说明 |
|------|------|
| **数据类型** | 字符串、数字、布尔值、null、数组、对象，共六种 |
| **编码** | 默认 UTF-8，RFC 8259 要求 |
| **可读性** | 纯文本、无二进制，人眼可直接读取 |
| **互操作性** | 独立于编程语言，99% 的语言有原生或主流 JSON 库 |
| **嵌套深度** | 无硬性限制，但实际不建议过深（多数解析器默认 19 层以内） |
| **根值** | RFC 8259 只允许对象或数组作最外层，不再允许裸字符串或数字 |

## 常见误区

### 误区一：JSON 是 JavaScript 对象

JSON 是数据格式，不是语言特性。JSON 字符串只是序列化了的数据，要变成 JS 对象必须经过 `JSON.parse`。如果你直接把未经解析的字符串当对象用——比如 `data.name`——结果只会是 `undefined`。

### 误区二：JSON.stringify 能序列化任何 JS 对象

不能。除了前面说的 `undefined`、`Function`、`Symbol` 会静默丢失，`BigInt` 直接报错，`Map` 和 `Set` 会输出空对象 `{}`。循环引用的对象也无法序列化。`Date` 倒是能序列化——但它变成的是一个 ISO 字符串，失去了所有原型方法。

### 误区三：JSON 很慢

解析速度上，`JSON.parse` 在现代 JS 引擎里被极限优化了——因为 JSON 语法简单，V8 的解析器可以对它做特化路径。相比之下，XML 的解析速度通常比同等大小的 JSON 慢 5-10 倍。JSON 实际上是所有文本序列化格式中最快的那一批。

## JSON vs YAML vs TOML

| | JSON | YAML | TOML |
|---|---|---|---|
| **数据类型** | 六种 | JSON 超集 + 日期 + 多行字符串等 | JSON 超集 + 日期 + 类型注解 |
| **可读性** | 好（但深层嵌套时括号密集） | 很好（靠缩进，人类撰写优化） | 很好（适合配置表） |
| **注释** | 不支持 | 支持 | 支持 |
| **尾随逗号** | 不允许 | 允许 | 允许 |
| **主要用途** | API 数据交换 | 配置文件（K8s、Ansible、CI） | 配置文件（Cargo、Poetry） |
| **解析器复杂度** | 低 | 中高（缩进敏感） | 低中 |

YAML 不支持注释？不对——YAML 支持。这就是为什么它更适合人工编辑的配置文件。1.1 版本的 YAML 还有个荒诞的坑：未引用的 `yes` 和 `no` 会被解析为布尔值而不是字符串。如果你在 YAML 里写 `country: no` 想表示"挪威"—对不起，它变成了 `false`。JSON 没有这种"自作聪明"的问题。

## 常见问题

**Q: JSON 文件名一定是 .json 吗？**

不一定，约定而已。`.json` 是最常见后缀，但也有 `.jsonc`（带注释）、`.jsonl`（每行一个 JSON 对象，用于大数据流处理）和 `.har`（HTTP Archive 格式，实质是 JSON）。HAR 文件是浏览器 Network 面板导出的 HTTP 事务记录，本质上就是一个标准 JSON 对象。

**Q: JSON 能放二进制数据吗？**

不能直接放。JSON 只支持六种数据类型，没有二进制。通常的做法是把二进制数据 Base64 编码成字符串后嵌入——体积上多 33%，加上 JSON 自身的括号引号开销，总体上比原始二进制膨胀近 50%。图片或文件接口尽量不要用 JSON 装二进制，用 `multipart/form-data` 或独立的文件 URL 更好。

**Q: JSON.stringify 的第二个和第三个参数是干什么用的？**

`JSON.stringify(value, replacer, space)` 中，`replacer` 可以是过滤键的数组或自定义转换函数，`space` 控制缩进空格数。`JSON.stringify(obj, null, 2)` 生成带换行和 2 空格缩进的格式化 JSON——你几乎在每一个"JSON 格式化"工具里都在用这个技巧。我自己调试的时候总是 `console.log(JSON.stringify(data, null, 2))`，没有缩进看嵌套简直眼瞎。

**Q: JSON.parse 有没有大小限制？**

标准没有硬性限制，但 JS 引擎有。V8（Chrome/Node.js）对单个 JSON 字符串的长度限制和最大字符串长度一致——在 64 位系统上大概就是 2^28 - 16 ≈ 256MB。超过这个量级的 JSON 不宜一次性 parse，用流式解析（比如 `oboe.js` 或 `clarinet`）逐块处理。

**Q: JSON 未来会被取代吗？**

短时间内不太可能。Protocol Buffers、MessagePack 这些二进制格式在某些领域（微服务内部通信、移动端）确实比 JSON 快、比 JSON 小，但它们牺牲了 JSON 的最大优势——人可直接阅读。一个调试的时候能肉眼读的格式，工程价值没法被单纯的速度指标替代。JSON 的下一站可能是"可扩展 JSON"——像 JSON-LD、JSON Schema 这样——在不打破向后兼容的前提下给 JSON 加语义，而不是推翻重建。
