import { defineConfig } from 'vite'
import quickWasm from 'vite-plugin-quick-wasm'
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "QuickWasmJS",
            format: ['es', 'cjs'],
            fileName: 'index'
        },
        minify: 'terser',
        terserOptions: {
          format: {
            comments: /@vite-ignore/i, // 保留包含这些关键词的注释
          },
        },
    },
    plugins: [
        quickWasm(),
        dts({
          insertTypesEntry: true,
        }),
    ]
})