import { describe, it, expect } from "vitest";
import { bareme } from "../bareme";
import { comparer } from "../compare";
import { calcAma, calcCreche, calcDomicile, calcMicroCreche } from "../calc";
import type { Inputs } from "../types";

// Invariants property-based (§9.4) + cas limites (§9.3).

const scenarios: Inputs[] = [];
for (const revenuMensuelNet of [500, 814.62, 1500, 3000, 6000, 9000, 12000]) {
  for (const heuresMois of [0, 80, 160, 200, 250]) {
    for (const nbEnfants of [1, 2, 3, 5]) {
      for (const agesGardes of [[1], [4], [1, 1], [1, 4], [2, 3, 5]]) {
        // On ne peut pas garder plus d'enfants qu'on n'en a à charge.
        if (agesGardes.length > nbEnfants) continue;
        scenarios.push({ revenuMensuelNet, situation: "couple", nbEnfants, agesGardes, heuresMois });
      }
    }
  }
}

describe("Invariants (§9.4)", () => {
  it("coût net réel ≥ 0 pour tous les modes et scénarios", () => {
    for (const s of scenarios) {
      for (const r of comparer(s, bareme).results) {
        expect(r.netReel, `${r.mode} @ ${JSON.stringify(s)}`).toBeGreaterThanOrEqual(-0.001);
      }
    }
  });

  it("aide ≤ coût brut (on ne gagne pas d'argent à faire garder)", () => {
    for (const s of scenarios) {
      for (const r of comparer(s, bareme).results) {
        expect(r.aide, `${r.mode} @ ${JSON.stringify(s)}`).toBeLessThanOrEqual(r.coutBrut + 0.001);
      }
    }
  });

  it("crédit d'impôt ≤ plafond annuel applicable", () => {
    for (const s of scenarios) {
      const nbGardes = s.agesGardes.length;
      for (const r of comparer(s, bareme).results) {
        // Domicile/partagée : plafond foyer unique. Modes par place : plafond PAR enfant.
        const plafond =
          r.mode === "domicile" || r.mode === "partagee"
            ? bareme.credit_impot.emploi_domicile.plafond_max
            : bareme.credit_impot.frais_garde.plafond_par_enfant * nbGardes;
        expect(r.creditImpotAnnuel).toBeLessThanOrEqual(0.5 * plafond + 0.001);
      }
    }
  });

  it("monotonie : plus de revenus ⇒ tarif crèche ≥ (jamais décroissant)", () => {
    let prev = -1;
    for (const revenuMensuelNet of [500, 1000, 2000, 4000, 8000, 10000]) {
      const r = comparer(
        { revenuMensuelNet, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 160 },
        bareme,
      );
      const tarif = r.results.find((x) => x.mode === "creche")!.details.tarifHoraire;
      expect(tarif).toBeGreaterThanOrEqual(prev - 0.0001);
      prev = tarif;
    }
  });

  it("monotonie : plus de revenus ⇒ CMG AMA ≤ (jamais croissant)", () => {
    let prev = Infinity;
    for (const revenuMensuelNet of [1000, 2000, 4000, 6000, 9000]) {
      const r = comparer(
        { revenuMensuelNet, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 160, tauxHoraireAma: 4.85 },
        bareme,
      );
      const cmg = r.results.find((x) => x.mode === "ama")!.details.cmg;
      expect(cmg).toBeLessThanOrEqual(prev + 0.0001);
      prev = cmg;
    }
  });

  it("classement stable : un gagnant défini et un écart ≥ 0", () => {
    for (const s of scenarios) {
      const c = comparer(s, bareme);
      expect(c.gagnant).toBeDefined();
      expect(c.ecartAuSuivant).toBeGreaterThanOrEqual(-0.001);
    }
  });
});

describe("Cas limites (§9.3)", () => {
  it("0 heure → coûts nuls partout", () => {
    const c = comparer(
      { revenuMensuelNet: 3000, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 0 },
      bareme,
    );
    for (const r of c.results) expect(r.coutBrut).toBeCloseTo(0, 5);
  });

  it("revenu sous plancher → clampé à 814,62 €", () => {
    const r = comparer(
      { revenuMensuelNet: 100, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 160 },
      bareme,
    ).results.find((x) => x.mode === "creche")!;
    expect(r.details.ressourcesRetenues).toBeCloseTo(bareme.ressources.plancher, 2);
  });

  it("revenu au-dessus plafond → clampé à 8 500 €", () => {
    const r = comparer(
      { revenuMensuelNet: 20000, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 160 },
      bareme,
    ).results.find((x) => x.mode === "creche")!;
    expect(r.details.ressourcesRetenues).toBeCloseTo(bareme.ressources.plafond, 2);
  });

  it("micro-crèche : enfant ≥ 3 ans → aide divisée par 2", () => {
    const young = calcMicroCreche(bareme, {
      revenuMensuelNet: 1500, situation: "couple", nbEnfants: 1, agesGardes: [1], heuresMois: 200, tarifMicroCreche: 10,
    });
    const old = calcMicroCreche(bareme, {
      revenuMensuelNet: 1500, situation: "couple", nbEnfants: 1, agesGardes: [4], heuresMois: 200, tarifMicroCreche: 10,
    });
    expect(old.aide).toBeCloseTo(young.aide / 2, 2);
  });
});

describe("Multi-enfants gardés (§6.7 v2)", () => {
  const deux = (agesGardes: number[]): Inputs => ({
    revenuMensuelNet: 3000,
    situation: "couple",
    nbEnfants: 2,
    agesGardes,
    heuresMois: 160,
    tauxHoraireAma: 4.85,
    coutHoraireDomicile: 17.5,
    tarifMicroCreche: 10,
  });

  it("modes par place : 2 enfants → coût ≈ 2× celui d'un enfant (à charge constant)", () => {
    for (const calc of [calcCreche, calcMicroCreche, calcAma]) {
      const c1 = calc(bareme, deux([1])); // nbEnfants=2, 1 seul gardé
      const c2 = calc(bareme, deux([1, 1])); // nbEnfants=2, 2 gardés
      expect(c2.coutBrut).toBeCloseTo(c1.coutBrut * 2, 1);
    }
  });

  it("garde à domicile : coût NON multiplié par le nombre d'enfants (un seul intervenant)", () => {
    const un = calcDomicile(bareme, deux([1]));
    const deuxEnfants = calcDomicile(bareme, deux([1, 1]));
    expect(deuxEnfants.coutBrut).toBeCloseTo(un.coutBrut, 1);
  });

  it("crédit frais de garde plafonné PAR enfant (2 enfants → plafond doublé possible)", () => {
    const c = comparer(deux([1, 1]), bareme).results.find((x) => x.mode === "ama")!;
    const plafond1Enfant = 0.5 * bareme.credit_impot.frais_garde.plafond_par_enfant;
    // Avec 2 enfants le crédit peut dépasser le plafond d'un seul enfant.
    expect(c.creditImpotAnnuel).toBeLessThanOrEqual(2 * plafond1Enfant + 0.001);
  });

  it("micro-crèche : 1 bébé + 1 enfant de 4 ans → aide = aide_bébé + aide_4ans/2", () => {
    const bebe = calcMicroCreche(bareme, { ...deux([1]), nbEnfants: 2 });
    const grand = calcMicroCreche(bareme, { ...deux([4]), nbEnfants: 2 });
    const mixte = calcMicroCreche(bareme, deux([1, 4]));
    expect(mixte.aide).toBeCloseTo(bebe.aide + grand.aide, 2);
  });
});
