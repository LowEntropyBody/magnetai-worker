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
        const completion = await this.openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "user", "content": question }],
        });
        return completion.data.choices[0].message.content;
    }
}