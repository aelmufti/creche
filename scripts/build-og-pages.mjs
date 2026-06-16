// Génère une image Open Graph par département (public/og/dept-<slug>.png),
// au style néo-brutalisme, avec le chiffre local. Lancé en `prebuild` → les
// images sont régénérées à chaque build (non versionnées, cf. .gitignore).
//
// Régénérer : node scripts/build-og-pages.mjs

import sharp from "sharp";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import departementsJson from "../src/data/departements.json" with { type: "json" };
import tarifsJson from "../src/data/tarifs-departements.json" with { type: "json" };

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public/og");
mkdirSync(OUT, { recursive: true });

const departements = departementsJson;
const national = tarifsJson.national;
const deps = tarifsJson.departements;

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function svgDept(nom, ama, dom) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#EDE8E0"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#0D0D0D" stroke-width="10"/>
  <rect x="64" y="80" width="560" height="64" fill="#1754CC"/>
  <text x="84" y="125" font-family="JetBrains Mono, monospace" font-size="30" font-weight="700" fill="#FFFFFF">CRÈCHE OU NOUNOU ? · COÛT 2026</text>
  <text x="64" y="250" font-family="JetBrains Mono, monospace" font-size="86" font-weight="800" fill="#0D0D0D">${esc(nom)}</text>
  <g font-family="JetBrains Mono, monospace" fill="#0D0D0D">
    <text x="64" y="370" font-size="40" font-weight="800">Assistante maternelle : ${ama} €/h net</text>
    <text x="64" y="440" font-size="40" font-weight="800">Garde à domicile : ${dom} €/h</text>
  </g>
  <text x="64" y="540" font-family="JetBrains Mono, monospace" font-size="26" font-weight="500" fill="#0D0D0D">Source URSSAF 2024 · creche-ou-nounou.fr</text>
</svg>`;
}

let n = 0;
for (const code of Object.keys(deps)) {
  const nom = departements[code];
  if (!nom) continue;
  const t = { ...national, ...deps[code] };
  const fr = (x) => x.toFixed(2).replace(".", ",");
  const svg = svgDept(nom, fr(t.tauxHoraireAma), fr(t.coutHoraireDomicile));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  writeFileSync(join(OUT, `dept-${slugify(nom)}.png`), png);
  n++;
}
console.log(`OK — ${n} images OG par département générées dans public/og/.`);
