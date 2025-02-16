import path from 'path'
import fs from 'fs'
import { normalizePath } from 'vite'
import shell from 'shelljs'
import cmakeTxt from './CMakeLists.js'

const moduleID = 'quick-wasm:'
const resolvedModuleID = '\0' + moduleID
const buildDirName = '.cache.quick-wasm'

let emcmakeRun = false

function commandExists(command) {
  return !!shell.which(command)
}

function envCheck() {
  const emsdkOK = commandExists('emcc') && commandExists('emcmake')
  const cmakeOK = commandExists('cmake')
  if (!emsdkOK && !cmakeOK) {
    throw new Error(`Oh, some compilation environments are missing. Please make sure you have installed 'Emscripten SDK' and 'CMake' first. :)`)
  } else if (!emsdkOK) {
    throw new Error(`Command 'emcc' cannot not be found! :( Please install 'Emscripten SDK'.`)
  } else if (!cmakeOK) {
    throw new Error(`Command 'cmake' cannot not be found! :( Please install 'CMake'.`)
  }
  return emsdkOK && cmakeOK
}

function complie(cppDir) {
  const rootPath = shell.pwd()
  shell.cd(cppDir)
  const cmakeConfigExit = shell.find('CMakeLists.txt').code === 0
  if (!cmakeConfigExit) {
    fs.writeFileSync(path.resolve(cppDir, 'CMakeLists.txt'), cmakeTxt)
  }
  const buildDirExit = shell.find(buildDirName).code === 0
  if (!buildDirExit) {
    fs.mkdirSync(buildDirName, { recursive: true });
  }
  shell.cd(buildDirName)
  shell.echo('\nCompling Wasm...')
  shell.exec('emcmake cmake ..')
  shell.exec('cmake --build .')
  shell.cd(rootPath)
  return true
}

function resolveId(source, importer, options) {
  if (typeof source !== 'string') return
  if (source.startsWith(moduleID)) {
    if (!envCheck()) {
      return null
    }
    const cppDir = path.resolve(path.dirname(importer), source.substring(moduleID.length))
    if (!complie(cppDir)) {
      return null
    }
    const moduleJSPath = normalizePath(path.resolve(cppDir, buildDirName + '/out.js'))
    const wasmPath = normalizePath(path.resolve(cppDir, buildDirName + '/out.wasm'))
    return {
      id: resolvedModuleID,
      moduleSideEffects: true,
      meta: { moduleJSPath, wasmPath }
    }
  }
  return null
}

function load(id) {
  if (id === resolvedModuleID) {
    const { moduleJSPath, wasmPath } = this.getModuleInfo(id).meta
    const source =
`
import moduleJSURL from '${moduleJSPath}?url'
import wasmPathURL from '${wasmPath}?url'
const worker = new Worker(new URL('quick-wasm/dist/worker.js', import.meta.url))
export default {moduleUrl: moduleJSURL, wasmUrl: wasmPathURL, worker }
`
    return source;
  }
  return null; // 其他ID应按通常方式处理
}

export default function quickWasm() {
  return {
    name: 'quick-wasm', // 此名称将出现在警告和错误中
    resolveId,
    load
  };
}
