import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallbackDenylist: [/^\/socket\.io/, /^\/health/],
      },
      manifest: {
        name: "Duo Play",
        short_name: "Duo Play",
        description: "Two-player games on your phone. Same room, two browsers.",
        theme_color: "#07080d",
        background_color: "#07080d",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        categories: ["games", "entertainment"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    include: ["three", "@react-three/fiber"],
  },
  server: {
    host: true,
    proxy: {
      "/socket.io": { target: "http://127.0.0.1:3000", ws: true },
      "/health": "http://127.0.0.1:3000",
    },
  },
});
