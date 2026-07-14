# 案例 02 · 运行样例

> 这是 `src/cases/02-tool-file-read.mjs` 的一次真实运行输出存档，配合 [02-tool-file-read.md](./02-tool-file-read.md) 对照学习。
> 注意：下方 `content` 中的 `MiniMax-M3` 等模型名取决于当时 `.env` 的 `MODEL_NAME` 配置，可能与你本地不同。

```text
$ node src/cases/02-tool-file-read.mjs
AIMessage {
  "id": "0692f662c41fd4af2d52bc1539d9bc16",
  "content": "<think>\n用户要求读取文件并解释代码。让我调用 read_file 工具来获取文件内容。\n</think>\n",
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
        "filePath": "src/cases/02-tool-file-read.mjs"
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

[检测到 1 个工具调用]
  [执行工具] read_file({"filePath":"src/cases/02-tool-file-read.mjs"})
  [工具调用] read_file("src/cases/02-tool-file-read.mjs") - 成功读取 3206 字节

[最终回复]
（模型基于文件内容生成的代码解释……）
```

## 关键观察

- 第一次响应 `finish_reason` 是 `tool_calls`，`content` 里只有思考过程，真正的「动作」在 `tool_calls` 字段里。
- `tool_calls[].id` 会在回传 `ToolMessage` 时用作 `tool_call_id`，两者必须匹配。
- `usage_metadata` 可观察 token 消耗与缓存命中（`cache_read`）。
- 工具执行完把结果回传后，模型第二次响应才产出最终的 `content`（代码解释）。
