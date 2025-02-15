import { spec, it, beforeAll } from "simp-spec";
import { expect } from "chai";
import { TEST_CONFIG } from "../configs/test.config";
import { QuickWebAssemblyFactory } from "../../src/index";

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
