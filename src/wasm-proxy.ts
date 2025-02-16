import { CmdMessage, initCmdMsg, callCmdMsg, createHeapCmdMsg, freeHeapCmdMsg, getHeapCmdMsg } from "./message.interface";

async function load(ctx: any, assetsUrl: string, wasmUrl: string) {
    if (!window) {
        throw new Error("load() should be run in the main thread")
    }
    if (ctx.loaded) return
    // Hack 导出
    const oldExports = window.exports
    window.exports = Object.assign({}, oldExports)
    await import(/* @vite-ignore */ assetsUrl)
    const module = window.exports['Module']
    window.exports = oldExports
    if (!ctx.loaded) {
        ctx.M = await module({
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

export class WasmProxy {
    M: any
    loaded = false;

    // Worker 线程中该方法被覆盖重写
    load: (ctx: WasmProxy, assetsUrl: string, wasmUrl: string) => Promise<void>

    constructor() {
        this.load = load
    }

    private loadCheck() {
        if (!this.loaded) {
            throw new Error("WebAssembly is not loaded!")
        }
    }

    call(funcName: string, funcArgs: any[]) {
        const ptrShouldFree: number[] = [];
        const newArgs = funcArgs.map(arg => {
            if (typeof arg === "string") {
                const strPtr = this.M._malloc(arg.length*2);
                this.M.stringToUTF8(arg, strPtr, arg.length*2);
                ptrShouldFree.push(strPtr);
                return strPtr;
            }
            return arg;
        })
        const res = this.M["_"+funcName](...newArgs) || true;
        ptrShouldFree.forEach(ptr => {
            this.M._free(ptr);
        });
        return res;
    }

    getKeys() {
        const res = [];
        for (const keys of Object.keys(this.M)) {
            if (keys.startsWith("_")) {
                res.push(keys.slice(1));
            }
        }
        return res;
    }

    createHeap(data: ArrayBuffer) {
        const ptr = this.M._malloc(data.byteLength);
        this.M.HEAP8.set(data, ptr)
        return ptr;
    }

    freeHeap(ptr: number) {
        this.M._free(ptr);
        return true;
    }

    getHeap(ptr: number, bytes: number) {
        return new Int8Array(this.M.HEAP8.subarray(ptr, ptr + bytes));
    }

    postMessage (msg: CmdMessage): any {
        switch (msg.cmd) {
            case "load": {
                const { args } = msg as initCmdMsg;
                const assetsUrl = args[0];
                const wasmUrl = args[1];
                return load(this, assetsUrl, wasmUrl)
            }
            case "call": {
                this.loadCheck();
                const { args } = msg as callCmdMsg;
                const funcName = args[0];
                const funcArgs = args[1];
                return this.call(funcName, funcArgs)
            }
            case "getKeys": {
                this.loadCheck();
                return this.getKeys()
            }
            case "createHeap": {
                this.loadCheck();
                const { args } = msg as createHeapCmdMsg;
                const data = args[0];
                return this.createHeap(data)
            }
            case "freeHeap": {
                this.loadCheck();
                const { args } = msg as freeHeapCmdMsg;
                const ptr = args[0];
                return this.freeHeap(ptr);
            }
            case "getHeap": {
                this.loadCheck();
                const { args } = msg as getHeapCmdMsg;
                const ptr = args[0];
                const bytes = args[1];
                return this.getHeap(ptr, bytes);
            }
            default: {
                throw new Error("Unknown Message.");
            }
        }
    }
}