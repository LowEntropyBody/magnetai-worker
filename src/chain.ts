import dotenv from "dotenv"
import { ApiPromise, WsProvider } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api/types';
import { Header, Extrinsic } from '@polkadot/types/interfaces';
import { Keyring } from '@polkadot/keyring';
import bluebird from 'bluebird';
import Monitor from './monitor';

const IntervalBlocks = 5;
const UpdateTimes = 10;

export default class Chain {
    private api!: ApiPromise;
    private seed: string;
    private address: string;

    private upload: boolean;
    private startUpdateBlock: number;
    private startUpdateTime: number;
    private currentUpdateTimes: number;
    private nonce: number;

    constructor(address: string, seed: string) {
        this.address = address;
        this.seed = seed;

        this.upload = false;
        this.startUpdateBlock = 0;
        this.startUpdateTime = 0;
        this.currentUpdateTimes = 0;
        this.nonce = 0;
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

    async subscribeNewHeads(monitor: Monitor): UnsubscribePromise {
        // Subscribe finalized event
        return await this.api.rpc.chain.subscribeNewHeads((head: Header) =>
            this.handler(head, monitor)
        );
    }

    async handler(head: Header, monitor: Monitor) {
        const blockNum = head.number.toNumber();
        console.log(`Handle the ${blockNum} block`);
        const blockHash = await this.api.rpc.chain.getBlockHash(blockNum);
        const block = await this.api.rpc.chain.getBlock(blockHash);
        const exs: Extrinsic[] = block.block.extrinsics;
        const at = await this.api.at(blockHash);

        if (this.upload) {
            if (blockNum >= this.startUpdateBlock && !(blockNum % IntervalBlocks)) {
                try {
                    this.metricsUpdate(monitor, this.startUpdateTime, this.nonce).finally(() => {
                        this.currentUpdateTimes++;
                        if (this.currentUpdateTimes == 5) {
                            this.upload = false;
                            this.startUpdateBlock = 0;
                            this.startUpdateTime = 0;
                            this.currentUpdateTimes = 0;
                        }
                    });
                } catch (error) {
                    console.error(error);
                }
            }
        } else {
            await at.query.system.events(async (events) => {
                events.forEach((record) => {
                    const { event, phase } = record;
                    // data should be like [who, nonce, model]
                    if (event.section === 'market' && event.method === 'Order' && event.data.length >= 3) {
                        const who = event.data[0];
                        this.nonce = event.data[1];
                        const model = Buffer.from(event.data[2], 'hex').toString();
                        try {
                            this.startAImodel(who, this.nonce, model);
                            this.apiReady(this.nonce, process.env.API_ADDRESS).then(() => {
                                this.upload = true;
                                this.startUpdateBlock = blockNum + 2;
                                this.startUpdateTime = Date.parse(new Date().toString());
                            });
                        } catch (error) {
                            console.error(error);
                        }
                    }
                });
            });
        }
    }

    // Demo
    startAImodel(who: string, nonce: number, model: string) {
        //Logs
    }

    async apiReady(nonce: number, apiAddress: string) {
        // 1. Construct add-prepaid tx
        const tx = this.api.tx.market.apiReady(nonce, apiAddress);

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
                            console.log(`✅  API ready success!`);
                            resolve(true);
                        }
                    });
                }
            }).catch(e => {
                reject(e);
            })
        });
    }

    async metricsUpdate(monitor: Monitor, startTime: number, nonce: number) {
        // 1. Construct add-prepaid tx
        const tx = this.api.tx.market.metricsUpdate("");

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
                            console.log(`✅  Metrics Update success!`);
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
