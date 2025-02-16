import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    lib: {
      entry: 'src/wasm.worker',
      formats: ['iife'],
      name: 'WasmWorker',
      fileName: 'worker'
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: 'worker.js'
      }
    },
    minify: 'terser',
    terserOptions: {
      format: {
        comments: true, // 保留包含这些关键词的注释
      },
    },
  },
})