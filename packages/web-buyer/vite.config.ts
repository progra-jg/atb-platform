import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        maximumFileSizeToCacheInBytes: 1024 * 1024 * 3,
      },
      manifest: {
        name: "ATB AgriTrace — Place de Marché B2B AgriTech",
        short_name: "ATB AgriTrace",
        description:
          "Plateforme B2B de traçabilité agricole blockchain — lots certifiés EUDR, GlobalGAP, escrow sécurisé.",
        theme_color: "#0a6e4a",
        background_color: "#070b09",
        display: "standalone",
        display_override: ["window-controls-overlay", "minimal-ui", "standalone"],
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        lang: "fr",
        categories: ["business", "agriculture", "marketplace"],
        shortcuts: [
          {
            name: "Dashboard",
            short_name: "Accueil",
            url: "/dashboard",
            icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
          },
          {
            name: "Lots",
            short_name: "Lots",
            url: "/lots",
            icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
          },
          {
            name: "Commandes",
            short_name: "Commandes",
            url: "/orders",
            icons: [{ src: "/icons/icon-192.svg", sizes: "192x192" }],
          },
        ],
        screenshots: [],
        icons: [
          { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml", purpose: "any" },
          { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "any" },
          {
            src: "/icons/maskable-icon.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: { port: 5174, host: true },
  build: { outDir: "dist", sourcemap: false },
});
