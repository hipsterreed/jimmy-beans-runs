import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  vite: {
    preview: {
      allowedHosts: true,
    },
    server: {
      fs: {
        // allow serving asset files from the project root
        allow: [".."],
      },
    },
  },
});
