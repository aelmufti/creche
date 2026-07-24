import { describe, it, expect } from "vitest";
import {
  CLASSEMENT_AMA,
  NB_DEPARTEMENTS,
  MOYENNE_AMA,
  DEPT_MIN,
  DEPT_MAX,
  rangAma,
  quartile,
  departementsComparables,
  basculesLocales,
} from "../departements-stats";
import { TARIFS_DEPARTEMENTS, TARIFS_NATIONAL } from "../../data/tarifs-locaux";

// Ces stats alimentent le texte des 100 pages département : une erreur ici
// produit des affirmations fausses (« 3ᵉ sur 100 ») sur du contenu indexé.

describe("classement national", () => {
  it("trié du plus cher au moins cher, sans doublon", () => {
    const taux = CLASSEMENT_AMA.map((d) => d.tauxHoraireAma);
    expect(taux).toEqual([...taux].sort((a, b) => b - a));
    expect(new Set(CLASSEMENT_AMA.map((d) => d.code)).size).toBe(NB_DEPARTEMENTS);
  });

  it("ne retient que les départements ayant une donnée locale réelle", () => {
    expect(NB_DEPARTEMENTS).toBeGreaterThan(0);
    expect(NB_DEPARTEMENTS).toBeLessThanOrEqual(Object.keys(TARIFS_DEPARTEMENTS).length);
    for (const d of CLASSEMENT_AMA) {
      expect(TARIFS_DEPARTEMENTS[d.code]).toBeDefined();
    }
  });

  it("moyenne observée encadrée par les extrêmes", () => {
    expect(MOYENNE_AMA).toBeGreaterThan(DEPT_MIN.tauxHoraireAma);
    expect(MOYENNE_AMA).toBeLessThan(DEPT_MAX.tauxHoraireAma);
  });
});

describe("rangAma", () => {
  it("le plus cher est 1ᵉ, le moins cher est dernier", () => {
    expect(rangAma(DEPT_MAX.code)).toBe(1);
    expect(rangAma(DEPT_MIN.code)).toBe(NB_DEPARTEMENTS);
  });

  it("tous les rangs sont dans [1, NB_DEPARTEMENTS] et distincts", () => {
    const rangs = CLASSEMENT_AMA.map((d) => rangAma(d.code));
    expect(new Set(rangs).size).toBe(NB_DEPARTEMENTS);
    expect(Math.min(...rangs)).toBe(1);
    expect(Math.max(...rangs)).toBe(NB_DEPARTEMENTS);
  });

  it("département sans donnée locale → 0 (pas de rang inventé)", () => {
    expect(rangAma("00")).toBe(0);
  });
});

describe("quartile", () => {
  it("extrêmes dans les quartiles attendus", () => {
    expect(quartile(DEPT_MAX.code)).toBe(1);
    expect(quartile(DEPT_MIN.code)).toBe(4);
  });

  it("toujours entre 1 et 4, et croissant avec le rang", () => {
    let precedent = 0;
    for (const d of CLASSEMENT_AMA) {
      const q = quartile(d.code);
      expect(q).toBeGreaterThanOrEqual(1);
      expect(q).toBeLessThanOrEqual(4);
      expect(q).toBeGreaterThanOrEqual(precedent);
      precedent = q;
    }
  });

  it("les 4 quartiles sont représentés", () => {
    expect(new Set(CLASSEMENT_AMA.map((d) => quartile(d.code))).size).toBe(4);
  });
});

describe("departementsComparables (maillage latéral)", () => {
  it("exclut le département lui-même et respecte n", () => {
    const c = departementsComparables(DEPT_MAX.code, 4);
    expect(c).toHaveLength(4);
    expect(c.some((d) => d.code === DEPT_MAX.code)).toBe(false);
  });

  it("classés par écart croissant au tarif de référence", () => {
    const ref = CLASSEMENT_AMA[Math.floor(NB_DEPARTEMENTS / 2)];
    const ecarts = departementsComparables(ref.code, 6).map((d) =>
      Math.abs(d.tauxHoraireAma - ref.tauxHoraireAma),
    );
    expect(ecarts).toEqual([...ecarts].sort((a, b) => a - b));
  });

  it("les liens pointent vers des slugs de pages réellement générées", () => {
    const slugsGeneres = new Set(CLASSEMENT_AMA.map((d) => d.slug));
    for (const d of departementsComparables(DEPT_MIN.code)) {
      expect(slugsGeneres.has(d.slug)).toBe(true);
    }
  });

  it("département sans donnée locale → aucun comparable", () => {
    expect(departementsComparables("00")).toEqual([]);
  });
});

describe("basculesLocales (seuils de revenu où le verdict change)", () => {
  const tarifsDe = (code: string) => ({ ...TARIFS_NATIONAL, ...TARIFS_DEPARTEMENTS[code] });

  it("seuils croissants et chaînés (le gagnant d'après devient le gagnant d'avant)", () => {
    for (const code of [DEPT_MAX.code, DEPT_MIN.code]) {
      const b = basculesLocales(tarifsDe(code));
      for (let i = 1; i < b.length; i++) {
        expect(b[i].revenu).toBeGreaterThan(b[i - 1].revenu);
        expect(b[i].avant).toBe(b[i - 1].apres);
      }
      for (const x of b) expect(x.avant).not.toBe(x.apres);
    }
  });

  it("le seuil dépend réellement des tarifs locaux (sinon la section serait dupliquée)", () => {
    const cher = basculesLocales(tarifsDe(DEPT_MAX.code));
    const pasCher = basculesLocales(tarifsDe(DEPT_MIN.code));
    expect(cher.length + pasCher.length).toBeGreaterThan(0);
    expect(JSON.stringify(cher)).not.toBe(JSON.stringify(pasCher));
  });

  it("reste dans la plage balayée", () => {
    const b = basculesLocales(tarifsDe(DEPT_MAX.code), { min: 2000, max: 5000, pas: 100 });
    for (const x of b) {
      expect(x.revenu).toBeGreaterThan(2000);
      expect(x.revenu).toBeLessThanOrEqual(5000);
    }
  });
});
