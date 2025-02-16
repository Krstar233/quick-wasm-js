import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'node18',
    lib: {
      entry: './index.js', // 插件入口文件
      name: 'ViteQuickWasmPlugin', // 全局变量名
      fileName: 'vite-plugin-quick-wasm', // 输出文件名
      formats: ['es', 'cjs'], // 打包格式
    },
    rollupOptions: {
      // 如果有外部依赖，可以在这里配置
      external: ['vite', 'shelljs', 'path', 'fs'],
    },
  },
});