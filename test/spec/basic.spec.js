import { spec, it, beforeAll } from "simp-spec";
import { expect } from "chai";
import { TEST_CONFIG } from "../configs/test.config";
import QuickWebAssembly from "../../src/index"


export default spec("QuickWebAssembly test", function() {
    let fibManager;
    beforeAll(async done => {
        fibManager = await QuickWebAssembly.create({ moduleUrl: `${TEST_CONFIG.assetsPath}/out.js`, wasmUrl: `${TEST_CONFIG.assetsPath}/out.wasm`});
        done();
    });

    it("basic use", async done => {
        expect(fibManager.fib(12)).eq(233)
        fibManager.greet("hello");
        let ptr = fibManager.createHEAP8(new Int8Array([1,2,3]));
        fibManager.printInt8Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAP16(new Int16Array([1,2,3]));
        fibManager.printInt16Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAP32(new Int32Array([1,2,3]));
        fibManager.printInt32Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAPF32(new Float32Array([1.0,2.0,3.0]));
        fibManager.printFloat32Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAPF64(new Float64Array([1,2,3]));
        fibManager.printFloat64Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAPU8(new Uint8Array([-1,2,3]));
        fibManager.printUInt8Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAPU16(new Uint16Array([-1,2,3]));
        fibManager.printUInt16Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAPU32(new Uint32Array([-1,2,3]));
        fibManager.printUInt32Array(ptr, 3);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.createHEAP(new Int8Array([1,2,3]).buffer);
        fibManager.printInt8Array(ptr, 3);
        const buffer = fibManager.getHEAP(ptr, 3);
        expect(buffer instanceof ArrayBuffer).ok;
        const getInt8 = new Int8Array(buffer);
        expect(getInt8[0]+getInt8[1]+getInt8[2]).eq(6);
        fibManager.freeHEAP(ptr);
        ptr = fibManager.mockRandom(10);
        const heap = fibManager.getHEAPF32(ptr, 10);
        expect(heap instanceof Float32Array).true;
        expect(heap.length).eq(10);
        console.log(heap);
        done();
    });
});
