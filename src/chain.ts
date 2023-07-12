import { ApiPromise, WsProvider } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api/types';
import { Header, Extrinsic, EventRecord } from '@polkadot/types/interfaces';
import { Keyring } from '@polkadot/keyring';
import bluebird from 'bluebird';
import Moniter from './moniter';

export default class Chain {
    private api!: ApiPromise;
    private seed: string;
    private address: string;

    constructor(address: string, seed: string) {
        this.address = address;
        this.seed = seed;
    }

    async init(): Promise<void> {
        if (this.api && this.api.disconnect) {
            this.api.disconnect().then().catch();
        }

        this.api = new ApiPromise({
            provider: new WsProvider(this.address)
        });

        await this.api.isReady;
        while (!this.api.isConnected) {
            console.log('Waiting for api to connect');
            await bluebird.delay(1000);
        }
    }

    async subscribeNewHeads(moniter: Moniter): UnsubscribePromise {
        // Subscribe finalized event
        return await this.api.rpc.chain.subscribeNewHeads((head: Header) =>
            this.handler(head, moniter)
        );
    }

    async handler(head: Header, moniter: Moniter) {
        console.log(`Handle the ${head.number.toNumber()} block`);
        const blockHash = await this.api.rpc.chain.getBlockHash(head.number.toNumber());
        const block = await this.api.rpc.chain.getBlock(blockHash);
        const exs: Extrinsic[] = block.block.extrinsics;
        const at = await this.api.at(blockHash);
        await at.query.system.events((events) => {
            events.forEach((record) => {
                const { event, phase } = record;
                // data should be like [whos, nonce, message]
                if (event.section === 'ai' && event.method === 'Ask' && event.data.length >= 3) {
                    const whose = event.data[0];
                    const nonce = event.data[1];
                    const question = Buffer.from(event.data[2], 'hex').toString();
                    // For demo, no queue
                }
            });
        });
    }

    async ask(message: string) {
        // 1. Construct add-prepaid tx
        const tx = this.api.tx.ai.ask(message);

        // 2. Load seeds(account)
        const kr = new Keyring({ type: 'sr25519' });
        const krp = kr.addFromUri(this.seed);

        // 3. Send transaction
        await this.api.isReadyOrError;
        return new Promise((resolve, reject) => {
            tx.signAndSend(krp, ({ events = [], status }) => {
                console.log(`💸  Tx status: ${status.type}, nonce: ${tx.nonce}`);
                if (status.isInBlock) {
                    events.forEach(({ event: { method } }) => {
                        if (method === 'ExtrinsicSuccess') {
                            console.log(`✅  Ask success!`);
                            resolve(true);
                        }
                    });
                }
            }).catch(e => {
                reject(e);
            })
        });
    }
}