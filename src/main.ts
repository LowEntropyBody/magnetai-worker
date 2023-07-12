import dotenv from "dotenv"
import Chain from "./chain";
import Moniter from "./moniter";

dotenv.config();

const moniter = new Moniter();
const chain = new Chain(process.env.CHAIN_ADDRESS,process.env.CHAIN_ACCOUNT_SEED);

async function main() {
  await chain.init();
  await chain.subscribeNewHeads(moniter);
}

main().catch(e => {
  console.error(e);
});
