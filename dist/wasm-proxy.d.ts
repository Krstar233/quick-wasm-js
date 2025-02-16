import { CmdMessage } from './message.interface';
export declare class WasmProxy {
    M: any;
    loaded: boolean;
    load: (ctx: WasmProxy, assetsUrl: string, wasmUrl: string) => Promise<void>;
    constructor();
    private loadCheck;
    call(funcName: string, funcArgs: any[]): any;
    getKeys(): string[];
    createHeap(data: ArrayBuffer): any;
    freeHeap(ptr: number): boolean;
    getHeap(ptr: number, bytes: number): Int8Array<any>;
    postMessage(msg: CmdMessage): any;
}
