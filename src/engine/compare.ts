import type { Bareme, ComparisonResult, Inputs, ModeResult } from "./types";
import { bareme as defaultBareme } from "./bareme";
import { calcAma, calcCreche, calcDomicile, calcMicroCreche } from "./calc";

/**
 * Calcule les 5 modes et rend le verdict : classement par coût net réel mensuel,
 * gagnant + écart € avec le suivant (§11). Fonction pure.
 */
export function comparer(i: Inputs, b: Bareme = defaultBareme): ComparisonResult {
  const results: ModeResult[] = [
    calcCreche(b, i),
    calcMicroCreche(b, i),
    calcAma(b, i),
    calcDomicile(b, i, false),
    calcDomicile(b, i, true),
  ];

  const classement = [...results].sort((a, z) => a.netReel - z.netReel);
  const gagnant = classement[0];
  const ecartAuSuivant =
    classement.length > 1 ? classement[1].netReel - classement[0].netReel : 0;

  return { results, classement, gagnant, ecartAuSuivant };
}
