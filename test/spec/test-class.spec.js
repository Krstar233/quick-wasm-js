import { spec, it, beforeAll, afterAll } from "simp-spec";
import { expect } from "chai";
import { TestClass } from "../util/test-class";

export default spec("test-class", function() {
  let testObj;
  beforeAll(done => {
    testObj = new TestClass("123");
    done();
  });

  it("class constructor", done => {
    expect(testObj._name === "123").ok;
    done();
  });

  it("setName", done => {
    testObj.setName("krits");
    expect(testObj._name === "krits").ok;
    done();
  });

  it("Promise Test", async done => {
    let promisePass = false;
    await new Promise(res => {
      setTimeout(() => {
        promisePass = true;
        res();
      }, 10);
    });
    expect(promisePass).true;
    done();
  });

  afterAll(done => {
    done();
  });
});
