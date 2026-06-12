import baremeJson from "../../bareme-2026.json";
import type { Bareme } from "./types";

// Source unique de vérité : le fichier bareme-2026.json à la racine, bundlé au
// build (cf. §13). Aucune valeur chiffrée ne doit être dupliquée ailleurs.
export const bareme: Bareme = baremeJson as Bareme;

// Valeurs de pré-remplissage « typiques » pour donner une réponse même sans
// connaître les prix locaux (cf. §10). Ce ne sont PAS des paramètres de barème
// réglementaire : ce sont des hypothèses de saisie, modifiables par l'utilisateur.
export const defauts = {
  tauxHoraireAma: 4.0, // €/h net AMA, moyenne nationale indicative
  fraisAnnexesAma: 90, // indemnités entretien + repas, mensuel
  coutHoraireDomicile: 17.5, // €/h total employeur (salaire + charges)
  tarifMicroCreche: 10.0, // €/h structure (plafonné à 10 pour le calcul)
  tarifCrecheNonUtilise: 0, // le tarif crèche PSU est calculé, jamais saisi
} as const;
