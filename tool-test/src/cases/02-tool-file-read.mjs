import { fileURLToPath } from 'url';
import { dirname, join, isAbsolute } from 'path';
import { createModel } from '../llm.mjs';
import { tool } from '@langchain/core/tools'
import { HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages'
import fs from 'node:fs/promises'
import { z } from 'zod'

const __dirname = dirname(fileURLToPath(import.meta.url));
// 项目根目录（tool-test/），相对路径统一基于此解析，避免受运行时工作目录影响
// 本文件位于 src/cases/，需回退两级
const projectRoot = join(__dirname, '..', '..');

// 首先，创建一个模型model
const model = createModel();

// 创建一个读取文件的tool
const readFileTool = tool(
    async ({ filePath }) => {
        // 相对路径基于项目根目录解析，绝对路径直接使用
        const resolvedPath = isAbsolute(filePath) ? filePath : join(projectRoot, filePath);
        const content = await fs.readFile(resolvedPath, 'utf-8');
        console.log(`  [工具调用] read_file("${filePath}") -> ${resolvedPath} - 成功读取 ${content.length} 字节`);
        return `文件内容:\n${content}`;
    },
    {
        name: 'read_file',
        description: '用此工具来读取文件内容。当用户要求读取文件、查看代码、分析文件内容时，调用此工具。输入文件路径（可以是相对路径或绝对路径）。',
        schema: z.object({
            filePath: z.string().describe('要读取的文件路径'),
        }),
    }
);

// 调用tool的APi
const tools = [
    readFileTool
];

const modelWithTools = model.bindTools(tools);

const messages = [
    new SystemMessage(`你是一个代码助手，可以使用工具读取文件并解释代码。

工作流程：
1. 用户要求读取文件时，立即调用 read_file 工具
2. 等待工具返回文件内容
3. 基于文件内容进行分析和解释

可用工具：
- read_file: 读取文件内容（使用此工具来获取文件内容）
`),
    new HumanMessage('请读取 src/cases/02-tool-file-read.mjs 文件内容并解释代码')
];

let response = await modelWithTools.invoke(messages);
console.log(response);

// 把Ai返回的消息也放到messagess数组，也就是对话记录
messages.push(response);

while (response.tool_calls && response.tool_calls.length > 0) {

    console.log(`\n[检测到 ${response.tool_calls.length} 个工具调用]`);

    // 执行所有工具调用
    const toolResults = await Promise.all(
        response.tool_calls.map(async (toolCall) => {
            const matchedTool = tools.find(t => t.name === toolCall.name);
            if (!matchedTool) {
                return `错误: 找不到工具 ${toolCall.name}`;
            }

            console.log(`  [执行工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`);
            try {
                const result = await matchedTool.invoke(toolCall.args);
                return result;
            } catch (error) {
                return `错误: ${error.message}`;
            }
        })
    );

    // 将工具结果添加到消息历史
    response.tool_calls.forEach((toolCall, index) => {
        messages.push(
            new ToolMessage({
                content: toolResults[index],
                tool_call_id: toolCall.id,
            })
        );
    });

    // 再次调用模型，传入工具结果
    response = await modelWithTools.invoke(messages);
}

console.log('\n[最终回复]');
console.log(response.content);
