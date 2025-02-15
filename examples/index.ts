import { QuickWebAssemblyFactory } from '../src/index'

const fibManager = await new QuickWebAssemblyFactory()
        .createManager(`../test/assets/cpp/build.em/fib.js`, `../test/assets/cpp/build.em/fib.wasm`);
await fibManager.greet("hello");
let ptr = await fibManager.createHEAP8(new Int8Array([1,2,3]));
await fibManager.printInt8Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAP16(new Int16Array([1,2,3]));
await fibManager.printInt16Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAP32(new Int32Array([1,2,3]));
await fibManager.printInt32Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAPF32(new Float32Array([1.0,2.0,3.0]));
await fibManager.printFloat32Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAPF64(new Float64Array([1,2,3]));
await fibManager.printFloat64Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAPU8(new Uint8Array([-1,2,3]));
await fibManager.printUInt8Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAPU16(new Uint16Array([-1,2,3]));
await fibManager.printUInt16Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAPU32(new Uint32Array([-1,2,3]));
await fibManager.printUInt32Array(ptr, 3);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.createHEAP(new Int8Array([1,2,3]).buffer);
await fibManager.printInt8Array(ptr, 3);
const buffer = await fibManager.getHEAP(ptr, 3);
const getInt8 = new Int8Array(buffer);
await fibManager.freeHEAP(ptr);
ptr = await fibManager.mockRandom(10);
const heap = await fibManager.getHEAPF32(ptr, 10);
console.log(heap);
