# quick-wasm

## 介绍

可以快速封装 WebAssembly 的实用小工具

## 快速开始

### 前置工具
请安装 emscripten SDK 和 cmake，并确保在环境变量中能够调用这两个工具。

### 1. 插件集成

**Vite 集成**

安装 npm 包
```bash
npm install quick-wasm vite-plugin-quick-wasm
```

添加 vite 配置
```js
// vite.config.js
import quickWasmPlugin from 'vite-plugin-quick-wasm'
export default defineConfig({
   plugins: [
      quickWasmPlugin()
   ]
})
```

新建目录，在该目录下编写 c++ 代码
```cpp
// src/cpp/main.cc
#include <emscripten.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int fib(int n) {
   // 斐波那契数列的第 n 位
   int i, t, a = 0, b = 1;
   for (i = 0; i < n; i++) {
      t = a + b;
      a = b;
      b = t;
   }
   return b;
}

}
```

在 js 中集成 wasm，使用标识 `quick-wasm:` 指向存放 c++ 代码的目录
```js
// src/index.js
import QuickWasm from 'quick-wasm'
import wasm from 'quick-wasm:./cpp'

const myCpp = await QuickWasm.create(wasm)
const result = myCpp.fib(12) // result: 233
```

### 2. 通用方式

安装 npm 包

```bash
npm install quick-wasm
```

准备 WebAssembly 资源，使用 Emscripten 工具编译 C/C++ 代码, 导出您需要的 API. 

例如, fib.cc
```Cpp
#include <emscripten.h>

extern "C" {

EMSCRIPTEN_KEEPALIVE
int fib(int n) {
   // 斐波那契数列的第 n 位
   int i, t, a = 0, b = 1;
   for (i = 0; i < n; i++) {
      t = a + b;
      a = b;
      b = t;
   }
   return b;
}

}
```

在使用 Emscripten 编译时, 需要注意添加必要的编译选项:

```bash
-Os -sMAIN_MODULE=2 -sWASM=1 -sMODULARIZE=1 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry
```

使用 Emscripten 编译您的资源. 

示例编译指令:
```
emcc fib.cc -Os -sMAIN_MODULE=2 -sWASM=1 -sMODULARIZE=1 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry
```


从`quick-wasm`包中导出 QuickWasm, 并指定 Emscripten 编译的 WebAssembly 资源路径.
```js
import QuickWasm from "quick-wasm"
const resource = { moduleUrl: 'fib.js', wasmUrl: 'fib.wasm' }
const manager = await QuickWasm.create(resource);
```

开始使用代理对象
```js
console.log(fibManager.fib(12)) // 输出 233
```

### 相关 API

生成的代理对象已经提供几个 API 方便对 WebAssembly 的内存进行操作.

- **createHEAP(data: ArrayBuffer): number**

   传入 ArrayBuffer , 返回相应堆的指针.


- **freeHEAP(ptr: number): boolean**

   传入堆的指针, 释放内存.

- **getHEAP(ptr: number, bytes: number): ArrayBuffer**
   
   传入指针和字节数, 获取相应的堆数据以 ArrayBuffer 返回.

更多API 访问: [quick-wasm API 文档](https://krstar233.github.io/quick-wasm-js/)