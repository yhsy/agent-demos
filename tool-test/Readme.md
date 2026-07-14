# tool-test

一个 **LangChain 学习工程**，用一系列由浅入深的独立案例，演示如何接入并调用 OpenAI 协议兼容的大模型。

## 项目简介

通过 `@langchain/openai` 接入 OpenAI 协议兼容的第三方大模型，从环境变量加载、模型实例化，到单轮对话、工具调用等逐步进阶。每个案例都是一个可独立运行的 demo，并配有一份学习笔记。

## 文件结构

```
tool-test/
├── AGENTS.md                # 给 AI 协作者 / 贡献者的项目约定
├── Readme.md                # 本文档
├── package.json             # 依赖与包管理器配置
├── pnpm-lock.yaml           # 依赖锁文件
├── .env / .env.local        # 环境变量（勿提交敏感值；.env.local 优先级更高）
├── src/
│   ├── llm.mjs              # 公共模块：加载配置 + 创建模型（createModel）
│   └── cases/               # 案例 demo（按编号，由浅入深）
│       ├── 01-hello-langchain.mjs   # 案例 01：单轮对话最小闭环
│       └── 02-tool-file-read.mjs    # 案例 02：工具调用（Tool Calling）
└── docs/                     # 配套学习笔记
    ├── overview.md          # 案例总览与学习路线图（建议从这里开始）
    ├── 01-hello-langchain.md
    ├── 02-tool-file-read.md
    └── 02-tool-file-read.output.md  # 案例 02 运行样例存档
```

## 案例一览

| 编号 | 案例 | 知识点 | 笔记 |
|------|------|--------|------|
| 01 | hello-langchain | 单轮对话：`createModel` / `invoke` / `content` | [docs/01-hello-langchain.md](./docs/01-hello-langchain.md) |
| 02 | tool-file-read | 工具调用：`tool()` / `bindTools` / `tool_calls` 循环 | [docs/02-tool-file-read.md](./docs/02-tool-file-read.md) |

> 更多规划中的案例（多轮对话、流式输出、结构化输出、多工具 Agent）见 [docs/overview.md](./docs/overview.md)。

## 核心设计

- **公共模块复用**：「加载配置 + 创建模型」统一走 `src/llm.mjs` 的 `createModel()`，案例本身只关注要演示的知识点。
- **配置按脚本位置加载**：`.env` 的定位基于脚本文件位置，从任意目录运行都可用。
- **编号命名**：demo 与笔记一一对应，用两位数编号标明学习顺序。

## 环境变量

运行前需配置以下环境变量（建议放在 `tool-test/.env` 或 `.env.local`）：

- `API_KEY`：模型服务的访问密钥。
- `BASE_URL`：模型服务的网关地址（OpenAI 协议兼容）。
- `MODEL_NAME`：模型名称（可选，`llm.mjs` 内有兜底默认值）。

加载顺序：先读取 `.env`，再用 `.env.local` 覆盖，因此 `.env.local` 中的值优先生效。

## 运行方式

```bash
# 安装依赖
pnpm install

# 运行指定案例（从项目根目录）
node src/cases/01-hello-langchain.mjs
node src/cases/02-tool-file-read.mjs
```

## 贡献 / 协作

新增案例或修改代码前，请先阅读 [AGENTS.md](./AGENTS.md) 与 [docs/overview.md](./docs/overview.md)，遵循「编号命名 + 复用 `createModel()` + 配套笔记」的约定。
