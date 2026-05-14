import { fileURLToPath, URL } from "node:url";
import vue from "@vitejs/plugin-vue";
import { defineConfig, type ProxyOptions } from "vite";

const kernelTarget = process.env.COMTRYA_SERVER_URL ?? "http://127.0.0.1:8080";
const kernelProxy = (): ProxyOptions => ({
  target: kernelTarget,
  changeOrigin: true,
  configure(proxy) {
    proxy.on("proxyReq", (proxyReq) => {
      proxyReq.removeHeader("origin");
    });
  },
});

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: {
      "/graphql": kernelProxy(),
      "/_extensions": kernelProxy(),
      "/readyz": kernelProxy(),
      "/events/session": kernelProxy(),
      "/events": kernelProxy(),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
