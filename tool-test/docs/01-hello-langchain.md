# 案例 01 · hello-langchain（单轮对话）

> 对应 `src/cases/01-hello-langchain.mjs`，LangChain 调用大模型的最小闭环。

## 1. 这个案例做了什么

加载配置 → 创建一个大模型实例 → 向模型提问一句「请介绍下你自己?」 → 把模型回复打印到控制台。

演示 LangChain 调用大模型的最小闭环：`配置 → 创建模型 → invoke（调用模型）→ 取 content`。

## 2. 涉及文件

```
tool-test/
├── .env / .env.local          # 环境变量（API_KEY / BASE_URL / MODEL_NAME）
└── src/
    ├── llm.mjs                 # 公共模块：加载配置 + 创建模型（createModel）
    └── cases/
        └── 01-hello-langchain.mjs  # 本案例入口
```

核心设计：**AI 相关的初始化逻辑抽到 `src/llm.mjs` 公共模块**，示例脚本只负责「提问 + 输出」，避免每个脚本重复写配置加载。

## 3. 整体逻辑（代码拆解）

### 3.1 引入公共模块

```js
import { createModel } from '../llm.mjs';
```

案例本身几乎没有配置代码，全部委托给 `llm.mjs`。

### 3.2 创建模型实例

```js
const model = createModel();
```

`createModel()`（`src/llm.mjs`）内部做了四件事：

1. **加载环境变量**：基于脚本文件位置定位 `.env` 和 `.env.local`，按优先级合并（`config({ path: '.env' })` 先加载，`.env.local` 用 `override: true` 后加载，覆盖同名变量）。
2. **读取变量**：从环境中取 `API_KEY`、`BASE_URL`、`MODEL_NAME`（缺省有兜底名）。
3. **校验必填项**：`API_KEY` 或 `BASE_URL` 缺失时，直接抛出带中文提示的错误，而不是让底层 OpenAI 客户端报晦涩的错。
4. **返回 `ChatOpenAI` 实例**：固定 `temperature: 0`、`timeout: 30000`，`configuration.baseURL` 指向兼容 OpenAI 协议的服务地址。

> 为什么基于「脚本文件位置」定位 `.env`？因为 `dotenv` 的 `path` 相对的是**运行时工作目录**。如果相对 CWD，从子目录运行就会找不到 `.env`。用 `fileURLToPath(import.meta.url)` 取脚本绝对路径，可保证无论从哪运行都能正确加载。

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
- `response.tool_calls`：本次回复是否携带工具调用（本案例没用到，见案例 02）

## 4. 运行流程（时序）

```
用户执行 node src/cases/01-hello-langchain.mjs
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
# 在 tool-test 根目录运行（推荐）
node src/cases/01-hello-langchain.mjs
```

> 前提：在 `tool-test/.env`（或 `.env.local`）中已配置好 `API_KEY`、`BASE_URL`、`MODEL_NAME`。因为配置按脚本位置加载，从任意目录运行都可以。

## 6. 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 报错「缺少环境变量：API_KEY=未设置」 | 没配置 `.env` 或变量名拼错 | 在 `tool-test/` 下创建 `.env`，填入 `API_KEY`、`BASE_URL` |
| 网络超时 / 连接失败 | `BASE_URL` 不正确或网络不通 | 检查 `.env` 中的 `BASE_URL` 是否指向可达的服务 |
| 回复内容为空 | 误把 `response` 整体打印而非 `response.content` | 取 `response.content` 才是文本 |

## 7. 下一步

对照 [案例 02 · tool-file-read](./02-tool-file-read.md) 学习「模型 + 工具（Tool Calling）」的调用流程——它复用了同一个 `createModel()`。
