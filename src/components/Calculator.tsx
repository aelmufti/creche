import { useEffect, useMemo, useState } from "react";
import { comparer, decodeInputs, encodeInputs, inputsParDefaut, type Inputs } from "../engine";
import { defauts } from "../engine/bareme";
import { SOURCE_TARIFS, tarifsLocaux } from "../data/tarifs-locaux";
import { Field, NumberInput, Segmented, Slider, Toggle } from "./ui";
import { ResultsPanel } from "./ResultsPanel";

export function Calculator() {
  // SSR : on part des valeurs par défaut (rendu déterministe, pas de window).
  const [inputs, setInputs] = useState<Inputs>(inputsParDefaut);
  const [hydrated, setHydrated] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copied, setCopied] = useState(false);

  // Au montage client : hydrate l'état depuis l'URL (scénario partagé, §11).
  useEffect(() => {
    setInputs(decodeInputs(window.location.search));
    setHydrated(true);
  }, []);

  // Synchronise l'état dans l'URL — seulement après hydratation, pour ne pas
  // écraser les paramètres partagés au premier rendu.
  useEffect(() => {
    if (!hydrated) return;
    const q = encodeInputs(inputs);
    const url = q ? `${window.location.pathname}?${q}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [inputs, hydrated]);

  // Pré-remplissage local (§10/§14) : les champs avancés NON modifiés par
  // l'utilisateur (undefined) prennent la valeur indicative du département.
  const local = useMemo(() => tarifsLocaux(inputs.codePostal), [inputs.codePostal]);
  const tauxAma = inputs.tauxHoraireAma ?? local.tarifs.tauxHoraireAma;
  const coutDom = inputs.coutHoraireDomicile ?? local.tarifs.coutHoraireDomicile;
  const tarifMicro = inputs.tarifMicroCreche ?? local.tarifs.tarifMicroCreche;
  const sourceTarif =
    local.tarifsSources && local.dept ? local.dept.nom : "national indicatif";

  // Le moteur reçoit les valeurs résolues (locales pour les champs intacts).
  const resolved = useMemo<Inputs>(
    () => ({
      ...inputs,
      tauxHoraireAma: tauxAma,
      coutHoraireDomicile: coutDom,
      tarifMicroCreche: tarifMicro,
    }),
    [inputs, tauxAma, coutDom, tarifMicro],
  );

  const comparison = useMemo(() => comparer(resolved), [resolved]);

  const resetTarifsLocaux = () =>
    setInputs((prev) => ({
      ...prev,
      tauxHoraireAma: undefined,
      coutHoraireDomicile: undefined,
      tarifMicroCreche: undefined,
    }));

  const aDesOverrides =
    inputs.tauxHoraireAma !== undefined ||
    inputs.coutHoraireDomicile !== undefined ||
    inputs.tarifMicroCreche !== undefined;

  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const setNbEnfants = (n: number) =>
    setInputs((prev) => {
      const nb = Math.max(1, Math.min(8, Math.round(n)));
      // On ne peut pas garder plus d'enfants qu'on n'en a à charge.
      const ages = prev.agesGardes.slice(0, nb);
      return { ...prev, nbEnfants: nb, agesGardes: ages.length ? ages : [1] };
    });

  const setAge = (index: number, age: number) =>
    setInputs((prev) => {
      const ages = [...prev.agesGardes];
      ages[index] = Math.max(0, Math.min(6, Math.round(age)));
      return { ...prev, agesGardes: ages };
    });

  const addEnfantGarde = () =>
    setInputs((prev) =>
      prev.agesGardes.length >= prev.nbEnfants
        ? prev
        : { ...prev, agesGardes: [...prev.agesGardes, 1] },
    );

  const removeEnfantGarde = () =>
    setInputs((prev) =>
      prev.agesGardes.length <= 1
        ? prev
        : { ...prev, agesGardes: prev.agesGardes.slice(0, -1) },
    );

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard indisponible */
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Formulaire */}
      <form className="card-brutal flex flex-col gap-5 p-5" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-lg font-extrabold uppercase tracking-brutal">Votre situation</h2>

        <Field label="Revenu net mensuel du foyer" htmlFor="revenu" hint="Revenus nets catégoriels N-2 (2024) / 12.">
          <NumberInput id="revenu" value={inputs.revenuMensuelNet} onChange={(n) => set("revenuMensuelNet", n)} min={0} step={100} suffix="€" />
          <Slider value={inputs.revenuMensuelNet} onChange={(n) => set("revenuMensuelNet", n)} min={0} max={12000} step={100} ariaLabel="Revenu net mensuel" />
        </Field>

        <Field label="Situation" htmlFor="situation">
          <Segmented
            ariaLabel="Situation familiale"
            value={inputs.situation}
            onChange={(v) => set("situation", v)}
            options={[
              { value: "couple", label: "Couple" },
              { value: "isole", label: "Parent isolé" },
            ]}
          />
        </Field>

        <Field
          label="Enfants à charge dans le foyer"
          htmlFor="nbEnfants"
          hint="Détermine le taux d'effort CNAF (plus d'enfants = garde moins chère)."
        >
          <NumberInput id="nbEnfants" value={inputs.nbEnfants} onChange={setNbEnfants} min={1} max={8} />
        </Field>

        <Field
          label="Enfants en garde"
          hint="Crèche/micro-crèche/assistante maternelle : coût par enfant. Garde à domicile : un seul intervenant pour tous."
        >
          <div className="flex flex-col gap-2">
            {inputs.agesGardes.map((age, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-8 w-8 flex-none items-center justify-center border-[3px] border-border bg-muted text-xs font-bold">
                  {idx + 1}
                </span>
                <label htmlFor={`age-${idx}`} className="flex-none text-sm font-bold">
                  Âge
                </label>
                <div className="flex-1">
                  <NumberInput
                    id={`age-${idx}`}
                    value={age}
                    onChange={(n) => setAge(idx, n)}
                    min={0}
                    max={6}
                    suffix="ans"
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={removeEnfantGarde}
                disabled={inputs.agesGardes.length <= 1}
                className="btn-brutal flex-1 bg-card px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="Retirer un enfant en garde"
              >
                − Enfant
              </button>
              <button
                type="button"
                onClick={addEnfantGarde}
                disabled={inputs.agesGardes.length >= inputs.nbEnfants}
                className="btn-brutal flex-1 bg-card px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="Ajouter un enfant en garde"
              >
                + Enfant
              </button>
            </div>
          </div>
        </Field>

        <Field label="Heures de garde / mois" htmlFor="heures">
          <NumberInput id="heures" value={inputs.heuresMois} onChange={(n) => set("heuresMois", n)} min={0} max={300} suffix="h" />
          <Slider value={inputs.heuresMois} onChange={(n) => set("heuresMois", n)} min={0} max={300} step={5} ariaLabel="Heures de garde par mois" />
        </Field>

        <Field label="Code postal (optionnel)" htmlFor="cp" hint="Pré-remplit les tarifs typiques de votre département (modifiables).">
          <input
            id="cp"
            type="text"
            inputMode="numeric"
            maxLength={5}
            value={inputs.codePostal ?? ""}
            onChange={(e) => set("codePostal", e.target.value.replace(/\D/g, ""))}
            className="border-[3px] border-border bg-card px-3 py-2 font-bold shadow-brutal-sm outline-none"
            placeholder="75011"
          />
          {local.dept && (
            <p className="mt-1 border-l-[3px] border-l-accent bg-accent/10 px-2 py-1 text-[11px] font-bold">
              Département : {local.dept.nom} ({local.dept.code}).{" "}
              {local.tarifsSources
                ? `Salaires assistante maternelle & garde à domicile pré-remplis (URSSAF ${SOURCE_TARIFS.annee}, modifiables).`
                : "Tarifs nationaux indicatifs (pas de données locales)."}
            </p>
          )}
          {local.inconnu && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Code postal introuvable : tarifs nationaux indicatifs appliqués.
            </p>
          )}
        </Field>

        <button
          type="button"
          onClick={() => setShowAdvanced((s) => !s)}
          className="btn-brutal bg-card px-4 py-2 text-sm"
          aria-expanded={showAdvanced}
        >
          {showAdvanced ? "− Masquer" : "+ Options avancées"}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-5 border-t-[3px] border-border pt-5">
            {aDesOverrides && (
              <button
                type="button"
                onClick={resetTarifsLocaux}
                className="btn-brutal self-start bg-card px-3 py-1.5 text-xs"
              >
                ↺ Réinitialiser (tarifs {sourceTarif})
              </button>
            )}
            <Field label="Taux horaire assistante maternelle" htmlFor="ta" hint={`${sourceTarif} : ${tauxAma} €/h net`}>
              <NumberInput id="ta" value={tauxAma} onChange={(n) => set("tauxHoraireAma", n)} step={0.1} suffix="€/h" />
            </Field>
            <Field label="Frais annexes AMA (repas, entretien)" htmlFor="fa" hint="Mensuel, indicatif.">
              <NumberInput id="fa" value={inputs.fraisAnnexesAma ?? defauts.fraisAnnexesAma} onChange={(n) => set("fraisAnnexesAma", n)} step={5} suffix="€" />
            </Field>
            <Field label="Coût horaire garde à domicile" htmlFor="cd" hint={`Total employeur. ${sourceTarif} : ${coutDom} €/h`}>
              <NumberInput id="cd" value={coutDom} onChange={(n) => set("coutHoraireDomicile", n)} step={0.5} suffix="€/h" />
            </Field>
            <Field label="Tarif micro-crèche" htmlFor="tm" hint={`Plafonné à 10 €/h pour l'aide. ${sourceTarif} : ${tarifMicro} €/h`}>
              <NumberInput id="tm" value={tarifMicro} onChange={(n) => set("tarifMicroCreche", n)} step={0.5} suffix="€/h" />
            </Field>
            <Field label="Participation employeur / CESU" htmlFor="pe" hint="Mensuel. Réduit le reste à charge avant crédit d'impôt.">
              <NumberInput id="pe" value={inputs.participationEmployeur ?? 0} onChange={(n) => set("participationEmployeur", n)} step={10} suffix="€" />
            </Field>
            <Field label="Familles en garde partagée" htmlFor="nf">
              <NumberInput id="nf" value={inputs.nbFamillesPartage ?? 2} onChange={(n) => set("nbFamillesPartage", Math.max(2, Math.round(n)))} min={2} max={3} />
            </Field>
            <Toggle id="aeeh" checked={!!inputs.aeeh} onChange={(b) => set("aeeh", b)} label="Enfant en situation de handicap (AEEH)" />
            <Toggle id="at" checked={!!inputs.horairesAtypiques} onChange={(b) => set("horairesAtypiques", b)} label="Horaires atypiques (nuit, dimanche, férié)" />
          </div>
        )}

        <button type="button" onClick={copyLink} className="btn-brutal bg-brutal-yellow text-foreground px-4 py-3">
          {copied ? "Lien copié ✓" : "Copier le lien de ce scénario"}
        </button>
      </form>

      {/* Résultats */}
      <div className="animate-brut-enter">
        <ResultsPanel comparison={comparison} />
      </div>
    </div>
  );
}
