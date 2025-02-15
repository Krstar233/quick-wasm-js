import { defineConfig } from 'vite'
export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts",
            name: "QuickWasmJS",
            format: ['umd'],
            fileName: 'index.js'
        },
        rollupOptions: {
            output: {
                entryFileNames: 'index.js'
            }
        },
        sourcemap: true
    },
})