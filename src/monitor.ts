import dotenv from "dotenv"
import { GPU_INFO_CMD } from "./config";
import { Metrics, GPUInfo } from "./types";
const axios = require('axios');
const { exec } = require('child_process');

export default class Monitor {
  private lastTotalReqNum = 0;

  constructor() {
  }

  async updateLastTotal() {
    try {
      const data = await axios.get(
        `${process.env.WORKER_URL}/metrics`,
        {
          'content-type': 'application/json'
        }
      );
      const res = data.data?.results;
      if (res) {
        for (const r of res) {
          this.lastTotalReqNum = r.count;
          break;
        }
      }
    } catch (e: any) {
      console.error(`Get information from worker failed, error message:${e.message}.`);
    }
  }

  async getInfo(): Promise<Metrics> {
    // Get information from worker
    let reqCount = -1;
    try {
      const data = await axios.get(
        `${process.env.WORKER_URL}/metrics`,
        {
          'content-type': 'application/json'
        }
      );
      const res = data.data?.results;
      if (res) {
        for (const r of res) {
          reqCount = r.count - this.lastTotalReqNum;
          break;
        }
      }
    } catch (e: any) {
      //console.error(`Get information from worker failed, error message:${e.message}.`);
      throw new Error(`Get information from worker failed, error message:${e.message}`);
    }

    // Get gpu information
    let gpuInfo: any;
    try {
      const shellPromise = new Promise((resolve, reject) => {
        exec(GPU_INFO_CMD, {shell:'/bin/bash'}, (error, stdout, stderr) => {
          if (error) {
            reject(error.message);
          }
          if (stderr) {
            reject(stderr);
          }
          resolve(stdout);
        })
      });
      const gpuInfoStr = await shellPromise; 
      if (typeof gpuInfoStr === 'string') {
        gpuInfo = JSON.parse(gpuInfoStr);
      }
    } catch (e: any) {
      //console.error(`Get information from nvidia failed, error message:${e}`);
      throw new Error(`Get information from nvidia failed, error message:${e}`);
    }

    return {
      httpRequest: reqCount,
      gpuInfo: gpuInfo
    };
  }
}
