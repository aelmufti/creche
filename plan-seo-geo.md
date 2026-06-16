# Stratégie SEO + GEO — creche-ou-nounou.fr

> **Objectif.** Devenir LA référence francophone sur « quel mode de garde choisir / combien ça coûte »,
> à la fois dans les moteurs de recherche classiques (Google/Bing) **et** dans les moteurs génératifs
> (ChatGPT/SearchGPT, Google AI Overviews & AI Mode, Perplexity, Gemini, Claude, Copilot).
>
> **Principe directeur.** Sujet **YMYL** (argent + famille) → Google et les LLM exigent un haut niveau de
> confiance. Notre avantage défendable : **justesse chiffrée + fraîcheur + données réelles par département
> (URSSAF) + zéro inscription**. La stratégie consiste à rendre cette justesse **crawlable, structurée,
> citable et datée** partout.
>
> Compagnon de `plan-implementation-comparateur-mode-de-garde.md`. Lire dans l'ordre des phases (§10).

---

## 0. TL;DR — les 5 leviers qui font 80 % du résultat

1. **Rendre le site indexable** : migrer le SPA React → **rendu statique (Astro + îlots React)**. Sans ça, le
   GEO est mort (les bots IA n'exécutent pas le JS) et le SEO est handicapé. **C'est le prérequis absolu.**
2. **SEO programmatique sur nos données URSSAF par département** : ~100 pages département + top villes,
   chacune avec un chiffre local réel et unique. C'est le **moat** (contenu non-thin, utile, difficile à copier).
3. **Données structurées + contenu extractible** : Schema.org complet (WebApplication, FAQ, HowTo, Article,
   Dataset, Person/Organization) + chaque page commence par une **réponse directe citable** (chiffre + source + date).
4. **Étude de données annuelle** (« Observatoire du coût de la garde d'enfant ») à partir des données URSSAF :
   aimant à **backlinks + citations LLM**, et pilier **E-E-A-T** (donnée originale = expertise/expérience).
5. **Accès explicite aux crawlers IA + fraîcheur datée** : robots.txt qui autorise GPTBot/ClaudeBot/PerplexityBot/…,
   `llms.txt`, `dateModified` visible, rituel de mise à jour du barème.

> Hiérarchie mentale : **Fondations (rendu) → Contenu/Architecture → Structuration → GEO → Autorité → Mesure.**
> On ne saute pas une couche.
>
> ⚠️ Les 5 leviers ci-dessus sont les **priorités à plus fort levier** (le « 80 % »). La couverture
> **intégrale** (le « 20 % » restant qui sépare un bon site d'une *référence*) est traitée en **Partie II
> (§12–§21)** : recherche de mots-clés & analyse SERP, optimisation snippet/passage, vidéo/multimédia,
> indexation rapide (IndexNow) & crawl budget, netlinking complet, E-E-A-T avancé (relecteur expert),
> sémantique/entités/glossaire, analytics produit, gouvernance & résilience aux updates.

---

## 1. Fondations techniques (Tier 0 — bloquant)

### 1.1 Rendu : SPA → statique (LE chantier critique)
**Problème.** L'app est un SPA Vite/React rendu client. Googlebot rend le JS (mais avec délai/budget), Bing
moins bien, et **les crawlers génératifs ne rendent pas le JS** → contenu invisible pour le GEO.

**Solution recommandée : migration vers Astro + îlots React.**
- Le **moteur** (`src/engine/*`, TS pur framework-agnostique) se réutilise tel quel.
- Le **calculateur** devient un îlot React (`client:load` / `client:visible`).
- Toutes les pages de contenu (guides, pages département) deviennent du **HTML statique** généré au build
  (Content Collections + MDX) → crawlable par tous, CWV au top, méta par page.
- Sitemap automatique (`@astrojs/sitemap`), images optimisées (`astro:assets`).

**Alternative plus rapide (intérim)** si on ne veut pas migrer tout de suite : **prérendu** du SPA
(`vite-plugin-ssr`/`react-snap`/`@prerenderer`) sur toutes les routes connues (y compris les pages
programmatiques énumérées). Moins propre que Astro, mais débloque l'indexabilité. **Cible long terme = Astro.**

**Critère de validation.** `curl -A "GPTBot" https://creche-ou-nounou.fr/<page>` doit renvoyer le **contenu
complet en HTML** (pas une coquille `<div id="root">`). Tester aussi avec « Inspection d'URL » (GSC) → HTML rendu.

### 1.2 Domaine & canonicalisation
- HTTPS only (HSTS). Choisir **non-www** (`https://creche-ou-nounou.fr`) et **301** depuis www.
- **Trailing slash** cohérent (choisir avec ou sans, 301 l'autre forme).
- **Canonical** auto-référent sur chaque page (`<link rel="canonical">`), absolu.
- `hreflang="fr-FR"` + `<html lang="fr">`.
- Pas de paramètres d'URL indexables parasites : l'état du calculateur est dans le query string (`?r=...`) →
  **canonical pointe vers l'URL sans query**, et `noindex` n'est pas nécessaire (le canonical suffit), mais
  s'assurer que les variantes `?...` ne génèrent pas de duplicate indexé.

### 1.3 Le nom de domaine = atout d'intention
`creche-ou-nounou.fr` matche **exactement** la requête la plus haute en intention (« crèche ou nounou »).
- En faire la **marque** (pas du bourrage) : H1 home + `<title>` + Organization schema `name`.
- Exploiter la requête exacte sur la home (pillar comparatif crèche↔assistante maternelle), tout en
  élargissant l'autorité thématique vers les 5 modes via le cluster (§2).

---

## 2. Architecture de l'information & clusters thématiques

Modèle **hub-and-spoke** (pilier → satellites), maillage interne dense.

### 2.1 Arborescence d'URL cible
```
/                                  Pilier — comparateur « crèche ou nounou » (5 modes, verdict)
/methodologie                      E-E-A-T (formules, sources datées, changelog)
/guides/
   creche-ou-assistante-maternelle Comparatif 2 options (requête phare)
   cmg-2026                        Aide : montant/calcul/conditions (réforme sept. 2025)
   micro-creche-cmg-structure      Aide structure PAJE
   garde-a-domicile-cout-reel      Budget garde à domicile
   garde-partagee                  Budget garde partagée
   credit-impot-frais-de-garde     Fiscalité
   reste-a-charge-nounou           Budget AMA
   reforme-cmg-septembre-2025      Actualité/fraîcheur (wedge)
/cout-garde-enfant/                Hub données locales (étude/observatoire)
   [departement]                   « Crèche ou nounou en [Département] : coût 2026 » (×~100)
   [departement]/[ville]           Top villes (phase 6)
/observatoire-cout-garde-2026      Étude de données annuelle (digital PR + GEO)
/a-propos                          Auteur/éditeur (E-E-A-T, Person schema)
/mentions-legales /confidentialite Légal RGPD
```

### 2.2 Carte mots-clés → URL → intention → schema (à étendre)
| Requête cible | Intention | URL | Title pattern | Schema |
|---|---|---|---|---|
| crèche ou nounou | décision | `/` | « Crèche ou nounou ? Comparateur de coût 2026 (verdict chiffré) » | WebApplication, FAQPage |
| coût crèche vs assistante maternelle | comparer | `/guides/creche-ou-assistante-maternelle` | « Crèche ou assistante maternelle : laquelle coûte le moins cher en 2026 ? » | Article, FAQPage, HowTo |
| calcul CMG 2026 / simulateur CMG | aide | `/guides/cmg-2026` | « CMG 2026 : montant, calcul et conditions (réforme sept. 2025) » | Article, FAQPage |
| reste à charge nounou | budget | `/guides/reste-a-charge-nounou` | « Reste à charge d'une assistante maternelle en 2026 (exemples chiffrés) » | Article, FAQPage |
| prix nounou / crèche [département] | local | `/cout-garde-enfant/[departement]` | « Crèche ou nounou en [Département] : coût réel 2026 » | Article, Place, Dataset, FAQPage |
| CMG micro-crèche 2026 | aide structure | `/guides/micro-creche-cmg-structure` | « Micro-crèche 2026 : CMG structure, plafonds et reste à charge » | Article, FAQPage |
| garde à domicile coût réel | budget | `/guides/garde-a-domicile-cout-reel` | « Garde à domicile : coût réel après CMG et crédit d'impôt (2026) » | Article, FAQPage |
| crédit d'impôt frais de garde 2026 | fiscalité | `/guides/credit-impot-frais-de-garde` | « Crédit d'impôt frais de garde 2026 : montant, plafond, restituable » | Article, HowTo, FAQPage |
| réforme CMG septembre 2025 | actualité | `/guides/reforme-cmg-septembre-2025` | « Réforme du CMG (sept. 2025) : ce qui change concrètement » | Article, FAQPage |

> Règle : **1 page = 1 intention**. Pas de cannibalisation (deux pages sur la même requête). Le calculateur
> (home) capte la décision ; les guides captent les requêtes informationnelles et **renvoient vers le calculateur**.

### 2.3 Maillage interne
- Chaque guide → lien **contextuel** vers le calculateur (CTA « Calculez votre cas ») + 2-3 guides liés.
- Chaque page département → calculateur **pré-rempli** (`?cp=...`), guides nationaux, départements limitrophes.
- Breadcrumb sur toutes les pages (+ `BreadcrumbList` schema).
- Fil d'Ariane sémantique, ancres descriptives (pas « cliquez ici »).
- Lien **do-follow** depuis `freelance-ou-cdi.fr` (sibling) et `aelm.dev` (auteur).

---

## 3. SEO programmatique sur données réelles (le moat)

On a déjà `tarifs-departements.json` (URSSAF 2024, salaire AMA + coût garde à domicile par département) et
`codes-postaux.json`/`departements.json`. **C'est de l'or** : contenu local, chiffré, unique, utile, défendable.

### 3.1 Gabarit page département `/cout-garde-enfant/[departement]`
Généré au build (1 page/département). **Éviter le contenu “thin”/dupliqué** : chaque page doit contenir des
**chiffres locaux réels** et une analyse qui varie.
Sections :
1. **Réponse directe (TL;DR citable)** : « En [Département], une assistante maternelle coûte en moyenne
   **X €/h net** (URSSAF 2024). Pour 160 h/mois et 2 000 € de revenus, le mode le moins cher est **[Y]** à
   **Z €/mois** net. » ← phrase auto-suffisante, chiffrée, sourcée, datée.
2. **Tableau comparatif local** des 5 modes (coût net réel mensuel) calculé par le moteur avec le tarif local.
3. **Le calculateur en îlot**, pré-rempli avec le code postal/département (modifiable).
4. **Données locales** : salaire AMA local vs moyenne nationale (écart %), coût garde à domicile local.
5. **FAQ locale** (`FAQPage`) : « Combien coûte une nounou en [Département] ? », « Crèche ou nounou en [Ville principale] ? ».
6. **Sources & date** (URSSAF 2024, barème CNAF 2026) + lien méthodologie.
7. Maillage : départements limitrophes, guides nationaux.

### 3.2 Garde-fous qualité (pour ne pas se faire pénaliser)
- **Seuil de données** : ne générer une page que si on a une donnée locale réelle (sinon `noindex` ou page non créée).
- **Unicité** : intro + analyse paramétrées par les chiffres locaux (écart à la moyenne, classement local),
  pas un template figé avec juste le nom qui change.
- **Valeur ajoutée** : le calculateur interactif + le verdict local = utilité réelle (ce que Google récompense).
- Lancer **par vagues** (départements les plus peuplés d'abord), surveiller l'indexation avant de tout pousser.

### 3.3 Sitemap programmatique
Sitemap **généré** incluant toutes les pages (guides + départements + villes), avec `lastmod` réel
(= date de build / date de la donnée). Découper en sitemaps (index) si > 50 000 URL (on en sera loin).
- **Correction** : Google **ignore** `priority`/`changefreq` → ne garder que `<loc>` + `<lastmod>` fiable
  (le `sitemap.xml` actuel utilise priority/changefreq : à simplifier). Un `lastmod` honnête est un signal de fraîcheur ;
  un `lastmod` toujours « aujourd'hui » est ignoré, voire pénalisant en confiance.
- Image sitemap si visuels importants (cartes de l'Observatoire).
- Pinger l'index à chaque publication/MAJ (GSC + **IndexNow**, cf. §15).

---

## 4. On-page & données structurées (Schema.org)

### 4.1 On-page (par page)
- `<title>` unique < 60 car., `<meta name="description">` ~150 car. orientée bénéfice + chiffre.
- **Un seul `<h1>`**, hiérarchie Hn logique, HTML sémantique (`<article>`, `<section>`, `<nav>`, `<table>`).
- Open Graph + Twitter Card par page. **OG image dynamique** par page (verdict/chiffre local) → partage + CTR.
- Date visible « **Mis à jour le [date]** » en haut de chaque guide.

### 4.2 JSON-LD à déployer (state of the art)
- **WebApplication / SoftwareApplication** (calculateur) : `applicationCategory: FinanceApplication`,
  `offers: 0 EUR` (gratuit), `featureList`.
- **FAQPage** sur chaque guide & page département (questions = vraies requêtes) → éligibilité AI Overviews & PAA.
- **HowTo** : « Comment calculer le coût réel d'une nounou » / « Comment choisir son mode de garde ».
- **Article** (guides) avec `author` (Person Ali El Mufti), `publisher` (Organization),
  `datePublished` + `dateModified`, `about` (entités).
- **Dataset** (les données URSSAF agrégées) : `creator`, `temporalCoverage: 2024`, `license`,
  `distribution` (lien JSON/CSV téléchargeable) → **très fort pour le GEO** et l'autorité données.
- **Person** (Ali El Mufti) + **Organization** : `sameAs` → aelm.dev, LinkedIn, freelance-ou-cdi.fr.
- **BreadcrumbList** partout.
- **Place / AdministrativeArea** sur les pages département (rattachement géographique de l'entité).

Exemple (Article + auteur, YMYL) :
```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "CMG 2026 : montant, calcul et conditions",
  "datePublished": "2026-01-15",
  "dateModified": "2026-06-15",
  "author": { "@type": "Person", "name": "Ali El Mufti", "url": "https://aelm.dev",
              "sameAs": ["https://www.linkedin.com/in/...","https://freelance-ou-cdi.fr"] },
  "publisher": { "@type": "Organization", "name": "creche-ou-nounou.fr" },
  "about": ["Complément de libre choix du mode de garde","réforme CMG 2025"],
  "citation": ["https://www.service-public.fr/...","https://www.pajemploi.urssaf.fr/..."]
}
```

---

## 5. Performance / Core Web Vitals (signal de qualité + UX mobile)
Cible : **LCP < 2,5 s, INP < 200 ms, CLS < 0,1** (terrain CrUX, mobile).
- Astro statique → HTML pré-rendu, JS minimal.
- **Lazy-load des données postales** (`codes-postaux.json`, ~82 KB) : ne charger qu'à la saisie d'un code postal
  (dynamic import) → allège le bundle initial du calculateur. *(déjà identifié comme optimisation.)*
- Polices : `preconnect` déjà en place + `font-display: swap` + sous-ensemble si possible.
- Images : `astro:assets` (AVIF/WebP, dimensions explicites → CLS=0), `loading="lazy"`.
- Pas de layout shift : réserver l'espace du calculateur/résultats.
- Audit Lighthouse + PageSpeed à chaque release ; viser 95+ perf/SEO/accessibilité (RGAA/WCAG AA).

---

## 6. GEO — Generative Engine Optimization (le différenciateur)

> But : être **cité** comme source dans les réponses IA et **connu** des modèles comme la référence du sujet.

### 6.1 Accès des crawlers IA (robots.txt)
On **veut** être crawlé/cité. `robots.txt` :
```
User-agent: *
Allow: /

# Crawlers IA — explicitement autorisés (citation + grounding)
User-agent: GPTBot
Allow: /
User-agent: OAI-SearchBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: Claude-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Perplexity-User
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: Applebot-Extended
Allow: /
User-agent: Bingbot
Allow: /
User-agent: CCBot
Allow: /
User-agent: Amazonbot
Allow: /
User-agent: meta-externalagent
Allow: /

Sitemap: https://creche-ou-nounou.fr/sitemap.xml
```
> Décision assumée : on autorise même les crawlers d'entraînement (GPTBot, CCBot, Google-Extended,
> Applebot-Extended). Pour viser le statut de référence, être **dans** les modèles vaut le « coût ».
> *(Les noms de bots évoluent — revoir tous les 6 mois.)*

**Distinguer les types de crawlers IA** (la citation ne vient pas de tous) :
- **Entraînement** (GPTBot, CCBot, Google-Extended, Applebot-Extended) → influence ce que le modèle *connaît*
  par cœur (notoriété de marque à long terme). Pas de citation directe.
- **Recherche/grounding** (OAI-SearchBot, ChatGPT-User, PerplexityBot, Bingbot, Google) → c'est **eux** qui
  produisent les **citations** dans les réponses, souvent à partir des **pages bien classées**.
- Conséquence : **le SEO classique alimente le GEO** (AI Overviews & Perplexity puisent dans le top organique).
  On optimise donc les deux ensemble, jamais l'un sans l'autre.

### 6.2 `llms.txt` (standard émergent)
À la racine `/llms.txt` (Markdown) pointant vers les ressources clés (méthodologie, guides, observatoire).
Adoption encore inégale, mais coût quasi nul et signal de structuration.
```
# creche-ou-nounou.fr
> Comparateur indépendant et gratuit du coût des modes de garde d'enfant en France (barème 2026).

## Ressources clés
- [Méthodologie & sources](https://creche-ou-nounou.fr/methodologie): formules, barème daté, sources officielles
- [CMG 2026](https://creche-ou-nounou.fr/guides/cmg-2026): montant, calcul, réforme sept. 2025
- [Observatoire du coût de la garde 2026](https://creche-ou-nounou.fr/observatoire-cout-garde-2026): données URSSAF par département
```

### 6.3 Contenu structuré pour l'extraction/citation (recherche GEO)
Les LLM citent ce qui est **factuel, auto-suffisant, sourcé, chiffré**. Sur **chaque** page :
- **Réponse directe en tête** (« answer-first ») : 2-3 phrases qui répondent à la requête avec un chiffre + une date.
- **Phrases « citables »** : 1 fait = 1 phrase, avec **nombre + source + date** (« Au 1er sept. 2025, le CMG
  devient proportionnel au reste à charge (source : LFSS 2024). »). Éviter « comme vu plus haut » (non auto-suffisant).
- **Q&A explicites** (titres en question, réponse concise dessous) → AI Overviews / PAA / Perplexity.
- **Tableaux comparatifs** (les LLM les extraient très bien) + **listes** courtes.
- **Définitions d'entités** (encadrés) : CMG, PSU, AMA, micro-crèche, crédit d'impôt — phrases définitionnelles nettes.
- **Citations de sources primaires inline** (CNAF, URSSAF, service-public, impots.gouv) avec dates → boost de confiance LLM.
- **Statistiques originales** (nos chiffres URSSAF par département) = contenu qu'on est seul à fournir → forte citabilité.

### 6.4 Entité & marque (être « connu » des modèles)
- **Cohérence d'entité** : même `name`, même description partout + `sameAs` (aelm.dev, LinkedIn, sibling).
- Présence là où les LLM se nourrissent : **Wikidata** (créer l'entité de l'outil si éligible), citations sur
  des sites d'autorité, **mentions** sur Reddit (r/Parentsfr), forums parents, comparatifs tiers (non-spam, à valeur).
- **Cohérence des chiffres** entre le site et les réponses qu'on souhaite voir reprises (les LLM recoupent).

### 6.5 Fraîcheur (Google AI Overviews + LLM favorisent le récent)
- « Mis à jour le [date] » visible + `dateModified` schema.
- **Changelog du barème** public (page méthodologie) — chaque révision datée.
- Angle **réforme CMG sept. 2025** = wedge de fraîcheur (les vieux contenus sont périmés).
- Rituel de mise à jour (§10.3).

---

## 7. E-E-A-T (obligatoire en YMYL)
- **Experience/Expertise** : données originales (URSSAF agrégées), méthodologie transparente, formules publiées.
- **Authoritativeness** : auteur identifié **Ali El Mufti** (page `/a-propos` + `Person` schema + `sameAs`),
  publisher Organization, citations de sources officielles datées.
- **Trust** (le pilier central) : **zéro inscription**, RGPD strict (page confidentialité), disclaimer
  « estimation, pas un avis officiel — vérifiez sur caf.fr/pajemploi », date de mise à jour, contact accessible.
- Process éditorial affiché : « Chiffres vérifiés le [date] contre les simulateurs officiels (écart ≤ 1 €) ».
- Cohérence NAP/auteur sur tout le site.

---

## 8. Off-site / autorité / digital PR

### 8.1 L'étude de données = pièce maîtresse (backlinks + GEO + E-E-A-T d'un coup)
**« Observatoire du coût de la garde d'enfant 2026 »** à partir des données URSSAF :
- Carte interactive de France (coût AMA / garde à domicile par département), classement, écarts.
- Dataset téléchargeable (CSV/JSON) + `Dataset` schema + licence ouverte.
- **Communiqué/pitch presse** (presse parentalité, presse régionale, éco) → backlinks d'autorité + citations LLM.
- Rejouée chaque année (nouvelle vague de données) = marronnier → liens récurrents.

### 8.2 Le calculateur comme actif linkable
- **Widget embarquable** (iframe/script) pour blogs parents/assos → backlinks naturels.
- Boutons de partage + **OG image dynamique** du verdict (capturable, partageable).

### 8.3 Seeding communautaire (non-spam)
- Réponses utiles (avec lien quand pertinent) sur Reddit r/Parentsfr, forums (magicmaman, etc.), groupes FB.
- Maillage avec `freelance-ou-cdi.fr` et `aelm.dev`.

---

## 9. Mesure & monitoring (on ne pilote que ce qu'on mesure)

### 9.1 SEO classique
- **Google Search Console** + **Bing Webmaster Tools** (soumettre sitemap, surveiller couverture/indexation/CWV).
- **Analytics privacy-first** (Plausible ou Matomo, sans cookie) — RGPD, cohérent avec « zéro tracking ».
- Suivi de positions (Ahrefs/Semrush ou alternative légère) sur la carte mots-clés.
- CrUX/PageSpeed pour les Core Web Vitals terrain.

### 9.2 GEO (spécifique)
- **Trafic de référence IA** : segmenter les referrers `chatgpt.com`, `perplexity.ai`, `gemini.google.com`,
  `copilot.microsoft.com` dans l'analytics.
- **Panel de prompts** (mensuel) : liste fixe de ~20 requêtes cibles (« crèche ou nounou moins cher »,
  « combien coûte une assistante maternelle en 2026 », « CMG micro-crèche »…) rejouées sur ChatGPT/Perplexity/
  Gemini/Claude/Copilot → noter si/comment on est **cité** (part de voix générative).
- Outils dédiés (optionnels) : Profound, Peec AI, Otterly.ai, Scrunch, Ahrefs Brand Radar.

### 9.3 KPIs
- **3 mois** : 100 % des pages indexées ; calculateur cité dans ≥ 1 moteur IA sur les requêtes de marque ; CWV vert.
- **6 mois** : top 10 sur 3-5 requêtes mid-tail ; citations IA sur requêtes informationnelles ; 1er backlink presse.
- **12 mois** : top 3 sur « crèche ou nounou » + requêtes locales ; **référence citée** régulièrement par les LLM ;
  étude de données reprise par des médias.

---

## 10. Roadmap d'exécution

### Phase 0 — Fondation (semaine 1-2) — BLOQUANT
- [ ] Migration rendu **Astro + îlot calculateur** (ou prérendu intérim). Critère : `curl -A GPTBot` = HTML complet.
- [ ] Domaine/canonical/hreflang/HTTPS/redirections www.
- [ ] `robots.txt` (bots IA) + `sitemap.xml` généré + `llms.txt`.
- [ ] GSC + Bing WMT + analytics privacy-first.

### Phase 1 — On-page & structuration (semaine 2-3)
- [ ] Titles/meta/H1/OG par page ; date « mis à jour le ».
- [ ] JSON-LD : WebApplication, Person/Organization, BreadcrumbList, FAQPage (home + méthodo).
- [ ] Page `/a-propos` (E-E-A-T) ; renforcer `/methodologie` (changelog, dates).
- [ ] Réponse directe citable en tête de home + méthodologie.

### Phase 2 — Cluster de contenu (semaine 3-6)
- [ ] 8 guides (cf. §2.2) en MDX, answer-first, FAQ/HowTo schema, citations sourcées datées, maillage interne.

### Phase 3 — SEO programmatique (semaine 5-8)
- [ ] Gabarit page département (§3.1) + garde-fous qualité (§3.2).
- [ ] Génération par vagues (départements peuplés d'abord), suivi indexation, sitemap programmatique.

### Phase 4 — Autorité & GEO actif (semaine 8-12)
- [ ] **Observatoire 2026** (carte + dataset + `Dataset` schema) + pitch presse.
- [ ] OG images dynamiques + widget embarquable.
- [ ] Seeding communautaire ; backlinks sibling/auteur ; Wikidata si éligible.
- [ ] Mise en place du **panel de prompts GEO** mensuel.

### Phase 5 — Itération continue
- [ ] Refresh contenu, expansion villes, A/B titres, suivi part de voix générative.

### 10.3 Rituel de maintenance (fraîcheur = avantage durable)
- **Janvier** : barème CNAF (taux d'effort, plancher/plafond) → MAJ `bareme-AAAA.json`, changelog, `dateModified`.
- **Avril** : revalorisations → MAJ barème + forfaits micro-crèche.
- **Annuel** : nouvelle vague URSSAF → régénérer `tarifs-departements.json` (`scripts/build-tarifs-data.mjs`)
  + republier l'Observatoire.
- **Continu** : surveiller toute réforme (type sept. 2025) → article d'actualité = wedge de fraîcheur.

---

## 11. Checklists rapides

**Indexabilité (Phase 0)** : HTML complet pour bots IA · canonical · sitemap à jour · robots OK · GSC/Bing soumis.

**Par page** : 1 H1 · title/meta uniques · réponse directe citable en tête · FAQ schema · date MAJ visible ·
sources datées inline · maillage interne · OG image · CWV vert.

**GEO** : robots autorise bots IA · llms.txt · entité cohérente + sameAs · Dataset schema sur les données ·
phrases citables chiffrées/sourcées · présent dans le panel de prompts.

**YMYL/E-E-A-T** : auteur identifié + Person schema · sources officielles datées · disclaimer · zéro inscription ·
méthodologie + changelog · contact.

---
---

# Partie II — Couverture intégrale (le « 20 % » restant)

> Audit du plan ci-dessus : les fondations, le contenu, la structuration, le GEO de base, l'autorité et la
> mesure y sont. Ce qui manquait pour passer de *bon* à *référence* est ci-dessous. Ces sections s'imbriquent
> dans les phases de la §10 (mappées à la fin, §21).

## 12. Recherche de mots-clés & analyse SERP (process, pas une simple liste)

La §2.2 donne une carte de départ ; voici la **méthode** pour la rendre exhaustive et la maintenir.

**Outils** : Google Search Console (requêtes réelles dès qu'on a du trafic), Google Suggest / People Also Ask /
AlsoAsked / AnswerThePublic, Google Trends (saisonnalité : pics rentrée + grossesse), un outil volume/difficulté
(Ahrefs, Semrush, ou Mangools/Keyword Surfer en éco).

**Process** :
1. **Seeds** : crèche, nounou, assistante maternelle, garde d'enfant, CMG, mode de garde, coût/prix/tarif.
2. **Expansion** : modificateurs (coût, prix, calcul, simulateur, 2026, par mois, reste à charge, vs, ou,
   différence, avantages/inconvénients, + département/ville).
3. **Clustering par intention** (informationnel / comparatif / transactionnel-décision / local) → 1 cluster = 1 page.
4. **Analyse SERP par requête** : noter les **features présentes** (AI Overview ? PAA ? featured snippet ?
   pack local ? vidéo ?) → ça dicte le **format** de la page (cf. §13). Ex. : si AI Overview présent → viser la
   **citation** (réponse extractible) ; si featured snippet → viser le snippet ; si vidéo → produire une vidéo (§14).
5. **Priorisation** : `intention × volume × (1/difficulté) × valeur business`, en sur-pondérant les requêtes où on a
   un **avantage de données** (local/URSSAF) ou de **fraîcheur** (réforme 2025).
6. **Long-tail conversationnel** (questions complètes) pour le GEO : « est-ce que la crèche est moins chère qu'une
   nounou ? », « combien je touche de CMG pour une assistante maternelle ? ».

**Veille concurrentielle** : gap analysis mots-clés & backlinks vs `moncmg.fr`, `miraparent.com`,
`simulateurfinance.fr` (récupérer leurs requêtes/liens, repérer leurs angles manquants : multi-enfant, données locales).

## 13. Rédaction & on-page avancés (briefs, snippets, passages)

**Brief type (par guide)** — à produire avant rédaction :
- Requête principale + secondaires (du cluster) ; intention ; angle d'**information gain** (ce qu'on apporte de neuf :
  nos chiffres URSSAF, le double affichage trésorerie/coût net réel, le multi-enfant).
- **Entités à couvrir** (cf. §18) + **questions PAA** à répondre.
- Sources officielles à citer (datées) ; liens internes obligatoires (calculateur + 2-3 guides).
- Format imposé par la SERP (§12.4). Longueur = celle nécessaire pour couvrir l'intention (jamais un quota).

**Featured snippets / PAA** : sous un Hn formulé en **question**, placer une réponse **autonome de 40-60 mots**
(snippet paragraphe) ; utiliser **listes** (snippet liste) et **tableaux** (snippet tableau) quand la requête s'y prête.

**Optimisation par passage/chunk** (clé pour Google passage ranking **et** la récupération RAG des LLM) :
chaque section = **bloc auto-suffisant** = `titre explicite` + réponse compréhensible **hors contexte**.
Pas de « comme vu plus haut ». C'est ce qui se fait extraire et citer.

**Helpful Content / people-first** : écrire pour le parent qui décide, pas pour l'algo. Profondeur réelle,
exemples chiffrés concrets, pas de remplissage. (Filtre anti-pénalité « contenu inutile ».)

## 14. Multimédia & vidéo (surfaces négligées à fort ROI)

- **YouTube** (2ᵉ moteur de recherche, repris dans les SERP Google et cité par les IA) : vidéos courtes
  « Crèche ou nounou : combien ça coûte vraiment en 2026 ? », démo du calculateur, explication de la réforme CMG.
  Optimiser titre/description/**chapitres**/**transcription** (les LLM lisent le transcript). Intégrer la vidéo
  dans le guide correspondant (VideoObject schema).
- **Infographies** (carte de l'Observatoire) → fortement partagées/embarquées = backlinks + citations.
- **Images** : `alt` descriptif, légendes textuelles, dimensions explicites (CLS=0), image sitemap, `ImageObject`.
- Règle d'or GEO : **tout média doit avoir un équivalent texte** (les moteurs génératifs lisent le texte).

## 15. Indexation rapide & gestion du crawl budget

- **IndexNow** (Bing, Yandex ; alimente l'écosystème Copilot/ChatGPT-search) : ping instantané à chaque
  publication/MAJ de page → indexation en heures, pas en semaines. **Crucial pour les ~100 pages programmatiques**
  et pour propager vite les MAJ de barème. Clé API + endpoint au build/déploiement.
- **Soumission** : sitemap à GSC + Bing WMT ; « Inspection d'URL » pour forcer les pages prioritaires.
- **Crawl budget & architecture** : profondeur ≤ 3 clics depuis la home, **aucune page orpheline**, maillage dense,
  pas de pièges de crawl (variantes `?r=...`, pagination infinie). Pages programmatiques liées depuis le hub
  `/cout-garde-enfant` et entre départements limitrophes.
- **Variantes d'URL du calculateur** (`?r=...&h=...`) : `canonical` vers l'URL propre ; envisager
  `Disallow: /*?` dans robots **sans** bloquer les ressources (JS/CSS/JSON nécessaires au rendu).
- **Analyse de logs serveur** : vérifier que Googlebot **et** les bots IA (GPTBot, OAI-SearchBot, PerplexityBot,
  ClaudeBot) crawlent réellement et reçoivent du **200 + HTML**. Si un bot IA ne passe pas / reçoit une coquille →
  le rendu (§1.1) ou le robots est mal configuré. C'est le **test de vérité** du GEO.

## 16. Netlinking complet (au-delà de l'étude de données)

- **Digital PR** : l'Observatoire (§8.1) = pièce maîtresse.
- **Journalist sourcing** : Connectively (ex-HARO), Qwoted, featured.com — répondre aux demandes de journalistes
  (parentalité, économie, presse régionale) avec nos données → liens d'autorité + statut d'expert cité.
- **Backlink gap analysis** : récupérer les liens des concurrents (mêmes annuaires, mêmes articles « comparatif »).
- **Unlinked mentions** : alerte sur « creche-ou-nounou » → demander la transformation en lien.
- **Resource pages / annuaires de qualité** : assos de parents, sites famille, mutuelles, CSE/CE (angle CESU),
  structures petite enfance, RPE/RAM. Cibler les domaines à forte confiance (proches du `.gouv`/CAF).
- **Broken link building** sur des pages « aides garde d'enfant » obsolètes (post-réforme 2025).
- **Réseau** : liens do-follow depuis `freelance-ou-cdi.fr` et `aelm.dev`.
- **Qualité > quantité, et propreté** : pas de PBN / achat de liens (risque accru en YMYL). Liens éditoriaux mérités.

## 17. E-E-A-T avancé (exigence YMYL renforcée)

- **Relecteur expert** : faire **relire/valider** les guides par un profil crédible (conseiller petite enfance,
  expert-comptable, juriste social) → mention « **Relu par [Nom, titre] le [date]** » + `Person` (reviewer) dans le
  schema. C'est l'un des plus forts signaux de confiance en finance/YMYL.
- **Politique éditoriale publique** : page décrivant sources, processus de fact-checking (cross-validation ≤ 1 €
  contre simulateurs officiels), **politique de correction**, fréquence de mise à jour.
- **Page transparence / modèle économique** : comment le site se finance ; déclaration d'affiliation le cas échéant
  (la confiance prime sur la monétisation, cf. plan d'implémentation §12).
- **Bio auteur étoffée** (`/a-propos`) : expérience, raison de crédibilité, liens (sameAs) cohérents.
- **Preuve sociale** : avis/témoignages, nombre de simulations réalisées, reprises presse.

## 18. Sémantique, entités & glossaire (autorité thématique)

- **Carte des entités** du domaine à couvrir exhaustivement : CMG, PSU, PAJE, assistante maternelle agréée,
  micro-crèche, EAJE, crédit d'impôt frais de garde / emploi à domicile, taux d'effort CNAF, CESU préfinancé,
  RPE/RAM, allocation de base PAJE, congé parental/PreParE, AEEH… → chacune traitée (page ou section dédiée).
- **Glossaire** `/glossaire` avec définitions nettes (`DefinedTerm` / `DefinedTermSet`) → entité + maillage interne
  + très bonne matière à citation LLM (les modèles adorent les définitions auto-suffisantes).
- **Information gain** : se démarquer en apportant ce que les autres n'ont pas (données locales URSSAF,
  distinction trésorerie vs coût net réel, multi-enfant, garde à domicile non multipliée). Google et les LLM
  valorisent l'apport d'information original.
- **Cohérence de nommage** des entités sur tout le site (même terme, même définition).

## 19. Analytics produit & expérimentation

- **Événements** (Plausible/Matomo, sans cookie, anonymisés) : usage du calculateur, mode gagnant, copie/partage
  de lien, ouverture des options avancées, saisie d'un code postal, profondeur de scroll. → comprendre les usages
  et prioriser le contenu.
- **Expérimentation CTR** : itérer titres/meta à partir des données GSC (impressions vs CTR par requête) ;
  réécrire les pages à forte impression/faible CTR.
- **Tableaux de bord** (SEO + GEO + produit) + cadence de revue (mensuelle).
- Boucle vertueuse : *insights produit → idées de contenu → mots-clés → pages → mesure*.

## 20. Gouvernance, risque & résilience

- **Résilience aux updates Google** (Helpful Content intégré au core, spam updates) : rester **people-first** +
  E-E-A-T solide = la meilleure assurance. Suivre les annonces (Search Status Dashboard).
- **Risque SEO programmatique** (« scaled content abuse », mars 2024) : **quality gates** stricts — ne publier
  une page département que si elle porte une **donnée locale réelle** et une utilité (calculateur) ; surveiller les
  **actions manuelles** dans GSC ; déployer par vagues et observer l'indexation avant d'étendre.
- **Politique contenu IA** : rédaction assistée OK si **relue par un humain** et **utile** (position Google :
  c'est la qualité qui compte, pas le mode de production) ; jamais de masse non vérifiée sur un sujet YMYL.
- **Disclaimers & responsabilité** : « estimation, pas un avis officiel » visible ; renvoi caf.fr/pajemploi.
- **Monitoring & alerting** : chutes de positions/indexation, régressions Core Web Vitals (CrUX), **données
  structurées cassées** (GSC Rich Results), uptime, 404 (rapport GSC) → corriger vite (301 si déplacé, 410 si supprimé).
- **Versionnement des barèmes** : snapshot `bareme-AAAA.json` + diff à chaque MAJ (déjà prévu, plan d'implém. §9.5).
- **Accessibilité** (RGAA/WCAG AA) : alt, contrastes, navigation clavier, ARIA → UX, conformité **et** signal SEO.
- **Sécurité / hygiène** : en-têtes (HSTS, CSP adaptée au widget embarquable), pas de chaînes de redirection,
  cohérence mobile/desktop (mobile-first indexing).

## 21. Definition of Done — couverture 100 % (et mapping vers les phases §10)

| Domaine | Critère « fait » | Phase |
|---|---|---|
| Rendu | HTML complet pour bots IA (test logs/`curl -A GPTBot`) | 0 |
| Indexation | IndexNow + sitemap propre (`loc`+`lastmod`) + GSC/Bing | 0 |
| Crawl | profondeur ≤ 3, 0 orphelin, canonical des `?…`, logs vérifiés | 0/3 |
| On-page | title/meta/H1/OG + date MAJ + answer-first par page | 1 |
| Schema | WebApplication, Article(+author/reviewer/dates), FAQ, HowTo, Dataset, Breadcrumb, Person/Org, Place, DefinedTerm | 1-4 |
| Recherche MC | carte étendue + analyse SERP par requête + veille concurrents | 1-2 |
| Contenu | 8 guides + glossaire, briefs, snippet/passage-ready, sources datées | 2 |
| Programmatique | pages département (donnée réelle) + quality gates + vagues | 3 |
| Multimédia | vidéos YouTube + infographies + transcripts | 4 |
| Autorité | Observatoire + presse + journalist sourcing + backlink gap + réseau | 4 |
| GEO | robots bots IA + llms.txt + contenu citable + entité/sameAs + Wikidata | 1-4 |
| E-E-A-T | auteur + **relecteur expert** + politique éditoriale + transparence | 1-2 |
| CWV | LCP<2,5s / INP<200ms / CLS<0,1 (terrain) + lazy-load données postales | 0-1 |
| Produit | events analytics + dashboards + boucle CTR | 1-5 |
| Gouvernance | monitoring/alerting + quality gates + rituel barème + disclaimers | continu |
| Mesure GEO | referrers IA segmentés + panel de prompts mensuel + part de voix | 4-5 |

> Une ligne « fait » = artefact en prod **et** vérifié (test/outil), pas juste « codé ».
