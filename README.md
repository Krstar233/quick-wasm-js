# Quick WebAssembly JS

快速创建 WebAssembly 代理对象的工具类. 

## 介绍

一个可以快速创建 WebAssembly 代理对象的工具类. 

## 快速开始

1. 准备 WebAssembly 资源

   使用 Emscripten 工具编译 C/C++ 代码, 导出您需要的 API. 

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
      -sWASM=1 -sMAIN_MODULE=2 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] --no-entry
   ```

   使用 Emscripten 编译您的资源. 
   
   示例编译指令:
   ```
   emcc fib.cc -sWASM=1 -sMAIN_MODULE=2 -sEXPORTED_FUNCTIONS=['_malloc','_free'] -sEXPORTED_RUNTIME_METHODS=['UTF8ToString','stringToUTF8'] -o fib.js
   ```


2. 安装 npm 包

   ```bash
   npm install quick-wasm-js
   ```

3. 创建 QuickWebAssemblyFactory 工厂类, 指定 Emscripten 编译的 WebAssembly 资源路径.
   ```js
   import { QuickWebAssemblyFactory } from "quick-wasm-js";

   const manager = await new QuickWebAssemblyFactory().createManager(`fib.js`, `fib.wasm`);
   ```

4. 开始使用代理对象
   ```js
   console.log(await fibManager.fib(12)) // 输出 233
   ```

### 相关 API

生成的代理对象有固定几个 API 方便针对 WebAssembly 的内存进行操作.

- **createHEAP(data: ArrayBuffer): Promise\<number\>**

   传入 ArrayBuffer , 返回相应堆的指针.


- **freeHEAP(ptr: number): Promise\<boolean\>**

   传入堆的指针, 释放内存.

- **getHEAP(ptr: number, bytes: number): Promise\<Int8Array>**
   
   传入指针和字节数, 获取相应的堆数据以 Int8Array 返回.

...