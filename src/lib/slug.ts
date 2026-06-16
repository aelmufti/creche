/** Slug URL à partir d'un nom de département (accents/apostrophes gérés). */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // diacritiques
    .replace(/['’]/g, " ") // apostrophes droites/typographiques
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
