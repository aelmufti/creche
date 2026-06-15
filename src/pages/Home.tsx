import { Calculator } from "../components/Calculator";

export function Home() {
  return (
    <div className="flex flex-col gap-8">
      <section className="hero-grid-bg -mx-5 border-b-[3px] border-border px-5 pb-8 pt-2">
        <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.05] sm:text-5xl">
          Quel mode de garde est{" "}
          <span className="marker">le moins cher</span> pour votre famille ?
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Crèche, micro-crèche, assistante maternelle, garde à domicile ou partagée. Verdict chiffré
          personnalisé au barème 2026 (CMG, crédit d'impôt, reste à charge). Instantané, gratuit,
          <strong className="text-foreground"> sans inscription</strong>.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-brutal">
          {["Réforme CMG sept. 2025", "Trésorerie vs coût net réel", "Chiffres datés & sourcés"].map(
            (t) => (
              <span key={t} className="border-[3px] border-border bg-card px-2 py-1 shadow-brutal-sm">
                {t}
              </span>
            ),
          )}
        </div>
      </section>

      <Calculator />

      <section className="card-brutal p-5 text-sm leading-relaxed">
        <h2 className="text-lg font-extrabold uppercase tracking-brutal">Comment lire le verdict</h2>
        <p className="mt-3">
          On distingue deux chiffres que personne d'autre ne sépare clairement :
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong>Trésorerie mensuelle</strong> : ce qui part réellement de votre compte chaque
            mois (avant crédit d'impôt).
          </li>
          <li>
            <strong>Coût net réel</strong> : après crédit d'impôt (50 %), encaissé l'année suivante
            (avance de 60 % en janvier, solde en été).
          </li>
        </ul>
        <p className="mt-3 text-muted-foreground">
          Le classement se fait sur le coût net réel. Les sliders revenu et heures font basculer le
          verdict en direct — testez vos scénarios.
        </p>
      </section>
    </div>
  );
}
