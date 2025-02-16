const files = import.meta.glob('../spec/*.js', { eager: true });
const keys = Object.keys(files)
export function config() {
  const res = [];
  for (const key of keys) {
    const specModule = files[key].default;
    res.push(specModule);
  }
  return res;
}