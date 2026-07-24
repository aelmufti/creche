// Locatif correct de chaque département (« dans le Nord », « en Gironde »,
// « à Paris »). Sans cette table, le gabarit produit « en Nord », « en Paris »,
// « en Orne » sur 100 pages indexées : une faute visible qui décrédibilise des
// pages qui, par ailleurs, prétendent faire autorité sur des chiffres officiels.
//
// L'usage n'est pas dérivable d'une règle simple (on dit « en Vendée » mais
// « dans la Loire ») : la préposition est donc saisie explicitement, et un test
// vérifie qu'aucun département de departements.json n'est oublié.

import departementsJson from "./departements.json";

const departements = departementsJson as Record<string, string>;

type Prep = "en" | "à" | "dans le" | "dans la" | "dans l'" | "dans les";

/** Préposition + article, par code département. */
export const PREPOSITION: Record<string, Prep> = {
  "01": "dans l'", // Ain
  "02": "dans l'", // Aisne
  "03": "dans l'", // Allier
  "04": "dans les", // Alpes-de-Haute-Provence
  "05": "dans les", // Hautes-Alpes
  "06": "dans les", // Alpes-Maritimes
  "07": "en", // Ardèche
  "08": "dans les", // Ardennes
  "09": "en", // Ariège
  "10": "dans l'", // Aube
  "11": "dans l'", // Aude
  "12": "en", // Aveyron
  "13": "dans les", // Bouches-du-Rhône
  "14": "dans le", // Calvados
  "15": "dans le", // Cantal
  "16": "en", // Charente
  "17": "en", // Charente-Maritime
  "18": "dans le", // Cher
  "19": "en", // Corrèze
  "21": "en", // Côte-d'Or
  "22": "dans les", // Côtes-d'Armor
  "23": "dans la", // Creuse
  "24": "en", // Dordogne
  "25": "dans le", // Doubs
  "26": "dans la", // Drôme
  "27": "dans l'", // Eure
  "28": "en", // Eure-et-Loir
  "29": "dans le", // Finistère
  "30": "dans le", // Gard
  "31": "en", // Haute-Garonne
  "32": "dans le", // Gers
  "33": "en", // Gironde
  "34": "dans l'", // Hérault
  "35": "en", // Ille-et-Vilaine
  "36": "dans l'", // Indre
  "37": "en", // Indre-et-Loire
  "38": "en", // Isère
  "39": "dans le", // Jura
  "40": "dans les", // Landes
  "41": "dans le", // Loir-et-Cher
  "42": "dans la", // Loire
  "43": "en", // Haute-Loire
  "44": "en", // Loire-Atlantique
  "45": "dans le", // Loiret
  "46": "dans le", // Lot
  "47": "dans le", // Lot-et-Garonne
  "48": "en", // Lozère
  "49": "en", // Maine-et-Loire
  "50": "dans la", // Manche
  "51": "dans la", // Marne
  "52": "en", // Haute-Marne
  "53": "en", // Mayenne
  "54": "en", // Meurthe-et-Moselle
  "55": "dans la", // Meuse
  "56": "dans le", // Morbihan
  "57": "en", // Moselle
  "58": "dans la", // Nièvre
  "59": "dans le", // Nord
  "60": "dans l'", // Oise
  "61": "dans l'", // Orne
  "62": "dans le", // Pas-de-Calais
  "63": "dans le", // Puy-de-Dôme
  "64": "dans les", // Pyrénées-Atlantiques
  "65": "dans les", // Hautes-Pyrénées
  "66": "dans les", // Pyrénées-Orientales
  "67": "dans le", // Bas-Rhin
  "68": "dans le", // Haut-Rhin
  "69": "dans le", // Rhône
  "70": "en", // Haute-Saône
  "71": "en", // Saône-et-Loire
  "72": "dans la", // Sarthe
  "73": "en", // Savoie
  "74": "en", // Haute-Savoie
  "75": "à", // Paris
  "76": "en", // Seine-Maritime
  "77": "en", // Seine-et-Marne
  "78": "dans les", // Yvelines
  "79": "dans les", // Deux-Sèvres
  "80": "dans la", // Somme
  "81": "dans le", // Tarn
  "82": "dans le", // Tarn-et-Garonne
  "83": "dans le", // Var
  "84": "dans le", // Vaucluse
  "85": "en", // Vendée
  "86": "dans la", // Vienne
  "87": "en", // Haute-Vienne
  "88": "dans les", // Vosges
  "89": "dans l'", // Yonne
  "90": "dans le", // Territoire de Belfort
  "91": "dans l'", // Essonne
  "92": "dans les", // Hauts-de-Seine
  "93": "en", // Seine-Saint-Denis
  "94": "dans le", // Val-de-Marne
  "95": "dans le", // Val-d'Oise
  "2A": "en", // Corse-du-Sud
  "2B": "en", // Haute-Corse
  "971": "en", // Guadeloupe
  "972": "en", // Martinique
  "973": "en", // Guyane
  "974": "à", // La Réunion
  "976": "à", // Mayotte
};

/** « dans le Nord », « en Gironde », « à Paris ». */
export function deptLoc(code: string, nom = departements[code] ?? ""): string {
  const prep = PREPOSITION[code] ?? "en";
  return prep.endsWith("'") ? `${prep}${nom}` : `${prep} ${nom}`;
}

/** Idem, en début de phrase : « Dans le Nord, … ». */
export function deptLocCap(code: string, nom?: string): string {
  const s = deptLoc(code, nom);
  return s.charAt(0).toUpperCase() + s.slice(1);
}
