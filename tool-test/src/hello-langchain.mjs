import { config } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';

// 先加载 .env，再加载 .env.local（后者优先级更高，便于本地覆盖）
config({ path: '.env', quiet: true });
config({ path: '.env.local', override: true, quiet: true });

const apiKey = process.env.API_KEY;
const baseURL = process.env.BASE_URL;
const modelName = process.env.MODEL_NAME;

if (!apiKey || !baseURL) {
    throw new Error(
        `缺少环境变量：API_KEY=${apiKey ? '已设置' : '未设置'}, BASE_URL=${baseURL ? '已设置' : '未设置'}。` +
        `请设置环境变量或在 tool-test/.env 中配置。`
    );
}

const model = new ChatOpenAI({
    model: modelName,
    apiKey,
    configuration: {
        baseURL,
    }
});

const response =  await model.invoke("请介绍下你自己?");

console.log(response.content);
