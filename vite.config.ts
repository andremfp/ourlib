import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import compression from "vite-plugin-compression";
import { resolve } from "path";

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      manifest: false,
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "NetworkFirst",
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
  build: {
    target: "esnext",
    modulePreload: true,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["vue", "vue-router"],
          firebase: [
            "firebase/app",
            "firebase/auth",
            "firebase/firestore",
            "firebase/storage",
            "firebase/functions",
          ],
        },
      },
    },
  },
  server: {
    proxy: {
      "/goodreads-proxy": {
        target: "https://www.goodreads.com", // The base URL of the external API
        changeOrigin: true, // Ensures the host header matches the target
        rewrite: (path) => path.replace(/^\/goodreads-proxy/, ""), // Removes "/proxy" from the path
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            // Modify headers to look more like a regular browser request
            proxyReq.setHeader(
              "Accept",
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            );
            proxyReq.setHeader(
              "User-Agent",
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            );
          });

          // Handle redirects internally within the proxy
          proxy.on("proxyRes", (proxyRes) => {
            if (proxyRes.headers.location) {
              // If it's a redirect to a Goodreads URL, rewrite it to use our proxy
              if (proxyRes.headers.location.includes("goodreads.com")) {
                proxyRes.headers.location = proxyRes.headers.location.replace(
                  "https://www.goodreads.com",
                  "/goodreads-proxy",
                );
              }
            }
          });
        },
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
