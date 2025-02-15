import { spec, it, beforeAll, afterAll } from "simp-spec";
import { expect } from "chai";

export default spec("spec util self test", function() {
  beforeAll(done => {
    done();
  });

  it("should pass", done => {
    expect(1).eq(1);
    done();
  });

  afterAll(done => {
    done();
  });
});
