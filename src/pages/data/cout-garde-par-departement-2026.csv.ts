import departementsJson from "../../data/departements.json";
import { TARIFS_DEPARTEMENTS, TARIFS_NATIONAL } from "../../data/tarifs-locaux";

// Jeu de données ouvert : coût de la garde d'enfant par département (2026).
// Sert l'Observatoire (digital PR + GEO) et le schema Dataset.
export function GET() {
  const departements = departementsJson as Record<string, string>;
  const rows: string[][] = [
    ["code", "departement", "salaire_horaire_net_ama_eur", "cout_horaire_total_domicile_eur"],
  ];
  for (const code of Object.keys(TARIFS_DEPARTEMENTS).sort()) {
    const nom = departements[code];
    if (!nom) continue;
    const t = { ...TARIFS_NATIONAL, ...TARIFS_DEPARTEMENTS[code] };
    rows.push([code, nom, String(t.tauxHoraireAma), String(t.coutHoraireDomicile)]);
  }
  const csv = rows
    .map((r) => r.map((c) => (/[",;\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(","))
    .join("\n");
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8" },
  });
}
