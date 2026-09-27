// Audit SEO du site construit (dist/). Échoue (code 1) si une page indexable
// enfreint une règle on-page. À lancer après `npm run build` : npm run audit:seo
//
// Règles : 1 <title> de 25 à 60 caractères, 1 meta description de 70 à 160
// caractères, titres et descriptions uniques, exactement un <h1>, canonical
// absolu sans trailing slash, meta robots, og:image présente, <img> avec alt,
// JSON-LD valide, et chaque URL du sitemap servie par une page.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = "dist";
const SITE = "https://creche-ou-nounou.fr";

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith(".html")) files.push(p);
  }
})(DIST);

const errors = [];
const seen = { title: new Map(), desc: new Map() };
const len = (s) => [...s].length;
const decode = (s) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

for (const f of files) {
  const rel = relative(DIST, f);
  const h = readFileSync(f, "utf8");
  const robots = h.match(/<meta name="robots" content="([^"]*)"/)?.[1] ?? "";
  if (!robots) errors.push(`${rel} : meta robots absente`);
  if (/noindex/.test(robots)) continue; // pages exclues de l'index (404…)

  const title = decode(h.match(/<title>([^<]*)<\/title>/)?.[1] ?? "");
  const desc = decode(h.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "");
  const canonical = h.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? "";
  const h1 = (h.match(/<h1[\s>]/g) ?? []).length;

  if (len(title) < 25 || len(title) > 60) errors.push(`${rel} : title ${len(title)} car. « ${title} »`);
  if (len(desc) < 70 || len(desc) > 160) errors.push(`${rel} : description ${len(desc)} car.`);
  if (h1 !== 1) errors.push(`${rel} : ${h1} <h1>`);
  if (!canonical.startsWith(SITE)) errors.push(`${rel} : canonical absent ou relatif`);
  else if (new URL(canonical).pathname !== "/" && canonical.endsWith("/"))
    errors.push(`${rel} : canonical avec trailing slash`);
  if (!/property="og:image" content="https:/.test(h)) errors.push(`${rel} : og:image absente`);
  if (/<img(?![^>]*\balt=)[^>]*>/.test(h)) errors.push(`${rel} : <img> sans alt`);

  for (const [k, v] of [["title", title], ["desc", desc]]) {
    if (seen[k].has(v)) errors.push(`${rel} : ${k} dupliqué avec ${seen[k].get(v)}`);
    else seen[k].set(v, rel);
  }

  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const node = JSON.parse(m[1]);
      if (["Article", "NewsArticle", "BlogPosting"].includes(node["@type"])) {
        for (const key of ["headline", "image", "author", "publisher", "datePublished", "dateModified"])
          if (!node[key]) errors.push(`${rel} : Article sans ${key}`);
      }
    } catch {
      errors.push(`${rel} : JSON-LD invalide`);
    }
  }
}

// Chaque URL du sitemap doit correspondre à une page construite.
for (const sm of readdirSync(DIST).filter((f) => /^sitemap-\d+\.xml$/.test(f))) {
  const xml = readFileSync(join(DIST, sm), "utf8");
  for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const p = new URL(loc).pathname;
    const file = p === "/" ? "index.html" : join(p.slice(1), "index.html");
    if (!existsSync(join(DIST, file))) errors.push(`sitemap : ${loc} ne correspond à aucune page`);
  }
}

if (errors.length) {
  console.error(`✗ Audit SEO : ${errors.length} problème(s) sur ${files.length} pages\n` + errors.join("\n"));
  process.exit(1);
}
console.log(`✓ Audit SEO : ${files.length} pages conformes.`);
