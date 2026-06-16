// Lot curaté des principales villes (recherche locale « nounou/crèche [ville] »).
// Volontairement limité aux grandes villes : la donnée tarifaire est de granularité
// DÉPARTEMENTALE (URSSAF) — les pages ville le précisent explicitement et renvoient
// vers la page département. On évite la génération de masse (risque thin content).

export interface Ville {
  nom: string;
  /** Code postal représentatif (pour pré-remplir le calculateur). */
  cp: string;
  /** Code département (doit exister dans les tarifs URSSAF). */
  dept: string;
}

export const VILLES: Ville[] = [
  { nom: "Paris", cp: "75001", dept: "75" },
  { nom: "Marseille", cp: "13001", dept: "13" },
  { nom: "Lyon", cp: "69001", dept: "69" },
  { nom: "Toulouse", cp: "31000", dept: "31" },
  { nom: "Nice", cp: "06000", dept: "06" },
  { nom: "Nantes", cp: "44000", dept: "44" },
  { nom: "Montpellier", cp: "34000", dept: "34" },
  { nom: "Strasbourg", cp: "67000", dept: "67" },
  { nom: "Bordeaux", cp: "33000", dept: "33" },
  { nom: "Lille", cp: "59000", dept: "59" },
  { nom: "Rennes", cp: "35000", dept: "35" },
  { nom: "Reims", cp: "51100", dept: "51" },
  { nom: "Saint-Étienne", cp: "42000", dept: "42" },
  { nom: "Le Havre", cp: "76600", dept: "76" },
  { nom: "Toulon", cp: "83000", dept: "83" },
  { nom: "Grenoble", cp: "38000", dept: "38" },
  { nom: "Dijon", cp: "21000", dept: "21" },
  { nom: "Angers", cp: "49000", dept: "49" },
  { nom: "Nîmes", cp: "30000", dept: "30" },
  { nom: "Villeurbanne", cp: "69100", dept: "69" },
  { nom: "Clermont-Ferrand", cp: "63000", dept: "63" },
  { nom: "Le Mans", cp: "72000", dept: "72" },
  { nom: "Aix-en-Provence", cp: "13100", dept: "13" },
  { nom: "Brest", cp: "29200", dept: "29" },
  { nom: "Tours", cp: "37000", dept: "37" },
  { nom: "Amiens", cp: "80000", dept: "80" },
  { nom: "Limoges", cp: "87000", dept: "87" },
  { nom: "Annecy", cp: "74000", dept: "74" },
  { nom: "Perpignan", cp: "66000", dept: "66" },
  { nom: "Besançon", cp: "25000", dept: "25" },
  { nom: "Metz", cp: "57000", dept: "57" },
  { nom: "Orléans", cp: "45000", dept: "45" },
  { nom: "Rouen", cp: "76000", dept: "76" },
  { nom: "Mulhouse", cp: "68100", dept: "68" },
  { nom: "Caen", cp: "14000", dept: "14" },
  { nom: "Nancy", cp: "54000", dept: "54" },
  { nom: "Argenteuil", cp: "95100", dept: "95" },
  { nom: "Boulogne-Billancourt", cp: "92100", dept: "92" },
];

/** Forme locative correcte (« à Paris », « au Havre », « au Mans »). */
export function villeLoc(nom: string): string {
  if (nom.startsWith("Le ")) return "au " + nom.slice(3);
  if (nom.startsWith("La ")) return "à la " + nom.slice(3);
  if (nom.startsWith("Les ")) return "aux " + nom.slice(4);
  return "à " + nom;
}
