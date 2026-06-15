import { describe, it, expect } from "vitest";
import {
  TARIFS_NATIONAL,
  departementDuCodePostal,
  tarifsLocaux,
} from "../tarifs-locaux";

// Données géographiques officielles (geo.api.gouv.fr / INSEE).

describe("departementDuCodePostal (base officielle INSEE)", () => {
  it("Paris", () => {
    expect(departementDuCodePostal("75004")).toEqual({ code: "75", nom: "Paris" });
    expect(departementDuCodePostal("75011")).toEqual({ code: "75", nom: "Paris" });
  });

  it("préfixe trompeur : 42620 est en Loire (pas l'inverse), pas un mapping naïf", () => {
    // 42620 couvre Loire ET Allier ; arbitré par population → Loire.
    expect(departementDuCodePostal("42620")?.code).toBe("42");
  });

  it("Corse : 2A / 2B distingués (pas '20')", () => {
    expect(departementDuCodePostal("20000")).toEqual({ code: "2A", nom: "Corse-du-Sud" });
    expect(departementDuCodePostal("20200")).toEqual({ code: "2B", nom: "Haute-Corse" });
  });

  it("DOM", () => {
    expect(departementDuCodePostal("97400")?.nom).toBe("La Réunion");
  });

  it("vide / invalide / introuvable → null", () => {
    expect(departementDuCodePostal(undefined)).toBeNull();
    expect(departementDuCodePostal("abc")).toBeNull();
    expect(departementDuCodePostal("00000")).toBeNull();
  });

  it("collectivités d'outre-mer (Saint-Martin 97150) → null (pas un département)", () => {
    expect(departementDuCodePostal("97150")).toBeNull();
  });
});

describe("tarifsLocaux (tarifs réels URSSAF par département)", () => {
  it("département reconnu → tarifs locaux sourcés, complétés par le national", () => {
    const r = tarifsLocaux("75004");
    expect(r.dept?.nom).toBe("Paris");
    expect(r.inconnu).toBe(false);
    expect(r.tarifsSources).toBe(true);
    expect(r.tarifs.tauxHoraireAma).toBeGreaterThan(0);
    expect(r.tarifs.coutHoraireDomicile).toBeGreaterThan(0);
    // tarif micro-crèche non couvert par dépt → vient du national.
    expect(r.tarifs.tarifMicroCreche).toBe(TARIFS_NATIONAL.tarifMicroCreche);
  });

  it("le code postal change concrètement les tarifs d'un département à l'autre", () => {
    const corse = tarifsLocaux("20000").tarifs.tauxHoraireAma; // Corse-du-Sud
    const nord = tarifsLocaux("59000").tarifs.tauxHoraireAma; // Nord
    expect(corse).not.toBe(nord);
  });

  it("code postal 5 chiffres introuvable → repli national + drapeau inconnu", () => {
    const r = tarifsLocaux("00000");
    expect(r.dept).toBeNull();
    expect(r.inconnu).toBe(true);
    expect(r.tarifsSources).toBe(false);
    expect(r.tarifs).toEqual(TARIFS_NATIONAL);
  });

  it("pas de code postal → repli national sans drapeau inconnu", () => {
    const r = tarifsLocaux(undefined);
    expect(r.dept).toBeNull();
    expect(r.inconnu).toBe(false);
    expect(r.tarifs).toEqual(TARIFS_NATIONAL);
  });
});
