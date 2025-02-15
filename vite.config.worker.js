import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'src',
    lib: {
      entry: 'src/wasm.worker',
      formats: ['iife'],
      name: 'WasmWorker',
      fileName: 'worker'
    },
    rollupOptions: {
      output: {
        entryFileNames: 'worker.js'
      }
    }
  },
})