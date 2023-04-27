const files = require.context("../spec", true, /.spec.js$/);
const keys = files.keys();

export async function config() {
  for (const key of keys) {
    const specModule = await files(key);
    specModule();
  }
}