(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.QuickWasmJS = {}));
})(this, (function (exports) { 'use strict';

    /******************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __awaiter(thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    }

    function __generator(thisArg, body) {
        var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
        return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
        function verb(n) { return function (v) { return step([n, v]); }; }
        function step(op) {
            if (f) throw new TypeError("Generator is already executing.");
            while (g && (g = 0, op[0] && (_ = 0)), _) try {
                if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                if (y = 0, t) op = [op[0] & 2, t.value];
                switch (op[0]) {
                    case 0: case 1: t = op; break;
                    case 4: _.label++; return { value: op[1], done: false };
                    case 5: _.label++; y = op[1]; op = [0]; continue;
                    case 7: op = _.ops.pop(); _.trys.pop(); continue;
                    default:
                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                        if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                        if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                        if (t[2]) _.ops.pop();
                        _.trys.pop(); continue;
                }
                op = body.call(thisArg, _);
            } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
            if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
        }
    }

    var messageIds = 0;

    function onMessage (self, e) {
      var message = e.data;
      if (!Array.isArray(message) || message.length < 2) {
        // Ignore - this message is not for us.
        return
      }
      var messageId = message[0];
      var error = message[1];
      var result = message[2];

      var callback = self._callbacks[messageId];

      if (!callback) {
        // Ignore - user might have created multiple PromiseWorkers.
        // This message is not for us.
        return
      }

      delete self._callbacks[messageId];
      callback(error, result);
    }

    function PromiseWorker (worker) {
      var self = this;
      self._worker = worker;
      self._callbacks = {};

      worker.addEventListener('message', function (e) {
        onMessage(self, e);
      });
    }

    PromiseWorker.prototype.postMessage = function (userMessage) {
      var self = this;
      var messageId = messageIds++;

      var messageToSend = [messageId, userMessage];

      return new Promise(function (resolve, reject) {
        self._callbacks[messageId] = function (error, result) {
          if (error) {
            return reject(new Error(error.message))
          }
          resolve(result);
        };

        /* istanbul ignore if */
        if (typeof self._worker.controller !== 'undefined') {
          // service worker, use MessageChannels because e.source is broken in Chrome < 51:
          // https://bugs.chromium.org/p/chromium/issues/detail?id=543198
          var channel = new MessageChannel();
          channel.port1.onmessage = function (e) {
            onMessage(self, e);
          };
          self._worker.controller.postMessage(messageToSend, [channel.port2]);
        } else {
          // web worker
          self._worker.postMessage(messageToSend);
        }
      })
    };

    var promiseWorker = PromiseWorker;

    function decodeBase64(base64, enableUnicode) {
        var binaryString = atob(base64);
        if (enableUnicode) {
            var binaryView = new Uint8Array(binaryString.length);
            for (var i = 0, n = binaryString.length; i < n; ++i) {
                binaryView[i] = binaryString.charCodeAt(i);
            }
            return String.fromCharCode.apply(null, new Uint16Array(binaryView.buffer));
        }
        return binaryString;
    }

    function createURL(base64, sourcemapArg, enableUnicodeArg) {
        var sourcemap = sourcemapArg === undefined ? null : sourcemapArg;
        var enableUnicode = enableUnicodeArg === undefined ? false : enableUnicodeArg;
        var source = decodeBase64(base64, enableUnicode);
        var start = source.indexOf('\n', 10) + 1;
        var body = source.substring(start) + (sourcemap ? '\/\/# sourceMappingURL=' + sourcemap : '');
        var blob = new Blob([body], { type: 'application/javascript' });
        return URL.createObjectURL(blob);
    }

    function createBase64WorkerFactory(base64, sourcemapArg, enableUnicodeArg) {
        var url;
        return function WorkerFactory(options) {
            url = url || createURL(base64, sourcemapArg, enableUnicodeArg);
            return new Worker(url, options);
        };
    }

    var WorkerFactory = createBase64WorkerFactory('Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwooZnVuY3Rpb24gKCkgewogICAgJ3VzZSBzdHJpY3QnOwoKICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAgICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4NCg0KICAgIFBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueQ0KICAgIHB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC4NCg0KICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAiQVMgSVMiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIDQogICAgUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZDQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULA0KICAgIElORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTQ0KICAgIExPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SDQogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUg0KICAgIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuDQogICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi8NCg0KICAgIGZ1bmN0aW9uIF9fYXdhaXRlcih0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHsNCiAgICAgICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9DQogICAgICAgIHJldHVybiBuZXcgKFAgfHwgKFAgPSBQcm9taXNlKSkoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgew0KICAgICAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfQ0KICAgICAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbInRocm93Il0odmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfQ0KICAgICAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH0NCiAgICAgICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTsNCiAgICAgICAgfSk7DQogICAgfQ0KDQogICAgZnVuY3Rpb24gX19nZW5lcmF0b3IodGhpc0FyZywgYm9keSkgew0KICAgICAgICB2YXIgXyA9IHsgbGFiZWw6IDAsIHNlbnQ6IGZ1bmN0aW9uKCkgeyBpZiAodFswXSAmIDEpIHRocm93IHRbMV07IHJldHVybiB0WzFdOyB9LCB0cnlzOiBbXSwgb3BzOiBbXSB9LCBmLCB5LCB0LCBnOw0KICAgICAgICByZXR1cm4gZyA9IHsgbmV4dDogdmVyYigwKSwgInRocm93IjogdmVyYigxKSwgInJldHVybiI6IHZlcmIoMikgfSwgdHlwZW9mIFN5bWJvbCA9PT0gImZ1bmN0aW9uIiAmJiAoZ1tTeW1ib2wuaXRlcmF0b3JdID0gZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSwgZzsNCiAgICAgICAgZnVuY3Rpb24gdmVyYihuKSB7IHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gc3RlcChbbiwgdl0pOyB9OyB9DQogICAgICAgIGZ1bmN0aW9uIHN0ZXAob3ApIHsNCiAgICAgICAgICAgIGlmIChmKSB0aHJvdyBuZXcgVHlwZUVycm9yKCJHZW5lcmF0b3IgaXMgYWxyZWFkeSBleGVjdXRpbmcuIik7DQogICAgICAgICAgICB3aGlsZSAoZyAmJiAoZyA9IDAsIG9wWzBdICYmIChfID0gMCkpLCBfKSB0cnkgew0KICAgICAgICAgICAgICAgIGlmIChmID0gMSwgeSAmJiAodCA9IG9wWzBdICYgMiA/IHlbInJldHVybiJdIDogb3BbMF0gPyB5WyJ0aHJvdyJdIHx8ICgodCA9IHlbInJldHVybiJdKSAmJiB0LmNhbGwoeSksIDApIDogeS5uZXh0KSAmJiAhKHQgPSB0LmNhbGwoeSwgb3BbMV0pKS5kb25lKSByZXR1cm4gdDsNCiAgICAgICAgICAgICAgICBpZiAoeSA9IDAsIHQpIG9wID0gW29wWzBdICYgMiwgdC52YWx1ZV07DQogICAgICAgICAgICAgICAgc3dpdGNoIChvcFswXSkgew0KICAgICAgICAgICAgICAgICAgICBjYXNlIDA6IGNhc2UgMTogdCA9IG9wOyBicmVhazsNCiAgICAgICAgICAgICAgICAgICAgY2FzZSA0OiBfLmxhYmVsKys7IHJldHVybiB7IHZhbHVlOiBvcFsxXSwgZG9uZTogZmFsc2UgfTsNCiAgICAgICAgICAgICAgICAgICAgY2FzZSA1OiBfLmxhYmVsKys7IHkgPSBvcFsxXTsgb3AgPSBbMF07IGNvbnRpbnVlOw0KICAgICAgICAgICAgICAgICAgICBjYXNlIDc6IG9wID0gXy5vcHMucG9wKCk7IF8udHJ5cy5wb3AoKTsgY29udGludWU7DQogICAgICAgICAgICAgICAgICAgIGRlZmF1bHQ6DQogICAgICAgICAgICAgICAgICAgICAgICBpZiAoISh0ID0gXy50cnlzLCB0ID0gdC5sZW5ndGggPiAwICYmIHRbdC5sZW5ndGggLSAxXSkgJiYgKG9wWzBdID09PSA2IHx8IG9wWzBdID09PSAyKSkgeyBfID0gMDsgY29udGludWU7IH0NCiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChvcFswXSA9PT0gMyAmJiAoIXQgfHwgKG9wWzFdID4gdFswXSAmJiBvcFsxXSA8IHRbM10pKSkgeyBfLmxhYmVsID0gb3BbMV07IGJyZWFrOyB9DQogICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDYgJiYgXy5sYWJlbCA8IHRbMV0pIHsgXy5sYWJlbCA9IHRbMV07IHQgPSBvcDsgYnJlYWs7IH0NCiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ICYmIF8ubGFiZWwgPCB0WzJdKSB7IF8ubGFiZWwgPSB0WzJdOyBfLm9wcy5wdXNoKG9wKTsgYnJlYWs7IH0NCiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0WzJdKSBfLm9wcy5wb3AoKTsNCiAgICAgICAgICAgICAgICAgICAgICAgIF8udHJ5cy5wb3AoKTsgY29udGludWU7DQogICAgICAgICAgICAgICAgfQ0KICAgICAgICAgICAgICAgIG9wID0gYm9keS5jYWxsKHRoaXNBcmcsIF8pOw0KICAgICAgICAgICAgfSBjYXRjaCAoZSkgeyBvcCA9IFs2LCBlXTsgeSA9IDA7IH0gZmluYWxseSB7IGYgPSB0ID0gMDsgfQ0KICAgICAgICAgICAgaWYgKG9wWzBdICYgNSkgdGhyb3cgb3BbMV07IHJldHVybiB7IHZhbHVlOiBvcFswXSA/IG9wWzFdIDogdm9pZCAwLCBkb25lOiB0cnVlIH07DQogICAgICAgIH0NCiAgICB9CgogICAgZnVuY3Rpb24gaXNQcm9taXNlIChvYmopIHsKICAgICAgLy8gdmlhIGh0dHBzOi8vdW5wa2cuY29tL2lzLXByb21pc2VAMi4xLjAvaW5kZXguanMKICAgICAgcmV0dXJuICEhb2JqICYmICh0eXBlb2Ygb2JqID09PSAnb2JqZWN0JyB8fCB0eXBlb2Ygb2JqID09PSAnZnVuY3Rpb24nKSAmJiB0eXBlb2Ygb2JqLnRoZW4gPT09ICdmdW5jdGlvbicKICAgIH0KCiAgICBmdW5jdGlvbiByZWdpc3RlclByb21pc2VXb3JrZXIgKGNhbGxiYWNrKSB7CiAgICAgIGZ1bmN0aW9uIHBvc3RPdXRnb2luZ01lc3NhZ2UgKGUsIG1lc3NhZ2VJZCwgZXJyb3IsIHJlc3VsdCkgewogICAgICAgIGZ1bmN0aW9uIHBvc3RNZXNzYWdlIChtc2cpIHsKICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBpZiAqLwogICAgICAgICAgaWYgKHR5cGVvZiBzZWxmLnBvc3RNZXNzYWdlICE9PSAnZnVuY3Rpb24nKSB7IC8vIHNlcnZpY2Ugd29ya2VyCiAgICAgICAgICAgIGUucG9ydHNbMF0ucG9zdE1lc3NhZ2UobXNnKTsKICAgICAgICAgIH0gZWxzZSB7IC8vIHdlYiB3b3JrZXIKICAgICAgICAgICAgc2VsZi5wb3N0TWVzc2FnZShtc2cpOwogICAgICAgICAgfQogICAgICAgIH0KICAgICAgICBpZiAoZXJyb3IpIHsKICAgICAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovCiAgICAgICAgICBpZiAodHlwZW9mIGNvbnNvbGUgIT09ICd1bmRlZmluZWQnICYmICdlcnJvcicgaW4gY29uc29sZSkgewogICAgICAgICAgICAvLyBUaGlzIGlzIHRvIG1ha2UgZXJyb3JzIGVhc2llciB0byBkZWJ1Zy4gSSB0aGluayBpdCdzIGltcG9ydGFudAogICAgICAgICAgICAvLyBlbm91Z2ggdG8ganVzdCBsZWF2ZSBoZXJlIHdpdGhvdXQgZ2l2aW5nIHRoZSB1c2VyIGFuIG9wdGlvbgogICAgICAgICAgICAvLyB0byBzaWxlbmNlIGl0LgogICAgICAgICAgICBjb25zb2xlLmVycm9yKCdXb3JrZXIgY2F1Z2h0IGFuIGVycm9yOicsIGVycm9yKTsKICAgICAgICAgIH0KICAgICAgICAgIHBvc3RNZXNzYWdlKFttZXNzYWdlSWQsIHsKICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZQogICAgICAgICAgfV0pOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICBwb3N0TWVzc2FnZShbbWVzc2FnZUlkLCBudWxsLCByZXN1bHRdKTsKICAgICAgICB9CiAgICAgIH0KCiAgICAgIGZ1bmN0aW9uIHRyeUNhdGNoRnVuYyAoY2FsbGJhY2ssIG1lc3NhZ2UpIHsKICAgICAgICB0cnkgewogICAgICAgICAgcmV0dXJuIHsgcmVzOiBjYWxsYmFjayhtZXNzYWdlKSB9CiAgICAgICAgfSBjYXRjaCAoZSkgewogICAgICAgICAgcmV0dXJuIHsgZXJyOiBlIH0KICAgICAgICB9CiAgICAgIH0KCiAgICAgIGZ1bmN0aW9uIGhhbmRsZUluY29taW5nTWVzc2FnZSAoZSwgY2FsbGJhY2ssIG1lc3NhZ2VJZCwgbWVzc2FnZSkgewogICAgICAgIHZhciByZXN1bHQgPSB0cnlDYXRjaEZ1bmMoY2FsbGJhY2ssIG1lc3NhZ2UpOwoKICAgICAgICBpZiAocmVzdWx0LmVycikgewogICAgICAgICAgcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIHJlc3VsdC5lcnIpOwogICAgICAgIH0gZWxzZSBpZiAoIWlzUHJvbWlzZShyZXN1bHQucmVzKSkgewogICAgICAgICAgcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIG51bGwsIHJlc3VsdC5yZXMpOwogICAgICAgIH0gZWxzZSB7CiAgICAgICAgICByZXN1bHQucmVzLnRoZW4oZnVuY3Rpb24gKGZpbmFsUmVzdWx0KSB7CiAgICAgICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBudWxsLCBmaW5hbFJlc3VsdCk7CiAgICAgICAgICB9LCBmdW5jdGlvbiAoZmluYWxFcnJvcikgewogICAgICAgICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgZmluYWxFcnJvcik7CiAgICAgICAgICB9KTsKICAgICAgICB9CiAgICAgIH0KCiAgICAgIGZ1bmN0aW9uIG9uSW5jb21pbmdNZXNzYWdlIChlKSB7CiAgICAgICAgdmFyIHBheWxvYWQgPSBlLmRhdGE7CiAgICAgICAgaWYgKCFBcnJheS5pc0FycmF5KHBheWxvYWQpIHx8IHBheWxvYWQubGVuZ3RoICE9PSAyKSB7CiAgICAgICAgICAvLyBtZXNzYWdlIGRvZW5zJ3QgbWF0Y2ggY29tbXVuaWNhdGlvbiBmb3JtYXQ7IGlnbm9yZQogICAgICAgICAgcmV0dXJuCiAgICAgICAgfQogICAgICAgIHZhciBtZXNzYWdlSWQgPSBwYXlsb2FkWzBdOwogICAgICAgIHZhciBtZXNzYWdlID0gcGF5bG9hZFsxXTsKCiAgICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayAhPT0gJ2Z1bmN0aW9uJykgewogICAgICAgICAgcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIG5ldyBFcnJvcigKICAgICAgICAgICAgJ1BsZWFzZSBwYXNzIGEgZnVuY3Rpb24gaW50byByZWdpc3RlcigpLicpKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgaGFuZGxlSW5jb21pbmdNZXNzYWdlKGUsIGNhbGxiYWNrLCBtZXNzYWdlSWQsIG1lc3NhZ2UpOwogICAgICAgIH0KICAgICAgfQoKICAgICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgb25JbmNvbWluZ01lc3NhZ2UpOwogICAgfQoKICAgIHZhciByZWdpc3RlciA9IHJlZ2lzdGVyUHJvbWlzZVdvcmtlcjsKCiAgICB2YXIgbG9hZGVkID0gZmFsc2U7CiAgICByZWdpc3RlcihmdW5jdGlvbiAobXNnKSB7IHJldHVybiBfX2F3YWl0ZXIodm9pZCAwLCB2b2lkIDAsIHZvaWQgMCwgZnVuY3Rpb24gKCkgewogICAgICAgIHZhciBsb2FkQ2hlY2ssIF9hLCBhcmdzLCBhc3NldHNVcmwsIHdhc21VcmxfMSwgYXJncywgZnVuY05hbWUsIGZ1bmNBcmdzLCBwdHJTaG91bGRGcmVlXzEsIG5ld0FyZ3MsIHJlcywgcmVzLCBfaSwgX2IsIGtleXMsIGFyZ3MsIGRhdGEsIHB0ciwgYXJncywgcHRyLCBhcmdzLCBwdHIsIGJ5dGVzOwogICAgICAgIHJldHVybiBfX2dlbmVyYXRvcih0aGlzLCBmdW5jdGlvbiAoX2MpIHsKICAgICAgICAgICAgc3dpdGNoIChfYy5sYWJlbCkgewogICAgICAgICAgICAgICAgY2FzZSAwOgogICAgICAgICAgICAgICAgICAgIGxvYWRDaGVjayA9IGZ1bmN0aW9uICgpIHsKICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFsb2FkZWQpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiV2ViQXNzZW1ibHkgaXMgbm90IGxvYWRlZCEiKTsKICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIH07CiAgICAgICAgICAgICAgICAgICAgX2EgPSBtc2cuY21kOwogICAgICAgICAgICAgICAgICAgIHN3aXRjaCAoX2EpIHsKICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAibG9hZCI6IHJldHVybiBbMyAvKmJyZWFrKi8sIDFdOwogICAgICAgICAgICAgICAgICAgICAgICBjYXNlICJjYWxsIjogcmV0dXJuIFszIC8qYnJlYWsqLywgNF07CiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgImdldEtleXMiOiByZXR1cm4gWzMgLypicmVhayovLCA1XTsKICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAiY3JlYXRlSGVhcCI6IHJldHVybiBbMyAvKmJyZWFrKi8sIDZdOwogICAgICAgICAgICAgICAgICAgICAgICBjYXNlICJmcmVlSGVhcCI6IHJldHVybiBbMyAvKmJyZWFrKi8sIDddOwogICAgICAgICAgICAgICAgICAgICAgICBjYXNlICJnZXRIZWFwIjogcmV0dXJuIFszIC8qYnJlYWsqLywgOF07CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIHJldHVybiBbMyAvKmJyZWFrKi8sIDldOwogICAgICAgICAgICAgICAgY2FzZSAxOgogICAgICAgICAgICAgICAgICAgIGlmIChsb2FkZWQpIHsKICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJXZWJBc3NlbWJseSBpcyBsb2FkZWQhIik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtc2cuYXJnczsKICAgICAgICAgICAgICAgICAgICBhc3NldHNVcmwgPSBhcmdzWzBdOwogICAgICAgICAgICAgICAgICAgIHdhc21VcmxfMSA9IGFyZ3NbMV07CiAgICAgICAgICAgICAgICAgICAgc2VsZi5Nb2R1bGUgPSB7CiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0ZUZpbGU6IGZ1bmN0aW9uIChwYXRoKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocGF0aC5lbmRzV2l0aCgid2FzbSIpICYmIHdhc21VcmxfMSkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB3YXNtVXJsXzE7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aDsKICAgICAgICAgICAgICAgICAgICAgICAgfSwKICAgICAgICAgICAgICAgICAgICAgICAgb25SdW50aW1lSW5pdGlhbGl6ZWQ6IGZ1bmN0aW9uICgpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICB9OwogICAgICAgICAgICAgICAgICAgIGltcG9ydFNjcmlwdHMoYXNzZXRzVXJsKTsKICAgICAgICAgICAgICAgICAgICBpZiAoISFsb2FkZWQpIHJldHVybiBbMyAvKmJyZWFrKi8sIDNdOwogICAgICAgICAgICAgICAgICAgIHJldHVybiBbNCAvKnlpZWxkKi8sIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXMpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZS5vblJ1bnRpbWVJbml0aWFsaXplZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHJlcygpOyB9OwogICAgICAgICAgICAgICAgICAgICAgICB9KV07CiAgICAgICAgICAgICAgICBjYXNlIDI6CiAgICAgICAgICAgICAgICAgICAgX2Muc2VudCgpOwogICAgICAgICAgICAgICAgICAgIGxvYWRlZCA9IHRydWU7CiAgICAgICAgICAgICAgICAgICAgX2MubGFiZWwgPSAzOwogICAgICAgICAgICAgICAgY2FzZSAzOiByZXR1cm4gWzIgLypyZXR1cm4qLywgdHJ1ZV07CiAgICAgICAgICAgICAgICBjYXNlIDQ6CiAgICAgICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2soKTsKICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1zZy5hcmdzOwogICAgICAgICAgICAgICAgICAgICAgICBmdW5jTmFtZSA9IGFyZ3NbMF07CiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmNBcmdzID0gYXJnc1sxXTsKICAgICAgICAgICAgICAgICAgICAgICAgcHRyU2hvdWxkRnJlZV8xID0gW107CiAgICAgICAgICAgICAgICAgICAgICAgIG5ld0FyZ3MgPSBmdW5jQXJncy5tYXAoZnVuY3Rpb24gKGFyZykgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBhcmcgPT09ICJzdHJpbmciKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHN0clB0ciA9IE1vZHVsZS5fbWFsbG9jKGFyZy5sZW5ndGggKiAyKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGUuc3RyaW5nVG9VVEY4KGFyZywgc3RyUHRyLCBhcmcubGVuZ3RoICogMik7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHRyU2hvdWxkRnJlZV8xLnB1c2goc3RyUHRyKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyUHRyOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGFyZzsKICAgICAgICAgICAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgICAgICAgICAgICAgIHJlcyA9IE1vZHVsZVsiXyIgKyBmdW5jTmFtZV0uYXBwbHkoTW9kdWxlLCBuZXdBcmdzKSB8fCB0cnVlOwogICAgICAgICAgICAgICAgICAgICAgICBwdHJTaG91bGRGcmVlXzEuZm9yRWFjaChmdW5jdGlvbiAocHRyKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGUuX2ZyZWUocHRyKTsKICAgICAgICAgICAgICAgICAgICAgICAgfSk7CiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCByZXNdOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGNhc2UgNToKICAgICAgICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRDaGVjaygpOwogICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBbXTsKICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChfaSA9IDAsIF9iID0gT2JqZWN0LmtleXMoTW9kdWxlKTsgX2kgPCBfYi5sZW5ndGg7IF9pKyspIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleXMgPSBfYltfaV07CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoa2V5cy5zdGFydHNXaXRoKCJfIikpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXMucHVzaChrZXlzLnNsaWNlKDEpKTsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgcmVzXTsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBjYXNlIDY6CiAgICAgICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2soKTsKICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1zZy5hcmdzOwogICAgICAgICAgICAgICAgICAgICAgICBkYXRhID0gYXJnc1swXTsKICAgICAgICAgICAgICAgICAgICAgICAgcHRyID0gTW9kdWxlLl9tYWxsb2MoZGF0YS5ieXRlTGVuZ3RoKTsKICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlLkhFQVA4LnNldChkYXRhLCBwdHIpOwogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgcHRyXTsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBjYXNlIDc6CiAgICAgICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2soKTsKICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1zZy5hcmdzOwogICAgICAgICAgICAgICAgICAgICAgICBwdHIgPSBhcmdzWzBdOwogICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGUuX2ZyZWUocHRyKTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIHRydWVdOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGNhc2UgODoKICAgICAgICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAgICAgICAgIGxvYWRDaGVjaygpOwogICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gbXNnLmFyZ3M7CiAgICAgICAgICAgICAgICAgICAgICAgIHB0ciA9IGFyZ3NbMF07CiAgICAgICAgICAgICAgICAgICAgICAgIGJ5dGVzID0gYXJnc1sxXTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIG5ldyBJbnQ4QXJyYXkoTW9kdWxlLkhFQVA4LnN1YmFycmF5KHB0ciwgcHRyICsgYnl0ZXMpKV07CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY2FzZSA5OgogICAgICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCJVbmtub3duIE1lc3NhZ2UuIik7CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY2FzZSAxMDogcmV0dXJuIFsyIC8qcmV0dXJuKi9dOwogICAgICAgICAgICB9CiAgICAgICAgfSk7CiAgICB9KTsgfSk7Cgp9KSgpOwovLyMgc291cmNlTWFwcGluZ1VSTD13YXNtLndvcmtlci5qcy5tYXAKCg==', null, false);
    /* eslint-enable */

    /**
     * @class QuickWebAssemblyFactory
     */
    var QuickWebAssemblyFactory = /** @class */ (function () {
        function QuickWebAssemblyFactory() {
        }
        /**
         *
         * @returns {string} Hello
         */
        QuickWebAssemblyFactory.prototype.greet = function () {
            return "hello world";
        };
        /**
         * CreateManager
         * @param moduleUrl moduleUrl
         * @param wasmUrl wasmUrl
         * @returns Object
         */
        QuickWebAssemblyFactory.prototype.createManager = function (moduleUrl, wasmUrl) {
            return __awaiter(this, void 0, void 0, function () {
                var TransformUrl, msg, worker, promiseWorker$1, manager, keys;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            TransformUrl = function () {
                                var a = document.createElement("a");
                                a.href = moduleUrl;
                                moduleUrl = a.href;
                                if (wasmUrl) {
                                    a.href = wasmUrl;
                                    wasmUrl = a.href;
                                }
                            };
                            TransformUrl();
                            worker = new WorkerFactory();
                            promiseWorker$1 = new promiseWorker(worker);
                            manager = {
                                createHEAP: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAP8: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [data] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAP16: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAP32: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAPF32: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAPF64: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAPU8: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAPU16: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                createHEAPU32: function (data) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "createHeap", args: [new Int8Array(data.buffer)] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                freeHEAP: function (ptr) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "freeHeap", args: [ptr] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                getHEAP: function (ptr, bytes) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, bytes] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, (_a.sent()).buffer];
                                        }
                                    });
                                }); },
                                getHEAP8: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len] };
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, _a.sent()];
                                        }
                                    });
                                }); },
                                getHEAP16: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 2] };
                                                _a = Int16Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Int16Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAP32: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 4] };
                                                _a = Int32Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Int32Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAPF32: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 4] };
                                                _a = Float32Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Float32Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAPF64: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 8] };
                                                _a = Float64Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Float64Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAPU8: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len] };
                                                _a = Uint8Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Uint8Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAPU16: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 2] };
                                                _a = Uint16Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Uint16Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                                getHEAPU32: function (ptr, len) { return __awaiter(_this, void 0, void 0, function () {
                                    var _a;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                msg = { cmd: "getHeap", args: [ptr, len * 4] };
                                                _a = Uint32Array.bind;
                                                return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                            case 1: return [2 /*return*/, new (_a.apply(Uint32Array, [void 0, (_b.sent()).buffer]))()];
                                        }
                                    });
                                }); },
                            };
                            msg = { cmd: "load", args: [moduleUrl, wasmUrl] };
                            return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                        case 1:
                            _a.sent();
                            msg = { cmd: "getKeys" };
                            return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                        case 2:
                            keys = _a.sent();
                            keys.forEach(function (k) {
                                manager[k] = function () {
                                    var funcArgs = [];
                                    for (var _i = 0; _i < arguments.length; _i++) {
                                        funcArgs[_i] = arguments[_i];
                                    }
                                    return __awaiter(_this, void 0, void 0, function () {
                                        var msg;
                                        return __generator(this, function (_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    msg = { cmd: "call", args: [k, funcArgs] };
                                                    return [4 /*yield*/, promiseWorker$1.postMessage(msg)];
                                                case 1: return [2 /*return*/, _a.sent()];
                                            }
                                        });
                                    });
                                };
                            });
                            return [2 /*return*/, manager];
                    }
                });
            });
        };
        return QuickWebAssemblyFactory;
    }());

    exports.QuickWebAssemblyFactory = QuickWebAssemblyFactory;

}));
