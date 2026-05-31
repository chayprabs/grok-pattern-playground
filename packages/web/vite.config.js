import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "GrokParse",
                short_name: "GrokParse",
                description: "Write, test and benchmark grok and Logstash patterns online",
                theme_color: "#ffffff",
                background_color: "#fafafa",
                display: "standalone",
            },
        }),
    ],
    build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
            output: {
                manualChunks: undefined,
            },
        },
    },
});
