import { describe, it, expect } from "vitest";
import {
  CLASSEMENT_VILLES,
  NB_VILLES,
  VILLE_MIN,
  VILLE_MAX,
  rangVille,
  reperes,
  voisinesClassement,
  villesMemeDept,
} from "../villes-stats";
import { VILLES } from "../../data/villes";

describe("classement des grandes villes", () => {
  it("couvre toutes les villes du lot curaté, trié du plus cher au moins cher", () => {
    expect(NB_VILLES).toBe(VILLES.length);
    const couts = CLASSEMENT_VILLES.map((v) => v.coutAma);
    expect(couts).toEqual([...couts].sort((a, b) => b - a));
  });

  it("les extrêmes encadrent toutes les villes", () => {
    for (const v of CLASSEMENT_VILLES) {
      expect(v.coutAma).toBeLessThanOrEqual(VILLE_MAX.coutAma);
      expect(v.coutAma).toBeGreaterThanOrEqual(VILLE_MIN.coutAma);
    }
  });

  it("les liens pointent vers les slugs département/ville réellement générés", () => {
    for (const v of CLASSEMENT_VILLES) {
      expect(v.slug).toMatch(/^[a-z0-9-]+$/);
      expect(v.deptSlug).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

describe("rangVille (ex aequo)", () => {
  it("deux villes au même coût partagent le même rang", () => {
    for (const a of CLASSEMENT_VILLES) {
      for (const b of CLASSEMENT_VILLES) {
        if (a.coutAma === b.coutAma) expect(rangVille(a.nom)).toBe(rangVille(b.nom));
      }
    }
  });

  it("les villes d'un même département ont le même coût, donc le même rang", () => {
    for (const v of CLASSEMENT_VILLES) {
      for (const autre of villesMemeDept(v.nom)) {
        expect(autre.coutAma).toBe(v.coutAma);
        expect(rangVille(autre.nom)).toBe(rangVille(v.nom));
      }
    }
  });

  it("ville inconnue → 0", () => {
    expect(rangVille("Trifouillis")).toBe(0);
  });
});

describe("reperes (comparaisons strictes)", () => {
  // Le bug évité ici : comparer à la voisine de CLASSEMENT produisait
  // « Villeurbanne, moins chère que Lyon » alors que les deux villes ont
  // exactement le même coût (même base tarifaire départementale).
  it("plusChere est strictement plus chère, moinsChere strictement moins chère", () => {
    for (const v of CLASSEMENT_VILLES) {
      const { plusChere, moinsChere } = reperes(v.nom);
      if (plusChere) expect(plusChere.coutAma).toBeGreaterThan(v.coutAma);
      if (moinsChere) expect(moinsChere.coutAma).toBeLessThan(v.coutAma);
    }
  });

  it("ce sont les repères les plus proches, sans trou", () => {
    const v = CLASSEMENT_VILLES[Math.floor(NB_VILLES / 2)];
    const { plusChere, moinsChere } = reperes(v.nom);
    const entreDeux = CLASSEMENT_VILLES.filter(
      (o) => o.coutAma > v.coutAma && o.coutAma < plusChere!.coutAma,
    );
    expect(entreDeux).toEqual([]);
    const enDessous = CLASSEMENT_VILLES.filter(
      (o) => o.coutAma < v.coutAma && o.coutAma > moinsChere!.coutAma,
    );
    expect(enDessous).toEqual([]);
  });

  it("les extrêmes n'ont pas de repère au-delà d'eux-mêmes", () => {
    expect(reperes(VILLE_MAX.nom).plusChere).toBeNull();
    expect(reperes(VILLE_MIN.nom).moinsChere).toBeNull();
  });

  it("exAequo ne contient jamais la ville elle-même et n'a que des coûts égaux", () => {
    for (const v of CLASSEMENT_VILLES) {
      for (const e of reperes(v.nom).exAequo) {
        expect(e.nom).not.toBe(v.nom);
        expect(e.coutAma).toBe(v.coutAma);
      }
    }
  });
});

describe("voisinesClassement (extrait de tableau)", () => {
  it("n'inclut pas la ville elle-même et respecte l'ordre du classement", () => {
    const v = CLASSEMENT_VILLES[10];
    const { avant, apres } = voisinesClassement(v.nom);
    expect([...avant, ...apres].some((x) => x.nom === v.nom)).toBe(false);
    for (const a of avant) expect(a.coutAma).toBeGreaterThanOrEqual(v.coutAma);
    for (const a of apres) expect(a.coutAma).toBeLessThanOrEqual(v.coutAma);
  });

  it("la ville la plus chère n'a pas de voisine au-dessus", () => {
    expect(voisinesClassement(VILLE_MAX.nom).avant).toEqual([]);
  });

  it("les ex aequo restent dans l'extrait (découpage par index, pas par rang)", () => {
    // Régression : découper par rang faisait disparaître Lyon du tableau de
    // Villeurbanne et affichait Villeurbanne deux fois.
    for (const v of CLASSEMENT_VILLES) {
      const { avant, apres } = voisinesClassement(v.nom);
      const noms = [...avant, v, ...apres].map((x) => x.nom);
      expect(new Set(noms).size).toBe(noms.length);
      const i = CLASSEMENT_VILLES.findIndex((x) => x.nom === v.nom);
      expect(noms).toEqual(
        CLASSEMENT_VILLES.slice(Math.max(0, i - 2), i + 3).map((x) => x.nom),
      );
    }
  });
});
