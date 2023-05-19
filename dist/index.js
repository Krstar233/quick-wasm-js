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
    /* global Reflect, Promise */


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

    var WorkerFactory = createBase64WorkerFactory('Lyogcm9sbHVwLXBsdWdpbi13ZWItd29ya2VyLWxvYWRlciAqLwooZnVuY3Rpb24gKCkgewogICAgJ3VzZSBzdHJpY3QnOwoKICAgIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioNCiAgICBDb3B5cmlnaHQgKGMpIE1pY3Jvc29mdCBDb3Jwb3JhdGlvbi4NCg0KICAgIFBlcm1pc3Npb24gdG8gdXNlLCBjb3B5LCBtb2RpZnksIGFuZC9vciBkaXN0cmlidXRlIHRoaXMgc29mdHdhcmUgZm9yIGFueQ0KICAgIHB1cnBvc2Ugd2l0aCBvciB3aXRob3V0IGZlZSBpcyBoZXJlYnkgZ3JhbnRlZC4NCg0KICAgIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCAiQVMgSVMiIEFORCBUSEUgQVVUSE9SIERJU0NMQUlNUyBBTEwgV0FSUkFOVElFUyBXSVRIDQogICAgUkVHQVJEIFRPIFRISVMgU09GVFdBUkUgSU5DTFVESU5HIEFMTCBJTVBMSUVEIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZDQogICAgQU5EIEZJVE5FU1MuIElOIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1IgQkUgTElBQkxFIEZPUiBBTlkgU1BFQ0lBTCwgRElSRUNULA0KICAgIElORElSRUNULCBPUiBDT05TRVFVRU5USUFMIERBTUFHRVMgT1IgQU5ZIERBTUFHRVMgV0hBVFNPRVZFUiBSRVNVTFRJTkcgRlJPTQ0KICAgIExPU1MgT0YgVVNFLCBEQVRBIE9SIFBST0ZJVFMsIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBORUdMSUdFTkNFIE9SDQogICAgT1RIRVIgVE9SVElPVVMgQUNUSU9OLCBBUklTSU5HIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFVTRSBPUg0KICAgIFBFUkZPUk1BTkNFIE9GIFRISVMgU09GVFdBUkUuDQogICAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiogKi8NCiAgICAvKiBnbG9iYWwgUmVmbGVjdCwgUHJvbWlzZSAqLw0KDQoNCiAgICBmdW5jdGlvbiBfX2F3YWl0ZXIodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7DQogICAgICAgIGZ1bmN0aW9uIGFkb3B0KHZhbHVlKSB7IHJldHVybiB2YWx1ZSBpbnN0YW5jZW9mIFAgPyB2YWx1ZSA6IG5ldyBQKGZ1bmN0aW9uIChyZXNvbHZlKSB7IHJlc29sdmUodmFsdWUpOyB9KTsgfQ0KICAgICAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHsNCiAgICAgICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH0NCiAgICAgICAgICAgIGZ1bmN0aW9uIHJlamVjdGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yWyJ0aHJvdyJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH0NCiAgICAgICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9DQogICAgICAgICAgICBzdGVwKChnZW5lcmF0b3IgPSBnZW5lcmF0b3IuYXBwbHkodGhpc0FyZywgX2FyZ3VtZW50cyB8fCBbXSkpLm5leHQoKSk7DQogICAgICAgIH0pOw0KICAgIH0NCg0KICAgIGZ1bmN0aW9uIF9fZ2VuZXJhdG9yKHRoaXNBcmcsIGJvZHkpIHsNCiAgICAgICAgdmFyIF8gPSB7IGxhYmVsOiAwLCBzZW50OiBmdW5jdGlvbigpIHsgaWYgKHRbMF0gJiAxKSB0aHJvdyB0WzFdOyByZXR1cm4gdFsxXTsgfSwgdHJ5czogW10sIG9wczogW10gfSwgZiwgeSwgdCwgZzsNCiAgICAgICAgcmV0dXJuIGcgPSB7IG5leHQ6IHZlcmIoMCksICJ0aHJvdyI6IHZlcmIoMSksICJyZXR1cm4iOiB2ZXJiKDIpIH0sIHR5cGVvZiBTeW1ib2wgPT09ICJmdW5jdGlvbiIgJiYgKGdbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gdGhpczsgfSksIGc7DQogICAgICAgIGZ1bmN0aW9uIHZlcmIobikgeyByZXR1cm4gZnVuY3Rpb24gKHYpIHsgcmV0dXJuIHN0ZXAoW24sIHZdKTsgfTsgfQ0KICAgICAgICBmdW5jdGlvbiBzdGVwKG9wKSB7DQogICAgICAgICAgICBpZiAoZikgdGhyb3cgbmV3IFR5cGVFcnJvcigiR2VuZXJhdG9yIGlzIGFscmVhZHkgZXhlY3V0aW5nLiIpOw0KICAgICAgICAgICAgd2hpbGUgKGcgJiYgKGcgPSAwLCBvcFswXSAmJiAoXyA9IDApKSwgXykgdHJ5IHsNCiAgICAgICAgICAgICAgICBpZiAoZiA9IDEsIHkgJiYgKHQgPSBvcFswXSAmIDIgPyB5WyJyZXR1cm4iXSA6IG9wWzBdID8geVsidGhyb3ciXSB8fCAoKHQgPSB5WyJyZXR1cm4iXSkgJiYgdC5jYWxsKHkpLCAwKSA6IHkubmV4dCkgJiYgISh0ID0gdC5jYWxsKHksIG9wWzFdKSkuZG9uZSkgcmV0dXJuIHQ7DQogICAgICAgICAgICAgICAgaWYgKHkgPSAwLCB0KSBvcCA9IFtvcFswXSAmIDIsIHQudmFsdWVdOw0KICAgICAgICAgICAgICAgIHN3aXRjaCAob3BbMF0pIHsNCiAgICAgICAgICAgICAgICAgICAgY2FzZSAwOiBjYXNlIDE6IHQgPSBvcDsgYnJlYWs7DQogICAgICAgICAgICAgICAgICAgIGNhc2UgNDogXy5sYWJlbCsrOyByZXR1cm4geyB2YWx1ZTogb3BbMV0sIGRvbmU6IGZhbHNlIH07DQogICAgICAgICAgICAgICAgICAgIGNhc2UgNTogXy5sYWJlbCsrOyB5ID0gb3BbMV07IG9wID0gWzBdOyBjb250aW51ZTsNCiAgICAgICAgICAgICAgICAgICAgY2FzZSA3OiBvcCA9IF8ub3BzLnBvcCgpOyBfLnRyeXMucG9wKCk7IGNvbnRpbnVlOw0KICAgICAgICAgICAgICAgICAgICBkZWZhdWx0Og0KICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEodCA9IF8udHJ5cywgdCA9IHQubGVuZ3RoID4gMCAmJiB0W3QubGVuZ3RoIC0gMV0pICYmIChvcFswXSA9PT0gNiB8fCBvcFswXSA9PT0gMikpIHsgXyA9IDA7IGNvbnRpbnVlOyB9DQogICAgICAgICAgICAgICAgICAgICAgICBpZiAob3BbMF0gPT09IDMgJiYgKCF0IHx8IChvcFsxXSA+IHRbMF0gJiYgb3BbMV0gPCB0WzNdKSkpIHsgXy5sYWJlbCA9IG9wWzFdOyBicmVhazsgfQ0KICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wWzBdID09PSA2ICYmIF8ubGFiZWwgPCB0WzFdKSB7IF8ubGFiZWwgPSB0WzFdOyB0ID0gb3A7IGJyZWFrOyB9DQogICAgICAgICAgICAgICAgICAgICAgICBpZiAodCAmJiBfLmxhYmVsIDwgdFsyXSkgeyBfLmxhYmVsID0gdFsyXTsgXy5vcHMucHVzaChvcCk7IGJyZWFrOyB9DQogICAgICAgICAgICAgICAgICAgICAgICBpZiAodFsyXSkgXy5vcHMucG9wKCk7DQogICAgICAgICAgICAgICAgICAgICAgICBfLnRyeXMucG9wKCk7IGNvbnRpbnVlOw0KICAgICAgICAgICAgICAgIH0NCiAgICAgICAgICAgICAgICBvcCA9IGJvZHkuY2FsbCh0aGlzQXJnLCBfKTsNCiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHsgb3AgPSBbNiwgZV07IHkgPSAwOyB9IGZpbmFsbHkgeyBmID0gdCA9IDA7IH0NCiAgICAgICAgICAgIGlmIChvcFswXSAmIDUpIHRocm93IG9wWzFdOyByZXR1cm4geyB2YWx1ZTogb3BbMF0gPyBvcFsxXSA6IHZvaWQgMCwgZG9uZTogdHJ1ZSB9Ow0KICAgICAgICB9DQogICAgfQoKICAgIGZ1bmN0aW9uIGlzUHJvbWlzZSAob2JqKSB7CiAgICAgIC8vIHZpYSBodHRwczovL3VucGtnLmNvbS9pcy1wcm9taXNlQDIuMS4wL2luZGV4LmpzCiAgICAgIHJldHVybiAhIW9iaiAmJiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcgfHwgdHlwZW9mIG9iaiA9PT0gJ2Z1bmN0aW9uJykgJiYgdHlwZW9mIG9iai50aGVuID09PSAnZnVuY3Rpb24nCiAgICB9CgogICAgZnVuY3Rpb24gcmVnaXN0ZXJQcm9taXNlV29ya2VyIChjYWxsYmFjaykgewogICAgICBmdW5jdGlvbiBwb3N0T3V0Z29pbmdNZXNzYWdlIChlLCBtZXNzYWdlSWQsIGVycm9yLCByZXN1bHQpIHsKICAgICAgICBmdW5jdGlvbiBwb3N0TWVzc2FnZSAobXNnKSB7CiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgaWYgKi8KICAgICAgICAgIGlmICh0eXBlb2Ygc2VsZi5wb3N0TWVzc2FnZSAhPT0gJ2Z1bmN0aW9uJykgeyAvLyBzZXJ2aWNlIHdvcmtlcgogICAgICAgICAgICBlLnBvcnRzWzBdLnBvc3RNZXNzYWdlKG1zZyk7CiAgICAgICAgICB9IGVsc2UgeyAvLyB3ZWIgd29ya2VyCiAgICAgICAgICAgIHNlbGYucG9zdE1lc3NhZ2UobXNnKTsKICAgICAgICAgIH0KICAgICAgICB9CiAgICAgICAgaWYgKGVycm9yKSB7CiAgICAgICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqLwogICAgICAgICAgaWYgKHR5cGVvZiBjb25zb2xlICE9PSAndW5kZWZpbmVkJyAmJiAnZXJyb3InIGluIGNvbnNvbGUpIHsKICAgICAgICAgICAgLy8gVGhpcyBpcyB0byBtYWtlIGVycm9ycyBlYXNpZXIgdG8gZGVidWcuIEkgdGhpbmsgaXQncyBpbXBvcnRhbnQKICAgICAgICAgICAgLy8gZW5vdWdoIHRvIGp1c3QgbGVhdmUgaGVyZSB3aXRob3V0IGdpdmluZyB0aGUgdXNlciBhbiBvcHRpb24KICAgICAgICAgICAgLy8gdG8gc2lsZW5jZSBpdC4KICAgICAgICAgICAgY29uc29sZS5lcnJvcignV29ya2VyIGNhdWdodCBhbiBlcnJvcjonLCBlcnJvcik7CiAgICAgICAgICB9CiAgICAgICAgICBwb3N0TWVzc2FnZShbbWVzc2FnZUlkLCB7CiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UKICAgICAgICAgIH1dKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgcG9zdE1lc3NhZ2UoW21lc3NhZ2VJZCwgbnVsbCwgcmVzdWx0XSk7CiAgICAgICAgfQogICAgICB9CgogICAgICBmdW5jdGlvbiB0cnlDYXRjaEZ1bmMgKGNhbGxiYWNrLCBtZXNzYWdlKSB7CiAgICAgICAgdHJ5IHsKICAgICAgICAgIHJldHVybiB7IHJlczogY2FsbGJhY2sobWVzc2FnZSkgfQogICAgICAgIH0gY2F0Y2ggKGUpIHsKICAgICAgICAgIHJldHVybiB7IGVycjogZSB9CiAgICAgICAgfQogICAgICB9CgogICAgICBmdW5jdGlvbiBoYW5kbGVJbmNvbWluZ01lc3NhZ2UgKGUsIGNhbGxiYWNrLCBtZXNzYWdlSWQsIG1lc3NhZ2UpIHsKICAgICAgICB2YXIgcmVzdWx0ID0gdHJ5Q2F0Y2hGdW5jKGNhbGxiYWNrLCBtZXNzYWdlKTsKCiAgICAgICAgaWYgKHJlc3VsdC5lcnIpIHsKICAgICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCByZXN1bHQuZXJyKTsKICAgICAgICB9IGVsc2UgaWYgKCFpc1Byb21pc2UocmVzdWx0LnJlcykpIHsKICAgICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBudWxsLCByZXN1bHQucmVzKTsKICAgICAgICB9IGVsc2UgewogICAgICAgICAgcmVzdWx0LnJlcy50aGVuKGZ1bmN0aW9uIChmaW5hbFJlc3VsdCkgewogICAgICAgICAgICBwb3N0T3V0Z29pbmdNZXNzYWdlKGUsIG1lc3NhZ2VJZCwgbnVsbCwgZmluYWxSZXN1bHQpOwogICAgICAgICAgfSwgZnVuY3Rpb24gKGZpbmFsRXJyb3IpIHsKICAgICAgICAgICAgcG9zdE91dGdvaW5nTWVzc2FnZShlLCBtZXNzYWdlSWQsIGZpbmFsRXJyb3IpOwogICAgICAgICAgfSk7CiAgICAgICAgfQogICAgICB9CgogICAgICBmdW5jdGlvbiBvbkluY29taW5nTWVzc2FnZSAoZSkgewogICAgICAgIHZhciBwYXlsb2FkID0gZS5kYXRhOwogICAgICAgIGlmICghQXJyYXkuaXNBcnJheShwYXlsb2FkKSB8fCBwYXlsb2FkLmxlbmd0aCAhPT0gMikgewogICAgICAgICAgLy8gbWVzc2FnZSBkb2Vucyd0IG1hdGNoIGNvbW11bmljYXRpb24gZm9ybWF0OyBpZ25vcmUKICAgICAgICAgIHJldHVybgogICAgICAgIH0KICAgICAgICB2YXIgbWVzc2FnZUlkID0gcGF5bG9hZFswXTsKICAgICAgICB2YXIgbWVzc2FnZSA9IHBheWxvYWRbMV07CgogICAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgIT09ICdmdW5jdGlvbicpIHsKICAgICAgICAgIHBvc3RPdXRnb2luZ01lc3NhZ2UoZSwgbWVzc2FnZUlkLCBuZXcgRXJyb3IoCiAgICAgICAgICAgICdQbGVhc2UgcGFzcyBhIGZ1bmN0aW9uIGludG8gcmVnaXN0ZXIoKS4nKSk7CiAgICAgICAgfSBlbHNlIHsKICAgICAgICAgIGhhbmRsZUluY29taW5nTWVzc2FnZShlLCBjYWxsYmFjaywgbWVzc2FnZUlkLCBtZXNzYWdlKTsKICAgICAgICB9CiAgICAgIH0KCiAgICAgIHNlbGYuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIG9uSW5jb21pbmdNZXNzYWdlKTsKICAgIH0KCiAgICB2YXIgcmVnaXN0ZXIgPSByZWdpc3RlclByb21pc2VXb3JrZXI7CgogICAgdmFyIGxvYWRlZCA9IGZhbHNlOwogICAgcmVnaXN0ZXIoZnVuY3Rpb24gKG1zZykgeyByZXR1cm4gX19hd2FpdGVyKHZvaWQgMCwgdm9pZCAwLCB2b2lkIDAsIGZ1bmN0aW9uICgpIHsKICAgICAgICB2YXIgbG9hZENoZWNrLCBfYSwgYXJncywgYXNzZXRzVXJsLCB3YXNtVXJsXzEsIGFyZ3MsIGZ1bmNOYW1lLCBmdW5jQXJncywgcHRyU2hvdWxkRnJlZV8xLCBuZXdBcmdzLCByZXMsIHJlcywgX2ksIF9iLCBrZXlzLCBhcmdzLCBkYXRhLCBwdHIsIGFyZ3MsIHB0ciwgYXJncywgcHRyLCBieXRlczsKICAgICAgICByZXR1cm4gX19nZW5lcmF0b3IodGhpcywgZnVuY3Rpb24gKF9jKSB7CiAgICAgICAgICAgIHN3aXRjaCAoX2MubGFiZWwpIHsKICAgICAgICAgICAgICAgIGNhc2UgMDoKICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2sgPSBmdW5jdGlvbiAoKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghbG9hZGVkKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoIldlYkFzc2VtYmx5IGlzIG5vdCBsb2FkZWQhIik7CiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICB9OwogICAgICAgICAgICAgICAgICAgIF9hID0gbXNnLmNtZDsKICAgICAgICAgICAgICAgICAgICBzd2l0Y2ggKF9hKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgImxvYWQiOiByZXR1cm4gWzMgLypicmVhayovLCAxXTsKICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAiY2FsbCI6IHJldHVybiBbMyAvKmJyZWFrKi8sIDRdOwogICAgICAgICAgICAgICAgICAgICAgICBjYXNlICJnZXRLZXlzIjogcmV0dXJuIFszIC8qYnJlYWsqLywgNV07CiAgICAgICAgICAgICAgICAgICAgICAgIGNhc2UgImNyZWF0ZUhlYXAiOiByZXR1cm4gWzMgLypicmVhayovLCA2XTsKICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAiZnJlZUhlYXAiOiByZXR1cm4gWzMgLypicmVhayovLCA3XTsKICAgICAgICAgICAgICAgICAgICAgICAgY2FzZSAiZ2V0SGVhcCI6IHJldHVybiBbMyAvKmJyZWFrKi8sIDhdOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzMgLypicmVhayovLCA5XTsKICAgICAgICAgICAgICAgIGNhc2UgMToKICAgICAgICAgICAgICAgICAgICBpZiAobG9hZGVkKSB7CiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiV2ViQXNzZW1ibHkgaXMgbG9hZGVkISIpOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICBhcmdzID0gbXNnLmFyZ3M7CiAgICAgICAgICAgICAgICAgICAgYXNzZXRzVXJsID0gYXJnc1swXTsKICAgICAgICAgICAgICAgICAgICB3YXNtVXJsXzEgPSBhcmdzWzFdOwogICAgICAgICAgICAgICAgICAgIHNlbGYuTW9kdWxlID0gewogICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGVGaWxlOiBmdW5jdGlvbiAocGF0aCkgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHBhdGguZW5kc1dpdGgoIndhc20iKSAmJiB3YXNtVXJsXzEpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gd2FzbVVybF8xOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7CiAgICAgICAgICAgICAgICAgICAgICAgIH0sCiAgICAgICAgICAgICAgICAgICAgICAgIG9uUnVudGltZUluaXRpYWxpemVkOiBmdW5jdGlvbiAoKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2FkZWQgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgfTsKICAgICAgICAgICAgICAgICAgICBpbXBvcnRTY3JpcHRzKGFzc2V0c1VybCk7CiAgICAgICAgICAgICAgICAgICAgaWYgKCEhbG9hZGVkKSByZXR1cm4gWzMgLypicmVhayovLCAzXTsKICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzQgLyp5aWVsZCovLCBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBNb2R1bGUub25SdW50aW1lSW5pdGlhbGl6ZWQgPSBmdW5jdGlvbiAoKSB7IHJldHVybiByZXMoKTsgfTsKICAgICAgICAgICAgICAgICAgICAgICAgfSldOwogICAgICAgICAgICAgICAgY2FzZSAyOgogICAgICAgICAgICAgICAgICAgIF9jLnNlbnQoKTsKICAgICAgICAgICAgICAgICAgICBsb2FkZWQgPSB0cnVlOwogICAgICAgICAgICAgICAgICAgIF9jLmxhYmVsID0gMzsKICAgICAgICAgICAgICAgIGNhc2UgMzogcmV0dXJuIFsyIC8qcmV0dXJuKi8sIHRydWVdOwogICAgICAgICAgICAgICAgY2FzZSA0OgogICAgICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICAgICAgbG9hZENoZWNrKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtc2cuYXJnczsKICAgICAgICAgICAgICAgICAgICAgICAgZnVuY05hbWUgPSBhcmdzWzBdOwogICAgICAgICAgICAgICAgICAgICAgICBmdW5jQXJncyA9IGFyZ3NbMV07CiAgICAgICAgICAgICAgICAgICAgICAgIHB0clNob3VsZEZyZWVfMSA9IFtdOwogICAgICAgICAgICAgICAgICAgICAgICBuZXdBcmdzID0gZnVuY0FyZ3MubWFwKGZ1bmN0aW9uIChhcmcpIHsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgYXJnID09PSAic3RyaW5nIikgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzdHJQdHIgPSBNb2R1bGUuX21hbGxvYyhhcmcubGVuZ3RoICogMik7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlLnN0cmluZ1RvVVRGOChhcmcsIHN0clB0ciwgYXJnLmxlbmd0aCAqIDIpOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB0clNob3VsZEZyZWVfMS5wdXNoKHN0clB0cik7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0clB0cjsKICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhcmc7CiAgICAgICAgICAgICAgICAgICAgICAgIH0pOwogICAgICAgICAgICAgICAgICAgICAgICByZXMgPSBNb2R1bGVbIl8iICsgZnVuY05hbWVdLmFwcGx5KE1vZHVsZSwgbmV3QXJncykgfHwgdHJ1ZTsKICAgICAgICAgICAgICAgICAgICAgICAgcHRyU2hvdWxkRnJlZV8xLmZvckVhY2goZnVuY3Rpb24gKHB0cikgewogICAgICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlLl9mcmVlKHB0cik7CiAgICAgICAgICAgICAgICAgICAgICAgIH0pOwogICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gWzIgLypyZXR1cm4qLywgcmVzXTsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBjYXNlIDU6CiAgICAgICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2soKTsKICAgICAgICAgICAgICAgICAgICAgICAgcmVzID0gW107CiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAoX2kgPSAwLCBfYiA9IE9iamVjdC5rZXlzKE1vZHVsZSk7IF9pIDwgX2IubGVuZ3RoOyBfaSsrKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXlzID0gX2JbX2ldOwogICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGtleXMuc3RhcnRzV2l0aCgiXyIpKSB7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzLnB1c2goa2V5cy5zbGljZSgxKSk7CiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIHJlc107CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY2FzZSA2OgogICAgICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICAgICAgbG9hZENoZWNrKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtc2cuYXJnczsKICAgICAgICAgICAgICAgICAgICAgICAgZGF0YSA9IGFyZ3NbMF07CiAgICAgICAgICAgICAgICAgICAgICAgIHB0ciA9IE1vZHVsZS5fbWFsbG9jKGRhdGEuYnl0ZUxlbmd0aCk7CiAgICAgICAgICAgICAgICAgICAgICAgIE1vZHVsZS5IRUFQOC5zZXQoZGF0YSwgcHRyKTsKICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFsyIC8qcmV0dXJuKi8sIHB0cl07CiAgICAgICAgICAgICAgICAgICAgfQogICAgICAgICAgICAgICAgY2FzZSA3OgogICAgICAgICAgICAgICAgICAgIHsKICAgICAgICAgICAgICAgICAgICAgICAgbG9hZENoZWNrKCk7CiAgICAgICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBtc2cuYXJnczsKICAgICAgICAgICAgICAgICAgICAgICAgcHRyID0gYXJnc1swXTsKICAgICAgICAgICAgICAgICAgICAgICAgTW9kdWxlLl9mcmVlKHB0cik7CiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCB0cnVlXTsKICAgICAgICAgICAgICAgICAgICB9CiAgICAgICAgICAgICAgICBjYXNlIDg6CiAgICAgICAgICAgICAgICAgICAgewogICAgICAgICAgICAgICAgICAgICAgICBsb2FkQ2hlY2soKTsKICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG1zZy5hcmdzOwogICAgICAgICAgICAgICAgICAgICAgICBwdHIgPSBhcmdzWzBdOwogICAgICAgICAgICAgICAgICAgICAgICBieXRlcyA9IGFyZ3NbMV07CiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBbMiAvKnJldHVybiovLCBuZXcgSW50OEFycmF5KE1vZHVsZS5IRUFQOC5zdWJhcnJheShwdHIsIHB0ciArIGJ5dGVzKSldOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGNhc2UgOToKICAgICAgICAgICAgICAgICAgICB7CiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigiVW5rbm93biBNZXNzYWdlLiIpOwogICAgICAgICAgICAgICAgICAgIH0KICAgICAgICAgICAgICAgIGNhc2UgMTA6IHJldHVybiBbMiAvKnJldHVybiovXTsKICAgICAgICAgICAgfQogICAgICAgIH0pOwogICAgfSk7IH0pOwoKfSkoKTsKLy8jIHNvdXJjZU1hcHBpbmdVUkw9d2FzbS53b3JrZXIuanMubWFwCgo=', null, false);
    /* eslint-enable */

    /**
     * 构建 WebAssembly 代理对象的工厂类
     */
    var QuickWebAssemblyFactory = /** @class */ (function () {
        function QuickWebAssemblyFactory() {
        }
        /**
         * 传入 WebAssembly 资源, 构建代理对象
         * @param moduleUrl 由 Emscripten 编译的 JS 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
         * @param wasmUrl 由 Emscripten 编译的 WebAssembly(.wasm) 文件资源路径, 如果是相对路径则会相对于当前页面的 location 请求资源
         * @returns
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
