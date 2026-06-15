import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Comparateur", end: true },
  { to: "/methodologie", label: "Méthodologie" },
  { to: "/mentions-legales", label: "Mentions" },
];

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b-[3px] border-border bg-background">
        <div className="container flex flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" className="text-lg font-extrabold uppercase tracking-brutal">
            <span className="marker">Mode de garde</span> ?
          </Link>
          <nav aria-label="Navigation principale" className="flex flex-wrap gap-2">
            {navItems.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) =>
                  `border-[3px] border-border px-3 py-1.5 text-xs font-bold uppercase tracking-brutal ${
                    isActive ? "bg-foreground text-background" : "bg-card hover:bg-muted"
                  }`
                }
              >
                {n.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="container flex-1 py-8">{children}</main>

      <footer className="border-t-[3px] border-border bg-foreground text-background">
        <div className="container flex flex-col gap-3 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p>
            Fait par{" "}
            <a
              href="https://aelm.dev"
              className="marker font-bold"
              style={{ background: "#D4A800", color: "#0D0D0D" }}
            >
              Ali El Mufti
            </a>
          </p>
          <nav aria-label="Liens de bas de page" className="flex flex-wrap gap-4">
            <Link to="/methodologie" className="underline">
              Méthodologie
            </Link>
            <Link to="/mentions-legales" className="underline">
              Mentions légales
            </Link>
            <Link to="/confidentialite" className="underline">
              Confidentialité
            </Link>
            <a href="https://freelance-ou-cdi.fr" className="underline">
              freelance-ou-cdi.fr
            </a>
          </nav>
        </div>
        <div className="container pb-6 text-xs opacity-70">
          Estimation indicative, ce n'est pas un avis officiel. Vérifiez sur caf.fr / pajemploi.urssaf.fr.
          Barème au 1ᵉʳ avril 2026.
        </div>
      </footer>
    </div>
  );
}
