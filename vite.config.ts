import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import compression from "vite-plugin-compression";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "CacheFirst",
            options: {
              cacheName: "assets",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin !== self.location.origin,
            handler: "NetworkFirst",
            options: {
              cacheName: "external",
              networkTimeoutSeconds: 10,
            },
          },
        ],
      },
    }),
    compression({
      algorithm: "gzip",
      threshold: 10240,
      deleteOriginFile: false,
    }),
  ],
  server: {
    proxy: {
      "/goodreads-proxy": {
        target: "http://localhost:3000/api/goodreads-proxy", // Point to local dev server
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/goodreads-proxy/, ""), // Remove the proxy prefix
      },
      "/goodreads-cover-proxy": {
        target: "https://images-na.ssl-images-amazon.com", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/goodreads-cover-proxy/, ""), // Removes "/proxy" from the path
      },
      "/google-proxy": {
        target: "https://www.googleapis.com", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/google-proxy/, ""), // Removes "/proxy" from the path
      },
      "/google-cover-proxy": {
        target: "http://books.google.com", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/google-cover-proxy/, ""), // Removes "/proxy" from the path
      },
      "/hardcover-proxy": {
        target: "https://api.hardcover.app", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/hardcover-proxy/, ""), // Removes "/proxy" from the path
      },
      "/hardcover-cover-proxy": {
        target: "https://assets.hardcover.app", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/hardcover-cover-proxy/, ""), // Removes "/proxy" from the path
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"), // Define `@` as an alias for `src`
    },
  },
});
