# hello-langchain 学习笔记

> 本文档对应 `src/hello-langchain.mjs`，用于梳理它的运行流程与整体逻辑，方便后续回顾学习。

## 1. 这个脚本做了什么

`hello-langchain.mjs` 是 LangChain 的入门示例：加载配置 → 创建一个大模型实例 → 向模型提问一句「请介绍下你自己?」 → 把模型回复打印到控制台。

它演示了 LangChain 调用大模型的最小闭环：`配置 → 创建模型 → invoke（调用模型） → 取 content`。

## 2. 文件结构

```
tool-test/
├── .env              # 基础环境变量（不提交到仓库）
├── .env.local        # 本地覆盖配置，优先级更高
├── package.json      # 依赖：@langchain/core、@langchain/openai、dotenv、zod
├── docs/
│   └── hello-langchain.md   # 本文档
└── src/
    ├── llm.mjs             # 公共模块：加载配置 + 创建模型（createModel）
    └── hello-langchain.mjs # 本示例入口
```

核心设计：**AI 相关的初始化逻辑抽到 `src/llm.mjs` 公共模块**，示例脚本只负责「提问 + 输出」，避免每个脚本重复写配置加载。

## 3. 整体逻辑（代码拆解）

### 3.1 引入公共模块

```js
import { createModel } from './llm.mjs';
```

`hello-langchain.mjs` 本身几乎没有配置代码，全部委托给 `llm.mjs`。

### 3.2 创建模型实例

```js
const model = createModel();
```

`createModel()`（`src/llm.mjs`）内部做了四件事：

1. **加载环境变量**：基于脚本文件位置定位 `.env` 和 `.env.local`，按优先级合并（`config({ path: '.env' })` 先加载，`.env.local` 用 `override: true` 后加载，覆盖同名变量）。
2. **读取变量**：从环境中取 `API_KEY`、`BASE_URL`、`MODEL_NAME`（缺省有兜底名）。
3. **校验必填项**：`API_KEY` 或 `BASE_URL` 缺失时，直接抛出带中文提示的错误，而不是让底层 OpenAI 客户端报晦涩的错。
4. **返回 `ChatOpenAI` 实例**：固定 `temperature: 0`、`timeout: 30000`，`configuration.baseURL` 指向兼容 OpenAI 协议的服务地址。

> 为什么基于「脚本文件位置」定位 `.env`？因为 `dotenv` 的 `path` 相对的是**运行时工作目录**。如果相对 CWD，从 `src/` 子目录运行就会找不到上一级的 `.env`。用 `fileURLToPath(import.meta.url)` 取脚本绝对路径，可保证无论从哪运行都能正确加载。

### 3.3 调用模型

```js
const response = await model.invoke("请介绍下你自己?");
```

- `invoke` 是 LangChain 模型统一调用的入口，接收一条消息/提示，返回 `AIMessage`。
- 这里直接传字符串，LangChain 会自动包装成一条用户消息。

### 3.4 输出结果

```js
console.log(response.content);
```

模型返回的 `response` 是一个 `AIMessage` 对象，`content` 字段才是真正的文本回复。常见字段：

- `response.content`：模型生成的文本内容
- `response.tool_calls`：本次回复是否携带工具调用（本示例没有用到，在 `tool-file-read.mjs` 中才涉及）

## 4. 运行流程（时序）

```
用户执行 node hello-langchain.mjs
        │
        ▼
llm.mjs 加载 .env / .env.local（按脚本位置定位）
        │
        ▼
createModel() 读取并校验 API_KEY / BASE_URL / MODEL_NAME
        │
        ▼
返回 ChatOpenAI 实例 model
        │
        ▼
model.invoke("请介绍下你自己?")  ── HTTP 请求 ──▶ 兼容 OpenAI 的远端大模型
        │
        ▼
拿到 AIMessage，取 response.content
        │
        ▼
console.log 打印到终端
```

## 5. 如何运行

```bash
# 方式一：在 tool-test 根目录运行
node src/hello-langchain.mjs

# 方式二：先进入 src 目录再运行（因为配置按脚本位置加载，两种方式都可用）
cd src
node hello-langchain.mjs
```

> 前提：在 `tool-test/.env`（或 `.env.local`）中已配置好 `API_KEY`、`BASE_URL`、`MODEL_NAME`。

## 6. 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 报错「缺少环境变量：API_KEY=未设置」 | 没配置 `.env` 或变量名拼错 | 在 `tool-test/` 下创建 `.env`，填入 `API_KEY`、`BASE_URL` |
| 网络超时 / 连接失败 | `BASE_URL` 不正确或网络不通 | 检查 `.env` 中的 `BASE_URL` 是否指向可达的服务 |
| 回复内容为空 | 误把 `response` 整体打印而非 `response.content` | 取 `response.content` 才是文本 |

## 7. 与 tool-file-read.mjs 的关系

`tool-file-read.mjs` 是进阶示例，复用了同一个 `createModel()`：在模型外绑定 `read_file` 工具，让模型能通过工具读取文件。两者共享 `llm.mjs` 的配置与模型创建逻辑——这正是最初把公共函数抽出来的目的。

下一步可对照 `docs/tool-file-read.md`（若已生成）学习「模型 + 工具（Tool Calling）」的调用流程。
