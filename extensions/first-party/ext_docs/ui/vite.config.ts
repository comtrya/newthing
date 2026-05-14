import { fileURLToPath, URL } from "node:url";
import vue from "../../../../frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { defineConfig } from "../../../../frontend/node_modules/vite/dist/node/index.js";

const fromHere = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: fromHere("."),
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  plugins: [vue({ customElement: true })],
  resolve: {
    alias: {
      "@comtrya/sdk-core": fromHere("../../../../frontend/packages/sdk-core/src/index.ts"),
      "@comtrya/sdk-vue": fromHere("../../../../frontend/packages/sdk-vue/src/index.ts"),
    },
  },
  build: {
    target: "es2022",
    outDir: fromHere("../assets"),
    emptyOutDir: false,
    lib: {
      entry: fromHere("src/register.ts"),
      formats: ["es"],
      fileName: () => "index.js",
    },
    codeSplitting: false,
    rollupOptions: {
      output: {
        entryFileNames: "index.js",
      },
    },
  },
});
