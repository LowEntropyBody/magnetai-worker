import dotenv from "dotenv"
import Chain from "./chain";
import Openai from "./openai";

dotenv.config();

const openai = new Openai(process.env.OPENAI_API_KEY);
const chain = new Chain(process.env.CHAIN_ADDRESS,process.env.CHAIN_ACCOUNT_SEED);

async function main() {
  await chain.init();
  chain.ask("hello, please introduce yourself");
  await chain.subscribeNewHeadsForAsk(openai);
}

main().catch(e => {
  console.error(e);
});
