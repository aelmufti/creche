// Classement des grandes villes couvertes, CALCULÉ depuis les tarifs URSSAF
// départementaux et le moteur de comparaison.
//
// But : les pages ville étaient à ~98 % identiques entre elles (même gabarit,
// mêmes phrases, seul le nom changeait) — thin content dupliqué, exactement ce
// que le §3.2 du plan SEO interdit. Chaque page peut désormais situer sa ville
// dans un classement réel et pointer les villes aux budgets voisins.
//
// Honnêteté de la donnée : la granularité URSSAF est DÉPARTEMENTALE. Deux
// villes d'un même département partagent donc la même base tarifaire — les
// pages le disent explicitement (cf. villesMemeDept).

import { comparer, type Inputs } from "../engine";
import { TARIFS_DEPARTEMENTS, TARIFS_NATIONAL } from "../data/tarifs-locaux";
import { VILLES, type Ville } from "../data/villes";
import { slugify } from "./slug";
import departementsJson from "../data/departements.json";

const departements = departementsJson as Record<string, string>;

/** Scénario de référence, identique à celui affiché sur les pages (comparabilité). */
export const SCENARIO = { revenu: 3000, heures: 160 };

export interface VilleStat {
  nom: string;
  slug: string;
  dept: string;
  deptNom: string;
  deptSlug: string;
  cp: string;
  tauxHoraireAma: number;
  /** Coût net réel mensuel d'une assistante maternelle, scénario de référence. */
  coutAma: number;
  /** Mode le moins cher et son coût net réel, scénario de référence. */
  gagnant: string;
  coutGagnant: number;
}

function statDe(v: Ville): VilleStat {
  const tarifs = { ...TARIFS_NATIONAL, ...TARIFS_DEPARTEMENTS[v.dept] };
  const inputs: Inputs = {
    revenuMensuelNet: SCENARIO.revenu,
    situation: "couple",
    nbEnfants: 1,
    agesGardes: [1],
    heuresMois: SCENARIO.heures,
    tauxHoraireAma: tarifs.tauxHoraireAma,
    coutHoraireDomicile: tarifs.coutHoraireDomicile,
    tarifMicroCreche: tarifs.tarifMicroCreche,
  };
  const { results, gagnant } = comparer(inputs);
  const ama = results.find((r) => r.mode === "ama")!;
  const deptNom = departements[v.dept] ?? "";
  return {
    nom: v.nom,
    slug: slugify(v.nom),
    dept: v.dept,
    deptNom,
    deptSlug: slugify(deptNom),
    cp: v.cp,
    tauxHoraireAma: tarifs.tauxHoraireAma,
    coutAma: ama.netReel,
    gagnant: gagnant.label,
    coutGagnant: gagnant.netReel,
  };
}

/** Villes couvertes, de la plus chère à la moins chère (coût réel d'une AMA). */
export const CLASSEMENT_VILLES: VilleStat[] = VILLES.filter((v) => TARIFS_DEPARTEMENTS[v.dept])
  .map(statDe)
  .sort((a, b) => b.coutAma - a.coutAma || a.nom.localeCompare(b.nom, "fr"));

export const NB_VILLES = CLASSEMENT_VILLES.length;

// Rang « à la sportive » : deux villes au même coût partagent le même rang.
// Indispensable ici — les villes d'un même département (Lyon/Villeurbanne,
// Marseille/Aix, Le Havre/Rouen) ont par construction un coût identique, et les
// départager donnerait un classement faux (« Villeurbanne, moins chère que Lyon »).
const RANG_PAR_VILLE = new Map(
  CLASSEMENT_VILLES.map((v) => [
    v.nom,
    1 + CLASSEMENT_VILLES.filter((o) => o.coutAma > v.coutAma).length,
  ]),
);

/** Rang de cherté parmi les grandes villes couvertes (1 = la plus chère). */
export function rangVille(nom: string): number {
  return RANG_PAR_VILLE.get(nom) ?? 0;
}

/**
 * Repères de comparaison STRICTS : la ville immédiatement plus chère, la ville
 * immédiatement moins chère, et les villes au même coût. Comparer à une voisine
 * de classement à coût identique produirait une affirmation fausse.
 */
export function reperes(nom: string): {
  plusChere: VilleStat | null;
  moinsChere: VilleStat | null;
  exAequo: VilleStat[];
} {
  const ref = CLASSEMENT_VILLES.find((v) => v.nom === nom);
  if (!ref) return { plusChere: null, moinsChere: null, exAequo: [] };
  const plusCheres = CLASSEMENT_VILLES.filter((v) => v.coutAma > ref.coutAma);
  const moinsCheres = CLASSEMENT_VILLES.filter((v) => v.coutAma < ref.coutAma);
  return {
    plusChere: plusCheres[plusCheres.length - 1] ?? null,
    moinsChere: moinsCheres[0] ?? null,
    exAequo: CLASSEMENT_VILLES.filter((v) => v.coutAma === ref.coutAma && v.nom !== nom),
  };
}

export const VILLE_MIN = CLASSEMENT_VILLES[NB_VILLES - 1];
export const VILLE_MAX = CLASSEMENT_VILLES[0];

/**
 * Voisines immédiates au classement (au-dessus et en dessous) : donne un
 * repère concret « plus cher que X, moins cher que Y » propre à chaque page.
 */
export function voisinesClassement(nom: string, n = 2): { avant: VilleStat[]; apres: VilleStat[] } {
  // Découpage par INDEX, pas par rang : le rang est partagé en cas d'égalité,
  // et s'en servir comme position ferait disparaître les ex aequo du tableau.
  const i = CLASSEMENT_VILLES.findIndex((v) => v.nom === nom);
  if (i < 0) return { avant: [], apres: [] };
  return {
    avant: CLASSEMENT_VILLES.slice(Math.max(0, i - n), i),
    apres: CLASSEMENT_VILLES.slice(i + 1, i + 1 + n),
  };
}

/** Autres villes couvertes du même département : même base tarifaire URSSAF. */
export function villesMemeDept(nom: string): VilleStat[] {
  const ref = CLASSEMENT_VILLES.find((v) => v.nom === nom);
  if (!ref) return [];
  return CLASSEMENT_VILLES.filter((v) => v.dept === ref.dept && v.nom !== nom);
}
