// Source unique des dates de publication/mise à jour par section.
// À mettre à jour à chaque révision de contenu (rituel barème : plan-seo-geo.md §10.3).
// Format ISO (AAAA-MM-JJ). Alimente le JSON-LD des pages ET le <lastmod> du sitemap.

export const DATES = {
  home: { published: "2026-06-15", modified: "2026-07-24" },
  guides: { published: "2026-06-16", modified: "2026-07-24" },
  departements: { published: "2026-06-16", modified: "2026-07-24" },
  villes: { published: "2026-06-17", modified: "2026-07-24" },
  methodologie: { published: "2026-06-15", modified: "2026-07-24" },
  observatoire: { published: "2026-06-16", modified: "2026-07-24" },
  // Le glossaire n'a pas changé : un lastmod « aujourd'hui » sur une page
  // inchangée est ignoré par Google, voire coûteux en confiance (§3.3).
  glossaire: { published: "2026-06-16", modified: "2026-06-16" },
  site: { published: "2026-06-15", modified: "2026-07-24" },
};

/** Date de dernière modification (lastmod sitemap) pour une URL du site. */
export function lastmodFor(url) {
  const path = new URL(url).pathname;
  if (path === "/") return DATES.home.modified;
  if (path.startsWith("/guides")) return DATES.guides.modified;
  if (path.startsWith("/cout-garde-enfant")) {
    // /cout-garde-enfant/[departement]/[ville] a 3 segments.
    const segments = path.split("/").filter(Boolean);
    return segments.length >= 3 ? DATES.villes.modified : DATES.departements.modified;
  }
  if (path.startsWith("/methodologie")) return DATES.methodologie.modified;
  if (path.startsWith("/observatoire")) return DATES.observatoire.modified;
  if (path.startsWith("/glossaire")) return DATES.glossaire.modified;
  return DATES.site.modified;
}
