function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
var promiseWorker;
var hasRequiredPromiseWorker;
function requirePromiseWorker() {
  if (hasRequiredPromiseWorker) return promiseWorker;
  hasRequiredPromiseWorker = 1;
  var messageIds = 0;
  function onMessage(self, e) {
    var message = e.data;
    if (!Array.isArray(message) || message.length < 2) {
      return;
    }
    var messageId = message[0];
    var error = message[1];
    var result = message[2];
    var callback = self._callbacks[messageId];
    if (!callback) {
      return;
    }
    delete self._callbacks[messageId];
    callback(error, result);
  }
  function PromiseWorker2(worker) {
    var self = this;
    self._worker = worker;
    self._callbacks = {};
    worker.addEventListener("message", function(e) {
      onMessage(self, e);
    });
  }
  PromiseWorker2.prototype.postMessage = function(userMessage) {
    var self = this;
    var messageId = messageIds++;
    var messageToSend = [messageId, userMessage];
    return new Promise(function(resolve, reject) {
      self._callbacks[messageId] = function(error, result) {
        if (error) {
          return reject(new Error(error.message));
        }
        resolve(result);
      };
      if (typeof self._worker.controller !== "undefined") {
        var channel = new MessageChannel();
        channel.port1.onmessage = function(e) {
          onMessage(self, e);
        };
        self._worker.controller.postMessage(messageToSend, [channel.port2]);
      } else {
        self._worker.postMessage(messageToSend);
      }
    });
  };
  promiseWorker = PromiseWorker2;
  return promiseWorker;
}
var promiseWorkerExports = requirePromiseWorker();
const PromiseWorker = /* @__PURE__ */ getDefaultExportFromCjs(promiseWorkerExports);
async function load(ctx, assetsUrl, wasmUrl) {
  if (!window) {
    throw new Error("load() should be run in the main thread");
  }
  if (ctx.loaded) return;
  const oldExports = window.exports;
  window.exports = Object.assign({}, oldExports);
  await import(
    /* @vite-ignore */
    assetsUrl
  );
  const module = window.exports["Module"];
  window.exports = oldExports;
  if (!ctx.loaded) {
    ctx.M = await module({
      locateFile: (path) => {
        if (path.endsWith("wasm") && wasmUrl) {
          return wasmUrl;
        }
        return path;
      },
      onRuntimeInitialized: () => {
        ctx.loaded = true;
      }
    });
  }
}
class WasmProxy {
  constructor() {
    this.loaded = false;
    this.load = load;
  }
  loadCheck() {
    if (!this.loaded) {
      throw new Error("WebAssembly is not loaded!");
    }
  }
  call(funcName, funcArgs) {
    const ptrShouldFree = [];
    const newArgs = funcArgs.map((arg) => {
      if (typeof arg === "string") {
        const strPtr = this.M._malloc(arg.length * 2);
        this.M.stringToUTF8(arg, strPtr, arg.length * 2);
        ptrShouldFree.push(strPtr);
        return strPtr;
      }
      return arg;
    });
    const res = this.M["_" + funcName](...newArgs) || true;
    ptrShouldFree.forEach((ptr) => {
      this.M._free(ptr);
    });
    return res;
  }
  getKeys() {
    const res = [];
    for (const keys of Object.keys(this.M)) {
      if (keys.startsWith("_")) {
        res.push(keys.slice(1));
      }
    }
    return res;
  }
  createHeap(data) {
    const ptr = this.M._malloc(data.byteLength);
    this.M.HEAP8.set(data, ptr);
    return ptr;
  }
  freeHeap(ptr) {
    this.M._free(ptr);
    return true;
  }
  getHeap(ptr, bytes) {
    return new Int8Array(this.M.HEAP8.subarray(ptr, ptr + bytes));
  }
  postMessage(msg) {
    switch (msg.cmd) {
      case "load": {
        const { args } = msg;
        const assetsUrl = args[0];
        const wasmUrl = args[1];
        return load(this, assetsUrl, wasmUrl);
      }
      case "call": {
        this.loadCheck();
        const { args } = msg;
        const funcName = args[0];
        const funcArgs = args[1];
        return this.call(funcName, funcArgs);
      }
      case "getKeys": {
        this.loadCheck();
        return this.getKeys();
      }
      case "createHeap": {
        this.loadCheck();
        const { args } = msg;
        const data = args[0];
        return this.createHeap(data);
      }
      case "freeHeap": {
        this.loadCheck();
        const { args } = msg;
        const ptr = args[0];
        return this.freeHeap(ptr);
      }
      case "getHeap": {
        this.loadCheck();
        const { args } = msg;
        const ptr = args[0];
        const bytes = args[1];
        return this.getHeap(ptr, bytes);
      }
      default: {
        throw new Error("Unknown Message.");
      }
    }
  }
}
const TransformUrl = (url) => {
  const a = document.createElement("a");
  a.href = url;
  url = a.href;
  return url;
};
class QuickWebAssemblyFactory {
  constructor() {
  }
  /**
   * 传入 WebAssembly 资源, 构建代理对象
   * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
   * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
   * @returns 
   */
  static async create({ moduleUrl, wasmUrl }) {
    moduleUrl && (moduleUrl = TransformUrl(moduleUrl));
    wasmUrl && (wasmUrl = TransformUrl(wasmUrl));
    let msg;
    const proxy = new WasmProxy();
    const manager = {
      createHEAP: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data)] };
        return proxy.postMessage(msg);
      },
      createHEAP8: (data) => {
        msg = { cmd: "createHeap", args: [data] };
        return proxy.postMessage(msg);
      },
      createHEAP16: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAP32: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAPF32: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAPF64: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAPU8: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAPU16: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      createHEAPU32: (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return proxy.postMessage(msg);
      },
      freeHEAP: (ptr) => {
        msg = { cmd: "freeHeap", args: [ptr] };
        return proxy.postMessage(msg);
      },
      getHEAP: (ptr, bytes) => {
        msg = { cmd: "getHeap", args: [ptr, bytes] };
        return proxy.postMessage(msg).buffer;
      },
      getHEAP8: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len] };
        return proxy.postMessage(msg);
      },
      getHEAP16: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 2] };
        return new Int16Array(proxy.postMessage(msg).buffer);
      },
      getHEAP32: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Int32Array(proxy.postMessage(msg).buffer);
      },
      getHEAPF32: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Float32Array(proxy.postMessage(msg).buffer);
      },
      getHEAPF64: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 8] };
        return new Float64Array(proxy.postMessage(msg).buffer);
      },
      getHEAPU8: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len] };
        return new Uint8Array(proxy.postMessage(msg).buffer);
      },
      getHEAPU16: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 2] };
        return new Uint16Array(proxy.postMessage(msg).buffer);
      },
      getHEAPU32: (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Uint32Array(proxy.postMessage(msg).buffer);
      }
    };
    msg = { cmd: "load", args: [moduleUrl, wasmUrl] };
    await proxy.postMessage(msg);
    msg = { cmd: "getKeys" };
    const keys = proxy.postMessage(msg);
    keys.forEach((k) => {
      manager[k] = (...funcArgs) => {
        const msg2 = { cmd: "call", args: [k, funcArgs] };
        return proxy.postMessage(msg2);
      };
    });
    return manager;
  }
  /**
   * 传入 WebAssembly 资源, 构建代理对象，与 create() 方法不同的是 WebAssmebly 实例将在一个单独 Worker 线程中被创建，因此生成的代理对象上的方法都是异步的
   * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
   * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
   * @returns 
   */
  static async createInWorker({
    moduleUrl,
    wasmUrl,
    workerUrl,
    worker
  }) {
    moduleUrl && (moduleUrl = TransformUrl(moduleUrl));
    wasmUrl && (wasmUrl = TransformUrl(wasmUrl));
    workerUrl && (workerUrl = TransformUrl(workerUrl));
    let msg;
    let _worker;
    if (worker) {
      _worker = worker;
    } else if (workerUrl) {
      _worker = new Worker(workerUrl);
    } else {
      throw new Error("cannot not run in worker, no workerUrl resource!");
    }
    const promiseWorker2 = new PromiseWorker(_worker);
    const manager = {
      createHEAP: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAP8: async (data) => {
        msg = { cmd: "createHeap", args: [data] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAP16: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAP32: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAPF32: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAPF64: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAPU8: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAPU16: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      createHEAPU32: async (data) => {
        msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
        return await promiseWorker2.postMessage(msg);
      },
      freeHEAP: async (ptr) => {
        msg = { cmd: "freeHeap", args: [ptr] };
        return await promiseWorker2.postMessage(msg);
      },
      getHEAP: async (ptr, bytes) => {
        msg = { cmd: "getHeap", args: [ptr, bytes] };
        return (await promiseWorker2.postMessage(msg)).buffer;
      },
      getHEAP8: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len] };
        return await promiseWorker2.postMessage(msg);
      },
      getHEAP16: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 2] };
        return new Int16Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAP32: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Int32Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAPF32: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Float32Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAPF64: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 8] };
        return new Float64Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAPU8: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len] };
        return new Uint8Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAPU16: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 2] };
        return new Uint16Array((await promiseWorker2.postMessage(msg)).buffer);
      },
      getHEAPU32: async (ptr, len) => {
        msg = { cmd: "getHeap", args: [ptr, len * 4] };
        return new Uint32Array((await promiseWorker2.postMessage(msg)).buffer);
      }
    };
    msg = { cmd: "load", args: [moduleUrl, wasmUrl] };
    await promiseWorker2.postMessage(msg);
    msg = { cmd: "getKeys" };
    const keys = await promiseWorker2.postMessage(msg);
    keys.forEach((k) => {
      manager[k] = async (...funcArgs) => {
        const msg2 = { cmd: "call", args: [k, funcArgs] };
        return await promiseWorker2.postMessage(msg2);
      };
    });
    return manager;
  }
}
export {
  QuickWebAssemblyFactory as default
};
