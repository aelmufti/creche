import { bareme } from "../engine/bareme";
import { fmtEuro2 } from "../lib/format";

function Source({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-muted-foreground">Source : {children}</p>;
}

export function Methodologie() {
  const b = bareme;
  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-extrabold sm:text-4xl">Méthodologie & sources</h1>
        <p className="mt-2 text-muted-foreground">
          Tous les calculs reposent sur des données officielles, datées et sourcées. Barème en
          vigueur : <strong className="text-foreground">{b.version}</strong> (1ᵉʳ avril 2026).
          Source agrégée : {b.source}.
        </p>
      </header>

      <div className="card-brutal border-l-[8px] border-l-brutal-red p-4 text-sm">
        <strong className="uppercase tracking-brutal">Avertissement.</strong> Cet outil fournit une
        <em> estimation indicative</em>, ce n'est pas un avis officiel ni un engagement de la CAF,
        de l'Urssaf ou des impôts. Vérifiez toujours votre situation sur{" "}
        <a className="underline" href="https://www.caf.fr">
          caf.fr
        </a>{" "}
        et{" "}
        <a className="underline" href="https://www.pajemploi.urssaf.fr">
          pajemploi.urssaf.fr
        </a>
        .
      </div>

      <section>
        <h2 className="text-xl font-extrabold">1. Le CMG en emploi direct (réforme sept. 2025)</h2>
        <p className="mt-2 text-sm">
          Depuis le 1ᵉʳ septembre 2025, le Complément de libre choix du Mode de Garde est
          proportionnel au reste à charge :
        </p>
        <pre className="card-brutal mt-2 overflow-x-auto p-3 text-xs">
{`CMG = coût_mensuel × (1 − revenu × taux_effort / coût_référence)`}
        </pre>
        <p className="mt-2 text-sm">
          Coût horaire de référence : {fmtEuro2(b.cout_horaire_ref.ama)} (assistante maternelle),{" "}
          {fmtEuro2(b.cout_horaire_ref.domicile)} (garde à domicile, taux d'effort doublé). Résultat
          plafonné à {fmtEuro2(b.cmg_max_emploi_direct.ama)}/mois (AMA) et{" "}
          {fmtEuro2(b.cmg_max_emploi_direct.domicile)}/mois (domicile). La distinction d'âge et le
          reste à charge minimum de 15 % sont <strong>supprimés</strong> en emploi direct.
        </p>
        <Source>Urssaf/Pajemploi ; art. 99 LFSS 2024 (loi n° 2023-1250), en vigueur 1ᵉʳ sept. 2025.</Source>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">2. Le tarif crèche (PSU)</h2>
        <p className="mt-2 text-sm">
          Pas de CMG : le tarif horaire est directement la participation familiale au taux d'effort
          CNAF, appliqué aux ressources (plancher {fmtEuro2(b.ressources.plancher)}, plafond{" "}
          {fmtEuro2(b.ressources.plafond)}). Taux d'effort selon le nombre d'enfants à charge :
        </p>
        <table className="card-brutal mt-2 w-full text-sm">
          <thead>
            <tr className="border-b-[3px] border-border text-left">
              <th className="p-2">Enfants à charge</th>
              <th className="p-2">Taux d'effort (collectif)</th>
            </tr>
          </thead>
          <tbody>
            {[
              ["1", b.taux_effort_collectif["1"]],
              ["2", b.taux_effort_collectif["2"]],
              ["3", b.taux_effort_collectif["3"]],
              ["4 à 7", b.taux_effort_collectif["4_7"]],
              ["8 et +", b.taux_effort_collectif["8_plus"]],
            ].map(([k, v]) => (
              <tr key={k as string} className="border-t border-border/30">
                <td className="p-2">{k}</td>
                <td className="p-2 tabular-nums">{((v as number) * 100).toFixed(4)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Source>CNAF, circulaire 2019-005 du 5 juin 2019 ; barème EAJE applicable au 1ᵉʳ janv. 2026.</Source>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">3. La micro-crèche (CMG « structure », PAJE)</h2>
        <p className="mt-2 text-sm">
          Logique distincte (la réforme de sept. 2025 ne s'applique pas) : aide ={" "}
          {b.micro_creche_structure.couverture_max * 100} % du coût éligible (plafonné à{" "}
          {fmtEuro2(b.micro_creche_structure.plafond_horaire)}/h), dans la limite d'un forfait par
          tranche de revenus. Reste à charge minimum {b.micro_creche_structure.reste_a_charge_min * 100} %{" "}
          <strong>maintenu</strong>, aide divisée par 2 entre 3 et 6 ans <strong>maintenue</strong>.
        </p>
        <Source>Pajemploi / service-public.fr. Forfaits T2/T3 à reconfirmer verbatim avant prod.</Source>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">4. Les deux crédits d'impôt (50 %)</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          <li>
            <strong>Frais de garde</strong> (crèche, micro-crèche, AMA) : 50 % dans la limite de{" "}
            {fmtEuro2(b.credit_impot.frais_garde.plafond_par_enfant)}/enfant.
          </li>
          <li>
            <strong>Emploi à domicile</strong> (garde à domicile et partagée) : 50 % dans la limite
            de ~{fmtEuro2(b.credit_impot.emploi_domicile.plafond_base)} (+
            {fmtEuro2(b.credit_impot.emploi_domicile.majoration_par_enfant)}/enfant, max{" "}
            {fmtEuro2(b.credit_impot.emploi_domicile.plafond_max)}). Ce plafond plus élevé rend la
            garde à domicile compétitive pour les hauts revenus.
          </li>
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Le crédit d'impôt est <strong>restituable</strong> : il s'applique même aux foyers non
          imposables. La part payée par l'employeur n'ouvre pas droit au crédit.
        </p>
        <Source>service-public.fr / impots.gouv.fr, 2026.</Source>
      </section>

      <section>
        <h2 className="text-xl font-extrabold">5. Limites connues</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>v1 : un seul enfant placé en garde ; le multi-placement arrive ensuite.</li>
          <li>
            Aide cotisations garde à domicile : approximation (50 % d'une estimation des charges),
            à affiner.
          </li>
          <li>
            Majoration parent isolé : porte sur les plafonds/tranches, mécanique exacte en cours de
            vérification avant application aux montants.
          </li>
        </ul>
      </section>
    </article>
  );
}
