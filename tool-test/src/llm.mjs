import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 先加载 .env，再加载 .env.local（后者优先级更高，便于本地覆盖）
// 基于脚本文件位置定位，避免受运行时工作目录影响
config({ path: join(__dirname, '..', '.env'), quiet: true });
config({ path: join(__dirname, '..', '.env.local'), override: true, quiet: true });

/**
 * 创建一个配置好的 ChatOpenAI 实例
 * 环境变量统一从 .env / .env.local 读取：API_KEY、BASE_URL、MODEL_NAME
 *
 * @param {Object} [options] - 透传给 ChatOpenAI 的额外配置，会与默认值合并
 * @returns {ChatOpenAI}
 */
export function createModel(options = {}) {
    const apiKey = process.env.API_KEY;
    const baseURL = process.env.BASE_URL;
    const modelName = process.env.MODEL_NAME || 'MiniMax-M3';

    if (!apiKey || !baseURL) {
        throw new Error(
            `缺少环境变量：API_KEY=${apiKey ? '已设置' : '未设置'}, BASE_URL=${baseURL ? '已设置' : '未设置'}。` +
            `请设置环境变量或在 tool-test/.env 中配置。`
        );
    }

    return new ChatOpenAI({
        model: modelName,
        apiKey,
        temperature: 0,
        timeout: 30000,
        configuration: {
            baseURL,
        },
        ...options,
    });
}
