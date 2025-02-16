import QuickWebAssembly from '../src/index'
//@ts-ignore
import wasm from "quick-wasm:../test/cpp"

async function wasmInWorker() {
    const fib = await QuickWebAssembly.createInWorker(wasm);
    console.warn(fib)
    await fib.greet("hello");
    let ptr = await fib.createHEAP8(new Int8Array([1,2,3]));
    await fib.printInt8Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAP16(new Int16Array([1,2,3]));
    await fib.printInt16Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAP32(new Int32Array([1,2,3]));
    await fib.printInt32Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAPF32(new Float32Array([1.0,2.0,3.0]));
    await fib.printFloat32Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAPF64(new Float64Array([1,2,3]));
    await fib.printFloat64Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAPU8(new Uint8Array([-1,2,3]));
    await fib.printUInt8Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAPU16(new Uint16Array([-1,2,3]));
    await fib.printUInt16Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAPU32(new Uint32Array([-1,2,3]));
    await fib.printUInt32Array(ptr, 3);
    await fib.freeHEAP(ptr);
    ptr = await fib.createHEAP(new Int8Array([1,2,3]).buffer);
    await fib.printInt8Array(ptr, 3);
    const buffer = await fib.getHEAP(ptr, 3);
    const getInt8 = new Int8Array(buffer);
    await fib.freeHEAP(ptr);
    ptr = await fib.mockRandom(10);
    const heap = await fib.getHEAPF32(ptr, 10);
    console.warn(heap);
}

async function wasmInMain() {
    const fib = await QuickWebAssembly.create(wasm);
    console.warn(fib)
    fib.greet("hello");
    let ptr = fib.createHEAP8(new Int8Array([1,2,3]));
    fib.printInt8Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAP16(new Int16Array([1,2,3]));
    fib.printInt16Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAP32(new Int32Array([1,2,3]));
    fib.printInt32Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAPF32(new Float32Array([1.0,2.0,3.0]));
    fib.printFloat32Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAPF64(new Float64Array([1,2,3]));
    fib.printFloat64Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAPU8(new Uint8Array([-1,2,3]));
    fib.printUInt8Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAPU16(new Uint16Array([-1,2,3]));
    fib.printUInt16Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAPU32(new Uint32Array([-1,2,3]));
    fib.printUInt32Array(ptr, 3);
    fib.freeHEAP(ptr);
    ptr = fib.createHEAP(new Int8Array([1,2,3]).buffer);
    fib.printInt8Array(ptr, 3);
    const buffer = fib.getHEAP(ptr, 3);
    const getInt8 = new Int8Array(buffer);
    fib.freeHEAP(ptr);
    ptr = fib.mockRandom(10);
    const heap = fib.getHEAPF32(ptr, 10);
    console.warn(heap);
}

window.onload = wasmInMain
