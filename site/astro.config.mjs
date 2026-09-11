import sitemap from "@astrojs/sitemap";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const readmePath = fileURLToPath(new URL("../README.md", import.meta.url));

const siteUrl =
  process.env.PUBLIC_SITE_URL || "https://awesome-steam-deck.vercel.app";

const readmeReloadPlugin = {
  name: "readme-reload",
  configureServer(server) {
    server.watcher.add(readmePath);
    server.watcher.on("change", (changedPath) => {
      if (changedPath === readmePath)
        server.ws.send({ type: "full-reload", path: "*" });
    });
  },
};

export default defineConfig({
  output: "static",
  site: siteUrl,
  trailingSlash: "always",
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss(), readmeReloadPlugin],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: { fs: { allow: [repoRoot] } },
  },
});
