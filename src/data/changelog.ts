// Journal des mises à jour du site, affiché sur /methodologie.
//
// Pourquoi ce fichier existe : /a-propos affirme que « toute correction est
// appliquée et le barème est versionné », et le plan SEO (§17, §21) attend une
// politique de correction publique. Une promesse de transparence sans preuve
// vérifiable est un signal négatif en YMYL, pas un signal neutre.
//
// Règle de tenue : une entrée = un changement visible par un utilisateur
// (chiffres, méthode, périmètre, correction). Les changements purement
// techniques n'y figurent pas. Les dates sont celles de la mise en ligne réelle.

export type ChangeType = "donnees" | "methode" | "contenu" | "correction";

export interface ChangeEntry {
  /** Date ISO de mise en ligne. */
  date: string;
  type: ChangeType;
  texte: string;
}

export const TYPE_LABEL: Record<ChangeType, string> = {
  donnees: "Données",
  methode: "Méthode",
  contenu: "Contenu",
  correction: "Correction",
};

/** Du plus récent au plus ancien. */
export const CHANGELOG: ChangeEntry[] = [
  {
    date: "2026-07-24",
    type: "correction",
    texte:
      "Classements départementaux et par ville passés en rangs ex aequo. Les taux horaires URSSAF étant arrondis au centime, 59 départements sur 100 partagent leur tarif avec un autre : les départager donnait un rang précis à une égalité réelle. Les départements et villes à tarif identique affichent désormais le même rang.",
  },
  {
    date: "2026-07-24",
    type: "correction",
    texte:
      "Corrections rédactionnelles sur les pages départementales (locatifs : « dans le Nord », « à Paris », « dans l'Orne » au lieu d'un « en » systématique).",
  },
  {
    date: "2026-07-24",
    type: "contenu",
    texte:
      "Ajout, sur chaque page département, des seuils de revenu où le mode de garde le moins cher change — calculés avec les tarifs locaux. Les pages ville situent désormais la ville dans un classement des grandes villes couvertes.",
  },
  {
    date: "2026-06-26",
    type: "contenu",
    texte: "Date de publication et de dernière mise à jour affichée sur chaque page.",
  },
  {
    date: "2026-06-17",
    type: "contenu",
    texte:
      "Ouverture de 38 pages de grandes villes. Les tarifs y restent de granularité départementale (URSSAF), ce que chaque page indique explicitement.",
  },
  {
    date: "2026-06-16",
    type: "contenu",
    texte:
      "Ouverture de 100 pages départementales, du cluster de guides, de l'observatoire et du glossaire.",
  },
  {
    date: "2026-06-15",
    type: "donnees",
    texte:
      "Intégration des tarifs réels par département (salaire horaire des assistantes maternelles et coût d'une garde à domicile, open data URSSAF, millésime 2024) en remplacement d'une moyenne nationale unique.",
  },
  {
    date: "2026-06-12",
    type: "methode",
    texte:
      "Mise en service du moteur de calcul des 5 modes de garde sur le barème 2026-04 (CNAF, Pajemploi, service-public.fr), réforme du CMG de septembre 2025 incluse. Les résultats sont exprimés en coût net réel, après CMG et après crédit d'impôt de 50 %.",
  },
];
