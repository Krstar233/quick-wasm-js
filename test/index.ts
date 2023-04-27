import { runTests, config } from "./common";

window.onload = async () => {
  await config();
  const result = await runTests();
  console.warn(JSON.stringify(result));
  document.getElementById("result-panel")!.innerHTML = `<span style="color: ${
    result.success ? "green" : "red"
  };">${JSON.stringify(result)}</span>`;
};
