import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  build: {
    // Preserve the authored color functions used by the holographic blend stack.
    cssMinify: false,
    modulePreload: {
      resolveDependencies(_filename, dependencies, context) {
        if (context.hostType !== "html") return dependencies
        return dependencies.filter((dependency) => !/(?:^|\/)(?:AuthDialog|schemas|dialog-|input-|label-|separator-|tabs-)/.test(dependency))
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return

          if (id.includes("/node_modules/react/") || id.includes("/node_modules/react-dom/") || id.includes("/node_modules/scheduler/")) return "vendor-react"
          if (id.includes("/react-router")) return "vendor-router"
          if (id.includes("/@tanstack/") || id.includes("/axios/") || id.includes("/zustand/")) return "vendor-data"
          if (id.includes("/i18next") || id.includes("/react-i18next")) return "vendor-i18n"
          if (id.includes("/radix-ui") || id.includes("/@radix-ui/") || id.includes("/@floating-ui/")) return "vendor-ui"
        },
      },
    },
  },
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: process.env.VITE_DEV_API_PROXY ? {
    proxy: {
      "/api": {
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/api/, ""),
        target: process.env.VITE_DEV_API_PROXY,
      },
    },
  } : undefined,
})
