const files = require.context("../spec", true, /.spec.js$/);
const keys = files.keys();

export async function config() {
  const res = [];
  for (const key of keys) {
    const specModule = await files(key);
    res.push(specModule);
  }
  return res;
}