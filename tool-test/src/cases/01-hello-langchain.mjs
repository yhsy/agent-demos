import { createModel } from '../llm.mjs';

const model = createModel();

const response = await model.invoke("请介绍下你自己?");

console.log(response.content);
