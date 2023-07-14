export interface GPUInfo {
  gpuType: string;
  powerLimit: string;
  powerDraw: string;
  memoryTotal: string;
  memoryused: string;
}

export interface Metrics {
  httpRequest: number;
  gpuInfo: GPUInfo;
}
