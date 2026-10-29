import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    // Docker Desktop's Electron 17.1.1 embeds Chromium 98.
    target: "chrome98",
    outDir: "build",
  },
  server: {
    port: 3000,
    strictPort: true,
  },
});
