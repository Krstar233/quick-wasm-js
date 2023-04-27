import registerPromiseWorker from "promise-worker/register"
import { CmdMessage, initCmdMsg, callCmdMsg, createHeapCmdMsg, freeHeapCmdMsg, getHeapCmdMsg } from "./message.interface";
declare var Module: any;
let loaded = false;

registerPromiseWorker(async (msg: CmdMessage) => {
    const loadCheck = () => {
        if (!loaded) {
            throw new Error("WebAssembly is not loaded!")
        }
    }

    switch (msg.cmd) {
        case "load": {
            if (loaded) {
                throw new Error("WebAssembly is loaded!")
            }
            const { args } = msg as initCmdMsg;
            const assetsUrl = args[0];
            const wasmUrl = args[1];
            (self as any).Module = {
                locateFile: (path: string) => {
                    if (path.endsWith("wasm") && wasmUrl) {
                        return wasmUrl;
                    }
                    return path;
                },
                onRuntimeInitialized: () => {
                    loaded = true;
                }
            }
            importScripts(assetsUrl);
            if (!loaded) {
                await new Promise<void>(res=>{
                    Module.onRuntimeInitialized = () => res();
                });
                loaded = true;
            }
            return true;
        }
        case "call": {
            loadCheck();
            const { args } = msg as callCmdMsg;
            const funcName = args[0];
            const funcArgs = args[1];
            const ptrShouldFree: number[] = [];
            const newArgs = funcArgs.map(arg => {
                if (typeof arg === "string") {
                    const strPtr = Module._malloc(arg.length*2);
                    Module.stringToUTF8(arg, strPtr, arg.length*2);
                    ptrShouldFree.push(strPtr);
                    return strPtr;
                }
                return arg;
            })
            const res = Module["_"+funcName](...newArgs) || true;
            ptrShouldFree.forEach(ptr => {
                Module._free(ptr);
            });
            return res;
        }
        case "getKeys": {
            loadCheck();
            const res = [];
            for (const keys of Object.keys(Module)) {
                if (keys.startsWith("_")) {
                    res.push(keys.slice(1));
                }
            }
            return res;
        }
        case "createHeap": {
            loadCheck();
            const { args } = msg as createHeapCmdMsg;
            const data = args[0];
            const ptr = Module._malloc(data.byteLength);
            Module.HEAP8.set(data, ptr)
            return ptr;
        }
        case "freeHeap": {
            loadCheck();
            const { args } = msg as freeHeapCmdMsg;
            const ptr = args[0];
            Module._free(ptr);
            return true;
        }
        case "getHeap": {
            loadCheck();
            const { args } = msg as getHeapCmdMsg;
            const ptr = args[0];
            const bytes = args[1];
            return new Int8Array(Module.HEAP8.subarray(ptr, ptr + bytes));
        }
        default: {
            throw new Error("Unknown Message.");
        }
    }
})