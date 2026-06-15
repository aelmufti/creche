import { defauts } from "../engine/bareme";
import departementsJson from "./departements.json";
import codesPostauxJson from "./codes-postaux.json";

// Données géographiques OFFICIELLES (générées par scripts/build-geo-data.mjs
// depuis geo.api.gouv.fr — IGN/INSEE). Le département vient du code INSEE de la
// commune, fiable, contrairement au préfixe du code postal.
const DEPARTEMENTS = departementsJson as Record<string, string>;
const CODES_POSTAUX = codesPostauxJson as Record<string, string>;

export interface Departement {
  code: string;
  nom: string;
}

/** Département officiel correspondant à un code postal (5 chiffres), ou null. */
export function departementDuCodePostal(codePostal?: string): Departement | null {
  if (!codePostal) return null;
  const cp = codePostal.trim();
  if (!/^\d{5}$/.test(cp)) return null;
  const code = CODES_POSTAUX[cp];
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
 * Les coûts réglementés (crèche PSU, CMG, plafond micro-crèche) sont nationaux ;
 * les salaires AMA / garde à domicile varient localement mais nous n'avons pas
 * encore de source départementale validée → données locales sourcées à venir (§14).
 */
export const TARIFS_NATIONAL: TarifsLocaux = {
  tauxHoraireAma: defauts.tauxHoraireAma,
  coutHoraireDomicile: defauts.coutHoraireDomicile,
  tarifMicroCreche: defauts.tarifMicroCreche,
};

/**
 * Surcharges tarifaires par département. Vide tant qu'aucune donnée n'est
 * sourcée (observatoires petite enfance, agrégats Urssaf/Pajemploi). Dès qu'une
 * source fiable est branchée, ajouter ici des entrées { "75": { ... } }.
 */
export const TARIFS_DEPARTEMENTS: Record<string, Partial<TarifsLocaux>> = {};

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

/** Résout département + tarifs à partir d'un code postal officiel. */
export function tarifsLocaux(codePostal?: string): ResolutionTarifs {
  const dept = departementDuCodePostal(codePostal);
  const override = dept ? TARIFS_DEPARTEMENTS[dept.code] : undefined;
  const inconnu = !dept && !!codePostal && /^\d{5}$/.test(codePostal.trim());
  return {
    dept,
    inconnu,
    tarifsSources: !!override,
    tarifs: { ...TARIFS_NATIONAL, ...override },
  };
}
