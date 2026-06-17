# creche-ou-nounou.fr

> **Comparateur indépendant du coût des modes de garde d'enfant en France.**
> Crèche, micro-crèche, assistante maternelle, garde à domicile, garde partagée :
> un **verdict chiffré personnalisé** au barème 2026 (CMG, crédit d'impôt, reste à charge),
> **instantané, gratuit et sans inscription**.

Site statique (Astro) avec un calculateur React, un moteur de calcul TypeScript pur et
des données réelles par département (URSSAF). Sibling de [`freelance-ou-cdi.fr`](https://freelance-ou-cdi.fr) —
même ADN : prendre un choix réglementé complexe et en sortir un verdict clair et **vérifiable**.

---

## Pourquoi ce projet

Choisir un mode de garde est une décision **YMYL** (argent + famille) : la plupart des outils
existants sont partiels, gatés derrière une inscription, ou périmés. Ici :

- **La justesse EST le produit.** Le moteur est couvert par des tests « golden » calés sur des
  cas officiels (CMG, tarif crèche PSU, forfaits). Tant que ces tests ne passent pas, le moteur
  n'est pas « fini ».
- **À jour de la réforme du CMG de septembre 2025** (CMG emploi direct proportionnel au reste à charge).
- **Données locales réelles** : salaire horaire AMA / garde à domicile par département (open data URSSAF 2024).
- **Zéro inscription, zéro serveur** : tout est calculé dans le navigateur, le scénario est sauvegardé dans l'URL.
- **Deux chiffres distincts** que personne ne sépare : *trésorerie mensuelle* vs *coût net réel* (timing du crédit d'impôt).

---

## Stack

| Élément | Choix |
|---|---|
| Framework | [Astro](https://astro.build) 4 (rendu statique, SEO/GEO) |
| Interactivité | Îlot [React](https://react.dev) 18 (le calculateur) |
| Moteur de calcul | TypeScript pur, **framework-agnostique**, fonctions pures |
| Styles | Tailwind CSS 3 — style **néo-brutalisme** (mono, bordures épaisses, ombres dures) |
| Tests | [Vitest](https://vitest.dev) |
| Hébergement | Vercel (statique) + Vercel Web Analytics (cookieless) |

---

## Démarrage

Prérequis : Node.js 18+.

```bash
npm install        # installer les dépendances
npm run dev        # serveur de dev (http://localhost:4321)
npm run build      # build de production -> dist/
npm run preview    # prévisualiser le build
npm test           # lancer la suite de tests (Vitest)
```

> `npm run build` exécute d'abord `prebuild` (génération des images Open Graph par page).

---

## Architecture

```
bareme-2026.json                 Barème réglementaire (taux d'effort, plafonds, crédits d'impôt) — source unique
src/
  engine/                        Moteur de calcul (TS pur, fonctions pures)
    types.ts                       Types (Inputs, ModeResult, ComparisonResult…)
    bareme.ts                      Chargement du barème + hypothèses de saisie
    calc.ts                        Les 5 pipelines (crèche PSU, micro-crèche, AMA, domicile, partagée)
    compare.ts                     Classement par coût net réel + écart
    url.ts                         Encodage/décodage de l'état dans l'URL (sauvegarde sans compte)
    __tests__/                     Golden cases + invariants + multi-enfants
  data/                          Données
    tarifs-departements.json       Tarifs réels par département (URSSAF 2024) — généré
    departements.json              Code → nom (officiel) — généré
    codes-postaux.json             Code postal → département (officiel) — généré, chargé à la demande
    tarifs-locaux.ts               Résolution département + tarifs (async, lazy)
    villes.ts                      Lot curaté de grandes villes
  layouts/Layout.astro           Layout (head/meta/JSON-LD, header, footer, analytics)
  components/                    Calculator.tsx (îlot), ResultsPanel.tsx, ui.tsx
  pages/                         Routes (voir ci-dessous)
  styles/global.css              Design system néo-brutalisme
scripts/                         Scripts de génération de données et d'assets
```

### Pages

- `/` — le comparateur (îlot calculateur + verdict)
- `/guides/*` — 8 guides (CMG 2026, crédit d'impôt, micro-crèche, garde à domicile, garde partagée,
  réforme CMG sept. 2025, reste à charge nounou, crèche ou assistante maternelle) + hub `/guides`
- `/cout-garde-enfant` — hub coût par département
- `/cout-garde-enfant/[département]` — 100 pages programmatiques (données URSSAF locales)
- `/cout-garde-enfant/[département]/[ville]` — 38 pages des grandes villes
- `/observatoire-cout-garde-2026` — étude de données + CSV téléchargeable (schema `Dataset`)
- `/glossaire`, `/methodologie`, `/a-propos`, `/mentions-legales`, `/confidentialite`, `/404`

**~156 pages** générées en HTML statique (crawlable par les moteurs de recherche **et** les moteurs IA).

---

## Le moteur (cœur de correction)

Pour chaque mode, le même pipeline :

```
coût brut → − aide (CMG ou tarif PSU) → − participation employeur → reste à charge → − crédit d'impôt → coût net réel
```

Toute valeur chiffrée provient de `bareme-2026.json` — **jamais en dur** dans le code.

**Cas « golden » (doivent passer) :** CMG emploi direct AMA = **577,92 €** · tarif crèche PSU = **2,06 €/h**
· crèche parent isolé ≈ **223 €/mois** · forfait micro-crèche T1 = **992,13 €**.

```bash
npm test   # 28 tests : golden cases, invariants (net ≥ 0, monotonie…), cas limites, multi-enfants
```

---

## Données & sources

| Donnée | Source | Validité |
|---|---|---|
| Taux d'effort EAJE / PSU | CNAF, circ. 2019-005 | 1ᵉʳ janv. 2026 |
| Formule + plafonds CMG (réforme sept. 2025) | Urssaf/Pajemploi ; art. 99 LFSS 2024 | avril 2026 |
| Crédits d'impôt | service-public.fr / impots.gouv.fr | 2026 |
| Salaire AMA / garde à domicile par département | open data **URSSAF 2024** | 2024 |
| Code postal → département | **geo.api.gouv.fr** (IGN/INSEE) | — |

Les chiffres affichés sont des **estimations indicatives** — voir `/methodologie`. Détails et limites
documentés dans les plans : [`plan-implementation-comparateur-mode-de-garde.md`](plan-implementation-comparateur-mode-de-garde.md)
et [`plan-seo-geo.md`](plan-seo-geo.md).

### Régénérer les données (rituel de maintenance)

```bash
node scripts/build-geo-data.mjs       # départements + codes postaux (geo.api.gouv.fr)
node scripts/build-tarifs-data.mjs    # tarifs par département (open data URSSAF)
node scripts/build-og.mjs             # image Open Graph par défaut
```

Mettre à jour `bareme-2026.json` à chaque échéance (**janvier** : barème CNAF · **avril** :
revalorisations) et régénérer les tarifs URSSAF chaque année.

---

## Configuration (`.env`)

```bash
# Analytics privacy-first (cookieless) — vide = désactivé
PUBLIC_PLAUSIBLE_DOMAIN=
```

IndexNow (indexation rapide, après déploiement) :

```bash
HOST=creche-ou-nounou.fr node scripts/indexnow-ping.mjs
```

---

## Déploiement

Site statique déployé sur **Vercel** (`npm run build` → `dist/`). `vercel.json` configure les en-têtes
de sécurité (HSTS, etc.) et de cache. Après déploiement : lancer le ping IndexNow et soumettre le sitemap
(`/sitemap-index.xml`) à Google Search Console et Bing Webmaster Tools.

---

## Auteur & licence

Conçu et maintenu par **[Ali El Mufti](https://aelm.dev)**.

Code : © Ali El Mufti, tous droits réservés. Les données dérivées d'URSSAF (Observatoire / `tarifs-departements.json`)
sont réutilisables sous [licence ouverte Etalab](https://www.etalab.gouv.fr/licence-ouverte-open-licence/).

> Estimation indicative — ce n'est pas un avis officiel. Vérifiez votre situation sur
> [caf.fr](https://www.caf.fr) et [pajemploi.urssaf.fr](https://www.pajemploi.urssaf.fr).
