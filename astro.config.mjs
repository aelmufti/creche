import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";
import { lastmodFor } from "./src/data/content-dates.mjs";

// https://astro.build/config
export default defineConfig({
  site: "https://creche-ou-nounou.fr",
  integrations: [
    react(),
    // On garde notre propre entrée Tailwind (src/styles/global.css) avec les
    // couches néo-brutalisme → ne pas injecter la base par défaut.
    tailwind({ applyBaseStyles: false }),
    sitemap({
      serialize(item) {
        // Politique d'URL : pas de trailing slash (aligné sur les canonical
        // et le trailingSlash:false de Vercel), sauf la racine.
        const url = new URL(item.url);
        if (url.pathname !== "/") item.url = item.url.replace(/\/$/, "");
        item.lastmod = lastmodFor(item.url);
        return item;
      },
    }),
  ],
});
