// Génère dist/llms-full.txt : le texte intégral des pages clés du site en Markdown,
// pour qu'un LLM ou un agent ingère tout le corpus en une seule requête.
//
// Lancé en `postbuild`, après `astro build` : il lit le HTML CONSTRUIT (dist/),
// pas les sources, donc le texte est exactement celui que voit le visiteur.
//
//   node scripts/build-llms-full.mjs [dossier]    (défaut : DIST_DIR ou « dist »)
//
// Sans dépendance. Ne fait échouer le build que si dist/ est absent ou si la
// sortie serait vide. Le convertisseur ne suppose aucun titre de section : il
// traduit la structure HTML de <main> (h2/h3, p, listes, tableaux, liens, pre).

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIST = process.argv[2] ?? process.env.DIST_DIR ?? "dist";
const SITE = "https://creche-ou-nounou.fr";
const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!existsSync(DIST) || !statSync(DIST).isDirectory()) {
  console.error(`llms-full : dossier « ${DIST} » introuvable (lancer astro build d'abord).`);
  process.exit(1);
}

// --- Entités et espaces -----------------------------------------------------------
const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", laquo: "«", raquo: "»",
  rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", hellip: "…", ndash: "–", mdash: "—", euro: "€",
  eacute: "é", egrave: "è", agrave: "à", ecirc: "ê", ccedil: "ç", times: "×", middot: "·", thinsp: " " };
const decode = (s) =>
  s.replace(/&(?:#(\d+)|#[xX]([0-9a-fA-F]+)|([a-zA-Z][a-zA-Z0-9]*));/g, (m, dec, hex, name) => {
    if (dec || hex) {
      try { return String.fromCodePoint(dec ? parseInt(dec, 10) : parseInt(hex, 16)); } catch { return m; }
    }
    return NAMED[name] ?? m;
  });
// Les espaces insécables restent lisibles en texte brut : on les ramène à une espace simple.
const collapse = (s) => s.replace(/\s+/g, " ");

// --- Mini-parseur HTML → arbre ----------------------------------------------------
const VOID = new Set(["br", "img", "hr", "input", "meta", "link", "source", "wbr", "col"]);
const SKIP_TAGS = new Set(["script", "style", "svg", "noscript", "template", "nav", "button", "form",
  "input", "select", "textarea", "astro-island", "astro-slot", "iframe"]);

function parse(html) {
  const cleaned = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|svg|noscript|template)\b[\s\S]*?<\/\1>/gi, "");
  const rootNode = { tag: "#root", attrs: {}, children: [] };
  const stack = [rootNode];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>|([^<]+|<)/g;
  for (const m of cleaned.matchAll(re)) {
    const top = stack[stack.length - 1];
    if (m[4] !== undefined) {
      top.children.push({ text: m[4] });
      continue;
    }
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    if (closing) {
      const i = stack.map((n) => n.tag).lastIndexOf(tag);
      if (i > 0) stack.length = i;
      continue;
    }
    const attrs = {};
    for (const a of m[3].matchAll(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g))
      attrs[a[1].toLowerCase()] = decode(a[2] ?? a[3] ?? a[4] ?? "");
    const node = { tag, attrs, children: [] };
    top.children.push(node);
    if (!VOID.has(tag) && !m[3].trimEnd().endsWith("/")) stack.push(node);
  }
  return rootNode;
}

const find = (node, tag) => {
  for (const c of node.children ?? []) {
    if (c.tag === tag) return c;
    const r = c.children && find(c, tag);
    if (r) return r;
  }
  return null;
};
const rawText = (node) =>
  node.text !== undefined ? decode(node.text) : (node.children ?? []).map(rawText).join("");

// --- Rendu Markdown ---------------------------------------------------------------
const skipped = (n) =>
  SKIP_TAGS.has(n.tag) ||
  n.attrs?.["aria-hidden"] === "true" ||
  n.attrs?.hidden !== undefined ||
  // boutons d'appel à l'action (liens « → Comparer… ») : sans intérêt hors de la page
  (n.tag === "a" && /\bbtn-/.test(n.attrs?.class ?? ""));

const absUrl = (href, pagePath) => {
  try { return new URL(href, SITE + pagePath).href; } catch { return null; }
};

function inline(nodes, ctx) {
  let out = "";
  let prev = null;
  for (const n of nodes) {
    if (n.text !== undefined) { out += collapse(decode(n.text)); prev = n; continue; }
    if (skipped(n)) continue;
    // Pastilles <span> collées les unes aux autres : on les sépare pour la lecture.
    if (n.tag === "span" && prev?.tag === "span") out += " · ";
    prev = n;
    const inner = () => inline(n.children, ctx);
    const wrap = (mark) => {
      const t = inner();
      const core = t.trim();
      if (!core) return t;
      return `${/^\s/.test(t) ? " " : ""}${mark}${core}${mark}${/\s$/.test(t) ? " " : ""}`;
    };
    switch (n.tag) {
      case "strong": case "b": out += wrap("**"); break;
      case "em": case "i": out += wrap("*"); break;
      case "code": case "kbd": out += wrap("`"); break;
      case "br": out += " "; break;
      case "a": {
        const t = inner();
        const href = n.attrs.href ?? "";
        const url = href && !href.startsWith("#") && !/^javascript:/i.test(href) ? absUrl(href, ctx.path) : null;
        if (!url || !t.trim()) { out += t; break; }
        const lead = /^\s/.test(t) ? " " : "";
        const trail = /\s$/.test(t) ? " " : "";
        out += `${lead}[${t.trim().replace(/([[\]])/g, "\\$1")}](${url})${trail}`;
        break;
      }
      case "img": break;
      default: out += inner();
    }
  }
  return out;
}

const INLINE_TAGS = new Set(["a", "strong", "b", "em", "i", "code", "kbd", "span", "small", "sup", "sub",
  "br", "abbr", "mark", "time", "u", "s", "cite", "q", "label", "img"]);
const para = (s) => s.replace(/\s+/g, " ").trim();
const cell = (s) => para(s).replace(/\|/g, "\\|");
const indent = (s, pad) => s.split("\n").map((l) => (l ? pad + l : l)).join("\n");

/** Rend une suite de nœuds en blocs Markdown (tableau de chaînes). */
function blocks(nodes, ctx) {
  const out = [];
  let buf = [];
  const flush = () => {
    const t = para(inline(buf, ctx));
    if (t) out.push(t);
    buf = [];
  };
  for (const n of nodes) {
    if (n.text !== undefined || INLINE_TAGS.has(n.tag)) { buf.push(n); continue; }
    if (skipped(n)) continue;
    flush();
    const level = /^h([1-6])$/.exec(n.tag)?.[1];
    if (level) {
      if (level === "1") continue; // le h1 devient le titre de la page
      const t = para(inline(n.children, ctx));
      if (t) out.push(`${"#".repeat(Math.min(Number(level), 6))} ${t}`);
    } else if (n.tag === "ul" || n.tag === "ol") {
      const items = n.children.filter((c) => c.tag === "li").map((li, i) => {
        const [first = "", ...rest] = blocks(li.children, ctx);
        const marker = n.tag === "ol" ? `${i + 1}. ` : "- ";
        const body = [first, ...rest.map((r) => indent(r, " ".repeat(marker.length)))].join("\n");
        return marker + body;
      });
      if (items.length) out.push(items.join("\n"));
    } else if (n.tag === "table") {
      const t = table(n, ctx);
      if (t) out.push(t);
    } else if (n.tag === "pre") {
      const code = rawText(n).replace(/^\n+|\s+$/g, "");
      if (code) out.push("```\n" + code + "\n```");
    } else if (n.tag === "hr") {
      // séparateur décoratif : ignoré
    } else if (n.tag === "blockquote") {
      const inner = blocks(n.children, ctx).join("\n\n");
      if (inner) out.push(indent(inner, "> ").replace(/^(\s*)$/gm, ">"));
    } else if (n.tag === "dl") {
      for (const c of n.children) {
        if (c.tag === "dt") out.push(`**${para(inline(c.children, ctx))}**`);
        else if (c.tag === "dd") out.push(...blocks(c.children, ctx));
      }
    } else if (n.tag === "summary") {
      const t = para(inline(n.children, ctx));
      if (t) out.push(`**${t}**`);
    } else {
      out.push(...blocks(n.children, ctx)); // p, div, section, article, header, details…
    }
  }
  flush();
  return out;
}

function table(t, ctx) {
  const rows = [];
  let caption = "";
  (function walk(node) {
    for (const c of node.children) {
      if (c.tag === "caption") caption = para(inline(c.children, ctx));
      else if (c.tag === "tr") {
        const cells = c.children.filter((x) => x.tag === "th" || x.tag === "td");
        if (cells.length) rows.push({ cells: cells.map((x) => cell(inline(x.children, ctx))), head: cells.every((x) => x.tag === "th") });
      } else if (c.children && ["thead", "tbody", "tfoot"].includes(c.tag)) walk(c);
    }
  })(t);
  if (!rows.length) return "";
  const width = Math.max(...rows.map((r) => r.cells.length));
  const pad = (cells) => [...cells, ...Array(width - cells.length).fill("")];
  const line = (cells) => `| ${pad(cells).join(" | ")} |`;
  // Ligne d'en-tête : la 1re ligne (Markdown en exige une, même si le HTML n'a que des <td>).
  const [head, ...body] = rows;
  const md = [line(head.cells), line(Array(width).fill("---")), ...body.map((r) => line(r.cells))];
  return (caption ? `**${caption}**\n\n` : "") + md.join("\n");
}

// --- Pages ------------------------------------------------------------------------
function convertPage(urlPath) {
  const file = urlPath === "/" ? join(DIST, "index.html") : join(DIST, urlPath, "index.html");
  if (!existsSync(file)) {
    console.warn(`llms-full : page absente, ignorée : ${urlPath}`);
    return null;
  }
  const html = readFileSync(file, "utf8");
  const tree = parse(html);
  const main = find(tree, "main");
  if (!main) {
    console.warn(`llms-full : pas de <main>, ignorée : ${urlPath}`);
    return null;
  }
  const ctx = { path: urlPath };
  const h1 = find(main, "h1");
  const title = para(h1 ? inline(h1.children, ctx) : decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? urlPath));
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? SITE + (urlPath === "/" ? "/" : urlPath);

  let modified = html.match(/property="article:modified_time" content="([^"]*)"/)?.[1] ?? "";
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      const found = [].concat(JSON.parse(m[1])).flatMap((x) => (x?.["@graph"] ? x["@graph"] : [x]))
        .find((x) => x?.dateModified)?.dateModified;
      if (found) { modified = found; break; }
    } catch { /* JSON-LD invalide : repli sur la meta */ }
  }

  const body = blocks(main.children, ctx).join("\n\n");
  const head = [`# ${title}`, `Source: ${canonical}` + (modified ? `\nDernière modification : ${modified.slice(0, 10)}` : "")];
  return [...head, body].filter(Boolean).join("\n\n");
}

const listDir = (d) => (existsSync(d) ? readdirSync(d).filter((f) => statSync(join(d, f)).isDirectory()) : []);
const guides = listDir(join(DIST, "guides"))
  .filter((slug) => existsSync(join(DIST, "guides", slug, "index.html")))
  .sort()
  .map((slug) => `/guides/${slug}`);
const order = ["/", ...guides, "/methodologie", "/glossaire", "/observatoire-cout-garde-2026", "/a-propos"];

// En-tête : celui de public/llms.txt (titre + citation), pour rester cohérent avec l'index.
let header = "# creche-ou-nounou.fr\n\n> Comparateur indépendant et gratuit du coût des modes de garde d'enfant en France (barème 2026).";
const llmsPath = join(root, "public", "llms.txt");
if (existsSync(llmsPath)) {
  const top = readFileSync(llmsPath, "utf8").split(/^## /m)[0].trim();
  if (top) header = top;
}
const today = new Date().toISOString().slice(0, 10);
const intro =
  `Texte intégral des pages clés du site, généré le ${today} (date du build) à partir du site publié. ` +
  `Les chiffres sont une estimation indicative (barème 2026), à vérifier sur caf.fr et pajemploi.urssaf.fr. ` +
  `Index des pages : ${SITE}/llms.txt`;

const sections = order.map(convertPage).filter(Boolean);
if (!sections.length) {
  console.error("llms-full : aucune page convertie, sortie vide.");
  process.exit(1);
}
const local =
  `## Pages locales (départements et villes)\n\n` +
  `Les pages départementales et communales ne sont pas reprises ici : elles suivent toutes le même modèle ` +
  `avec des chiffres locaux. Consulter l'index [${SITE}/cout-garde-enfant](${SITE}/cout-garde-enfant) ` +
  `ou les données ouvertes (CSV, licence ODbL 1.0) : ` +
  `[${SITE}/data/cout-garde-par-departement-2026.csv](${SITE}/data/cout-garde-par-departement-2026.csv).`;

const output =
  [header, intro, ...[...sections, local].map((s, i) => (i === 0 ? s : `---\n\n${s}`))]
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim() + "\n";

if (output.length < 500) {
  console.error("llms-full : sortie vide ou anormalement courte.");
  process.exit(1);
}
writeFileSync(join(DIST, "llms-full.txt"), output);
console.log(`llms-full : ${sections.length} pages, ${(output.length / 1024).toFixed(1)} Ko → ${join(DIST, "llms-full.txt")}`);
