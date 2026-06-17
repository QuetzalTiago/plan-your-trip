import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When running inside Docker/WSL, bind to all interfaces and use polling
// for reliable file-change detection through the volume mount.
const isDocker = Boolean(process.env["DOCKER"]);

export default defineConfig({
  plugins: [react()],
  define: {
    global: "window",
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    watch: isDocker ? { usePolling: true, interval: 1000 } : undefined,
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("react-markdown") || id.includes("remark-gfm")) {
            return "markdown";
          }
          if (
            id.includes("node_modules/react") ||
            id.includes("react-router-dom")
          ) {
            return "vendor";
          }
        },
      },
    },
  },
});
