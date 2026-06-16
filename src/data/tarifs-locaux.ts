import departementsJson from "./departements.json";
import tarifsJson from "./tarifs-departements.json";

// Données géographiques OFFICIELLES (générées par scripts/build-geo-data.mjs
// depuis geo.api.gouv.fr — IGN/INSEE). Le département vient du code INSEE de la
// commune, fiable, contrairement au préfixe du code postal.
//
// PERF (CWV) : la table code postal → département (~82 KB) n'est PAS importée
// statiquement → elle est chargée à la demande (import dynamique), pour ne pas
// alourdir le bundle de l'îlot calculateur. Seuls les tarifs (petits) sont en dur.
const DEPARTEMENTS = departementsJson as Record<string, string>;

let cpMapPromise: Promise<Record<string, string>> | null = null;
function loadCodesPostaux(): Promise<Record<string, string>> {
  if (!cpMapPromise) {
    cpMapPromise = import("./codes-postaux.json").then(
      (m) => m.default as Record<string, string>,
    );
  }
  return cpMapPromise;
}

export interface Departement {
  code: string;
  nom: string;
}

/** Département officiel correspondant à un code postal (5 chiffres), ou null. */
export async function departementDuCodePostal(codePostal?: string): Promise<Departement | null> {
  if (!codePostal) return null;
  const cp = codePostal.trim();
  if (!/^\d{5}$/.test(cp)) return null;
  const codes = await loadCodesPostaux();
  const code = codes[cp];
  if (!code) return null;
  // Les collectivités d'outre-mer (975, 977, 978…) ne sont pas des départements
  // et relèvent d'un régime distinct → on ne les traite pas comme tels.
  const nom = DEPARTEMENTS[code];
  if (!nom) return null;
  return { code, nom };
}

export interface TarifsLocaux {
  /** Taux horaire net assistante maternelle (€/h). */
  tauxHoraireAma: number;
  /** Coût horaire total employeur garde à domicile (€/h). */
  coutHoraireDomicile: number;
  /** Tarif horaire micro-crèche structure (€/h). */
  tarifMicroCreche: number;
}

/**
 * Tarifs nationaux indicatifs (hypothèses de saisie, modifiables — PAS du barème).
 * Salaires AMA / garde à domicile = données réelles URSSAF (cf. SOURCE_TARIFS) ;
 * tarif micro-crèche national (pas de source départementale, plafonné à 10 €/h).
 */
export const TARIFS_NATIONAL: TarifsLocaux = tarifsJson.national;

/** Provenance et année des tarifs locaux (à citer dans l'UI / la méthodologie). */
export const SOURCE_TARIFS = { source: tarifsJson.source, annee: tarifsJson.annee };

/**
 * Tarifs réels par département (salaire AMA + coût garde à domicile), dérivés
 * des données open data URSSAF 2024. Générés par scripts/build-tarifs-data.mjs.
 */
export const TARIFS_DEPARTEMENTS = tarifsJson.departements as Record<
  string,
  Partial<TarifsLocaux>
>;

export interface ResolutionTarifs {
  /** Département officiel identifié, ou null si code postal vide/invalide. */
  dept: Departement | null;
  /** Code postal à 5 chiffres saisi mais introuvable dans la base. */
  inconnu: boolean;
  /** Vrai si des tarifs locaux sourcés existent pour ce département. */
  tarifsSources: boolean;
  /** Tarifs à appliquer (locaux sourcés si dispo, sinon nationaux indicatifs). */
  tarifs: TarifsLocaux;
}

/** Résolution par défaut (national) — état initial sans chargement de la base postale. */
export const RESOLUTION_NATIONALE: ResolutionTarifs = {
  dept: null,
  inconnu: false,
  tarifsSources: false,
  tarifs: TARIFS_NATIONAL,
};

/** Résout département + tarifs à partir d'un code postal officiel (async, lazy). */
export async function tarifsLocaux(codePostal?: string): Promise<ResolutionTarifs> {
  const dept = await departementDuCodePostal(codePostal);
  const override = dept ? TARIFS_DEPARTEMENTS[dept.code] : undefined;
  const inconnu = !dept && !!codePostal && /^\d{5}$/.test(codePostal.trim());
  return {
    dept,
    inconnu,
    tarifsSources: !!override,
    tarifs: { ...TARIFS_NATIONAL, ...override },
  };
}
