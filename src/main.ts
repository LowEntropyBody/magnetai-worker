import dotenv from "dotenv"
import Chain from "./chain";
import Monitor from "./monitor";

dotenv.config();

const monitor = new Monitor();
const chain = new Chain(process.env.CHAIN_ADDRESS,process.env.CHAIN_ACCOUNT_SEED);

async function main() {
  await chain.init();
  await chain.subscribeNewHeads(monitor);
}

main().catch(e => {
  console.error(e);
});
