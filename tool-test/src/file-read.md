$ node ./src/tool-file-read.mjs
AIMessage {
  "id": "0692f662c41fd4af2d52bc1539d9bc16",
  "content": "<think>\n用户要求读取 src/tool-file-read.mjs 文件并解释代码。让我调用 read_file 工具来获取文件内容。\n</th
ink>\n",
  "additional_kwargs": {
    "tool_calls": [
      {
        "id": "call_function_1tqh6amia4kr_1",
        "type": "function",
        "function": "[Object]",
        "index": 0
      }
    ]
  },
  "response_metadata": {
    "tokenUsage": {
      "promptTokens": 541,
      "completionTokens": 60,
      "totalTokens": 601
    },
    "finish_reason": "tool_calls",
    "model_provider": "openai",
    "model_name": "MiniMax-M3"
  },
  "tool_calls": [
    {
      "name": "read_file",
      "args": {
        "filePath": "src/tool-file-read.mjs"
      },
      "type": "tool_call",
      "id": "call_function_1tqh6amia4kr_1"
    }
  ],
  "invalid_tool_calls": [],
  "usage_metadata": {
    "output_tokens": 60,
    "input_tokens": 541,
    "total_tokens": 601,
    "input_token_details": {
      "cache_read": 114
    },
    "output_token_details": {}
  }
}

[检测到 1 个工具调用]
  [执行工具] read_file({"filePath":"src/tool-file-read.mjs"})
  [工具调用] read_file("src/tool-file-read.mjs") - 成功读取 3206 字节

[最终回复]
<think>
现在我有了文件内容，让我详细解释这个代码。

这是一个使用 LangChain 框架的 Node.js 脚本，演示了如何让 AI 模型调用自定义工具来读取文件。主要功能：
1. 加载环境变量
2. 创建 OpenAI 兼容的聊天模型
3. 定义一个读取文件的工具
4. 通过系统消息指示 AI 在需要时调用工具
5. 处理工具调用的循环

让我详细解释每一部分。
</think>
# `src/tool-file-read.mjs` 代码解释

这是一个使用 **LangChain** 框架的 Node.js 脚本，演示了如何让大语言模型（LLM）通过 **Function Calling（工具调用）** 机制
来读取本地文件并解释代码。本质上就是用 AI 自己来回答你当前问的这个问题（"解释这个文件"）。

## 整体架构

代码采用"模型 + 工具 + 循环"的标准 Agent 模式：

```
用户提问 → 模型决定调用工具 → 执行工具 → 把结果回传模型 → 模型生成最终回复
```

下面分模块详细说明。

---

## 1. 依赖与环境变量加载

```js
import { config as loadEnv } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'

loadEnv({ path: '.env', quiet: true });
loadEnv({ path: '.env.local', override: true, quiet: true });
```

- `dotenv`：从 `.env` 文件加载环境变量。
- `ChatOpenAI`：LangChain 提供的 OpenAI 兼容聊天模型客户端。
- `tool`：用于把普通函数包装成 LangChain 工具。
- 各种 `Message` 类：构造对话消息。
- `z`（Zod）：用于声明工具入参的 **JSON Schema**。
- **环境变量优先级**：先加载 `.env`，再用 `.env.local` `override: true` 覆盖，方便本地开发时调试而不影响主配置。

## 2. 模型初始化与校验

```js
const apiKey = process.env.API_KEY;
const baseURL = process.env.BASE_URL;
const modelName = process.env.MODEL_NAME || 'MiniMax-M3';

if (!apiKey || !baseURL) {
    throw new Error(...)
}

const model = new ChatOpenAI({
    model: modelName,
    apiKey,
    temperature: 0,
    timeout: 30000,
    configuration: { baseURL },
});
```

- `temperature: 0` 让输出稳定、可复现，适合工具调用。
- `timeout: 30000` 防止网络卡死。
- 由于 `ChatOpenAI` 支持 OpenAI 兼容协议，所以可以通过 `baseURL` 接入 **MiniMax** 等第三方模型服务（代码默认模型名就是 `
MiniMax-M3`）。
- 主动校验环境变量能给出**清晰的中文错误提示**，比让 OpenAI 客户端抛隐晦的英文错更友好。

## 3. 定义工具：read_file

```js
const readFileTool = tool(
    async ({ filePath }) => {
        const content = await fs.readFile(filePath, 'utf-8');
        console.log(`  [工具调用] read_file("${filePath}") - 成功读取 ${content.length} 字节`);
        return `文件内容:\n${content}`;
    },
    {
        name: 'read_file',
        description: '用此工具来读取文件内容...',
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径'),
        }),
    }
);
```

这是整个示例的核心。`tool()` 工厂接收两个参数：

1. **执行函数** `async ({ filePath }) => {...}`：真正干活的代码，用 Node 内置 `fs/promises` 异步读文件，并返回字符串。
2. **配置**：
   - `name`：工具唯一标识，模型会通过这个名字来"点名"调用。
   - `description`：告诉模型**什么时候**应该调用此工具，措辞很关键，模型靠它判断是否触发。
   - `schema`：用 Zod 定义入参约束（类型 + 描述），LangChain 会自动转成 JSON Schema 发送给模型，模型据此生成**结构化参数
**。

## 4. 绑定工具到模型

```js
const tools = [readFileTool];
const modelWithTools = model.bindTools(tools);
```

`bindTools` 相当于告诉模型："你可以调用以下这些工具"，模型会在需要时返回 `tool_calls` 字段而不是直接生成回复文本。

## 5. 构造对话

```js
const messages = [
    new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。
工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释
...`),
    new HumanMessage('请读取 src/tool-file-read.mjs 文件内容并解释代码')
];
```

- `SystemMessage` 定义 AI 角色和工作流。
- `HumanMessage` 是用户的实际问题。
- LangChain 用消息数组维护对话历史。

## 6. 工具调用循环（核心逻辑）

```js
let response = await modelWithTools.invoke(messages);
messages.push(response);

while (response.tool_calls && response.tool_calls.length > 0) {
    const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
            const matchedTool = tools.find(t => t.name === toolCall.name);
            ...
            const result = await matchedTool.invoke(toolCall.args);
            return result;
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

这段实现了一个**标准的多步骤 Agent 循环**：

1. **第一次调用**：模型看到用户问题，决定调用 `read_file` 工具，返回的 `response` 里包含 `tool_calls`（而不是普通文本）
。
2. **执行工具**：用 `Promise.all` **并行**执行所有工具调用（支持一次问多个文件）。
3. **容错**：`try/catch` 兜底，并把错误转成字符串返回给模型，让模型有自我纠错的机会。
4. **回传结果**：用 `ToolMessage` 把工具结果塞回消息历史。**`tool_call_id` 必须和 `tool_calls[i].id` 对应**，否则模型会"
对不上号"。
5. **再次调用**：把累积的消息历史重新发给模型，模型此时就能基于文件内容生成最终答复。
6. **退出条件**：当响应里 `tool_calls` 为空时，循环结束，`response.content` 就是最终答案。

> 注意：模型**理论上可能连续调用多轮工具**（比如读完文件发现还要查别的文件），所以这里用 `while` 而不是 `if`。

## 7. 输出最终结果

```js
console.log('\n[最终回复]');
console.log(response.content);
```

## 总结

这个文件展示了一个**最小可用的 Tool-Use Agent**：

| 关键概念 | 实现方式 |
|---------|---------|
| 工具注册 | `tool(fn, {name, description, schema})` |
| 工具绑定 | `model.bindTools(tools)` |
| 工具调用检测 | `response.tool_calls` |
| 多工具并行 | `Promise.all` + `tool_call_id` 匹配 |
| 多轮工具调用 | `while` 循环 |
| 容错 | `try/catch` 把错误转成字符串返回 |

你刚刚看到的"我用工具读取并解释自己"的回复，**就是这个脚本的实际运行过程**。
