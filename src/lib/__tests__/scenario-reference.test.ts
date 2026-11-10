import { describe, expect, it } from "vitest";
import { comparer, inputsParDefaut } from "../../engine";
import { TARIFS_NATIONAL } from "../../data/tarifs-locaux";
import { comparaisonParDefaut, inputsReference, resoudreInputs, TARIFS_REFERENCE } from "../scenario-reference";

describe("scénario de référence", () => {
  it("donne exactement la comparaison du calculateur au premier rendu", () => {
    expect(comparer(inputsReference)).toEqual(comparer(resoudreInputs(inputsParDefaut)));
    expect(comparaisonParDefaut()).toEqual(comparer(resoudreInputs(inputsParDefaut)));
  });

  it("utilise les tarifs nationaux Urssaf", () => {
    expect(inputsReference.tauxHoraireAma).toBe(TARIFS_NATIONAL.tauxHoraireAma);
    expect(inputsReference.coutHoraireDomicile).toBe(TARIFS_NATIONAL.coutHoraireDomicile);
    expect(inputsReference.tarifMicroCreche).toBe(TARIFS_NATIONAL.tarifMicroCreche);
    expect(TARIFS_REFERENCE.tauxHoraireAma).toBe(TARIFS_NATIONAL.tauxHoraireAma);
  });
});
