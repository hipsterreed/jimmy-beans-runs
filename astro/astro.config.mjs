import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
  },
  vite: {
    server: {
      fs: {
        // allow serving asset files from the project root
        allow: [".."],
      },
    },
  },
});
