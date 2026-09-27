import { describe, it, expect } from "vitest";
import { bareme } from "../bareme";
import { calcAma, calcCreche, calcDomicile, calcMicroCreche } from "../calc";
import type { Inputs } from "../types";

// Cas de référence OFFICIELS. Chaque valeur attendue vient d'une publication de
// la CAF, de l'Urssaf ou du barème national, citée au-dessus du test — et non du
// moteur lui-même. Un test qui échoue ici signifie que le site affiche un chiffre
// différent de celui de l'administration.

const base: Inputs = {
  revenuMensuelNet: 2000,
  situation: "couple",
  nbEnfants: 1,
  agesGardes: [1],
  heuresMois: 160,
};

describe("Cas officiels publiés", () => {
  // caf.fr, « Réforme du CMG : la foire aux questions » (montants 2026) :
  // Mathéo et Alice, 2 000 € de ressources, 160 h/mois, 1 enfant, assistante
  // maternelle à 4,91 €/h → CMG = 4,91 × 160 × (1 − 2 000 × 0,0619 % ÷ 4,91) = 587,52 €.
  it("CMG assistante maternelle — exemple CAF : 2 000 €, 160 h, 4,91 €/h → 587,52 €", () => {
    const r = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, fraisAnnexesAma: 0 });
    expect(r.details.cmg).toBeCloseTo(587.52, 2);
  });

  // Barème national des participations familiales 2026 : ressources de 814,62 € à
  // 8 500 €, taux d'effort 0,0619 % (1 enfant) → de 0,50 € à 5,26 € de l'heure.
  it("Crèche PSU 2026 — tarif plancher 0,50 €/h et plafond 5,26 €/h (1 enfant)", () => {
    expect(calcCreche(bareme, { ...base, revenuMensuelNet: 500 }).details.tarifHoraire).toBeCloseTo(0.5, 2);
    expect(calcCreche(bareme, { ...base, revenuMensuelNet: 12000 }).details.tarifHoraire).toBeCloseTo(5.26, 2);
  });

  // Même barème : 4 000 € × 0,0516 % (2 enfants à charge) = 2,06 €/h.
  it("Crèche PSU 2026 — 4 000 €, 2 enfants → 2,06 €/h", () => {
    const r = calcCreche(bareme, { ...base, revenuMensuelNet: 4000, nbEnfants: 2 });
    expect(r.details.tarifHoraire).toBeCloseTo(2.06, 2);
  });

  // Le PSU ne connaît pas la situation familiale : 2 000 € × 0,0619 % × 180 h = 222,84 €.
  it("Crèche PSU — parent isolé, 2 000 €, 180 h → 222,84 €/mois", () => {
    const r = calcCreche(bareme, { ...base, situation: "isole", heuresMois: 180 });
    expect(r.coutBrut).toBeCloseTo(222.84, 2);
  });

  // CMG structure micro-crèche au 1er avril 2026, enfant < 3 ans, couple 1 enfant :
  // 992,13 € (revenus ≤ 24 333 €), 855,25 € (≤ 54 075 €), 718,41 € (au-delà).
  it("Micro-crèche — forfaits 2026 par tranche : 992,13 / 855,25 / 718,41 €", () => {
    const cas = (revenuMensuelNet: number) =>
      calcMicroCreche(bareme, { ...base, revenuMensuelNet, heuresMois: 200, tarifMicroCreche: 10 }).aide;
    expect(cas(1500)).toBeCloseTo(992.13, 2); // 18 000 €/an → T1
    expect(cas(3000)).toBeCloseTo(855.25, 2); // 36 000 €/an → T2
    expect(cas(6000)).toBeCloseTo(718.41, 2); // 72 000 €/an → T3
  });

  // Parent isolé : montants +30 % et seuils +40 % → 1 289,77 € en tranche 1
  // (seuil 34 066 €), 1 111,82 € en tranche 2.
  it("Micro-crèche — parent isolé : 1 289,77 € (T1) et 1 111,82 € (T2)", () => {
    const cas = (revenuMensuelNet: number) =>
      calcMicroCreche(bareme, {
        ...base,
        situation: "isole",
        revenuMensuelNet,
        heuresMois: 200,
        tarifMicroCreche: 10,
      }).aide;
    expect(cas(2700)).toBeCloseTo(1289.77, 1); // 32 400 €/an ≤ 34 066 € → T1 majorée
    expect(cas(4000)).toBeCloseTo(1111.82, 1); // 48 000 €/an → T2 majorée
  });
});

describe("Règles officielles (caf.fr, Urssaf)", () => {
  it("CMG emploi direct : plus de montant maximum mensuel", () => {
    // Ressources au plancher, 250 h à 8 €/h : l'ancien plafond de 825 € ne s'applique plus.
    const r = calcAma(bareme, {
      ...base,
      revenuMensuelNet: 800,
      heuresMois: 250,
      tauxHoraireAma: 8,
      fraisAnnexesAma: 0,
    });
    const attendu = 250 * 8 * (1 - (814.62 * 0.000619) / 4.91);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
    expect(r.details.cmg).toBeGreaterThan(825.16);
  });

  it("Assistante maternelle : indemnités d'entretien et de repas incluses dans le coût", () => {
    const r = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, fraisAnnexesAma: 100 });
    const attendu = (4.91 * 160 + 100) * (1 - (2000 * 0.000619) / 4.91);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
  });

  it("Assistante maternelle : coût horaire écrêté au plafond de 8,09 €/h", () => {
    const r = calcAma(bareme, { ...base, tauxHoraireAma: 9.5, fraisAnnexesAma: 0 });
    expect(r.details.coutMensuelGarde).toBeCloseTo(8.09 * 160, 2);
  });

  it("AEEH : taux d'effort de la tranche inférieure (pas de majoration de montant)", () => {
    const sans = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, fraisAnnexesAma: 0 });
    const avec = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, fraisAnnexesAma: 0, aeeh: true });
    const attendu = 4.91 * 160 * (1 - (2000 * 0.000516) / 4.91); // taux « 2 enfants »
    expect(avec.details.cmg).toBeCloseTo(attendu, 2);
    expect(avec.details.cmg).toBeGreaterThan(sans.details.cmg);
  });

  it("Horaires atypiques : plus de majoration en emploi direct", () => {
    const sans = calcAma(bareme, { ...base, tauxHoraireAma: 4.91 });
    const avec = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, horairesAtypiques: true });
    expect(avec.details.cmg).toBeCloseTo(sans.details.cmg, 6);
  });

  it("Garde à domicile : taux d'effort doublé, coût de référence 10,50 €/h", () => {
    // Coût total 18,90 €/h ≈ 10,50 €/h net (facteur 1,8).
    const r = calcDomicile(bareme, { ...base, revenuMensuelNet: 3000, coutHoraireDomicile: 18.9 });
    const attendu = 160 * 10.5 * (1 - (3000 * 0.000619 * 2) / 10.5);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
  });

  it("Garde à domicile : cotisations prises en charge à 50 %, au plus 524 €/mois (< 3 ans)", () => {
    const r = calcDomicile(bareme, { ...base, heuresMois: 200, coutHoraireDomicile: 25 });
    expect(r.details.cmgCotis).toBeCloseTo(524, 2);
    const grand = calcDomicile(bareme, { ...base, agesGardes: [4], heuresMois: 200, coutHoraireDomicile: 25 });
    expect(grand.details.cmgCotis).toBeCloseTo(263, 2);
  });

  it("Micro-crèche : au-delà de 10 €/h, pas de CMG structure", () => {
    const r = calcMicroCreche(bareme, { ...base, tarifMicroCreche: 10.5 });
    expect(r.aide).toBe(0);
    expect(r.tresorerieMensuelle).toBeCloseTo(10.5 * 160, 2);
  });

  it("Micro-crèche : aide divisée par deux entre 3 et 6 ans", () => {
    const r = calcMicroCreche(bareme, {
      ...base,
      revenuMensuelNet: 1500,
      agesGardes: [4],
      heuresMois: 200,
      tarifMicroCreche: 10,
    });
    expect(r.aide).toBeCloseTo(992.13 / 2, 2);
  });
});
