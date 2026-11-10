// Audit SEO du site construit (dist/). Échoue (code 1) si une page indexable
// enfreint une règle on-page. À lancer après `npm run build` : npm run audit:seo
//
// Règles : 1 <title> de 25 à 60 caractères, 1 meta description de 70 à 160
// caractères, titres et descriptions uniques, exactement un <h1>, canonical
// absolu sans trailing slash, meta robots, og:image présente, <img> avec alt,
// JSON-LD valide, et chaque URL du sitemap servie par une page.
// Règles de fond : parité FAQPage JSON-LD / texte visible (questions ET réponses),
// 600 mots minimum par guide, liens internes résolus (page, fichier, ancre) et sans
// trailing slash, BreadcrumbList cohérent avec le canonical, ordre des titres.
//
// Dossier audité : 1er argument ou variable DIST_DIR (défaut « dist »).
//   node scripts/seo-audit.mjs /chemin/vers/un/autre/build

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const DIST = process.argv[2] ?? process.env.DIST_DIR ?? "dist";
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

// --- Aides pour les règles de fond --------------------------------------------
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", laquo: "«", raquo: "»",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", ndash: "–", mdash: "—", euro: "€",
  eacute: "é", egrave: "è", agrave: "à", ecirc: "ê", ccedil: "ç", times: "×", middot: "·", thinsp: "\u2009" };
const decodeAll = (s) =>
  s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));/g, (m, dec, hex, name) => {
    if (dec || hex) {
      try { return String.fromCodePoint(dec ? parseInt(dec, 10) : parseInt(hex, 16)); } catch { return m; }
    }
    return NAMED[name] ?? m;
  });
// \s couvre déjà U+00A0, U+202F (espace fine insécable), U+2009, U+FEFF.
const norm = (s) => s.replace(/\s+/g, " ").trim();
const BLOCK = /<\/?(?:p|div|li|ul|ol|tr|td|th|table|thead|tbody|caption|h[1-6]|section|article|header|footer|nav|br|dt|dd|dl|blockquote|pre|figure|figcaption|details|summary|aside|form|button|label|select|option)\b[^>]*>/gi;
const mainOf = (h) => h.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? null;
const visibleText = (html) =>
  norm(decodeAll(html.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, " ").replace(BLOCK, " ").replace(/<[^>]*>/g, "")));
const ldNodes = (h) => {
  const out = [];
  const push = (n) => {
    if (Array.isArray(n)) return n.forEach(push);
    if (!n || typeof n !== "object") return;
    out.push(n);
    if (n["@graph"]) push(n["@graph"]);
  };
  for (const m of h.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try { push(JSON.parse(m[1])); } catch { /* signalé plus bas */ }
  }
  return out;
};
const hasType = (n, t) => [].concat(n["@type"] ?? []).includes(t);
const asArray = (v) => (v == null ? [] : [].concat(v));
const idCache = new Map();
const idsOf = (file) => {
  if (!idCache.has(file)) {
    const h = readFileSync(file, "utf8");
    idCache.set(file, new Set([...h.matchAll(/\sid=(?:"([^"]*)"|'([^']*)')/g)].map((m) => m[1] ?? m[2])));
  }
  return idCache.get(file);
};
/** Fichier de dist correspondant à un chemin d'URL, ou null. */
const resolveDist = (path) => {
  const rel = path.replace(/^\/+/, "");
  const candidates = rel === "" ? ["index.html"] : [join(rel, "index.html"), rel, `${rel}.html`];
  for (const c of candidates) {
    const full = join(DIST, c);
    if (existsSync(full) && statSync(full).isFile()) return full;
  }
  return null;
};
const MIN_GUIDE_WORDS = 600;

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

  const main = mainOf(h);
  if (main === null) errors.push(`${rel} : pas de <main>`);
  const text = main === null ? "" : visibleText(main);

  // b. profondeur minimale des guides (hors hub /guides)
  if (/^guides[\\/][^\\/]+[\\/]index\.html$/.test(rel)) {
    const words = text ? text.split(" ").length : 0;
    if (words < MIN_GUIDE_WORDS) errors.push(`${rel} : ${words} mots visibles (minimum ${MIN_GUIDE_WORDS})`);
  }

  // e. ordre des titres et titres vides dans <main>
  if (main !== null) {
    let seenH2 = false;
    for (const [, lvl, inner] of main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
      if (!visibleText(inner)) errors.push(`${rel} : <h${lvl}> vide`);
      if (lvl === "2") seenH2 = true;
      if (lvl === "3" && !seenH2) errors.push(`${rel} : <h3> avant le premier <h2>`);
    }
  }

  // c. liens internes : résolution, ancre, trailing slash
  for (const [, raw] of h.matchAll(/<a\b[^>]*?\shref="([^"]*)"/g)) {
    const href = decodeAll(raw);
    if (!href.startsWith("/") || href.startsWith("//")) continue;
    const [beforeHash, ...hashParts] = href.split("#");
    const fragment = hashParts.join("#");
    const path = beforeHash.split("?")[0];
    if (path !== "/" && path.endsWith("/")) errors.push(`${rel} : lien interne avec trailing slash ${href}`);
    let decoded = path;
    try { decoded = decodeURI(path); } catch { /* garde le brut */ }
    const target = resolveDist(decoded === "/" ? "/" : decoded.replace(/\/+$/, ""));
    if (!target) { errors.push(`${rel} : lien interne cassé ${href}`); continue; }
    if (fragment && target.endsWith(".html") && !idsOf(target).has(decodeURIComponent(fragment)))
      errors.push(`${rel} : ancre #${fragment} introuvable dans ${path || "/"} (lien ${href})`);
  }

  // a. parité FAQPage JSON-LD / texte visible, d. BreadcrumbList
  const nodes = ldNodes(h);
  for (const node of nodes) {
    if (hasType(node, "FAQPage")) {
      for (const q of asArray(node.mainEntity)) {
        const name = norm(String(q?.name ?? ""));
        const answer = norm(String(q?.acceptedAnswer?.text ?? ""));
        if (!name || !answer) errors.push(`${rel} : FAQ incomplète (question ou réponse vide) « ${name} »`);
        if (name && !text.includes(name)) errors.push(`${rel} : FAQ question absente du texte visible « ${name} »`);
        if (answer && !text.includes(norm(decodeAll(answer.replace(/<[^>]*>/g, " ")))))
          errors.push(`${rel} : FAQ réponse absente du texte visible « ${name} »`);
      }
    }
    if (hasType(node, "BreadcrumbList")) {
      const items = asArray(node.itemListElement);
      items.forEach((li, i) => {
        const u = typeof li?.item === "string" ? li.item : li?.item?.["@id"];
        if (!u) { if (i === items.length - 1) errors.push(`${rel} : BreadcrumbList sans item pour le dernier élément`); return; }
        let url;
        try { url = new URL(u); } catch { errors.push(`${rel} : BreadcrumbList item non absolu ${u}`); return; }
        if (url.origin !== SITE) errors.push(`${rel} : BreadcrumbList item hors du site ${u}`);
        if (url.pathname !== "/" && u.endsWith("/")) errors.push(`${rel} : BreadcrumbList item avec trailing slash ${u}`);
        if (i === items.length - 1 && u !== canonical)
          errors.push(`${rel} : BreadcrumbList dernier item ${u} ≠ canonical ${canonical}`);
      });
    }
  }

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
