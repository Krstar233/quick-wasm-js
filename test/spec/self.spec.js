import { expect, it, spec, beforeAll, afterAll } from "../common";

export default spec("spec util self test", function() {
  let beforeAllCount = 0;
  let afterAllCount = 0;
  let itCount = 0;

  beforeAll(async done => {
    expect(beforeAllCount).eq(0);
    await new Promise(res => setTimeout(res, 10));
    beforeAllCount++;
    done();
  });

  it("should pass", async done => {
    expect(beforeAllCount).eq(1);
    expect(afterAllCount).eq(0);
    itCount++;
    done();
  });

  it("should pass Promise Test", async done => {
    expect(beforeAllCount).eq(1);
    expect(afterAllCount).eq(0);
    let promisePass = false;
    await new Promise(res => {
      setTimeout(() => {
        promisePass = true;
        res();
      }, 10);
    });
    expect(promisePass).true;
    itCount++;
    done();
  });

  afterAll(done => {
    expect(beforeAllCount).eq(1);
    expect(afterAllCount).eq(0);
    expect(itCount).eq(2);
    afterAllCount++;
    done();
  });
});
