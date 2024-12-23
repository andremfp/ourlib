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
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"), // Define `@` as an alias for `src`
    },
  },
});
