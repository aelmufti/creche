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

describe("tarifsLocaux", () => {
  it("département reconnu → tarifs nationaux indicatifs (pas de source locale pour l'instant)", () => {
    const r = tarifsLocaux("75004");
    expect(r.dept?.nom).toBe("Paris");
    expect(r.inconnu).toBe(false);
    expect(r.tarifsSources).toBe(false);
    expect(r.tarifs).toEqual(TARIFS_NATIONAL);
  });

  it("code postal 5 chiffres introuvable → repli national + drapeau inconnu", () => {
    const r = tarifsLocaux("00000");
    expect(r.dept).toBeNull();
    expect(r.inconnu).toBe(true);
    expect(r.tarifs).toEqual(TARIFS_NATIONAL);
  });

  it("pas de code postal → repli national sans drapeau inconnu", () => {
    const r = tarifsLocaux(undefined);
    expect(r.dept).toBeNull();
    expect(r.inconnu).toBe(false);
    expect(r.tarifs).toEqual(TARIFS_NATIONAL);
  });
});
