import s from "path";
import a from "fs";
import { normalizePath as u } from "vite";
import t from "shelljs";
const _ = `cmake_minimum_required(VERSION 3.0.0)
project(out VERSION 0.1.0 LANGUAGES C CXX)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_C_STANDARD_REQUIRED ON)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include(CTest)

# 递归添加源文件
file(GLOB_RECURSE SRC_FILES_CPP "*.cpp")
file(GLOB_RECURSE SRC_FILES_CC "*.cc")
file(GLOB_RECURSE SRC_FILES_C "*.c")
set(SRC_FILES \${SRC_FILES_CPP} \${SRC_FILES_CC} \${SRC_FILES_C})

# 将源文件添加到可执行目标
add_executable(out \${SRC_FILES})

# 设置 FLAG
set_target_properties(out PROPERTIES COMPILE_FLAGS "-Os -sMAIN_MODULE=2")
set_target_properties(out PROPERTIES LINK_FLAGS
    "-Os -sWASM=1 -sMODULARIZE=1 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry")

set(CPACK_PROJECT_NAME \${PROJECT_NAME})
set(CPACK_PROJECT_VERSION \${PROJECT_VERSION})
include(CPack)`, m = "quick-wasm:", l = "\0" + m, n = ".cache.quick-wasm";
function c(e) {
  return !!t.which(e);
}
function S() {
  const e = c("emcc") && c("emcmake"), o = c("cmake");
  if (!e && !o)
    throw new Error("Oh, some compilation environments are missing. Please make sure you have installed 'Emscripten SDK' and 'CMake' first. :)");
  if (e) {
    if (!o)
      throw new Error("Command 'cmake' cannot not be found! :( Please install 'CMake'.");
  } else throw new Error("Command 'emcc' cannot not be found! :( Please install 'Emscripten SDK'.");
  return e && o;
}
function d(e) {
  const o = t.pwd();
  return t.cd(e), t.find("CMakeLists.txt").code === 0 || a.writeFileSync(s.resolve(e, "CMakeLists.txt"), _), t.find(n).code === 0 || a.mkdirSync(n, { recursive: !0 }), t.cd(n), t.echo(`
Compling Wasm...`), t.exec("emcmake cmake .."), t.exec("cmake --build ."), t.cd(o), !0;
}
function R(e, o, i) {
  if (typeof e == "string") {
    if (e.startsWith(m)) {
      if (!S())
        return null;
      const r = s.resolve(s.dirname(o), e.substring(m.length));
      d(r);
      const E = u(s.resolve(r, n + "/out.js")), C = u(s.resolve(r, n + "/out.wasm"));
      return {
        id: l,
        moduleSideEffects: !0,
        meta: { moduleJSPath: E, wasmPath: C }
      };
    }
    return null;
  }
}
function f(e) {
  if (e === l) {
    const { moduleJSPath: o, wasmPath: i } = this.getModuleInfo(e).meta;
    return `
import moduleJSURL from '${o}?url'
import wasmPathURL from '${i}?url'
const worker = new Worker(new URL('quick-wasm/dist/worker.js', import.meta.url))
export default {moduleUrl: moduleJSURL, wasmUrl: wasmPathURL, worker }
`;
  }
  return null;
}
function L() {
  return {
    name: "quick-wasm",
    // 此名称将出现在警告和错误中
    resolveId: R,
    load: f
  };
}
export {
  L as default
};
