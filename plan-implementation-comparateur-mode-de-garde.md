# Plan d'implémentation — Comparateur « Quel mode de garde ? »

> **Pour Claude Code.** Ce document est un brief de build complet et autoportant.
> Objectif : un **site statique, sans inscription**, qui compare les modes de garde d'enfant
> et rend un **verdict chiffré** personnalisé. Construire dans l'ordre du §17.
> Le moteur (§6) n'est « fini » que quand les **tests golden (§9) passent** — c'est le critère de correction.
> Stack recommandée au §13. **Toute valeur chiffrée vient de `bareme-2026.json` (§7), jamais en dur dans le code.**
>
> Sibling de `freelance-ou-cdi.fr`. Même ADN produit, autre verticale.

**Critères d'acceptation (definition of done) :**
- Les tests golden passent (CMG = 577,92 € ; crèche PSU = 2,06 €/h ; ~223 €/mois) + invariants OK.
- Le moteur est cross-validé contre les simulateurs officiels (CAF/Pajemploi) sur une grille de scénarios (écart ≤ 1 €).
- **Zéro inscription** pour obtenir le résultat. Résultat instantané.
- **Mobile-first**, accessible (RGAA/WCAG AA), Lighthouse vert (perf/SEO/a11y).
- Pages légales + page Méthodologie + footer « Fait par Ali El Mufti » → aelm.dev présents.
- Chaque chiffre affiché est **daté et sourcé**.

---

## 1. Résumé exécutif

L'outil prend un **menu fini d'options réglementées** (5 modes de garde) et rend **un verdict personnalisé** : le mode le moins cher pour *cette* famille, l'écart en € avec le suivant, et pourquoi.

C'est une instance du pattern qui fait marcher `freelance-ou-cdi.fr` :
- un menu fini d'options réglementées ;
- où l'optimum dépend **entièrement des chiffres de l'utilisateur** (aucune réponse universelle) ;
- des règles **publiques et vérifiables** mais trop chiantes à calculer soi-même sur tous les modes à la fois ;
- des acteurs qui devraient donner la réponse mais ne le font pas ou la gatent ;
- enjeu élevé + recherche evergreen → les gens veulent **un verdict**, pas un tableau à interpréter.

---

## 2. Positionnement concurrentiel & stratégie de différenciation

**Réalité : le créneau est déjà occupé.** On le sait, on y va quand même, et on gagne **par l'exécution**.

Concurrents identifiés :
- **Propres / sans inscription** (les vrais adversaires) : `moncmg.fr` (comparatif + quiz + crèche PSU/PAJE, RGPD/Matomo auto-hébergé), `miraparent.com` (comparateur avec verdict chiffré, inclut même le congé parental), `simulateurfinance.fr` (compare les 4 modes, crédit d'impôt restituable).
- **Lead-gen / gatés / moches** (beatables facilement) : `wizbii`, `amarris-immo` (« recevez votre simulation par email »), et divers sites qui exigent un compte.

**Les 4 leviers pour les battre :**
1. **Plus complet et plus clair.** Verdict net + double affichage *trésorerie mensuelle* vs *coût net réel* (timing du crédit d'impôt), prise en compte de la **participation employeur/CESU** et du **multi-enfant** — des angles que les incumbents traitent mal ou pas.
2. **Zéro inscription**, jamais. C'est le wedge contre les lead-gen. La sauvegarde se fait par URL (§11), pas par compte.
3. **Design intuitif et mobile-first.** La majorité des jeunes parents cherchent sur mobile ; beaucoup de concurrents sont datés.
4. **SEO/GEO supérieur.** Profondeur de contenu + E-E-A-T (§12) + **fraîcheur** (réforme CMG de sept. 2025 que les vieux contenus ratent) + données structurées + backlinks. C'est ce qui out-ranke un incumbent établi.

> Note honnête : out-ranker des incumbents qui ont déjà de l'autorité est un **jeu d'exécution sur la durée**, pas un créneau vide. La correction des calculs (§9) et la fraîcheur sont nos meilleurs atouts.

---

## 3. Pourquoi ce projet (rationale stratégique)

### 3.1 Le trou de marché initial
Le simulateur officiel de la CAF ne calcule **que le CMG en emploi direct** : il ne compare pas les modes, n'intègre pas le crédit d'impôt, ignore le tarif crèche PSU. La plupart des outils tiers font des comparaisons **partielles** ou **gatées**.

### 3.2 Le pilier « vérifiable »
Tous les paramètres sont des données officielles (CNAF, Urssaf/Pajemploi, service-public.fr), **datées et sourcées** dans la config → différencie des outils flous et rend l'outil **citable par les moteurs génératifs** (GEO).

### 3.3 La complexité joue pour nous
La réforme du CMG (1er sept. 2025) est la transformation la plus profonde du dispositif depuis 2004. **Les contenus et simulateurs d'avant sont périmés** → on surclasse en codant juste et à jour.

### 3.4 Le pattern de revisite / réassurance
La garde d'enfant est une **angoisse récurrente** : on re-vérifie après une augmentation, avant la rentrée, pour un scénario. Les **sliders de sensibilité** (heures, revenu) qui font basculer le verdict en direct sont le moteur de revisite et de partage.

---

## 4. Périmètre fonctionnel — les 5 modes comparés

1. **Crèche collective** (municipale / associative / d'entreprise, conventionnée PSU)
2. **Micro-crèche** (privée, tarification PAJE → CMG « structure »)
3. **Assistante maternelle agréée** (emploi direct)
4. **Garde à domicile** (emploi direct)
5. **Garde partagée** (garde à domicile partagée entre 2 familles)

Chaque mode a **son propre tuyau de calcul** : c'est là qu'est la difficulté, les règles diffèrent à chaque mode.

---

## 5. Principe de calcul (pipeline général)

Pour chaque mode, le même pipeline :

```
coût brut → − aide (CMG ou tarif PSU) → − participation employeur → reste à charge → − crédit d'impôt → coût net réel
```

**Deux chiffres distincts en sortie** (personne ne fait cette distinction, et c'est elle qui rassure) :
- **Trésorerie mensuelle** : ce qui part réellement du compte chaque mois (avant crédit d'impôt).
- **Coût net réel** : après crédit d'impôt, encaissé l'année suivante (avance de 60 % en janvier, solde en été).

---

## 6. Moteur de calcul détaillé

> Le moteur = **fonctions pures** `(inputs, config) → résultats par mode`. Framework-agnostique. Voir §9 pour les tests.

### 6.1 Cœur — formule CMG emploi direct (post-réforme, depuis le 1er sept. 2025)

```
CMG = coût_mensuel_garde × (1 − (revenu_mensuel × taux_effort / coût_horaire_référence))
```
- `coût_mensuel_garde = heures_mois × min(taux_horaire_réel, plafond_horaire)`
- `revenu_mensuel = clamp(revenu_net_catégoriel_N2 / 12, plancher, plafond)`
- `taux_effort` : table CNAF, colonne « collectif » pour l'AMA ; **× 2** pour la garde à domicile
- `coût_horaire_référence` : 4,85 € (AMA) / 10,38 € (garde à domicile)
- Résultat **clampé** à `[0, cmg_max_mensuel]`

**Vérification (exemple officiel Urssaf)** — 2 000 €, 160 h, AMA 4,85 €/h, 1 enfant, TE 0,0619 % :
`4,85 × 160 × (1 − (2 000 × 0,0619 % / 4,85)) = 776 × 0,7447 = 577,92 €` ✓

Cotisations (séparé, NON touché par la réforme) : **100 %** prises en charge (AMA agréée) ; **50 %** (garde à domicile).

### 6.2 Assistante maternelle agréée (emploi direct)
```
coût_brut    = heures × min(taux_horaire, 8) + frais_annexes_mensuels   // indemnités entretien + repas (NON aidés)
cmg_rem      = formule §6.1 (TE simple, réf 4,85)
cmg_cotis    = 100 % → 0 à charge
reste        = coût_brut − cmg_rem − participation_employeur
credit_impot = 0,5 × min(reste_annuel, 3 500 €/enfant)   // crédit FRAIS DE GARDE
net_réel     = reste − credit_impot/12
```

### 6.3 Garde à domicile (emploi direct)
```
coût_brut    = heures × coût_horaire_total_employeur
cmg_rem      = formule §6.1, TE DOUBLÉ, réf 10,38, plafond 15,18
cmg_cotis    = 50 % des cotisations estimées        // SOFT SPOT — à affiner (cf. config taux_charges_domicile_approx)
reste        = coût_brut − cmg_rem − cmg_cotis − participation_employeur
credit_impot = 0,5 × min(reste_annuel, 12 000 € (+1 500/enfant, max 15 000))   // crédit EMPLOI À DOMICILE
net_réel     = reste − credit_impot/12
```
> ⚠️ Crédit d'impôt **emploi à domicile** (~12 000 €), **PAS** le crédit frais de garde (3 500 €). C'est ce plafond plus haut qui rend la garde à domicile/partagée compétitive pour les hauts revenus. **Piège n°1 des comparateurs.**

### 6.4 Garde partagée
Variante du §6.3 : `coût_brut_par_famille = coût_brut_total / nb_familles`, CMG calculé **pour chaque famille** séparément, crédit d'impôt emploi à domicile. Souvent le meilleur ratio coût/souplesse → à mettre en avant quand il gagne.

### 6.5 Crèche collective (PSU)
Pas de CMG. Tarif = participation familiale au taux d'effort CNAF.
```
ressources_retenues = clamp(revenu_net_N2_mensuel, 814,62, 8500)
tarif_horaire       = ressources_retenues × taux_effort(nb_enfants)   // colonne « collectif »
coût_brut           = heures_FACTURÉES × tarif_horaire
reste               = coût_brut − participation_employeur
credit_impot        = 0,5 × min(reste_annuel, 3 500 €/enfant)
net_réel            = reste − credit_impot/12
```
- Même table de taux d'effort que le CMG AMA → un seul barème à maintenir.
- Pas de division par le nb d'enfants (déjà intégré dans le taux d'effort).
- La fourchette de tarif (≈ 0,50 €/h à ≈ 5,26 €/h pour 1 enfant) sort naturellement du plancher/plafond ; **ne pas** hardcoder de cap horaire.
- Drapeau honnête : place non garantie.

### 6.6 Micro-crèche (CMG « structure », PAJE)
Logique **totalement différente** de l'emploi direct (réforme sept. 2025 NON applicable ici).
```
cout_eligible  = heures × min(tarif_horaire_structure, 10)       // plafond 10 €/h
aide_brute     = min(0,85 × cout_eligible, forfait_max_tranche)  // double plafond
aide           = (age >= 3) ? aide_brute / 2 : aide_brute        // ÷2 de 3 à 6 ans (MAINTENU ici)
reste_min      = 0,15 × cout_eligible                            // reste à charge plancher 15 % (MAINTENU ici)
reste_a_charge = max(cout_total − aide − participation_employeur, reste_min)
credit_impot   = 0,5 × min(reste_a_charge_annuel, 3 500)         // frais de garde
net_reel       = reste_a_charge − credit_impot/12
```
- `forfait_max_tranche` : 3 tranches de revenus × 2 tranches d'âge (§7). Plafond secondaire : le cap 85 % et le plafond 10 €/h mordent souvent en premier.
- Conditions : min 16 h/mois ; structure en tarification PAJE (pas PSU).

### 6.7 Points transverses & extensions
- **Crédit d'impôt restituable** : à câbler explicitement. C'est un **crédit** (pas une réduction) → il s'applique **même aux foyers non imposables** et se déduit toujours du coût net. Ne pas conditionner à l'imposabilité.
- **Participation employeur / CESU préfinancé** : input optionnel qui réduit le reste à charge avant crédit d'impôt. La part payée par l'employeur **n'ouvre pas** le crédit d'impôt → ne pas la compter dans la base du crédit.
- **Multi-enfant gardé simultanément** : v1 = **un enfant placé**, `nb_enfants_à_charge` pilotant le taux d'effort. v2 = placement de 2+ enfants (coûts multipliés, plafonds de crédit d'impôt **par enfant**, parfois tarifs dégressifs en crèche). Documenté comme extension.
- **Transferts mode-invariants EXCLUS** du comparatif : allocation de base PAJE (~184 €/mois), prime de naissance → identiques quel que soit le mode, leur inclusion fausse la lisibilité sans changer le gagnant.

---

## 7. Barème / configuration complète (au 1er avril 2026)

> Fournie aussi en fichier prêt à l'emploi : **`bareme-2026.json`**.

### 7.1 Table des taux d'effort
Barème national EAJE — circulaire CNAF 2019-005 du 5 juin 2019, applicable au 1er janvier 2026. Ressources N-2. Sert **trois** modes : crèche PSU, CMG AMA (colonne collectif), CMG garde à domicile (collectif × 2).

| Enfants à charge | Accueil collectif + micro-crèche / CMG AMA | Accueil familial/parental |
|---|---|---|
| 1 | 0,0619 % | 0,0516 % |
| 2 | 0,0516 % | 0,0413 % |
| 3 | 0,0413 % | 0,0310 % |
| 4 à 7 | 0,0310 % | 0,0310 % puis 0,0206 % |
| 8 et + | 0,0206 % | 0,0206 % |

> ⚠️ Certains blogs donnent des valeurs FAUSSES (0,0612 %…). Sourcer le PDF officiel CAF.

### 7.2 Bornes de ressources
- Revenu retenu : **revenus nets catégoriels N-2** (revenus 2024 pour un calcul 2026).
- Plancher : **814,62 €/mois** ; Plafond : **8 500 €/mois**.
- `ressources_retenues = clamp(revenu_N2_mensuel, 814.62, 8500)`.

### 7.3 Coûts horaires de référence & plafonds
| Paramètre | AMA | Garde à domicile | Micro-crèche |
|---|---|---|---|
| Coût horaire de référence | 4,85 € | 10,38 € | — |
| Plafond horaire pris en compte | 8 € | 15,18 € | 10 € |
| Cotisations prises en charge | 100 % | 50 % | — |

### 7.4 Plafonds de versement CMG (caps mensuels)
- AMA emploi direct : **825,16 €/mois** (1 enfant).
- Garde à domicile : jusqu'à **797,80 €/mois** (tranche basse, 1 enfant).
- Micro-crèche structure (T1, < 3 ans) : **992,13 €/mois**.

### 7.5 Crédits d'impôt
| Dispositif | Modes | Taux | Plafond |
|---|---|---|---|
| Frais de garde (hors domicile) | crèche, micro-crèche, AMA | 50 % | 3 500 €/enfant → max 1 750 €/an/enfant |
| Emploi à domicile | garde à domicile, partagée | 50 % | ~12 000 € (+1 500/enfant, max 15 000) |

### 7.6 Majorations
- **Parent isolé** : plafonds relevés (+40 %) ; droit étendu jusqu'aux **12 ans**. *(Mécanique exacte d'application à vérifier — cf. §8.)*
- **AEEH** : +30 % sur le CMG ; pour la crèche PSU, taux d'effort de la **tranche juste en dessous**.
- **Horaires atypiques** (nuit 22h-6h, dimanche, férié) : +10 %.

### 7.7 Tranches de revenus annuels (1 enfant)
T1 : < 22 691 € · T2 : 22 691 à 50 425 € · T3 : > 50 425 € (bornes décalées vers le haut avec le nb d'enfants).

### 7.8 Forfait max micro-crèche structure (1 enfant, < 3 ans)
| Tranche | Forfait max mensuel |
|---|---|
| T1 (< 22 691 €) | **992,13 €** (confirmé) |
| T2 (22 691–50 425 €) | ~835 € — **À CONFIRMER verbatim (Pajemploi)** |
| T3 (> 50 425 €) | ~501 € — **À CONFIRMER verbatim (Pajemploi)** |

> Revalorisation +0,8 % au 1er avril 2026.

---

## 8. Pièges de correctness (à coder absolument)

1. **Distinction d'âge** : SUPPRIMÉE en emploi direct ; **MAINTENUE** en micro-crèche structure (÷2 entre 3 et 6 ans). Deux logiques coexistent → ne pas factoriser à l'aveugle.
2. **Reste à charge minimum 15 %** : SUPPRIMÉ en emploi direct ; **MAINTENU** en micro-crèche structure.
3. **Deux crédits d'impôt différents** : frais de garde (3 500 €) vs emploi à domicile (~12 000 €). Ne pas confondre.
4. **Taux d'effort** : sourcer le PDF CAF officiel (blogs erronés type 0,0612 %).
5. **Crèche PSU** : pas de division par le nb d'enfants ; clamp des ressources AVANT le taux d'effort.
6. **Crédit d'impôt restituable** : s'applique même aux non-imposables (cf. §6.7).
7. **Part employeur** : hors base du crédit d'impôt (cf. §6.7).
8. **Majoration parent isolé** : porte sur les plafonds/tranches, pas directement sur le montant — vérifier la mécanique exacte avant de l'appliquer en emploi direct.

---

## 9. Tests & validation des calculs (CRITIQUE)

Sujet YMYL → **la justesse EST le produit**. Moteur = fonctions pures → couvrir **toutes** les branches.

### 9.1 Golden cases (fixtures officielles — doivent passer)
- CMG emploi direct AMA : 2 000 €, 160 h, 4,85 €/h, 1 enfant → **577,92 €**.
- Crèche PSU : 4 000 €, 2 enfants → tarif horaire **2,06 €/h**.
- Crèche PSU : maman seule 1 enfant 2 000 € sur ~180 h → **≈ 223 €/mois**.
- Micro-crèche T1 < 3 ans → forfait plafond **992,13 €/mois**.

### 9.2 Cross-validation contre les simulateurs officiels
Gold standard : grille de scénarios (revenus × heures × nb enfants × âge × mode) comparée aux résultats CAF/Pajemploi/service-public. Tolérance ≤ 1 €. Prouve la correction, pas juste la cohérence interne.

### 9.3 Cas limites explicites
Revenus sous plancher (814,62) / au-dessus plafond (8 500) ; enfant franchissant 3 ans ; parent isolé ; AEEH ; horaires atypiques ; taux > plafond horaire ; 0 h ; plusieurs enfants ; garde partagée (split).

### 9.4 Invariants (property-based)
Coût net ≥ 0 ; aide ≤ coût éligible et ≤ plafond ; crédit ≤ plafond ; monotonie (plus de revenus ⇒ aide ≤) ; classement stable.

### 9.5 Config & non-régression
Snapshot de `bareme-AAAA.json` (afficher les deltas à chaque MAJ) ; suite de non-régression rejouée à chaque changement de barème (janv. CNAF, avril revalorisations) ; cible **100 % de couverture des branches**.

---

## 10. Inputs / formulaire

Objectif : un résultat en **4-5 champs max** (faible friction = revisite).

Champs principaux : revenu mensuel net du foyer (RFR N-2), situation (couple / parent isolé), nombre d'enfants à charge, âge de l'enfant, heures de garde/mois, code postal.

Champs avancés (repliés) : taux horaire réel AMA + indemnités annexes, coût horaire garde à domicile, tarif micro-crèche, **participation employeur/CESU**, % de partage, horaires atypiques, AEEH.

**Pré-remplissage intelligent** : taux horaire AMA + tarif crèche typiques injectés depuis une base régionale → réponse même sans connaître les prix. C'est ce qui fait revenir.

---

## 11. Sortie / UX

- **Classement** des 5 modes par coût net réel mensuel, gagnant en avant + écart €.
- **Phrase de justification** (verdict, pas un tableau).
- **Décomposition** du gagnant en barres : coût brut → aide → crédit d'impôt → net.
- **Trésorerie mensuelle vs coût net réel** (timing crédit d'impôt).
- **Sliders de sensibilité** (heures, revenu) → bascule en direct (moteur de revisite/partage).
- **Partage de scénario par URL** : l'état du formulaire est encodé dans les query params → c'est le « save » **sans compte**, partageable, et il alimente aussi les liens partagés et les pages par ville. (Pas de localStorage requis ; tout dans l'URL.)
- **Drapeaux honnêtes** : place crèche non garantie, activité pro requise, seuils.

---

## 12. Autour du calculateur (le calculateur seul ne ranke pas — YMYL)

Sujet finance/aides → Google exige un niveau de confiance élevé (YMYL). C'est ce que la plupart ratent.

### Tier critique
1. **Page « Méthodologie » + E-E-A-T.** La plus importante. Formules, sources officielles datées, date de MAJ du barème, **auteur identifiable** (footer §12 bis), disclaimer « estimation, pas un avis officiel, vérifiez sur caf.fr ».
2. **Cluster de contenu éditorial** (cf. carte de mots-clés ci-dessous) + **pages programmatiques par ville**.
3. **Données structurées Schema.org** : `FAQPage`, `HowTo`, `WebApplication`, `BreadcrumbList`.
4. **Pages légales RGPD** : mentions légales, confidentialité, consentement cookies.

### Tier croissance
5. **Partage natif** : image de résultat + OG **dynamiques** (le verdict s'affiche au partage).
6. **SEO technique** : sitemap, robots.txt, titres/meta/OG par page, **canonical** propre, Search Console.
7. **Analytics privacy-friendly** (Plausible / Matomo).
8. **Accessibilité (RGAA/WCAG AA) + mobile-first** : la majorité de l'audience est sur mobile ; l'a11y aide aussi le SEO.

### Carte de mots-clés (starter — 1 page = 1 intention)
| Requête cible | Intention | Page |
|---|---|---|
| comparateur mode de garde | comparer/décider | Calculateur (home) |
| coût crèche vs assistante maternelle | comparer 2 options | Guide comparatif |
| calcul CMG 2026 / simulateur CMG | calcul d'aide | Page CMG + calculateur |
| reste à charge nounou / assistante maternelle | budget | Guide AMA |
| prix crèche [ville] | local | Page programmatique /ville |
| CMG micro-crèche 2026 | aide structure | Guide micro-crèche |
| garde à domicile coût réel | budget | Guide garde à domicile |
| réforme CMG septembre 2025 | actualité/fraîcheur | Article réforme |
| crédit d'impôt frais de garde 2026 | fiscalité | Guide crédit d'impôt |

> Principe transverse : **jamais d'inscription** pour le résultat. Capture de valeur opt-in seulement (ex. newsletter « préviens-moi quand le barème change »).

### 12 bis. Footer (auteur + backlink)
Footer sur **toutes les pages** :
> Fait par **[Ali El Mufti](https://aelm.dev)**
- Lien vers `https://aelm.dev` **do-follow**.
- **Double bénéfice** : signal d'auteur E-E-A-T (crédibilise ce site) + **backlink d'autorité** vers aelm.dev.
- Compléter par un maillage interne vers `freelance-ou-cdi.fr`.

---

## 13. Architecture technique & stack recommandée

- **Front-only / statique.** Donnée de référence (bouge 1-2 fois/an), pas de temps réel → **aucun backend**.
- **Stack recommandée : Astro** (excellent SEO/perf, content collections pour les pages programmatiques par ville, MDX pour le cluster de contenu, îlots interactifs React pour le calculateur, Lighthouse au top). Alternatives : Next.js (SSG) ou SvelteKit.
- **Moteur = package TypeScript pur**, fonctions pures, **framework-agnostique** (réutilisable quelle que soit l'UI). Importé par l'île interactive.
- **Config** = `bareme-2026.json` bundlé au build ; **refresh annuel** (janv. CNAF, avril revalorisations).
- **Tests** = vitest, avec les fixtures officielles du §9.
- Pas de localStorage (état dans l'URL, cf. §11).

---

## 14. Couche données locales (roadmap — gros levier de trafic)

À brancher après le moteur national. Sert les pages par ville et le pré-remplissage.
À récupérer par territoire : tarif horaire moyen crèche (varie peu, barème national), **taux horaire moyen AMA par département** (donnée la plus dispersée → point dur), disponibilité indicative.
Sources à explorer : observatoires petite enfance, données CAF/Pajemploi agrégées, open data territorial.

---

## 15. Sources officielles & validité

| Donnée | Source | Validité |
|---|---|---|
| Taux d'effort EAJE / PSU | CNAF, circ. 2019-005 du 5 juin 2019 ; barème EAJE 2026 (caf.fr) | 1er janv. 2026 |
| Formule + plafonds CMG emploi direct | Urssaf/Pajemploi ; réforme art. 99 LFSS 2024 (loi n° 2023-1250), 1er sept. 2025 | avril 2026 |
| Plancher/plafond ressources | CNAF | 2026 |
| CMG structure micro-crèche | Pajemploi / service-public.fr | avril 2026 |
| Crédits d'impôt | service-public.fr / impots.gouv.fr | 2026 |

> Toutes les valeurs sont au 1er avril 2026. À revérifier à chaque loi de finances / revalorisation.

---

## 16. Action restante avant prod (donnée)

**Une seule** : remplacer les valeurs `~` du forfait max micro-crèche (T2/T3, §7.8 et config) par les chiffres **officiels Pajemploi / service-public.fr** (blogs contradictoires). Recherche de 2 min ; plafond secondaire qui ne mord que dans les cas extrêmes. Tout le reste du moteur est spécifié et vérifié.

---

## 17. Ordre de build recommandé (pour Claude Code)

1. **Moteur TS pur + `bareme-2026.json` + suite de tests vitest** (§6, §7, §9). Faire passer les golden cases et cross-valider contre les simulateurs officiels. *Le moteur n'est fini que quand les tests passent.*
2. **UI calculateur** : formulaire minimal + sortie (classement, décomposition, sliders, état dans l'URL) (§10, §11). Mobile-first + a11y dès le départ.
3. **Page Méthodologie + pages légales RGPD + footer E-E-A-T** (« Fait par Ali El Mufti » → aelm.dev) (§12, §12 bis). Avant lancement.
4. **Cluster de contenu + données structurées Schema.org** (§12) selon la carte de mots-clés.
5. **Mise en prod v1 « nationale »** (saisie manuelle des tarifs locaux par l'utilisateur).
6. **Couche données locales + pages programmatiques par ville** (§14) — levier SEO/GEO.
7. **Itérations** : image de partage + OG dynamiques, analytics, newsletter opt-in, maillage avec freelance-ou-cdi.fr, puis monétisation discrète une fois le trafic installé.
