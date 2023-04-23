import registerPromiseWorker from "promise-worker/register"

declare var Module: any;
let loaded = false;

export type CmdMessage =
    initCmdMsg |
    callCmdMsg |
    getKeysCmdMsg;

interface initCmdMsg {
    cmd: "load",
    args: [string]
}

interface callCmdMsg {
    cmd: "call",
    args: [
        string,
        any[]
    ]
}

interface getKeysCmdMsg {
    cmd: "getKeys"
}

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
            (self as any).Module = {
                locateFile: (path: string) => {
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
            }
            return true;
        }
        case "call": {
            loadCheck();
            const { args } = msg as callCmdMsg;
            const funcName = args[0];
            const funcArgs = args[1];
            return Module["_"+funcName](...funcArgs) || true;
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
        default: {
            throw new Error("Unknown Message.");
        }
    }
})
