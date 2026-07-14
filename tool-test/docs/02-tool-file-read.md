# 案例 02 · tool-file-read（工具调用 / Tool Calling）

> 对应 `src/cases/02-tool-file-read.mjs`，演示如何让大模型通过 **Function Calling（工具调用）** 读取本地文件并解释代码。

## 1. 这个案例做了什么

在案例 01 的基础上，给模型绑定一个自定义工具 `read_file`。当用户要求「读取并解释某个文件」时，模型会**自己决定调用工具**，脚本执行工具拿到文件内容后回传给模型，模型再基于内容生成最终解释。

这是一个**最小可用的 Tool-Use Agent**，采用「模型 + 工具 + 循环」的标准模式：

```
用户提问 → 模型决定调用工具 → 执行工具 → 把结果回传模型 → 模型生成最终回复
```

## 2. 涉及文件

```
tool-test/src/
├── llm.mjs                       # 复用：createModel()
└── cases/
    └── 02-tool-file-read.mjs     # 本案例入口
```

## 3. 整体逻辑（代码拆解）

### 3.1 依赖与模型创建

```js
import { createModel } from '../llm.mjs';
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'

const model = createModel();
```

- `tool`：把普通函数包装成 LangChain 工具。
- 各种 `Message` 类：构造对话消息。
- `z`（Zod）：声明工具入参的 **JSON Schema**。
- 模型创建复用 `createModel()`，无需重复写配置加载。

### 3.2 路径解析（避免 ENOENT 坑）

```js
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..'); // 本文件在 src/cases/，回退两级到 tool-test/
```

> 工具内 `fs.readFile` 默认按**运行时工作目录**解析相对路径。若不处理，从子目录运行时模型传入的相对路径会被拼错导致 `ENOENT`。这里统一把相对路径基于项目根目录解析，绝对路径则直接使用。

### 3.3 定义工具：read_file

```js
const readFileTool = tool(
    async ({ filePath }) => {
        const resolvedPath = isAbsolute(filePath) ? filePath : join(projectRoot, filePath);
        const content = await fs.readFile(resolvedPath, 'utf-8');
        return `文件内容:\n${content}`;
    },
    {
        name: 'read_file',
        description: '用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。',
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径'),
        }),
    }
);
```

`tool()` 工厂接收两个参数：

1. **执行函数**：真正干活的代码，异步读文件并返回字符串。
2. **配置**：
   - `name`：工具唯一标识，模型通过它「点名」调用。
   - `description`：告诉模型**什么时候**该调用此工具，措辞很关键，模型靠它判断是否触发。
   - `schema`：用 Zod 定义入参约束，LangChain 自动转成 JSON Schema 发给模型，模型据此生成**结构化参数**。

### 3.4 绑定工具到模型

```js
const tools = [readFileTool];
const modelWithTools = model.bindTools(tools);
```

`bindTools` 相当于告诉模型「你可以调用以下工具」，模型会在需要时返回 `tool_calls` 字段而不是直接生成回复文本。

### 3.5 构造对话

```js
const messages = [
    new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。...`),
    new HumanMessage('请读取 src/cases/02-tool-file-read.mjs 文件内容并解释代码')
];
```

- `SystemMessage` 定义 AI 角色和工作流。
- `HumanMessage` 是用户的实际问题。
- LangChain 用消息数组维护对话历史。

### 3.6 工具调用循环（核心）

```js
let response = await modelWithTools.invoke(messages);
messages.push(response);

while (response.tool_calls && response.tool_calls.length > 0) {
    const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
            const matchedTool = tools.find(t => t.name === toolCall.name);
            return await matchedTool.invoke(toolCall.args);
        })
    );

    response.tool_calls.forEach((toolCall, index) => {
        messages.push(new ToolMessage({
            content: toolResults[index],
            tool_call_id: toolCall.id,
        }));
    });

    response = await modelWithTools.invoke(messages);
}
```

标准的多步骤 Agent 循环：

1. **第一次调用**：模型决定调用 `read_file`，返回的 `response` 里含 `tool_calls`（而非普通文本）。
2. **执行工具**：用 `Promise.all` **并行**执行所有工具调用（支持一次问多个文件）。
3. **容错**：`try/catch` 兜底，把错误转成字符串返回给模型，让它有自我纠错的机会。
4. **回传结果**：用 `ToolMessage` 把结果塞回消息历史。**`tool_call_id` 必须与 `tool_calls[i].id` 对应**，否则模型「对不上号」。
5. **再次调用**：把累积的消息历史重新发给模型，它据此生成最终答复。
6. **退出条件**：响应里 `tool_calls` 为空时循环结束，`response.content` 即最终答案。

> 用 `while` 而非 `if`：模型可能连续调用多轮工具（读完一个文件发现还要读别的）。

## 4. 核心概念速查

| 关键概念 | 实现方式 |
|---------|---------|
| 工具注册 | `tool(fn, {name, description, schema})` |
| 工具绑定 | `model.bindTools(tools)` |
| 工具调用检测 | `response.tool_calls` |
| 多工具并行 | `Promise.all` + `tool_call_id` 匹配 |
| 多轮工具调用 | `while` 循环 |
| 容错 | `try/catch` 把错误转成字符串返回 |

## 5. 如何运行

```bash
node src/cases/02-tool-file-read.mjs
```

运行后模型会调用 `read_file` 读取本案例自身文件，并给出代码解释。真实运行输出可参考 [运行样例](./02-tool-file-read.output.md)。

## 6. 常见问题

| 现象 | 原因 | 解决 |
| --- | --- | --- |
| 读取文件报 `ENOENT` | 相对路径按运行时工作目录解析被拼错 | 已通过 `projectRoot` 修正；确认从项目内运行 |
| 模型不调用工具 | `description` 描述不清 / 提示词没引导 | 优化工具 `description`，在 `SystemMessage` 中明确工作流 |
| 报错 `tool_call_id` 不匹配 | `ToolMessage` 的 id 与 `tool_calls[i].id` 未对应 | 回传结果时严格用 `toolCall.id` |

## 7. 下一步

理解本案例后，可在其基础上扩展：多工具编排、结合 `withStructuredOutput` 让工具产出结构化结果、或改造成多轮对话式 Agent。
