import type { Bareme, Inputs, ModeResult } from "./types";
import { defauts } from "./bareme";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** Taux d'effort CNAF (colonne « accueil collectif »), selon le nb d'enfants à charge. */
function tauxEffortCollectif(b: Bareme, nbEnfants: number): number {
  const t = b.taux_effort_collectif;
  if (nbEnfants <= 1) return t["1"];
  if (nbEnfants === 2) return t["2"];
  if (nbEnfants === 3) return t["3"];
  if (nbEnfants <= 7) return t["4_7"];
  return t["8_plus"];
}

/**
 * Formule CMG emploi direct, post-réforme du 1er sept. 2025 (§6.1).
 *   CMG = coutMensuelGarde × (1 − (revenu × tauxEffort / coutRef))
 * clampé à [0, cmgMax]. La distinction d'âge est SUPPRIMÉE en emploi direct.
 */
function cmgEmploiDirect(
  b: Bareme,
  args: {
    coutMensuelGarde: number;
    coutRef: number;
    revenuMensuel: number;
    nbEnfants: number;
    doubleTauxEffort: boolean; // garde à domicile = TE × 2
    cmgMax: number;
  },
): number {
  const revenu = clamp(args.revenuMensuel, b.ressources.plancher, b.ressources.plafond);
  const te = tauxEffortCollectif(b, args.nbEnfants) * (args.doubleTauxEffort ? 2 : 1);
  const cmg = args.coutMensuelGarde * (1 - (revenu * te) / args.coutRef);
  return clamp(cmg, 0, args.cmgMax);
}

/** Crédit d'impôt « frais de garde » (hors domicile) — annuel. v1 : 1 enfant placé. */
function creditFraisGardeAnnuel(b: Bareme, resteMensuel: number): number {
  const annuel = Math.max(resteMensuel, 0) * 12;
  const fg = b.credit_impot.frais_garde;
  return fg.taux * Math.min(annuel, fg.plafond_par_enfant);
}

/** Crédit d'impôt « emploi à domicile » — annuel (plafond ~12 000 €, majoré par enfant). */
function creditEmploiDomicileAnnuel(b: Bareme, resteMensuel: number, nbEnfants: number): number {
  const annuel = Math.max(resteMensuel, 0) * 12;
  const ed = b.credit_impot.emploi_domicile;
  const plafond = Math.min(ed.plafond_base + ed.majoration_par_enfant * nbEnfants, ed.plafond_max);
  return ed.taux * Math.min(annuel, plafond);
}

/** Tranche de revenus annuels (barème 1 enfant) pour la micro-crèche structure. */
function trancheMicroCreche(b: Bareme, revenuMensuel: number): "T1" | "T2" | "T3" {
  const annuel = revenuMensuel * 12;
  const tr = b.tranches_revenus_annuels_1enfant;
  if (annuel < tr.T1_max) return "T1";
  if (annuel < tr.T2_max) return "T2";
  return "T3";
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

/** Nombre d'enfants effectivement placés en garde (≥ 1). */
function nbGardes(i: Inputs): number {
  return Math.max(1, i.agesGardes.length);
}

/** §6.5 — Crèche collective (PSU). Pas de CMG : tarif = participation familiale. */
export function calcCreche(b: Bareme, i: Inputs): ModeResult {
  const ressources = clamp(i.revenuMensuelNet, b.ressources.plancher, b.ressources.plafond);
  // AEEH : taux d'effort de la tranche juste en dessous (§7.6).
  const nbPourTaux = i.aeeh ? i.nbEnfants + 1 : i.nbEnfants;
  const tarifHoraire = ressources * tauxEffortCollectif(b, nbPourTaux);
  const nb = nbGardes(i);
  const partParEnfant = (i.participationEmployeur ?? 0) / nb;

  // Tarif facturé par enfant (place distincte) → coût sommé. Crédit d'impôt
  // plafonné PAR enfant, donc calculé puis sommé enfant par enfant.
  let coutBrut = 0;
  let tresorerie = 0;
  let creditAnnuel = 0;
  for (let k = 0; k < nb; k++) {
    const coutEnfant = i.heuresMois * tarifHoraire;
    const tEnfant = Math.max(coutEnfant - partParEnfant, 0);
    coutBrut += coutEnfant;
    tresorerie += tEnfant;
    creditAnnuel += creditFraisGardeAnnuel(b, tEnfant);
  }
  const netReel = tresorerie - creditAnnuel / 12;

  return {
    mode: "creche",
    label: "Crèche collective",
    coutBrut,
    aide: 0, // l'aide est intégrée dans le tarif (déjà réduit par le taux d'effort)
    participationEmployeur: i.participationEmployeur ?? 0,
    tresorerieMensuelle: tresorerie,
    creditImpotMensuel: creditAnnuel / 12,
    creditImpotAnnuel: creditAnnuel,
    netReel,
    breakdown: [
      { label: nb > 1 ? `Tarif facturé (${nb} enfants)` : "Tarif facturé", montant: coutBrut },
      { label: "Crédit d'impôt", montant: -creditAnnuel / 12 },
      { label: "Coût net réel", montant: netReel },
    ],
    flags: [
      "Place non garantie",
      "Tarif déjà aidé via le taux d'effort CNAF",
      ...(nb > 1 ? ["Tarif dégressif multi-enfant non modélisé"] : []),
    ],
    details: { tarifHoraire, ressourcesRetenues: ressources, nbGardes: nb },
  };
}

/** §6.6 — Micro-crèche (CMG « structure », PAJE). Logique distincte de l'emploi direct. */
export function calcMicroCreche(b: Bareme, i: Inputs): ModeResult {
  const m = b.micro_creche_structure;
  const tarif = i.tarifMicroCreche ?? defauts.tarifMicroCreche;
  const tranche = trancheMicroCreche(b, i.revenuMensuelNet);
  const forfaitMax = m.forfait_max_mensuel_1enfant_moins3ans[tranche];
  const nb = nbGardes(i);
  const partParEnfant = (i.participationEmployeur ?? 0) / nb;

  let coutBrut = 0;
  let aideTotale = 0;
  let tresorerie = 0;
  let creditAnnuel = 0;
  for (const age of i.agesGardes) {
    const coutEligible = i.heuresMois * Math.min(tarif, m.plafond_horaire); // plafond 10 €/h
    const coutTotal = i.heuresMois * tarif;
    let aide = Math.min(m.couverture_max * coutEligible, forfaitMax); // double plafond (85 % + forfait)
    // Distinction d'âge MAINTENUE ici : ÷2 de 3 à 6 ans (§8.1).
    if (m.distinction_age && age >= 3) aide *= m.reduction_3_6ans;
    const resteMin = m.reste_a_charge_min * coutEligible; // plancher 15 % MAINTENU (§8.2)
    const tEnfant = Math.max(coutTotal - aide - partParEnfant, resteMin);
    coutBrut += coutTotal;
    aideTotale += aide;
    tresorerie += tEnfant;
    creditAnnuel += creditFraisGardeAnnuel(b, tEnfant);
  }
  const netReel = tresorerie - creditAnnuel / 12;
  const auMoinsUn3ans = i.agesGardes.some((a) => a >= 3);

  return {
    mode: "micro_creche",
    label: "Micro-crèche",
    coutBrut,
    aide: aideTotale,
    participationEmployeur: i.participationEmployeur ?? 0,
    tresorerieMensuelle: tresorerie,
    creditImpotMensuel: creditAnnuel / 12,
    creditImpotAnnuel: creditAnnuel,
    netReel,
    breakdown: [
      { label: nb > 1 ? `Coût total (${nb} enfants)` : "Coût total", montant: coutBrut },
      { label: "CMG structure", montant: -aideTotale },
      { label: "Crédit d'impôt", montant: -creditAnnuel / 12 },
      { label: "Coût net réel", montant: netReel },
    ],
    flags: [
      "Reste à charge minimum 15 %",
      auMoinsUn3ans ? "Aide ÷2 entre 3 et 6 ans" : "Min. 16 h/mois requis",
    ],
    details: {
      forfaitMax,
      tranche: tranche === "T1" ? 1 : tranche === "T2" ? 2 : 3,
      nbGardes: nb,
    },
  };
}

/** §6.2 — Assistante maternelle agréée (emploi direct). */
export function calcAma(b: Bareme, i: Inputs): ModeResult {
  const taux = i.tauxHoraireAma ?? defauts.tauxHoraireAma;
  // Indemnités entretien + repas : liées aux jours de garde → nulles si 0 h.
  const fraisUn = i.heuresMois > 0 ? i.fraisAnnexesAma ?? defauts.fraisAnnexesAma : 0;
  const coutMensuelGarde = i.heuresMois * Math.min(taux, b.plafond_horaire.ama);
  const nb = nbGardes(i);
  const partParEnfant = (i.participationEmployeur ?? 0) / nb;

  // Contrat distinct par enfant → CMG (plafonné par enfant) et crédit sommés.
  let coutBrut = 0;
  let cmgTotal = 0;
  let tresorerie = 0;
  let creditAnnuel = 0;
  for (let k = 0; k < nb; k++) {
    const coutEnfant = coutMensuelGarde + fraisUn;
    let cmgBrut = cmgEmploiDirect(b, {
      coutMensuelGarde,
      coutRef: b.cout_horaire_ref.ama,
      revenuMensuel: i.revenuMensuelNet,
      nbEnfants: i.nbEnfants,
      doubleTauxEffort: false,
      cmgMax: b.cmg_max_emploi_direct.ama,
    });
    cmgBrut = applyMajorationsEmploiDirect(b, cmgBrut, i, b.cmg_max_emploi_direct.ama);
    // On ne peut pas être aidé au-delà de ce qu'on paie.
    const cmg = Math.min(cmgBrut, Math.max(coutEnfant - partParEnfant, 0));
    const tEnfant = Math.max(coutEnfant - cmg - partParEnfant, 0);
    coutBrut += coutEnfant;
    cmgTotal += cmg;
    tresorerie += tEnfant;
    creditAnnuel += creditFraisGardeAnnuel(b, tEnfant);
  }
  const netReel = tresorerie - creditAnnuel / 12;

  return {
    mode: "ama",
    label: "Assistante maternelle",
    coutBrut,
    aide: cmgTotal,
    participationEmployeur: i.participationEmployeur ?? 0,
    tresorerieMensuelle: tresorerie,
    creditImpotMensuel: creditAnnuel / 12,
    creditImpotAnnuel: creditAnnuel,
    netReel,
    breakdown: [
      { label: nb > 1 ? `Coût brut (${nb} enfants)` : "Coût brut", montant: coutBrut },
      { label: "CMG", montant: -cmgTotal },
      { label: "Crédit d'impôt", montant: -creditAnnuel / 12 },
      { label: "Coût net réel", montant: netReel },
    ],
    flags: ["Cotisations 100 % prises en charge", "Activité pro requise"],
    details: { cmg: cmgTotal, coutMensuelGarde, fraisAnnexes: fraisUn * nb, nbGardes: nb },
  };
}

/** §6.3 / §6.4 — Garde à domicile (emploi direct), avec variante partagée. */
export function calcDomicile(b: Bareme, i: Inputs, partagee = false): ModeResult {
  const nbFamilles = partagee ? Math.max(2, i.nbFamillesPartage ?? 2) : 1;
  const coutHoraire = i.coutHoraireDomicile ?? defauts.coutHoraireDomicile;
  const coutBrutTotal = i.heuresMois * coutHoraire;
  const coutBrut = coutBrutTotal / nbFamilles; // coût pour CETTE famille

  const coutMensuelGarde =
    (i.heuresMois * Math.min(coutHoraire, b.plafond_horaire.domicile)) / nbFamilles;

  let cmgRem = cmgEmploiDirect(b, {
    coutMensuelGarde,
    coutRef: b.cout_horaire_ref.domicile,
    revenuMensuel: i.revenuMensuelNet,
    nbEnfants: i.nbEnfants,
    doubleTauxEffort: true, // TE doublé pour la garde à domicile
    cmgMax: b.cmg_max_emploi_direct.domicile,
  });
  cmgRem = applyMajorationsEmploiDirect(b, cmgRem, i, b.cmg_max_emploi_direct.domicile);

  // SOFT SPOT : 50 % des cotisations estimées (cf. config taux_charges_domicile_approx).
  const cotisationsEstimees = coutBrut * b.cotisations.taux_charges_domicile_approx;
  const cmgCotisBrut = b.cotisations.prise_en_charge_domicile * cotisationsEstimees;

  const part = i.participationEmployeur ?? 0;
  // L'aide totale ne peut excéder ce qu'on paie : on plafonne (CMG rémunération
  // prioritaire, puis aide cotisations sur le reliquat).
  const plafondAide = Math.max(coutBrut - part, 0);
  const cmg = Math.min(cmgRem, plafondAide);
  const cmgCotis = Math.min(cmgCotisBrut, plafondAide - cmg);
  const tresorerie = Math.max(coutBrut - cmg - cmgCotis - part, 0);
  // Crédit d'impôt EMPLOI À DOMICILE (~12 000 €) — PAS le crédit frais de garde (§6.3 piège n°1).
  const creditAnnuel = creditEmploiDomicileAnnuel(b, tresorerie, i.nbEnfants);
  const netReel = tresorerie - creditAnnuel / 12;

  return {
    mode: partagee ? "partagee" : "domicile",
    label: partagee ? "Garde partagée" : "Garde à domicile",
    coutBrut,
    aide: cmg + cmgCotis,
    participationEmployeur: part,
    tresorerieMensuelle: tresorerie,
    creditImpotMensuel: creditAnnuel / 12,
    creditImpotAnnuel: creditAnnuel,
    netReel,
    breakdown: [
      { label: "Coût brut" + (partagee ? " (votre part)" : ""), montant: coutBrut },
      { label: "CMG", montant: -cmg },
      { label: "Aide cotisations", montant: -cmgCotis },
      { label: "Crédit d'impôt", montant: -creditAnnuel / 12 },
      { label: "Coût net réel", montant: netReel },
    ],
    flags: [
      ...(partagee
        ? [`Partagée entre ${nbFamilles} familles`]
        : ["Activité pro requise"]),
      "Crédit d'impôt emploi à domicile (~12 000 €)",
      ...(nbGardes(i) > 1 ? ["Un seul intervenant pour tous les enfants (coût non multiplié)"] : []),
    ],
    details: { cmg, cmgCotis, coutBrutTotal, nbFamilles, nbGardes: nbGardes(i) },
  };
}

/**
 * Majorations en emploi direct (§7.6). v1 : AEEH (+30 %) et horaires atypiques (+10 %)
 * appliqués au montant de CMG, re-clampés au plafond. Le parent isolé porte sur les
 * plafonds/tranches (mécanique exacte à confirmer, §8.8) → non appliqué au montant ici.
 */
function applyMajorationsEmploiDirect(b: Bareme, cmg: number, i: Inputs, cmgMax: number): number {
  let m = cmg;
  if (i.aeeh) m *= 1 + b.majorations.aeeh;
  if (i.horairesAtypiques) m *= 1 + b.majorations.atypique;
  return clamp(m, 0, cmgMax);
}
