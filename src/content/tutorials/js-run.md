---
title: "JS 在线运行详解：浏览器里的执行环境与沙箱"
toolId: js-run
category: javascript
description: "深入理解 JavaScript 的运行环境、REPL 执行模型、浏览器沙箱隔离，以及在线运行器背后的 console 重定向原理"
keywords: [JS运行, 在线JS, JavaScript运行, JS沙箱, REPL, console重定向, 在线编辑器]
author: 开发工具箱
date: 2026-06-17
phase: 3
relatedTools: [js-format, typescript-play]
relatedTutorials: []
---

## 在线运行器在做什么

"JS 在线运行"工具的本质是一个**浏览器内的 JavaScript 执行环境 + 输出捕获**：你写代码，点运行，它执行代码并把结果（console 输出、返回值、报错）展示给你。和你在浏览器 DevTools 控制台敲代码类似，但封装成了带编辑器的独立工具。

理解它的运作原理，能帮你解释为什么有些代码"本地能跑在线工具不行"、输出是怎么被捕获的、以及安全边界在哪。

## 浏览器里的 JS 执行环境

浏览器原生就是 JavaScript 运行时。在线运行器执行你的代码，最直接的方式是：

### 1. eval / new Function

```js
const result = new Function(userCode)();
// 或
eval(userCode);
```

把用户代码包进函数执行，能拿到返回值。`new Function` 比 `eval` 稍安全（不访问局部作用域，只能访问全局），是常见选择。

### 2. console 输出捕获

用户代码里的 `console.log` 默认输出到浏览器控制台，工具界面看不到。运行器要**重定向 console**——临时替换 `console.log/info/error`，把参数收集起来显示到界面的输出区：

```js
const logs = [];
const origLog = console.log;
console.log = (...args) => {
  logs.push(args.map(format).join(' '));
  origLog(...args); // 可选：同时输出到真实控制台
};
// 执行用户代码
// 恢复 console.log = origLog
// 把 logs 渲染到界面
```

同理 `console.error`、`console.warn` 分别捕获并标红/标黄。`console.table`、`console.dir` 等需要特殊格式化。

### 3. 错误捕获

用户代码可能抛错。运行器用 `try/catch` 包裹执行，捕获到错误时把错误类型、消息、堆栈显示在输出区，而不是让整个工具页面崩掉。

## 沙箱：限制用户代码的能力

直接 `eval` 用户代码有风险——恶意代码能访问 `window`、改 DOM、发请求、读 cookie。在线运行器要做**沙箱隔离**，限制代码能接触什么。常见手段：

### iframe 沙箱

把代码放进一个 `<iframe>`（最好是 `sandbox` 属性受限的 iframe）里执行。iframe 有独立的 `window`/`document`，用户代码的污染被限制在 iframe 内，碰不到主页面。这是较彻底的隔离方式。

### Web Worker

把代码丢进 Web Worker 执行。Worker 是独立线程、独立全局（`self` 而非 `window`），没有 DOM 访问能力——天然防 DOM 篡改。代价是通信要靠 `postMessage`，捕获 console 输出稍麻烦。Worker 的好处是**用户代码死循环不会卡死主界面**。

### 限制 API

不隔离环境的话，至少删除危险 API 的访问：禁用 `fetch`/`XMLHttpRequest`（防外发请求）、禁用 `eval`/`Function`（防二次逃逸）、禁用 `localStorage` 访问等。但靠"删 API"做沙箱不可靠，总会有遗漏。

本站运行器在浏览器内执行、做了输出重定向和错误捕获，并在受限环境里运行——你的代码不会离开浏览器，也不会影响工具页面本身。

## 同步 vs 异步输出的坑

用户代码常有异步操作（`setTimeout`、`Promise`、`async/await`）。运行器要处理"代码执行完了但异步还没结束"的问题：

- 简单做法：同步执行完就收工，异步的 `console.log` 可能漏掉
- 严谨做法：等一段缓冲时间（或监听微任务/宏任务队列空）再收集最终输出

这就是为什么有些运行器"异步输出看不到"或"要等一会儿才出来"——异步捕获的实现难度高于同步。好的运行器会明确告知是否支持异步输出、超时多久。

## 在线运行 vs 本地 Node 的差异

在线运行器跑在**浏览器**里，不是 Node.js，环境差异要注意：

- **全局对象**：浏览器是 `window`/`document`，Node 是 `global`/`process`。Node 专属 API（`fs`、`path`、`require`）在浏览器运行器里**不可用**
- **模块系统**：浏览器原生支持 ES Module（`import`），但 CommonJS（`require`）需要打包工具支持，纯运行器通常不认
- **DOM/BOM**：浏览器有 `document`、`localStorage`、`fetch`，Node 没有
- **某些 API 限制**：沙箱可能禁用了 `fetch` 等

所以"这段 Node 代码在在线运行器报错"很正常——环境不同。要测 Node 代码得用支持 Node 环境的平台，或本地跑。反过来，测浏览器 API（DOM 操作、事件）在线运行器很合适。

## 典型用途

- **验证语法/API 行为**：忘了 `Array.flat` 参数？敲一段试一下
- **正则调试**：`"abc".match(/.../)` 立即看结果，比开项目快
- **教学演示**：讲闭包、原型链时即时运行代码
- **算法草稿**：快速验证一段逻辑

它适合"几行到几十行的片段验证"，不适合写完整程序——那该用本地编辑器+版本控制。

## 安全提醒

- 在线运行器执行的代码理论上能访问你当前浏览器会话（如果沙箱不彻底）。别在公共在线运行器里粘贴含敏感信息（cookie、token）的代码
- 反过来，作为运行器实现者，对用户输入代码的沙箱隔离必须认真做，`eval` 裸跑是危险的

## 小结

JS 在线运行器的核心是"浏览器内执行 + console 重定向 + 错误捕获 + 沙箱隔离"。它跑的是浏览器环境不是 Node，所以 Node API 不可用、但浏览器 API 可用。沙箱通过 iframe/Worker/API 限制防止用户代码污染主页面或外发数据。理解了这些，你就能解释运行器的各种"为什么"——为什么异步输出有延迟、为什么 Node 代码跑不了、为什么安全。涉及代码格式化看 [[js-format]]。
