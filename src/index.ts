import PromiseWorker from "promise-worker"
import { CmdMessage } from "./wasm-worker";

export class WebAssemblyWorkerBuilder {
    private _promiseWorker: PromiseWorker
    private _moduleUrl: string;
    private _wasmUrl?: string;

    constructor(moduleUrl: string, wasmUrl?: string) {
        this._moduleUrl = moduleUrl;
        wasmUrl && (this._wasmUrl = wasmUrl);
    }

    async buildManager() {
        let msg: CmdMessage;
        const worker = new Worker(new URL("./wasm-worker", import.meta.url))
        this._promiseWorker = new PromiseWorker(worker);
        const manager: any = {
            createHEAP: async (data: ArrayBuffer): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAP8: async (data: Int8Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [data]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAP16: async (data: Int16Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAP32: async (data: Int32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAPF32: async (data: Float32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAPF64: async (data: Float32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAPU8: async (data: Uint8Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAPU16: async (data: Uint16Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            createHEAPU32: async (data: Uint32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await this._promiseWorker.postMessage(msg);
            },
            freeHEAP: async (ptr: number): Promise<boolean> => {
                msg = { cmd: "freeHeap", args: [ptr]}
                return await this._promiseWorker.postMessage(msg);
            },
            getHEAP: async (ptr: number, bytes: number): Promise<Int8Array> => {
                msg = { cmd: "getHeap", args: [ptr, bytes]}
                return await this._promiseWorker.postMessage(msg);
            },
            getHEAP8: async (ptr: number, len: number): Promise<Int8Array> => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return await this._promiseWorker.postMessage(msg);
            },
            getHEAP16: async (ptr: number, len: number): Promise<Int16Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Int16Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAP32: async (ptr: number, len: number): Promise<Int32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Int32Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPF32: async (ptr: number, len: number): Promise<Float32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Float32Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPF64: async (ptr: number, len: number): Promise<Float64Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 8]}
                return new Float64Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU8: async (ptr: number, len: number): Promise<Uint8Array> => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return new Uint8Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU16: async (ptr: number, len: number): Promise<Uint16Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Uint16Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU32: async (ptr: number, len: number): Promise<Uint32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Uint32Array((await this._promiseWorker.postMessage(msg)).buffer);
            },
        };
        msg = { cmd: "load", args: [this._moduleUrl, this._wasmUrl]}
        await this._promiseWorker.postMessage(msg);
        msg = { cmd: "getKeys" }
        const keys: string[] = await this._promiseWorker.postMessage(msg);
        keys.forEach(k => {
            manager[k] = async (...funcArgs: any[]) => {
                const msg: CmdMessage = { cmd: "call", args: [k, funcArgs]}
                return await this._promiseWorker.postMessage(msg);
            }
        });
        return manager;
    }
}