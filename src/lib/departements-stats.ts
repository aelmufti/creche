// Statistiques départementales dérivées des données URSSAF — tout est CALCULÉ
// à partir de src/data/tarifs-departements.json, rien n'est saisi à la main.
//
// But : donner à chaque page département un contenu réellement propre (rang
// national, positionnement, départements comparables, seuil de bascule local)
// plutôt qu'un gabarit figé où seuls le nom et deux nombres changent — c'est le
// garde-fou « unicité » du plan SEO (§3.2), sans lequel les 100 pages risquent
// d'être vues comme du contenu dupliqué.

import { comparer, type Inputs } from "../engine";
import { TARIFS_DEPARTEMENTS, TARIFS_NATIONAL } from "../data/tarifs-locaux";
import departementsJson from "../data/departements.json";
import { slugify } from "./slug";

const departements = departementsJson as Record<string, string>;

export interface DeptStat {
  code: string;
  nom: string;
  slug: string;
  tauxHoraireAma: number;
  coutHoraireDomicile: number;
}

/** Départements disposant d'une donnée locale réelle, triés du plus cher au moins cher (salaire AMA). */
export const CLASSEMENT_AMA: DeptStat[] = Object.keys(TARIFS_DEPARTEMENTS)
  .filter((code) => departements[code])
  .map((code) => {
    const t = { ...TARIFS_NATIONAL, ...TARIFS_DEPARTEMENTS[code] };
    return {
      code,
      nom: departements[code],
      slug: slugify(departements[code]),
      tauxHoraireAma: t.tauxHoraireAma,
      coutHoraireDomicile: t.coutHoraireDomicile,
    };
  })
  .sort((a, b) => b.tauxHoraireAma - a.tauxHoraireAma);

export const NB_DEPARTEMENTS = CLASSEMENT_AMA.length;

const RANG_PAR_CODE = new Map(CLASSEMENT_AMA.map((d, i) => [d.code, i + 1]));

/** Rang national (1 = le plus cher) sur le salaire horaire des assistantes maternelles. */
export function rangAma(code: string): number {
  return RANG_PAR_CODE.get(code) ?? 0;
}

/** Quartile de cherté : 1 = le plus cher, 4 = le moins cher. */
export function quartile(code: string): 1 | 2 | 3 | 4 {
  const r = rangAma(code);
  const q = Math.ceil((r / NB_DEPARTEMENTS) * 4);
  return Math.min(4, Math.max(1, q)) as 1 | 2 | 3 | 4;
}

/**
 * Départements au tarif le plus proche (hors lui-même) — maillage latéral.
 * On compare sur le salaire AMA, la donnée locale la plus significative.
 * (Pas de maillage « limitrophe » : le projet n'embarque aucune donnée
 * d'adjacence géographique, et l'inventer produirait des liens faux.)
 */
export function departementsComparables(code: string, n = 4): DeptStat[] {
  const ref = CLASSEMENT_AMA.find((d) => d.code === code);
  if (!ref) return [];
  return CLASSEMENT_AMA.filter((d) => d.code !== code)
    .map((d) => ({ d, ecart: Math.abs(d.tauxHoraireAma - ref.tauxHoraireAma) }))
    .sort((a, b) => a.ecart - b.ecart || a.d.nom.localeCompare(b.d.nom))
    .slice(0, n)
    .map((x) => x.d);
}

/** Moyenne nationale observée sur les départements couverts. */
export const MOYENNE_AMA =
  CLASSEMENT_AMA.reduce((s, d) => s + d.tauxHoraireAma, 0) / NB_DEPARTEMENTS;

export const DEPT_MIN = CLASSEMENT_AMA[CLASSEMENT_AMA.length - 1];
export const DEPT_MAX = CLASSEMENT_AMA[0];

export interface Bascule {
  /** Revenu mensuel net du foyer où le mode le moins cher change. */
  revenu: number;
  /** Mode gagnant en dessous de ce revenu. */
  avant: string;
  /** Mode gagnant à partir de ce revenu. */
  apres: string;
}

/**
 * Balaie le revenu du foyer et repère les revenus où le verdict change, pour
 * les tarifs de CE département. Le CMG étant dégressif avec le revenu, ces
 * seuils diffèrent réellement d'un département à l'autre : c'est l'information
 * la plus utile — et la plus spécifiquement locale — de la page.
 */
export function basculesLocales(
  tarifs: { tauxHoraireAma: number; coutHoraireDomicile: number; tarifMicroCreche: number },
  opts: { heures?: number; min?: number; max?: number; pas?: number } = {},
): Bascule[] {
  const { heures = 160, min = 1200, max = 8000, pas = 100 } = opts;
  const gagnantA = (revenu: number): string => {
    const i: Inputs = {
      revenuMensuelNet: revenu,
      situation: "couple",
      nbEnfants: 1,
      agesGardes: [1],
      heuresMois: heures,
      tauxHoraireAma: tarifs.tauxHoraireAma,
      coutHoraireDomicile: tarifs.coutHoraireDomicile,
      tarifMicroCreche: tarifs.tarifMicroCreche,
    };
    return comparer(i).gagnant.label;
  };
  const out: Bascule[] = [];
  let precedent = gagnantA(min);
  for (let r = min + pas; r <= max; r += pas) {
    const g = gagnantA(r);
    if (g !== precedent) {
      out.push({ revenu: r, avant: precedent, apres: g });
      precedent = g;
    }
  }
  return out;
}
