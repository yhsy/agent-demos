# tool-test

一个最小化的 LangChain 调用示例工程，用于验证 `MiniMax-M3` 大模型的连通性与环境配置。

## 项目简介

通过 `@langchain/openai` 接入 OpenAI 协议兼容的第三方大模型（`MiniMax-M3`），演示从环境变量加载、模型实例化到单轮对话的完整链路。

## 文件结构

```
tool-test/
├── src/
│   └── hello-langchain.mjs   # 主脚本：加载环境变量、调用 MiniMax-M3 模型并打印回复
├── package.json              # 项目配置：声明依赖与包管理器
├── pnpm-lock.yaml            # pnpm 依赖锁文件，锁定依赖版本
├── .env.local                # 本地环境变量（API_KEY、BASE_URL），优先级高于 .env
└── Readme.md                 # 本文档
```

## 文件作用说明

| 文件 | 作用 |
| --- | --- |
| `src/hello-langchain.mjs` | 主入口脚本。使用 `dotenv` 加载环境变量，创建 `ChatOpenAI` 客户端（模型 `MiniMax-M3`，自定义 `baseURL`），向模型发送 `"请介绍下你自己?"` 并打印回复内容。 |
| `package.json` | 声明项目名称、依赖（`@langchain/openai`、`dotenv`）以及包管理器（`pnpm@9.15.9`），并通过 `volta` 固定 Node 版本为 `20.20.2`。 |
| `pnpm-lock.yaml` | pnpm 生成的依赖锁定文件，确保团队/CI 环境安装的依赖版本一致。 |
| `.env.local` | 本地环境变量配置文件，包含 `API_KEY` 与 `BASE_URL`，优先级最高，会覆盖 `.env` 中的同名变量，便于本地调试。 |
| `Readme.md` | 项目说明文档（本文件）。 |

## 环境变量

运行前需配置以下环境变量（建议放在 `.env.local` 中）：

- `API_KEY`：模型服务的访问密钥。
- `BASE_URL`：模型服务的网关地址（OpenAI 协议兼容）。

加载顺序：先读取 `.env`，再用 `.env.local` 覆盖，因此 `.env.local` 中的值会优先生效。

## 运行方式

```bash
# 安装依赖
pnpm install

# 执行脚本
node src/hello-langchain.mjs
```

执行成功后，终端会打印 `MiniMax-M3` 模型对"请介绍下你自己?"的回复内容。