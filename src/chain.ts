import { ApiPromise, WsProvider } from '@polkadot/api';
import { UnsubscribePromise } from '@polkadot/api/types';
import { Header, Extrinsic,EventRecord } from '@polkadot/types/interfaces';
import { Keyring } from '@polkadot/keyring';
import bluebird from 'bluebird';
import Openai from './openai';

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

    async subscribeNewHeadsForAsk(openai: Openai): UnsubscribePromise {
        // Subscribe finalized event
        return await this.api.rpc.chain.subscribeFinalizedHeads((head: Header) =>
            this.handlerAsk(head, openai)
        );
    }

    async handlerAsk(head: Header, openai: Openai) {
        const blockHash = await this.api.rpc.chain.getBlockHash(head.number.toNumber());
        const block = await this.api.rpc.chain.getBlock(blockHash);
        const exs: Extrinsic[] = block.block.extrinsics;
        const at = await this.api.at(blockHash);
        await at.query.system.events((events) => {
            console.log(`\nReceived ${events.length} events:`);
        
            // Loop through the Vec<EventRecord>
            events.forEach((record) => {
              // Extract the phase, event and the event types
              const { event, phase } = record;
              const types = event.typeDef;
        
              // Show what we are busy with
              console.log(`\t${event.section}:${event.method}:: (phase=${phase.toString()})`);
              console.log(`\t\t${event.meta.documentation.toString()}`);
        
              // Loop through each of the parameters, displaying the type and data
              event.data.forEach((data, index) => {
                console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
              });
            });
          });
    }

    async reply(nonce: number, message: string) {
        // 1. Construct add-prepaid tx
        const tx = this.api.tx.ai.reply(nonce, message);

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
                            console.log(`✅  Reply success!`);
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