import PromiseWorker from "promise-worker"
import { CmdMessage } from "./wasm-worker";

export class WebAssemblyWorkerBuilder {
    private _promiseWorker: PromiseWorker
    private _assetsUrl: string;

    constructor(assetsUrl: string) {
        this._assetsUrl = assetsUrl;
    }

    async createManager() {
        const worker = new Worker(new URL("./wasm-worker", import.meta.url))
        this._promiseWorker = new PromiseWorker(worker);
        const manager: any = {};
        let msg: CmdMessage = { cmd: "load", args: [this._assetsUrl]}
        await this._promiseWorker.postMessage(msg);
        msg = { cmd: "getKeys" }
        const keys: string[] = await this._promiseWorker.postMessage(msg);
        keys.forEach(k => {
            manager[k] = async function(...funcArgs: any[]) {
                const msg: CmdMessage = { cmd: "call", args: [k, funcArgs]}
                return await this._promiseWorker.postMessage(msg);
            }
        });
        return manager;
    }
}