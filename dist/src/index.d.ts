/**
 * WebAssembly 代理对象
 */
export interface QuickWasmManager {
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
    freeHEAP: (ptr: number) => Promise<boolean>;
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
    [key: string]: (...funcArgs: any[]) => Promise<any>;
}
/**
 * 构建 WebAssembly 代理对象的工厂类
 */
export declare class QuickWebAssemblyFactory {
    constructor();
    /**
     * 传入 WebAssembly 资源, 构建代理对象
     * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
     * @returns
     */
    createManager(moduleUrl: string, wasmUrl?: string): Promise<QuickWasmManager>;
}
