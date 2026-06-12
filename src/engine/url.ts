import type { Inputs } from "./types";

// Sauvegarde SANS compte : l'état du formulaire est encodé dans les query params
// (§11). C'est le « save » partageable, et il alimente aussi les pages par ville.

export const inputsParDefaut: Inputs = {
  revenuMensuelNet: 3000,
  situation: "couple",
  nbEnfants: 1,
  agesGardes: [1],
  heuresMois: 160,
};

// Clés courtes pour des URL compactes.
const MAP: Record<string, keyof Inputs> = {
  r: "revenuMensuelNet",
  s: "situation",
  n: "nbEnfants",
  h: "heuresMois",
  cp: "codePostal",
  ta: "tauxHoraireAma",
  fa: "fraisAnnexesAma",
  cd: "coutHoraireDomicile",
  tm: "tarifMicroCreche",
  pe: "participationEmployeur",
  nf: "nbFamillesPartage",
  at: "horairesAtypiques",
  ah: "aeeh",
};

const NUMERIC: Set<keyof Inputs> = new Set([
  "revenuMensuelNet",
  "nbEnfants",
  "heuresMois",
  "tauxHoraireAma",
  "fraisAnnexesAma",
  "coutHoraireDomicile",
  "tarifMicroCreche",
  "participationEmployeur",
  "nbFamillesPartage",
]);

const BOOL: Set<keyof Inputs> = new Set(["horairesAtypiques", "aeeh"]);

export function encodeInputs(i: Inputs): string {
  const p = new URLSearchParams();
  for (const [short, key] of Object.entries(MAP)) {
    const v = i[key];
    if (v === undefined || v === null || v === "") continue;
    if (BOOL.has(key)) {
      if (v) p.set(short, "1");
    } else {
      p.set(short, String(v));
    }
  }
  // Âges des enfants gardés : liste compacte "1,4".
  if (i.agesGardes.length) p.set("ag", i.agesGardes.join(","));
  return p.toString();
}

export function decodeInputs(search: string): Inputs {
  const p = new URLSearchParams(search);
  const out: Inputs = { ...inputsParDefaut };
  for (const [short, key] of Object.entries(MAP)) {
    const raw = p.get(short);
    if (raw === null) continue;
    if (NUMERIC.has(key)) {
      const n = Number(raw);
      if (!Number.isNaN(n)) (out as unknown as Record<string, unknown>)[key] = n;
    } else if (BOOL.has(key)) {
      (out as unknown as Record<string, unknown>)[key] = raw === "1";
    } else if (key === "situation") {
      out.situation = raw === "isole" ? "isole" : "couple";
    } else {
      (out as unknown as Record<string, unknown>)[key] = raw;
    }
  }
  const ag = p.get("ag");
  if (ag !== null) {
    const ages = ag
      .split(",")
      .map((s) => Number(s))
      .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);
    if (ages.length) out.agesGardes = ages;
  }
  return out;
}
