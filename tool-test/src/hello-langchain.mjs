// 配置大模型
import { createModel } from "./llm.mjs";

// 创建大模型
const model = createModel();

// 调用大模型
const res = await model.invoke('你好，请问你是什么大模型？你能做哪些事情？');

// 输出大模型返回的内容
console.log(`res===>>>${res.content}`)