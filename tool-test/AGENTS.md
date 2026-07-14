# AGENTS.md

本文件为 AI 协作者（以及人类贡献者）提供本工程的约定与上下文，确保新增/修改代码时风格统一、可运行。

## 项目性质

`tool-test/` 是一个 **LangChain 学习工程**，用一系列由浅入深的**独立案例**演示如何调用大模型。每个案例 = 一个可运行 demo（`src/cases/`）+ 一份配套笔记（`docs/`）。案例总览见 [`docs/overview.md`](./docs/overview.md)。

## 技术栈

- 运行时：Node.js `20.20.2`（由 `volta` 固定），ES Modules（`.mjs`）
- 包管理：`pnpm@9.15.9`
- 依赖：`@langchain/core`、`@langchain/openai`、`dotenv`、`zod`
- 模型接入：通过 `ChatOpenAI` + 自定义 `baseURL` 接入 OpenAI 协议兼容的第三方模型

## 目录结构

```
tool-test/
├── AGENTS.md                # 本文件
├── Readme.md                # 项目说明
├── .env / .env.local        # 环境变量（勿提交敏感值）
├── src/
│   ├── llm.mjs              # 公共模块：createModel()
│   └── cases/               # 案例 demo（按编号）
└── docs/                     # 配套笔记（按编号）
```

## 核心约定

### 1. 模型创建统一走公共模块

**禁止**在案例里重复写「加载 `.env` + new ChatOpenAI」。一律使用：

```js
import { createModel } from '../llm.mjs';
const model = createModel();          // 需要覆盖参数时：createModel({ temperature: 0.7 })
```

`createModel()` 已负责：加载环境变量、校验必填项、返回配置好的 `ChatOpenAI` 实例。

### 2. 环境变量按脚本位置加载

- 变量：`API_KEY`、`BASE_URL`、`MODEL_NAME`，配置在 `tool-test/.env` 或 `.env.local`（后者 `override` 优先）。
- `.env` 的定位基于**脚本文件位置**（`import.meta.url`），不依赖运行时工作目录，因此从任意目录运行都可用。
- **切勿**把密钥明文写进代码、笔记或提交到仓库。文档中只引用变量名。

### 3. 文件路径处理

工具/脚本内涉及读写文件时，相对路径要**基于项目根目录解析**（用 `import.meta.url` 推导），避免因运行时工作目录不同导致 `ENOENT`。参考 `src/cases/02-tool-file-read.mjs` 的 `projectRoot` 写法。

### 4. 案例命名规范

- Demo：`src/cases/<两位数编号>-<短横线名>.mjs`，如 `03-multi-turn.mjs`。
- 笔记：`docs/<同编号>-<同名>.md`，与 demo 一一对应。
- 运行输出样例（可选）：`docs/<编号>-<名>.output.md`。
- 新增案例后，需在 [`docs/overview.md`](./docs/overview.md) 的案例列表中登记。

### 5. 笔记文档结构

每份案例笔记建议包含：做了什么 → 涉及文件 → 代码拆解 → 运行流程 → 如何运行 → 常见问题 → 下一步。保持中文、面向学习者、可对照代码。

## 运行方式

```bash
pnpm install                              # 安装依赖
node src/cases/01-hello-langchain.mjs     # 运行指定案例
```

## 语言约定

代码注释、文档、提交说明与交流一律使用**简体中文**。

## 给 AI 协作者的注意事项

- 修改前先阅读 `docs/overview.md` 了解案例全貌。
- 新增功能优先考虑能否复用/扩展 `llm.mjs`，而非各处复制配置逻辑。
- 编辑已有文件前先读取当前内容，避免覆盖用户的手动改动。
- 不要创建与学习无关的临时文件；若为验证临时创建，用完清理。
