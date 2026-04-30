import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { codeInspectorPlugin } from "code-inspector-plugin";
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    codeInspectorPlugin({
      bundler: "vite",
    }),
  ],
  resolve: {
    alias: {
      // 配置 @ 指向 src 目录
      '@': path.resolve(__dirname, 'src')
    }
  },
 server: {
    allowedHosts: true,
    host: "0.0.0.0",
    port: 5173,
  },
});
