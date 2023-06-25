import dotenv from "dotenv"
import { Configuration, OpenAIApi } from "openai";

dotenv.config();
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function runCompletion() {
  const completion = await openai.createCompletion({
    model: "gpt-3.5-turbo",
    prompt: "How are you today?",
    max_tokens: 4000
  });
  console.log(completion.data.choices[0].text);
}

async function main() {
  await runCompletion();
}

main().catch(e => {
  console.error(e);
});
