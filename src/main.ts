import dotenv from "dotenv"
import { Configuration, OpenAIApi } from "openai";

dotenv.config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function runCompletion() {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [{"role": "user", "content": "How are you"}],
  });
  console.log(completion.data.choices[0].message.content);
}

async function main() {
  await runCompletion();
}

main().catch(e => {
  console.error(e);
});
