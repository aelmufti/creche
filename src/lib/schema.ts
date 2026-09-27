// Entités Schema.org partagées (graphe d'entités).
//
// Google et les moteurs génératifs relient les pages entre elles par @id : une
// même Person / Organization référencée partout = une entité claire, et un
// auteur identifié (E-E-A-T, sujet YMYL). Avant ce fichier, chaque page
// déclarait son auteur et son éditeur à la main, sans @id ni logo.

export const SITE = "https://creche-ou-nounou.fr";

export const ORG_ID = `${SITE}/#organization`;
export const PERSON_ID = `${SITE}/a-propos#ali-el-mufti`;
export const WEBSITE_ID = `${SITE}/#website`;

export const ORGANIZATION = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "creche-ou-nounou.fr",
  alternateName: "Crèche ou nounou ?",
  url: `${SITE}/`,
  logo: {
    "@type": "ImageObject",
    url: `${SITE}/icon-512.png`,
    width: 512,
    height: 512,
  },
  description:
    "Comparateur indépendant et gratuit du coût des modes de garde d'enfant en France (barème 2026).",
  sameAs: ["https://aelm.dev", "https://freelance-ou-cdi.fr"],
  founder: { "@id": PERSON_ID },
};

export const PERSON = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: "Ali El Mufti",
  url: "https://aelm.dev",
  sameAs: ["https://aelm.dev", "https://freelance-ou-cdi.fr"],
};

export const WEBSITE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  // name + alternateName : source du « nom du site » affiché dans les résultats Google.
  name: "Crèche ou nounou ?",
  alternateName: ["creche-ou-nounou.fr", "Comparateur crèche ou nounou"],
  url: `${SITE}/`,
  inLanguage: "fr-FR",
  publisher: { "@id": ORG_ID },
};

type Ld = Record<string, unknown>;

const ARTICLE_TYPES = new Set(["Article", "NewsArticle", "BlogPosting", "TechArticle"]);

/**
 * Complète les nœuds Article d'une page : @id, mainEntityOfPage, image,
 * author/publisher reliés aux entités du site. Les autres nœuds passent tels quels.
 * Les champs déjà fournis par la page sont conservés.
 */
export function enrichJsonLd(nodes: Ld[], ctx: { canonical: string; image: string }): Ld[] {
  return nodes.map((node) => {
    if (!ARTICLE_TYPES.has(node["@type"] as string)) return node;
    return {
      ...node,
      "@id": node["@id"] ?? `${ctx.canonical}#article`,
      mainEntityOfPage: node.mainEntityOfPage ?? ctx.canonical,
      image: node.image ?? ctx.image,
      inLanguage: node.inLanguage ?? "fr-FR",
      author: PERSON,
      publisher: ORGANIZATION,
      isPartOf: node.isPartOf ?? { "@id": WEBSITE_ID },
    };
  });
}
