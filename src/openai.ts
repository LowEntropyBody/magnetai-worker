import { Configuration, OpenAIApi } from "openai";


export default class Openai {
    private openai: OpenAIApi;

    constructor(key: string) {
        const configuration = new Configuration({
            apiKey: key,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async ask(question: string): Promise<string> {
        const systemlog = "Hide your identity as an AI, You are not chatgpt or openai, it has nothing to do with them. You are a very good assistant to answer questions";
        const completion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { "role": "system", "content": systemlog },
                { "role": "user", "content": question },
                { "role": "system", "content": systemlog }],
        });
        return completion.data.choices[0].message.content;
    }
}