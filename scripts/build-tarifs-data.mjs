// Construit src/data/tarifs-departements.json : tarifs RÉELS par département,
// dérivés des données open data URSSAF « Salariés des particuliers employeurs
// en 2024 » (open.urssaf.fr).
//
//   tauxHoraireAma      = salaire horaire net moyen PAJE_AM  (masse / heures)
//   coutHoraireDomicile = salaire horaire net moyen PAJE_GED × FACTEUR_COUT_TOTAL
//
// Le FACTEUR convertit le NET en COÛT TOTAL EMPLOYEUR (le moteur attend le coût
// total) : net → brut (÷ ~0,78) puis brut → coût total (× ~1,40) ≈ × 1,8.
// Valeurs indicatives et modifiables côté UI ; la source et l'année sont citées.
//
// Régénérer : node scripts/build-tarifs-data.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATASET = "salaries-des-particuliers-employeurs-en-2024";
const ANNEE = 2024;
const FACTEUR_COUT_TOTAL_DOMICILE = 1.8;
const TARIF_MICRO_CRECHE_NATIONAL = 10; // plafonné à 10 €/h pour l'aide ; pas de source départementale

const round2 = (x) => Math.round(x * 100) / 100;
const round1 = (x) => Math.round(x * 10) / 10;

async function fetchAll() {
  const base = `https://open.urssaf.fr/api/explore/v2.1/catalog/datasets/${DATASET}/records`;
  const where = encodeURIComponent(`code_categorie_d_emploi in ("PAJE_AM","PAJE_GED")`);
  const select = "code_departement,code_categorie_d_emploi,nombre_d_heures_declarees,masse_salariale_nette";
  const out = [];
  for (let offset = 0; offset < 300; offset += 100) {
    const res = await fetch(`${base}?limit=100&offset=${offset}&select=${select}&where=${where}`);
    if (!res.ok) throw new Error(`URSSAF ${offset} -> ${res.status}`);
    const j = await res.json();
    out.push(...(j.results ?? []));
    if (offset + 100 >= (j.total_count ?? 0)) break;
  }
  return out;
}

console.log("Téléchargement des données URSSAF…");
const records = await fetchAll();

const byDept = new Map(); // code -> { amM, amH, gM, gH }
let amM = 0, amH = 0, gM = 0, gH = 0;
for (const r of records) {
  const dep = r.code_departement;
  const h = r.nombre_d_heures_declarees;
  const m = r.masse_salariale_nette;
  if (!dep || dep === "nca" || !h) continue;
  let d = byDept.get(dep);
  if (!d) byDept.set(dep, (d = { amM: 0, amH: 0, gM: 0, gH: 0 }));
  if (r.code_categorie_d_emploi === "PAJE_AM") { d.amM += m; d.amH += h; amM += m; amH += h; }
  if (r.code_categorie_d_emploi === "PAJE_GED") { d.gM += m; d.gH += h; gM += m; gH += h; }
}

const national = {
  tauxHoraireAma: round2(amM / amH),
  coutHoraireDomicile: round1((gM / gH) * FACTEUR_COUT_TOTAL_DOMICILE),
  tarifMicroCreche: TARIF_MICRO_CRECHE_NATIONAL,
};

const departements = {};
for (const [code, d] of [...byDept.entries()].sort()) {
  const entry = {};
  if (d.amH) entry.tauxHoraireAma = round2(d.amM / d.amH);
  if (d.gH) entry.coutHoraireDomicile = round1((d.gM / d.gH) * FACTEUR_COUT_TOTAL_DOMICILE);
  if (Object.keys(entry).length) departements[code] = entry;
}

const payload = {
  source: "URSSAF — Salariés des particuliers employeurs en 2024 (open.urssaf.fr)",
  annee: ANNEE,
  facteurCoutTotalDomicile: FACTEUR_COUT_TOTAL_DOMICILE,
  national,
  departements,
};

writeFileSync(join(ROOT, "src/data/tarifs-departements.json"), JSON.stringify(payload, null, 0) + "\n");
console.log(
  `OK — national AMA ${national.tauxHoraireAma} €/h, domicile ${national.coutHoraireDomicile} €/h ; ` +
    `${Object.keys(departements).length} départements.`,
);
