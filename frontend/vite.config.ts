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

// `/r/<repo>` is multiplexed: git smart-HTTP requests proxy to the kernel,
// every other `/r/...` request is an SPA browse route served by Vite. The
// three canonical Smart HTTP markers are the only paths the kernel owns
// under this prefix.
const isGitSmartHttp = (url: string): boolean => {
  const [path, query = ""] = url.split("?");
  if (path.endsWith("/git-upload-pack") || path.endsWith("/git-receive-pack")) {
    return true;
  }
  if (path.endsWith("/info/refs")) {
    return (
      query.includes("service=git-upload-pack") ||
      query.includes("service=git-receive-pack")
    );
  }
  return false;
};
const repoProxy = (): ProxyOptions => ({
  ...kernelProxy(),
  // Returning a non-null value from `bypass` skips the proxy; returning the
  // SPA entry lets Vite serve index.html so the browse route renders.
  bypass(req) {
    if (!isGitSmartHttp(req.url ?? "")) {
      return "/index.html";
    }
    return undefined;
  },
});
const kernelProxyTable = (): Record<string, ProxyOptions> => ({
  "/api/ops": kernelProxy(),
  "/auth": kernelProxy(),
  "/graphql": kernelProxy(),
  "/_extensions": kernelProxy(),
  "/r": repoProxy(),
  "/healthz": kernelProxy(),
  "/readyz": kernelProxy(),
  "/events/session": kernelProxy(),
  "/events": kernelProxy(),
});

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  appType: "spa",
  // PUBLIC_* env vars are exposed to client code (e.g.
  // `PUBLIC_COMTRYA_OPERATOR_CODE` is read by `@comtrya/sdk-core`'s
  // session bootstrap). Vite's default is `VITE_*`; we keep both.
  envPrefix: ["VITE_", "PUBLIC_"],
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    proxy: kernelProxyTable(),
  },
  preview: {
    host: "127.0.0.1",
    proxy: kernelProxyTable(),
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
