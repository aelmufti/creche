// Types du moteur de calcul. Le moteur est un ensemble de fonctions pures
// (inputs, config) -> résultats par mode. Aucune valeur chiffrée en dur :
// tout provient de bareme-2026.json (cf. plan §7, §13).

export type ModeId = "creche" | "micro_creche" | "ama" | "domicile" | "partagee";

export interface Bareme {
  version: string;
  source: string;
  ressources: {
    type: string;
    plancher: number;
    plafond: number;
  };
  taux_effort_collectif: Record<"1" | "2" | "3" | "4_7" | "8_plus", number>;
  cout_horaire_ref: { ama: number; domicile: number };
  plafond_horaire: { ama: number; domicile: number; micro_creche: number };
  cotisations: {
    prise_en_charge_ama: number;
    prise_en_charge_domicile: number;
    taux_charges_domicile_approx: number;
  };
  cmg_max_emploi_direct: { ama: number; domicile: number };
  credit_impot: {
    frais_garde: { taux: number; plafond_par_enfant: number };
    emploi_domicile: {
      taux: number;
      plafond_base: number;
      majoration_par_enfant: number;
      plafond_max: number;
    };
  };
  majorations: { isole_plafond: number; aeeh: number; atypique: number };
  tranches_revenus_annuels_1enfant: { T1_max: number; T2_max: number };
  micro_creche_structure: {
    plafond_horaire: number;
    couverture_max: number;
    reste_a_charge_min: number;
    distinction_age: boolean;
    reduction_3_6ans: number;
    forfait_max_mensuel_1enfant_moins3ans: {
      T1: number;
      T2: number;
      T3: number;
      _note?: string;
    };
  };
}

export interface Inputs {
  // --- Champs principaux (faible friction, cf. §10) ---
  /** Revenu net mensuel du foyer (proxy des revenus nets catégoriels N-2 / 12). */
  revenuMensuelNet: number;
  situation: "couple" | "isole";
  /** Nombre total d'enfants à charge dans le foyer — pilote le taux d'effort. */
  nbEnfants: number;
  /**
   * Âges (en années) des enfants effectivement placés en garde. La longueur du
   * tableau = nombre d'enfants gardés (≥ 1). Pour les modes « par place »
   * (crèche, micro-crèche, AMA) le coût est sommé par enfant ; pour la garde à
   * domicile/partagée une seule personne garde tous les enfants → coût unique.
   */
  agesGardes: number[];
  /** Heures de garde facturées par mois et par enfant (même fenêtre pour tous). */
  heuresMois: number;
  codePostal?: string;

  // --- Champs avancés (repliés) ---
  tauxHoraireAma?: number;
  fraisAnnexesAma?: number; // indemnités entretien + repas, mensuel (non aidé)
  coutHoraireDomicile?: number; // coût horaire total employeur
  tarifMicroCreche?: number; // €/h structure
  participationEmployeur?: number; // mensuel (CESU / part employeur)
  nbFamillesPartage?: number; // garde partagée, défaut 2
  horairesAtypiques?: boolean;
  aeeh?: boolean;
}

/** Une ligne de la décomposition (pour les barres §11). */
export interface BreakdownStep {
  label: string;
  montant: number;
}

export interface ModeResult {
  mode: ModeId;
  label: string;
  /** Coût brut mensuel avant aides. */
  coutBrut: number;
  /** Aide mensuelle (CMG, réduction tarif PSU intégrée, ou aide structure). */
  aide: number;
  participationEmployeur: number;
  /** Trésorerie mensuelle : ce qui part du compte chaque mois (avant crédit d'impôt). */
  tresorerieMensuelle: number;
  /** Crédit d'impôt mensualisé (annuel / 12). */
  creditImpotMensuel: number;
  creditImpotAnnuel: number;
  /** Coût net réel mensuel : après crédit d'impôt. C'est le critère de classement. */
  netReel: number;
  breakdown: BreakdownStep[];
  /** Drapeaux honnêtes (place non garantie, activité requise, etc.). */
  flags: string[];
  /** Données de debug / affichage spécifiques au mode. */
  details: Record<string, number>;
}

export interface ComparisonResult {
  results: ModeResult[];
  /** Résultats triés par coût net réel croissant. */
  classement: ModeResult[];
  gagnant: ModeResult;
  /** Écart € mensuel entre le gagnant et le 2e. */
  ecartAuSuivant: number;
}
