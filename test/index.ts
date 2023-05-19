import { runTests, config } from "./common";

window.onload = async () => {
  const cfg = await config();
  const result = await runTests(cfg);
  console.warn(JSON.stringify(result));
  document.getElementById("result-panel")!.innerHTML = `<span style="color: ${
    result.success ? "green" : "red"
  };">${JSON.stringify(result)}</span>`;
};
