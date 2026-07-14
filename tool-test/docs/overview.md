# LangChain 学习案例总览

本工程用一系列**由浅入深的独立案例**学习 LangChain 调用大模型。每个案例 = 一个可运行的 demo（`src/cases/`）+ 一份配套笔记（`docs/`）。

## 设计约定

- **公共模块复用**：所有案例的「加载配置 + 创建模型」统一走 `src/llm.mjs` 的 `createModel()`，案例本身只关注要演示的知识点。
- **编号命名**：demo 与笔记一一对应，用两位数编号（`01`、`02`……）标明学习顺序。
- **配置集中**：环境变量放在 `tool-test/.env` / `.env.local`，按脚本位置加载，从任意目录运行都可用。

## 案例列表

| 编号 | 案例 | 知识点 | Demo | 笔记 | 状态 |
|------|------|--------|------|------|------|
| 01 | hello-langchain | 单轮对话最小闭环：`createModel` / `invoke` / `content` | `src/cases/01-hello-langchain.mjs` | [01-hello-langchain.md](./01-hello-langchain.md) | ✅ 已完成 |
| 02 | tool-file-read | 工具调用（Tool Calling）：`tool()` / `bindTools` / `tool_calls` 循环 | `src/cases/02-tool-file-read.mjs` | [02-tool-file-read.md](./02-tool-file-read.md) | ✅ 已完成 |
| 03 | multi-turn | 多轮对话：维护 `messages` 历史 | _待补充_ | _待补充_ | ⬜ 规划中 |
| 04 | streaming | 流式输出：`stream()` / `streamEvents()` | _待补充_ | _待补充_ | ⬜ 规划中 |
| 05 | structured-output | 结构化输出：`withStructuredOutput` + Zod | _待补充_ | _待补充_ | ⬜ 规划中 |
| 06 | multi-tool-agent | 多工具 Agent：工具编排与并行调用 | _待补充_ | _待补充_ | ⬜ 规划中 |

> 03~06 为后续学习规划，尚未实现。新增案例时遵循「编号命名 + 复用 `createModel()` + 配套笔记」的约定。

## 推荐学习路径

1. **01 单轮对话** —— 打通配置与调用链路，理解 `AIMessage` 与 `content`。
2. **02 工具调用** —— 理解 Agent 的「模型决定动作 → 执行 → 回传 → 再生成」循环。
3. **03+ 进阶** —— 在前两者基础上叠加多轮记忆、流式、结构化输出、多工具编排。

## 目录结构

```
tool-test/
├── AGENTS.md                # 给 AI 协作者的项目约定
├── Readme.md                # 项目说明
├── .env / .env.local        # 环境变量（不提交敏感值）
├── src/
│   ├── llm.mjs              # 公共模块：createModel()
│   └── cases/               # 案例 demo（按编号）
│       ├── 01-hello-langchain.mjs
│       └── 02-tool-file-read.mjs
└── docs/                     # 配套笔记（按编号）
    ├── overview.md          # 本文件：案例索引
    ├── 01-hello-langchain.md
    ├── 02-tool-file-read.md
    └── 02-tool-file-read.output.md  # 运行样例存档
```
