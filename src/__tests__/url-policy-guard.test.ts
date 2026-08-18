import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

// Politique d'URL du site : une seule forme canonique par page, SANS trailing
// slash (sauf la racine). Elle repose sur quatre pièces qui doivent rester
// d'accord entre elles :
//   1. le canonical de Layout.astro          → ce que Google retient
//   2. le serialize() du sitemap             → ce que Google explore
//   3. trailingSlash:false de vercel.json    → 308 des variantes avec /
//   4. les liens internes des pages          → ce que Googlebot suit
//
// Quand ces pièces ont divergé (avant 0be0d7f, canonical et sitemap émettaient
// la variante avec /), Google a indexé ~117 URLs en /…/ qui sont devenues des
// redirections permanentes : « Page avec redirection », des semaines à
// réexplorer, et une validation Search Console qui ne peut pas réussir puisque
// la redirection est voulue. Le coût d'une régression ici se paie en mois de
// réindexation, pas en un correctif — d'où ce garde-fou.

const src = new URL("../", import.meta.url);
const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, src)), "utf8");

const layout = read("layouts/Layout.astro");
const astroConfig = readFileSync(
  fileURLToPath(new URL("../../astro.config.mjs", import.meta.url)),
  "utf8",
);
const vercelJson = JSON.parse(
  readFileSync(fileURLToPath(new URL("../../vercel.json", import.meta.url)), "utf8"),
);

/** Rejoue l'expression canonicalPath réellement livrée dans Layout.astro. */
function canonicalPathFromLayout(): (rawPath: string) => string {
  const m = layout.match(/const canonicalPath = ([\s\S]*?);\n/);
  if (!m) throw new Error("expression canonicalPath introuvable dans Layout.astro");
  return new Function("rawPath", `return ${m[1]};`) as (rawPath: string) => string;
}

/** Rejoue le serialize() du sitemap réellement livré dans astro.config.mjs. */
function serializeFromConfig(): (item: { url: string }) => { url: string } {
  const m = astroConfig.match(/serialize\(item\) \{([\s\S]*?)\n {6}\},/);
  if (!m) throw new Error("serialize() introuvable dans astro.config.mjs");
  const sandbox: Record<string, unknown> = { URL, lastmodFor: () => "2026-01-01" };
  vm.createContext(sandbox);
  vm.runInContext(`globalThis.__serialize = function (item) {${m[1]}\n};`, sandbox);
  return sandbox.__serialize as (item: { url: string }) => { url: string };
}

/** Tous les fichiers de pages/layouts/composants susceptibles de porter un lien. */
function sourceFiles(): string[] {
  const out: string[] = [];
  const walk = (dirRel: string) => {
    const dir = fileURLToPath(new URL(dirRel, src));
    for (const entry of readdirSync(dir)) {
      const rel = `${dirRel}${entry}`;
      if (statSync(fileURLToPath(new URL(rel, src))).isDirectory()) walk(`${rel}/`);
      else if (/\.(astro|tsx|ts)$/.test(entry) && !entry.endsWith(".test.ts")) out.push(rel);
    }
  };
  walk("pages/");
  walk("layouts/");
  walk("components/");
  return out;
}

describe("politique d'URL — pas de trailing slash (sauf racine)", () => {
  describe("1. canonical (Layout.astro)", () => {
    const canonicalPath = canonicalPathFromLayout();

    it("retire le trailing slash des pages département et ville", () => {
      expect(canonicalPath("/cout-garde-enfant/la-reunion/")).toBe("/cout-garde-enfant/la-reunion");
      expect(canonicalPath("/cout-garde-enfant/haut-rhin/mulhouse/")).toBe(
        "/cout-garde-enfant/haut-rhin/mulhouse",
      );
    });

    it("laisse la racine intacte (/ est sa propre forme canonique)", () => {
      expect(canonicalPath("/")).toBe("/");
    });

    it("est idempotent : une URL déjà sans slash n'est pas tronquée", () => {
      expect(canonicalPath("/cout-garde-enfant/jura")).toBe("/cout-garde-enfant/jura");
      expect(canonicalPath("/guides")).toBe("/guides");
    });
  });

  describe("2. sitemap (astro.config.mjs)", () => {
    const serialize = serializeFromConfig();

    it("n'annonce à Google que des URLs sans trailing slash", () => {
      // Astro construit en format « directory » : les URLs entrantes du
      // sitemap arrivent donc avec le slash. C'est ici qu'il tombe.
      expect(serialize({ url: "https://creche-ou-nounou.fr/cout-garde-enfant/calvados/" }).url).toBe(
        "https://creche-ou-nounou.fr/cout-garde-enfant/calvados",
      );
      expect(serialize({ url: "https://creche-ou-nounou.fr/cout-garde-enfant/vosges/" }).url).toBe(
        "https://creche-ou-nounou.fr/cout-garde-enfant/vosges",
      );
    });

    it("conserve le slash de la racine", () => {
      expect(serialize({ url: "https://creche-ou-nounou.fr/" }).url).toBe(
        "https://creche-ou-nounou.fr/",
      );
    });
  });

  describe("3. redirection (vercel.json)", () => {
    it("trailingSlash:false — les variantes avec / sont redirigées en 308", () => {
      // Sans ce réglage, /page et /page/ répondent toutes les deux 200 :
      // duplication pure, et le canonical devient le seul arbitre.
      expect(vercelJson.trailingSlash).toBe(false);
    });
  });

  describe("4. liens internes (pages, layouts, composants)", () => {
    it("aucun lien interne ne pointe vers une variante avec trailing slash", () => {
      const offenders: string[] = [];
      for (const rel of sourceFiles()) {
        const code = read(rel);
        // href="/quelque/chose/" et href={`/quelque/${chose}/`}
        const patterns = [/href="\/[^"]+\/"/g, /href=\{`\/[^`]+\/`\}/g];
        for (const re of patterns) {
          for (const hit of code.match(re) ?? []) offenders.push(`${rel} → ${hit}`);
        }
      }
      expect(offenders).toEqual([]);
    });

    it("aucune URL absolue du site n'est écrite en dur avec un trailing slash", () => {
      const offenders: string[] = [];
      for (const rel of sourceFiles()) {
        const code = read(rel);
        // https://creche-ou-nounou.fr/…/ suivi d'un guillemet ou backtick
        for (const hit of code.match(/https:\/\/creche-ou-nounou\.fr\/[^"'`\s]+\/(?=["'`])/g) ?? []) {
          offenders.push(`${rel} → ${hit}`);
        }
      }
      expect(offenders).toEqual([]);
    });
  });
});
