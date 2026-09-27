// Source unique des informations légales du site : éditeur, hébergeur, sources
// de données et licences. Utilisée par /mentions-legales, /confidentialite,
// /conditions-utilisation et le pied de page. Toute modification ici se
// répercute partout, pour qu'aucune page ne contredise une autre.
//
// Références :
//   - LCEN (loi n° 2004-575), art. 1-1 (issu de la loi SREN du 21 mai 2024) :
//     identification de l'éditeur, du directeur de la publication et de l'hébergeur.
//   - RGPD, art. 13 : information des personnes.
//   - Loi Informatique et Libertés, art. 82 : traceurs.

export const LEGAL_DATES = {
  /** Dernière mise à jour des pages légales (ISO). */
  modified: "2026-09-27",
};

/**
 * Statut de l'éditeur au sens de l'art. 1-1 LCEN.
 *   "non-professionnel" : site édité à titre personnel, sans activité commerciale
 *     (pas de publicité, d'affiliation ni de vente). L'art. 1-1 II permet alors de
 *     ne publier que l'identité de l'hébergeur, l'éditeur ayant communiqué son
 *     identité complète à celui-ci.
 *   "professionnel" : obligatoire dès que le site sert une activité professionnelle
 *     (revenus, promotion d'une entreprise, prospection). Il faut alors publier
 *     domicile ou siège, téléphone, e-mail et, le cas échéant, SIREN / RCS.
 */
export const EDITEUR = {
  statut: "non-professionnel" as "non-professionnel" | "professionnel",
  nom: "Ali El Mufti",
  site: "https://aelm.dev",
  /** Adresse e-mail de contact publique. null → contact via le site de l'éditeur. */
  email: null as string | null,
  // Champs requis uniquement si statut = "professionnel" :
  adresse: null as string | null,
  telephone: null as string | null,
  siren: null as string | null,
};

export const HEBERGEUR = {
  nom: "Vercel Inc.",
  adresse: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
  telephone: "+1 559 288 7060",
  site: "https://vercel.com",
  confidentialite: "https://vercel.com/legal/privacy-notice",
};

export const ODBL_URL = "https://opendatacommons.org/licenses/odbl/1-0/";
export const LICENCE_OUVERTE_URL = "https://www.etalab.gouv.fr/licence-ouverte-open-licence/";

/** Bases de données tierces réutilisées, avec leur licence et l'attribution exigée. */
export const SOURCES_DONNEES = [
  {
    id: "urssaf",
    nom: "Salariés des particuliers employeurs en 2024",
    producteur: "Urssaf Caisse nationale",
    url: "https://open.urssaf.fr/explore/dataset/salaries-des-particuliers-employeurs-en-2024/",
    licence: "Open Database License (ODbL) 1.0",
    licenceUrl: ODBL_URL,
    usage:
      "salaires horaires moyens par département (pages départements, villes, Observatoire, fichier CSV)",
  },
  {
    id: "codes-postaux",
    nom: "Base officielle des codes postaux",
    producteur: "La Poste",
    url: "https://www.data.gouv.fr/datasets/base-officielle-des-codes-postaux",
    licence: "Licence Ouverte / Open Licence 2.0",
    licenceUrl: LICENCE_OUVERTE_URL,
    usage: "correspondance code postal → département (via l'API Découpage administratif, geo.api.gouv.fr)",
  },
  {
    id: "cog",
    nom: "Code officiel géographique (communes et départements)",
    producteur: "Insee",
    url: "https://geo.api.gouv.fr",
    licence: "Licence Ouverte / Open Licence 2.0",
    licenceUrl: LICENCE_OUVERTE_URL,
    usage: "noms des départements et des communes (via geo.api.gouv.fr)",
  },
] as const;

/** Date d'extraction des données géographiques (génération de src/data/*.json). */
export const DATE_EXTRACTION_GEO = "2026-06-15";

/** Contact public : e-mail si renseigné, sinon le site de l'éditeur. */
export function contactHref(): string {
  return EDITEUR.email ? `mailto:${EDITEUR.email}` : EDITEUR.site;
}
export function contactLabel(): string {
  return EDITEUR.email ?? EDITEUR.site.replace("https://", "");
}
