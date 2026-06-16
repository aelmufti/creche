import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://creche-ou-nounou.fr",
  integrations: [
    react(),
    // On garde notre propre entrée Tailwind (src/styles/global.css) avec les
    // couches néo-brutalisme → ne pas injecter la base par défaut.
    tailwind({ applyBaseStyles: false }),
    sitemap(),
  ],
});
