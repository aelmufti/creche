import { describe, it, expect } from "vitest";
import { bareme } from "../bareme";
import { calcAma, calcCreche, calcMicroCreche } from "../calc";
import type { Inputs } from "../types";

// Fixtures officielles (§9.1) — DOIVENT passer. C'est le critère de correction
// du moteur. Tolérance ≤ 1 € (cross-validation simulateurs officiels, §9.2).

const base: Inputs = {
  revenuMensuelNet: 2000,
  situation: "couple",
  nbEnfants: 1,
  agesGardes: [1],
  heuresMois: 160,
};

describe("Golden cases (§9.1)", () => {
  it("CMG emploi direct AMA : 2000 €, 160 h, 4,85 €/h, 1 enfant → 577,92 €", () => {
    const r = calcAma(bareme, {
      ...base,
      revenuMensuelNet: 2000,
      heuresMois: 160,
      tauxHoraireAma: 4.85,
      nbEnfants: 1,
    });
    expect(r.details.cmg).toBeCloseTo(577.92, 2);
  });

  it("Crèche PSU : 4000 €, 2 enfants → tarif horaire 2,06 €/h", () => {
    const r = calcCreche(bareme, { ...base, revenuMensuelNet: 4000, nbEnfants: 2 });
    expect(r.details.tarifHoraire).toBeCloseTo(2.06, 2);
  });

  it("Crèche PSU : parent isolé 1 enfant, 2000 €, 180 h → ≈ 223 €/mois", () => {
    const r = calcCreche(bareme, {
      ...base,
      situation: "isole",
      revenuMensuelNet: 2000,
      nbEnfants: 1,
      heuresMois: 180,
      participationEmployeur: 0,
    });
    expect(r.coutBrut).toBeCloseTo(223, 0);
  });

  it("Micro-crèche T1 < 3 ans → aide plafonnée au forfait 992,13 €/mois", () => {
    const r = calcMicroCreche(bareme, {
      ...base,
      revenuMensuelNet: 1500, // < 22 691 €/an → T1
      agesGardes: [1],
      heuresMois: 200,
      tarifMicroCreche: 10,
    });
    expect(r.aide).toBeCloseTo(992.13, 2);
  });
});
