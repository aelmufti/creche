import { useState } from "react";
import type { ComparisonResult, ModeResult } from "../engine";
import { fmtEuro } from "../lib/format";

const MODE_COLOR: Record<string, string> = {
  creche: "#1754CC",
  micro_creche: "#0A9438",
  ama: "#CC5200",
  domicile: "#CC1F66",
  partagee: "#D4A800",
};

export function ResultsPanel({ comparison }: { comparison: ComparisonResult }) {
  const [vue, setVue] = useState<"net" | "tresorerie">("net");
  const { classement, gagnant, ecartAuSuivant } = comparison;
  const valeur = (r: ModeResult) => (vue === "net" ? r.netReel : r.tresorerieMensuelle);
  const max = Math.max(...classement.map(valeur), 1);

  return (
    <div className="flex flex-col gap-5">
      {/* Verdict */}
      <div
        className="card-brutal p-5"
        style={{ background: MODE_COLOR[gagnant.mode], color: "#fff" }}
      >
        <p className="text-xs font-bold uppercase tracking-brutal-wide opacity-90">
          Le moins cher pour vous
        </p>
        <h2 className="mt-1 text-3xl font-extrabold leading-none">{gagnant.label}</h2>
        <p className="mt-3 text-lg font-bold">
          <span className="marker" style={{ background: "#0D0D0D", color: "#fff" }}>
            {fmtEuro(gagnant.netReel)}/mois
          </span>{" "}
          net réel
        </p>
        {ecartAuSuivant > 0.5 && (
          <p className="mt-2 text-sm font-medium opacity-95">
            Soit {fmtEuro(ecartAuSuivant)}/mois de moins que l'option suivante (
            {fmtEuro(ecartAuSuivant * 12)}/an).
          </p>
        )}
        {gagnant.flags.length > 0 && (
          <p className="mt-3 text-xs opacity-90">⚠ {gagnant.flags.join(" · ")}</p>
        )}
      </div>

      {/* Bascule vue */}
      <div
        role="radiogroup"
        aria-label="Type de coût affiché"
        className="grid grid-cols-2 border-[3px] border-border shadow-brutal-sm"
      >
        {(
          [
            ["net", "Coût net réel"],
            ["tresorerie", "Trésorerie/mois"],
          ] as const
        ).map(([k, lbl], idx) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={vue === k}
            onClick={() => setVue(k)}
            className={`px-3 py-2 text-sm font-bold uppercase tracking-brutal ${
              idx > 0 ? "border-l-[3px] border-border" : ""
            } ${vue === k ? "bg-foreground text-background" : "bg-card hover:bg-muted"}`}
          >
            {lbl}
          </button>
        ))}
      </div>
      <p className="-mt-3 text-[11px] text-muted-foreground leading-tight">
        {vue === "net"
          ? "Après crédit d'impôt (50 %), encaissé l'année suivante."
          : "Ce qui part réellement du compte chaque mois, avant crédit d'impôt."}
      </p>

      {/* Classement */}
      <ol className="flex flex-col gap-3">
        {classement.map((r, idx) => (
          <li
            key={r.mode}
            className={`card-brutal p-4 ${idx === 0 ? "shadow-brutal-lg" : ""}`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex items-center gap-2 font-extrabold">
                <span
                  className="flex h-6 w-6 flex-none items-center justify-center border-[3px] border-border text-xs"
                  style={{ background: MODE_COLOR[r.mode], color: "#fff" }}
                >
                  {idx + 1}
                </span>
                {r.label}
              </span>
              <span className="text-xl font-extrabold tabular-nums">{fmtEuro(valeur(r))}</span>
            </div>
            <div className="mt-2 h-3 w-full border-[3px] border-border bg-muted">
              <div
                className="h-full"
                style={{
                  width: `${Math.max(2, (valeur(r) / max) * 100)}%`,
                  background: MODE_COLOR[r.mode],
                }}
              />
            </div>
          </li>
        ))}
      </ol>

      {/* Décomposition du gagnant */}
      <div className="card-brutal p-4">
        <h3 className="text-sm font-extrabold uppercase tracking-brutal">
          Décomposition — {gagnant.label}
        </h3>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {gagnant.breakdown.map((s, idx) => {
              const last = idx === gagnant.breakdown.length - 1;
              return (
                <tr key={s.label} className={last ? "border-t-[3px] border-border font-extrabold" : ""}>
                  <td className="py-1">{s.label}</td>
                  <td className="py-1 text-right tabular-nums">{fmtEuro(s.montant)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
