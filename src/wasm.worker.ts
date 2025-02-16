import registerPromiseWorker from "promise-worker/register"
import { CmdMessage, initCmdMsg} from "./message.interface";
import { WasmProxy } from "./wasm-proxy";

const wasmProxy = new WasmProxy()
wasmProxy.load = load

async function load(ctx: WasmProxy, assetsUrl: string, wasmUrl: string) {
    if (!self) {
        throw new Error('load() should be run in the worker thread')
    }
    if (ctx.loaded) return
    importScripts(assetsUrl)
    if (!ctx.loaded) {
        ctx.M = (self as any).M = await (self as any).Module({
            locateFile: (path: string) => {
                if (path.endsWith("wasm") && wasmUrl) {
                    return wasmUrl;
                }
                return path;
            },
            onRuntimeInitialized: () => {
                ctx.loaded = true;
            }
        })
    }
}

registerPromiseWorker(async (msg: CmdMessage) => {
    switch (msg.cmd) {
        case "load": {
            const { args } = msg as initCmdMsg;
            return await load(wasmProxy, args[0], args[1])
        }
        default: {
            return wasmProxy.postMessage(msg)
        }
    }
})