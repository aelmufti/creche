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
  // Exemple publié par l'Urssaf (page « Évolution du complément de libre choix du
  // mode de garde (CMG) », urssaf.fr, montants 2026) : Mathéo et Alice, 2 000 € de ressources, 160 h/mois, 1 enfant, assistante
  // maternelle à 4,91 €/h → CMG = 4,91 × 160 × (1 − 2 000 × 0,0619 % ÷ 4,91) = 587,52 €.
  it("CMG assistante maternelle — exemple Urssaf : 2 000 €, 160 h, 4,91 €/h → 587,52 €", () => {
    const r = calcAma(bareme, { ...base, tauxHoraireAma: 4.91, fraisAnnexesAma: 0 });
    expect(r.details.cmg).toBeCloseTo(587.52, 2);
  });

  // [CAF-PSU] Barème national des participations familiales 2026 : ressources de 814,62 € à
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

  // [SP-STRUCT] Montants majorés de 30 % (parent isolé), enfant de moins de 3 ans :
  // 1 289,77 € (tranche 1), 1 111,82 € (tranche 2), 933,94 € (tranche 3).
  it("Micro-crèche — parent isolé : 1 289,77 / 1 111,82 / 933,94 € (T1 / T2 / T3)", () => {
    const cas = (revenuMensuelNet: number) =>
      calcMicroCreche(bareme, {
        ...base,
        situation: "isole",
        revenuMensuelNet,
        heuresMois: 200,
        tarifMicroCreche: 10,
      }).aide;
    expect(cas(2700)).toBeCloseTo(1289.77, 2); // 32 400 €/an ≤ 34 066 € → T1 majorée
    expect(cas(4000)).toBeCloseTo(1111.82, 2); // 48 000 €/an ≤ 75 705 € → T2 majorée
    expect(cas(7000)).toBeCloseTo(933.94, 2); // 84 000 €/an > 75 705 € → T3 majorée
  });

  // [INSTR] §II.4.1 : la majoration de 30 % bénéficie aussi aux familles qui
  // perçoivent l'AEEH. Les seuils +40 % ne concernent que le parent isolé : un
  // couple AEEH garde les seuils « couple ».
  it("Micro-crèche — couple avec AEEH : montants majorés de 30 %, seuils couple", () => {
    const cas = (revenuMensuelNet: number, aeeh = true) =>
      calcMicroCreche(bareme, { ...base, aeeh, revenuMensuelNet, heuresMois: 200, tarifMicroCreche: 10 }).aide;
    expect(cas(1500)).toBeCloseTo(1289.77, 2); // 18 000 €/an → T1 majorée
    expect(cas(3000)).toBeCloseTo(1111.82, 2); // 36 000 €/an → T2 majorée
    expect(cas(6000)).toBeCloseTo(933.94, 2); // 72 000 €/an → T3 majorée
    expect(cas(2500)).toBeCloseTo(1111.82, 2); // 30 000 €/an > 24 333 € : seuil couple (pas +40 %)
    expect(cas(3000, false)).toBeCloseTo(855.25, 2); // sans AEEH : montant non majoré
  });

  // Une seule majoration de 30 % même si parent isolé ET AEEH (cumul non modélisé).
  it("Micro-crèche — parent isolé avec AEEH : une seule majoration de 30 %", () => {
    const r = calcMicroCreche(bareme, {
      ...base, situation: "isole", aeeh: true, revenuMensuelNet: 2700, heuresMois: 200, tarifMicroCreche: 10,
    });
    expect(r.aide).toBeCloseTo(1289.77, 2);
  });

  // [SP-STRUCT] Exemple officiel : couple, 28 000 € de revenus annuels, 1 enfant de
  // 3 ans, facture de 600 €/mois en micro-crèche → CMG de 427,63 € (= 855,25 ÷ 2,
  // tranche 2 : 24 333 < 28 000 ≤ 54 075). Avec une facture de 420 €/mois : 85 %
  // des dépenses dues, soit 357 €.
  it("Micro-crèche — exemple service-public : enfant de 3 ans, 600 € → 427,63 € ; 420 € → 357 €", () => {
    const cas = (heuresMois: number) =>
      calcMicroCreche(bareme, {
        ...base,
        revenuMensuelNet: 28000 / 12,
        agesGardes: [3],
        heuresMois,
        tarifMicroCreche: 10,
      });
    expect(cas(60).coutBrut).toBeCloseTo(600, 2);
    expect(cas(60).aide).toBeCloseTo(427.63, 2);
    expect(cas(42).coutBrut).toBeCloseTo(420, 2);
    expect(cas(42).aide).toBeCloseTo(357, 2);
  });

  // [SP-STRUCT] Seuils de revenus 2024 selon le nombre d'enfants à charge. Tranche 1
  // si revenu ≤ premier seuil, tranche 2 si ≤ second seuil, sinon tranche 3.
  describe("Micro-crèche — seuils par nombre d'enfants à charge", () => {
    const tranche = (situation: "couple" | "isole", nbEnfants: number, annuel: number) =>
      calcMicroCreche(bareme, {
        ...base,
        situation,
        nbEnfants,
        revenuMensuelNet: annuel / 12,
        heuresMois: 200,
        tarifMicroCreche: 10,
      }).details.tranche;

    const cas: [string, "couple" | "isole", number, number, number][] = [
      ["couple", "couple", 1, 24333, 54075],
      ["couple", "couple", 2, 27786, 61751],
      ["couple", "couple", 3, 31239, 69427],
      ["couple", "couple", 5, 34692 + 3453, 77103 + 7676], // 4 enfants + 1 supplémentaire
      ["isolé", "isole", 1, 34066, 75705],
      ["isolé", "isole", 2, 38900, 86451],
      ["isolé", "isole", 3, 43734, 97197],
      ["isolé", "isole", 5, 48568 + 4834, 107943 + 10746],
    ];
    for (const [nom, situation, n, s1, s2] of cas) {
      it(`${nom}, ${n} enfant(s) : ${s1} € → T1, ${s1 + 1} € → T2, ${s2} € → T2, ${s2 + 1} € → T3`, () => {
        expect(tranche(situation, n, s1)).toBe(1);
        expect(tranche(situation, n, s1 + 1)).toBe(2);
        expect(tranche(situation, n, s2)).toBe(2);
        expect(tranche(situation, n, s2 + 1)).toBe(3);
      });
    }
  });
});

describe("Règles officielles (caf.fr, Urssaf)", () => {
  it("CMG emploi direct : plus de montant maximum mensuel", () => {
    // Ressources au plancher CMG (821 €), 250 h à 8 €/h : l'ancien plafond de 825 € ne s'applique plus.
    const r = calcAma(bareme, {
      ...base,
      revenuMensuelNet: 800,
      heuresMois: 250,
      tauxHoraireAma: 8,
      fraisAnnexesAma: 0,
    });
    const attendu = 250 * 8 * (1 - (821 * 0.000619) / 4.91);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
    expect(r.details.cmg).toBeGreaterThan(825.16);
  });

  // [INSTR] §II.4.2 : plancher de ressources du CMG = 821 € (et non 814,62 €, qui
  // est le plancher PSU de la crèche). 500 € déclarés → 821 € retenus.
  // CMG = 785,60 × (1 − 821 × 0,000619 / 4,91) = 704,29 €.
  it("CMG AMA : ressources inférieures au plancher CMG (821 €) relevées à 821 € → 704,29 €", () => {
    const r = calcAma(bareme, { ...base, revenuMensuelNet: 500, tauxHoraireAma: 4.91, fraisAnnexesAma: 0 });
    const attendu = 4.91 * 160 * (1 - (821 * 0.000619) / 4.91);
    expect(attendu).toBeCloseTo(704.29, 2);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
  });

  it("CMG garde à domicile : même plancher de 821 € (taux doublé 0,1238 %, référence 10,50 €/h)", () => {
    // Coût total 18,90 €/h = 10,50 €/h net (facteur 1,8) ; ressources 500 € → 821 €.
    const r = calcDomicile(bareme, { ...base, revenuMensuelNet: 500, coutHoraireDomicile: 18.9 });
    const attendu = 160 * 10.5 * (1 - (821 * 0.001238) / 10.5);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
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

  // [SP-STRUCT] De 3 à 6 ans, c'est le MONTANT MAXIMUM qui est divisé par 2 :
  // aide = min(85 % × coût, forfait ÷ 2). Ici 2 000 € de facture : le forfait ÷ 2
  // (992,13 ÷ 2 = 496,07 €) borne l'aide ; avec 400 € de facture, 85 % (340 €) < forfait ÷ 2.
  it("Micro-crèche : forfait maximum divisé par deux entre 3 et 6 ans (pas l'aide calculée)", () => {
    const cas = (heuresMois: number) =>
      calcMicroCreche(bareme, { ...base, revenuMensuelNet: 1500, agesGardes: [4], heuresMois, tarifMicroCreche: 10 }).aide;
    expect(cas(200)).toBeCloseTo(992.13 / 2, 2);
    expect(cas(40)).toBeCloseTo(0.85 * 400, 2);
  });

  // [CAF-REFORME] Le plafond horaire (15,18 €/h) s'applique au tarif de chaque contrat
  // d'employeur, donc à la part de chaque famille en garde partagée.
  it("Garde partagée : plafond horaire appliqué par famille (36 €/h → 20 €/h net → 10 €/h par famille)", () => {
    const entree = { ...base, revenuMensuelNet: 3000, coutHoraireDomicile: 36, nbFamillesPartage: 2 };
    const r = calcDomicile(bareme, entree, true);
    // 10 €/h par famille < 15,18 € : aucun écrêtement (l'ancien calcul plafonnait le total net à 15,18 €).
    expect(r.details.coutMensuelGarde).toBeCloseTo(160 * 10, 2);
    const attendu = 160 * 10 * (1 - (3000 * 0.000619 * 2) / 10.5);
    expect(r.details.cmg).toBeCloseTo(attendu, 2);
  });

  it("Garde partagée : écrêtement par famille au-delà de 15,18 €/h par contrat", () => {
    // Coût total 100 €/h → net 55,56 €/h → 27,78 €/h par famille → écrêté à 15,18 €/h.
    const r = calcDomicile(bareme, { ...base, coutHoraireDomicile: 100 }, true);
    expect(r.details.coutMensuelGarde).toBeCloseTo(160 * 15.18, 2);
  });

  it("Garde à domicile non partagée : écrêtement à 15,18 €/h inchangé", () => {
    const r = calcDomicile(bareme, { ...base, coutHoraireDomicile: 36 });
    expect(r.details.coutMensuelGarde).toBeCloseTo(160 * 15.18, 2);
    const ok = calcDomicile(bareme, { ...base, coutHoraireDomicile: 18.9 });
    expect(ok.details.coutMensuelGarde).toBeCloseTo(160 * 10.5, 2);
  });
});
