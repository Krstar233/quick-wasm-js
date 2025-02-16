// import { runTests, config } from "./common";
import { config } from "./configs/spec.config";
import { runTests } from "simp-spec";

window.onload = async () => {
  const cfg = config();
  const result = await runTests(cfg);
  console.warn(JSON.stringify(result));
  document.getElementById("result-panel")!.innerHTML = `<span style="color: ${
    result.success ? "green" : "red"
  };">${JSON.stringify(result)}</span>`;
};
