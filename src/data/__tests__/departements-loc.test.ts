import { describe, it, expect } from "vitest";
import { PREPOSITION, deptLoc, deptLocCap } from "../departements-loc";
import departementsJson from "../departements.json";

const departements = departementsJson as Record<string, string>;

describe("locatif des départements", () => {
  it("aucun département n'est oublié (sinon repli « en » fautif sur une page indexée)", () => {
    const manquants = Object.keys(departements).filter((c) => !PREPOSITION[c]);
    expect(manquants).toEqual([]);
  });

  it("aucune entrée orpheline", () => {
    const orphelines = Object.keys(PREPOSITION).filter((c) => !departements[c]);
    expect(orphelines).toEqual([]);
  });

  it("les cas qui rendaient « en Nord », « en Paris », « en Orne » fautifs", () => {
    expect(deptLoc("59")).toBe("dans le Nord");
    expect(deptLoc("75")).toBe("à Paris");
    expect(deptLoc("61")).toBe("dans l'Orne");
    expect(deptLoc("78")).toBe("dans les Yvelines");
    expect(deptLoc("974")).toBe("à La Réunion");
  });

  it("« en » conservé là où il est correct", () => {
    expect(deptLoc("33")).toBe("en Gironde");
    expect(deptLoc("74")).toBe("en Haute-Savoie");
  });

  it("élision sans espace, autres prépositions avec espace", () => {
    for (const code of Object.keys(departements)) {
      const s = deptLoc(code);
      expect(s.endsWith(departements[code])).toBe(true);
      expect(s).not.toMatch(/'\s/);
      expect(s).toMatch(/^(en|à|dans (le|la|l'|les))/);
    }
  });

  it("capitalisation en début de phrase", () => {
    expect(deptLocCap("59")).toBe("Dans le Nord");
    expect(deptLocCap("33")).toBe("En Gironde");
    expect(deptLocCap("75")).toBe("À Paris");
  });
});
