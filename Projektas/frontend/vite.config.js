import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  },
  // "npm run build" sukompiliuota frontend'a ideda i backend/public - is ten ji atiduoda Express serveris.
  build: {
    outDir: "../backend/public",
    emptyOutDir: true
  }
});
