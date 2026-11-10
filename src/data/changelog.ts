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
    date: "2026-11-10",
    type: "correction",
    texte:
      "Micro-crèche, enfant de 3 à 6 ans : le calcul divisait l'aide par deux, alors que la règle divise par deux le montant maximum. À temps partiel, l'aide était sous-estimée : pour l'exemple de service-public.fr (couple à 28 000 € de revenus annuels, enfant de 3 ans, facture de 600 € par mois), le comparateur donnait 255 € au lieu de 427,63 €. Les deux exemples officiels sont désormais des tests automatiques. Les chiffres à temps plein ne changent pas.",
  },
  {
    date: "2026-11-10",
    type: "correction",
    texte:
      "CMG en emploi direct : le plancher de ressources est de 821 € par mois (instruction interministérielle du 20 mars 2026), et non 814,62 €, qui est le plancher du tarif crèche. Seuls les foyers dont les ressources sont inférieures à 821 € par mois voient leur estimation changer, de quelques euros.",
  },
  {
    date: "2026-11-10",
    type: "correction",
    texte:
      "Micro-crèche : les seuils de revenus officiels par nombre d'enfants à charge (1 à 4 enfants et au-delà, couple et parent isolé) remplacent les seuils « 1 enfant » appliqués jusqu'ici à tous les foyers. Les montants majorés de 30 % sont repris tels que publiés (1 289,77 / 1 111,82 / 933,94 €) et s'appliquent aussi lorsqu'un enfant du foyer bénéficie de l'AEEH, ce qui n'était pas pris en compte.",
  },
  {
    date: "2026-11-10",
    type: "correction",
    texte:
      "Sources et formulations corrigées. L'exemple de calcul du CMG (2 000 €, 160 h, 4,91 €/h → 587,52 €) est publié par l'Urssaf, et non par la CAF comme indiqué. Tarif crèche : les ressources retenues sont les revenus de l'année N-2 avant l'abattement fiscal de 10 %, et non le revenu net catégoriel ; le plafond de 8 500 € est la règle générale, mais un gestionnaire peut aller au-delà. Garde partagée : le plafond horaire s'applique à la part de chaque famille. Glossaire : les deux avantages fiscaux sont des crédits d'impôt, non des réductions.",
  },
  {
    date: "2026-11-10",
    type: "methode",
    texte:
      "Vérification complète du barème contre les textes officiels : instruction interministérielle n° DSS/2B/2026/46 du 20 mars 2026 (CMG au 1er avril 2026), barème CNAF des participations familiales 2026, fiches service-public.fr (CMG structure, crédits d'impôt). Les tarifs des 100 départements ont été recalculés à partir de l'open data Urssaf : aucun écart.",
  },
  {
    date: "2026-11-10",
    type: "correction",
    texte:
      "Scénario de référence unifié sur tout le site. L'encadré de l'accueil et les guides calculaient avec des tarifs indicatifs (assistante maternelle à 4,00 €/h, garde à domicile à 17,50 €/h) alors que le comparateur utilise les moyennes nationales Urssaf 2024 (4,03 €/h et 19,20 €/h) : un même foyer pouvait lire 138 € sur une page et 139 € sur une autre. Tous les exemples chiffrés partent désormais des moyennes nationales Urssaf, comme le comparateur.",
  },
  {
    date: "2026-11-10",
    type: "correction",
    texte:
      "Guide « Garde à domicile » : l'ancien texte la présentait comme compétitive pour les hauts revenus et les familles de plusieurs enfants. Le calcul ne le confirme pas : dans les exemples du guide, elle reste le mode le plus cher pour un enfant, et c'est la garde partagée qui devient intéressante aux revenus élevés. Le texte a été corrigé et les tableaux le montrent.",
  },
  {
    date: "2026-11-10",
    type: "contenu",
    texte:
      "Guides CMG 2026, réforme du CMG, reste à charge d'une assistante maternelle, crédit d'impôt, garde à domicile, garde partagée et micro-crèche réécrits : tableaux par niveau de revenus, exemples pas à pas et questions fréquentes, tous calculés par le moteur du comparateur à partir du barème en vigueur.",
  },
  {
    date: "2026-11-10",
    type: "contenu",
    texte:
      "Observatoire : classement complet des 100 départements, chiffres clés et citation prête à l'emploi. Pages département et ville : les questions fréquentes sont désormais affichées sur la page, avec les chiffres locaux. Signature (auteur, date de révision, méthode) ajoutée en tête des guides et des pages locales.",
  },
  {
    date: "2026-10-07",
    type: "correction",
    texte:
      "Référence légale de la réforme du CMG corrigée : article 86 de la loi de financement de la sécurité sociale pour 2023 (loi n° 2022-1616), et non article 99 de la LFSS 2024. Les montants et les calculs ne changent pas.",
  },
  {
    date: "2026-09-27",
    type: "donnees",
    texte:
      "Barème mis à jour avec la revalorisation du 1er avril 2026 : coût horaire de référence du CMG 4,91 €/h (assistante maternelle) et 10,50 €/h (garde à domicile), plafond horaire 8,09 €/h (assistante maternelle), plafond de prise en charge des cotisations en garde à domicile 524 €/mois (moins de 3 ans) et 263 €/mois (3-6 ans), forfaits micro-crèche 992,13 / 855,25 / 718,41 € et seuils de revenus 24 333 € et 54 075 €. Les valeurs précédentes dataient de 2025.",
  },
  {
    date: "2026-09-27",
    type: "correction",
    texte:
      "Calcul du CMG en emploi direct aligné sur les règles publiées par la CAF depuis la réforme de septembre 2025 : suppression du montant maximum mensuel (il n'existe plus), intégration des indemnités d'entretien et de repas dans le coût de l'assistante maternelle, calcul de la garde à domicile sur le salaire net, AEEH traitée par le taux d'effort de la tranche inférieure, suppression des majorations parent isolé et horaires spécifiques (abrogées). Micro-crèche : forfaits T2/T3 corrigés (ils étaient sous-estimés), majoration parent isolé appliquée, et plus de CMG au-delà de 10 €/h. Le verdict peut changer : l'assistante maternelle et la crèche sont désormais très proches, conformément à l'objectif de la réforme.",
  },
  {
    date: "2026-09-27",
    type: "methode",
    texte:
      "Tests du moteur : l'exemple chiffré publié par l'Urssaf (2 000 €, 160 h, 4,91 €/h → CMG de 587,52 €) et les montants officiels 2026 sont désormais vérifiés automatiquement, en plus des invariants.",
  },
  {
    date: "2026-09-27",
    type: "correction",
    texte:
      "Licence des données corrigée : les données Urssaf (« Salariés des particuliers employeurs en 2024 ») sont publiées sous licence ODbL, et non sous Licence Ouverte Etalab comme indiqué jusqu'ici. Le fichier CSV et les tableaux par département, qui en dérivent, sont désormais mis à disposition sous ODbL 1.0, avec mention de la source.",
  },
  {
    date: "2026-09-27",
    type: "contenu",
    texte:
      "Pages légales complétées : mentions légales (éditeur, directeur de la publication, hébergeur, sources et licences), politique de confidentialité détaillée (traitements, bases légales, durées, droits, réclamation CNIL) avec possibilité de s'opposer à la mesure d'audience, et nouvelles conditions d'utilisation.",
  },
  {
    date: "2026-09-27",
    type: "contenu",
    texte:
      "Nouveau guide « Tarif crèche 2026 » : calcul du tarif en crèche collective (ressources × taux d'effort CNAF), barème 2026 par nombre d'enfants et exemples par niveau de revenus, calculés par le même moteur que le comparateur.",
  },
  {
    date: "2026-09-27",
    type: "contenu",
    texte:
      "Accueil : ajout d'une réponse chiffrée en tête de page (mode le moins cher pour le scénario par défaut), calculée au build à partir du barème en vigueur.",
  },
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
