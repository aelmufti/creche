import { comparer, inputsParDefaut, type Inputs } from "../engine";
import { defauts } from "../engine/bareme";
import { RESOLUTION_NATIONALE, type ResolutionTarifs } from "../data/tarifs-locaux";

/**
 * Chemin unique « entrées → comparaison » : les champs de tarifs laissés vides
 * prennent la valeur indicative de la résolution locale (nationale par défaut),
 * jamais le repli interne du moteur. Le calculateur, les textes statiques de
 * l'accueil et tous les guides passent par ici : un même scénario affiche donc
 * le même chiffre partout.
 */
export function resoudreInputs(inputs: Inputs, local: ResolutionTarifs = RESOLUTION_NATIONALE): Inputs {
  return {
    ...inputs,
    tauxHoraireAma: inputs.tauxHoraireAma ?? local.tarifs.tauxHoraireAma,
    coutHoraireDomicile: inputs.coutHoraireDomicile ?? local.tarifs.coutHoraireDomicile,
    tarifMicroCreche: inputs.tarifMicroCreche ?? local.tarifs.tarifMicroCreche,
  };
}

/**
 * Scénario de référence unique du site (couple, 3 000 €/mois, 1 enfant, 160 h) :
 * tarifs nationaux Urssaf 2024. Les indemnités d'entretien/repas sont rendues
 * explicites ; le moteur applique déjà `defauts.fraisAnnexesAma` quand le champ
 * est absent, le résultat est donc strictement identique.
 */
export const inputsReference: Inputs = {
  ...resoudreInputs(inputsParDefaut),
  fraisAnnexesAma: inputsParDefaut.fraisAnnexesAma ?? defauts.fraisAnnexesAma,
};

/** Comparaison du scénario de référence, identique à celle du calculateur au premier rendu. */
export const comparaisonParDefaut = () => comparer(inputsReference);

/** Hypothèses effectivement utilisées dans le calcul (à imprimer dans les notes des pages). */
export const TARIFS_REFERENCE = {
  /** Salaire horaire net assistante maternelle (€/h). */
  tauxHoraireAma: inputsReference.tauxHoraireAma as number,
  /** Coût horaire total employeur garde à domicile (€/h). */
  coutHoraireDomicile: inputsReference.coutHoraireDomicile as number,
  /** Tarif horaire micro-crèche (€/h). */
  tarifMicroCreche: inputsReference.tarifMicroCreche as number,
  /** Indemnités d'entretien + repas assistante maternelle (€/mois). */
  fraisAnnexesAma: inputsReference.fraisAnnexesAma as number,
} as const;
