// Construit les données géographiques officielles bundlées :
//   - src/data/departements.json : code département -> nom (API officielle)
//   - src/data/codes-postaux.json : code postal -> code département
//
// Source : geo.api.gouv.fr (IGN/INSEE), autorité officielle. Le département est
// dérivé du code INSEE de la commune (fiable), PAS du préfixe du code postal
// (non fiable : un même code postal peut couvrir plusieurs départements).
// Conflits (cp sur plusieurs départements) résolus par la population de la commune.
//
// Régénérer : node scripts/build-geo-data.mjs

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const API = "https://geo.api.gouv.fr";

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

console.log("Téléchargement des départements…");
const depts = await getJson(`${API}/departements?fields=nom,code`);
const departements = {};
for (const d of depts.sort((a, b) => a.code.localeCompare(b.code))) departements[d.code] = d.nom;

console.log("Téléchargement des communes + codes postaux…");
const communes = await getJson(`${API}/communes?fields=codesPostaux,codeDepartement,population&format=json`);

// cp -> { dept: population cumulée } pour arbitrer les conflits.
const acc = new Map();
for (const c of communes) {
  const dept = c.codeDepartement;
  const pop = c.population ?? 0;
  for (const cp of c.codesPostaux ?? []) {
    if (!/^\d{5}$/.test(cp)) continue;
    let m = acc.get(cp);
    if (!m) acc.set(cp, (m = {}));
    m[dept] = (m[dept] ?? 0) + pop;
  }
}

const codesPostaux = {};
let conflits = 0;
for (const [cp, m] of [...acc.entries()].sort()) {
  const depList = Object.entries(m);
  if (depList.length > 1) conflits++;
  // Département de la population la plus élevée pour ce code postal.
  depList.sort((a, b) => b[1] - a[1]);
  codesPostaux[cp] = depList[0][0];
}

writeFileSync(join(ROOT, "src/data/departements.json"), JSON.stringify(departements) + "\n");
writeFileSync(join(ROOT, "src/data/codes-postaux.json"), JSON.stringify(codesPostaux) + "\n");

console.log(
  `OK — ${Object.keys(departements).length} départements, ${
    Object.keys(codesPostaux).length
  } codes postaux (${conflits} multi-départements arbitrés par population).`,
);
