import PromiseWorker from "promise-worker";
import { CmdMessage } from "./message.interface";
import { WasmProxy } from "./wasm-proxy";

const TransformUrl = (url: string): string => {
    const a = document.createElement("a");
    a.href = url;
    url = a.href;
    return url
}

/**
 * 构建 WebAssembly 代理对象的工厂类
 */
export default class QuickWebAssemblyFactory {

    constructor() {}

    /**
     * 传入 WebAssembly 资源, 构建代理对象
     * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @returns 
     */
    static async create({moduleUrl, wasmUrl}: {moduleUrl: string, wasmUrl?: string}): Promise<QuickWasmManager> {
        moduleUrl && (moduleUrl = TransformUrl(moduleUrl))
        wasmUrl && (wasmUrl = TransformUrl(wasmUrl))
        let msg: CmdMessage;
        const proxy = new WasmProxy()
        const manager: QuickWasmManager = {
            createHEAP: (data: ArrayBuffer): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data)]}
                return proxy.postMessage(msg);
            },
            createHEAP8: (data: Int8Array): number => {
                msg = { cmd: "createHeap", args: [data]}
                return proxy.postMessage(msg);
            },
            createHEAP16: (data: Int16Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAP32: (data: Int32Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAPF32: (data: Float32Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAPF64: (data: Float64Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAPU8: (data: Uint8Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAPU16: (data: Uint16Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            createHEAPU32: (data: Uint32Array): number => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return proxy.postMessage(msg);
            },
            freeHEAP: (ptr: number): boolean => {
                msg = { cmd: "freeHeap", args: [ptr]}
                return proxy.postMessage(msg);
            },
            getHEAP: (ptr: number, bytes: number): ArrayBuffer => {
                msg = { cmd: "getHeap", args: [ptr, bytes]}
                return (proxy.postMessage(msg)).buffer;
            },
            getHEAP8: (ptr: number, len: number): Int8Array => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return proxy.postMessage(msg);
            },
            getHEAP16: (ptr: number, len: number): Int16Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Int16Array((proxy.postMessage(msg)).buffer);
            },
            getHEAP32: (ptr: number, len: number): Int32Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Int32Array((proxy.postMessage(msg)).buffer);
            },
            getHEAPF32: (ptr: number, len: number): Float32Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Float32Array((proxy.postMessage(msg)).buffer);
            },
            getHEAPF64: (ptr: number, len: number): Float64Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 8]}
                return new Float64Array((proxy.postMessage(msg)).buffer);
            },
            getHEAPU8: (ptr: number, len: number): Uint8Array => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return new Uint8Array((proxy.postMessage(msg)).buffer);
            },
            getHEAPU16: (ptr: number, len: number): Uint16Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Uint16Array((proxy.postMessage(msg)).buffer);
            },
            getHEAPU32: (ptr: number, len: number): Uint32Array => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Uint32Array((proxy.postMessage(msg)).buffer);
            },
        };
        msg = { cmd: "load", args: [moduleUrl, wasmUrl]}
        await proxy.postMessage(msg);
        msg = { cmd: "getKeys" }
        const keys: string[] = proxy.postMessage(msg);
        keys.forEach(k => {
            manager[k] = (...funcArgs: any[]) => {
                const msg: CmdMessage = { cmd: "call", args: [k, funcArgs]}
                return proxy.postMessage(msg);
            }
        });
        return manager;
    }

    /**
     * 传入 WebAssembly 资源, 构建代理对象，与 create() 方法不同的是 WebAssmebly 实例将在一个单独 Worker 线程中被创建，因此生成的代理对象上的方法都是异步的
     * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @returns 
     */
    static async createInWorker({
        moduleUrl,
        wasmUrl,
        workerUrl,
        worker
    }: {
        moduleUrl: string,
        wasmUrl?: string,
        workerUrl?: string,
        worker?: Worker
    }
    ): Promise<QuickWorkerWasmManager> {
        moduleUrl && (moduleUrl = TransformUrl(moduleUrl))
        wasmUrl && (wasmUrl = TransformUrl(wasmUrl))
        workerUrl && (workerUrl = TransformUrl(workerUrl))
        let msg: CmdMessage;
        let _worker: Worker
        if (worker) {
            _worker = worker
        } else if (workerUrl) {
            _worker = new Worker(workerUrl)
        } else {
            throw new Error('cannot not run in worker, no workerUrl resource!')
        }
        const promiseWorker = new PromiseWorker(_worker);
        const manager: QuickWorkerWasmManager = {
            createHEAP: async (data: ArrayBuffer): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAP8: async (data: Int8Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [data]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAP16: async (data: Int16Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAP32: async (data: Int32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAPF32: async (data: Float32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAPF64: async (data: Float64Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAPU8: async (data: Uint8Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAPU16: async (data: Uint16Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            createHEAPU32: async (data: Uint32Array): Promise<number> => {
                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)]}
                return await promiseWorker.postMessage(msg);
            },
            freeHEAP: async (ptr: number): Promise<boolean> => {
                msg = { cmd: "freeHeap", args: [ptr]}
                return await promiseWorker.postMessage(msg);
            },
            getHEAP: async (ptr: number, bytes: number): Promise<ArrayBuffer> => {
                msg = { cmd: "getHeap", args: [ptr, bytes]}
                return (await promiseWorker.postMessage(msg)).buffer;
            },
            getHEAP8: async (ptr: number, len: number): Promise<Int8Array> => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return await promiseWorker.postMessage(msg);
            },
            getHEAP16: async (ptr: number, len: number): Promise<Int16Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Int16Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAP32: async (ptr: number, len: number): Promise<Int32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Int32Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPF32: async (ptr: number, len: number): Promise<Float32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Float32Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPF64: async (ptr: number, len: number): Promise<Float64Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 8]}
                return new Float64Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU8: async (ptr: number, len: number): Promise<Uint8Array> => {
                msg = { cmd: "getHeap", args: [ptr, len]}
                return new Uint8Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU16: async (ptr: number, len: number): Promise<Uint16Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 2]}
                return new Uint16Array((await promiseWorker.postMessage(msg)).buffer);
            },
            getHEAPU32: async (ptr: number, len: number): Promise<Uint32Array> => {
                msg = { cmd: "getHeap", args: [ptr, len * 4]}
                return new Uint32Array((await promiseWorker.postMessage(msg)).buffer);
            },
        };
        msg = { cmd: "load", args: [moduleUrl, wasmUrl]}
        await promiseWorker.postMessage(msg);
        msg = { cmd: "getKeys" }
        const keys: string[] = await promiseWorker.postMessage(msg);
        keys.forEach(k => {
            manager[k] = async (...funcArgs: any[]) => {
                const msg: CmdMessage = { cmd: "call", args: [k, funcArgs]}
                return await promiseWorker.postMessage(msg);
            }
        });
        return manager;
    }

}

/**
 * WebAssembly 代理对象
 */
export interface QuickWorkerWasmManager {
    /**
     * 传入 ArrayBuffer, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP: (data: ArrayBuffer) => Promise<number>;
    /**
     * 传入 Int8Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP8: (data: Int8Array) => Promise<number>;
    /**
     * 传入 Int16Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP16: (data: Int16Array) => Promise<number>;
    /**
     * 传入 Int32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP32: (data: Int32Array) => Promise<number>;
    /**
     * 传入 Float32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPF32: (data: Float32Array) => Promise<number>;
    /**
     * 传入 Float64Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPF64: (data: Float64Array) => Promise<number>;
    /**
     * 传入 Uint8Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU8: (data: Uint8Array) => Promise<number>;
    /**
     * 传入 Uint16Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU16: (data: Uint16Array) => Promise<number>;
    /**
     * 传入 Uint32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU32: (data: Uint32Array) => Promise<number>;
    /**
     * 传入堆指针, 释放内存
     * @param ptr 堆指针
     * @returns true |false
     */
    freeHEAP: (ptr: number)=> Promise<boolean>;
    /**
     * 读取 WebAssembly 中指向 ptr 的 bytes 个字节的数据
     * @param ptr 堆指针
     * @param bytes 字节数
     * @returns ArrayBuffer 数据
     */
    getHEAP: (ptr: number, bytes: number) => Promise<ArrayBuffer>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int8Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int8Array 数据
     */
    getHEAP8: (ptr: number, len: number) => Promise<Int8Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int16Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int16Array 数据
     */
    getHEAP16: (ptr: number, len: number) => Promise<Int16Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int32Array 数据
     */
    getHEAP32: (ptr: number, len: number) => Promise<Int32Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Float32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Float32Array 数据
     */
    getHEAPF32: (ptr: number, len: number) => Promise<Float32Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Float64Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Float64Array 数据
     */
    getHEAPF64: (ptr: number, len: number) => Promise<Float64Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint8Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint8Array 数据
     */
    getHEAPU8: (ptr: number, len: number) => Promise<Uint8Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint16Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint16Array 数据
     */
    getHEAPU16: (ptr: number, len: number) => Promise<Uint16Array>;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint32Array 数据
     */
    getHEAPU32: (ptr: number, len: number) => Promise<Uint32Array>;
    /**
     * 向外暴露的 WebAssembly API, 从 Emscripten 编译的 WebAssembly 文件资源中得到
     */
    [key: string]:  (...funcArgs: any[]) => Promise<any>;
}

export interface QuickWasmManager {
    /**
     * 传入 ArrayBuffer, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP: (data: ArrayBuffer) => number;
    /**
     * 传入 Int8Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP8: (data: Int8Array) => number;
    /**
     * 传入 Int16Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP16: (data: Int16Array) => number;
    /**
     * 传入 Int32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAP32: (data: Int32Array) => number;
    /**
     * 传入 Float32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPF32: (data: Float32Array) => number;
    /**
     * 传入 Float64Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPF64: (data: Float64Array) => number;
    /**
     * 传入 Uint8Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU8: (data: Uint8Array) => number;
    /**
     * 传入 Uint16Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU16: (data: Uint16Array) => number;
    /**
     * 传入 Uint32Array, 在 WebAssembly 中创建相应的堆指针, 同时写入 data 中的数据
     * @param data 传入的数据
     * @returns 堆指针
     */
    createHEAPU32: (data: Uint32Array) => number;
    /**
     * 传入堆指针, 释放内存
     * @param ptr 堆指针
     * @returns true |false
     */
    freeHEAP: (ptr: number)=> boolean
    /**
     * 读取 WebAssembly 中指向 ptr 的 bytes 个字节的数据
     * @param ptr 堆指针
     * @param bytes 字节数
     * @returns ArrayBuffer 数据
     */
    getHEAP: (ptr: number, bytes: number) => ArrayBuffer;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int8Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int8Array 数据
     */
    getHEAP8: (ptr: number, len: number) => Int8Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int16Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int16Array 数据
     */
    getHEAP16: (ptr: number, len: number) => Int16Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Int32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Int32Array 数据
     */
    getHEAP32: (ptr: number, len: number) => Int32Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Float32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Float32Array 数据
     */
    getHEAPF32: (ptr: number, len: number) => Float32Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Float64Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Float64Array 数据
     */
    getHEAPF64: (ptr: number, len: number) => Float64Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint8Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint8Array 数据
     */
    getHEAPU8: (ptr: number, len: number) => Uint8Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint16Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint16Array 数据
     */
    getHEAPU16: (ptr: number, len: number) => Uint16Array;
    /**
     * 读取 WebAssembly 中指向 ptr 的长度为 len 的 Uint32Array 数据
     * @param ptr 堆指针
     * @param len 元素个数
     * @returns Uint32Array 数据
     */
    getHEAPU32: (ptr: number, len: number) => Uint32Array;
    /**
     * 向外暴露的 WebAssembly API, 从 Emscripten 编译的 WebAssembly 文件资源中得到
     */
    [key: string]:  (...funcArgs: any[]) => any;
}