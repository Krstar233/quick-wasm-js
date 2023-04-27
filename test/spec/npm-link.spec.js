import { expect, it, spec, beforeAll, TEST_CONFIG } from "../common";
import { QuickWebAssemblyFactory } from "quick-wasm-js";

export default spec("npm link test", function() {
    let fibManager;
    beforeAll(async done => {
        fibManager = await new QuickWebAssemblyFactory().createManager(`${TEST_CONFIG.assetsPath}/fib.js`, `${TEST_CONFIG.assetsPath}/fib.wasm`);
        done();
    });

    it("basic use", async done => {
        expect(await fibManager.fib(12)).eq(233);
        done();
    });
});
