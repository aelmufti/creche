const euro = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const euro2 = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFr = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// Arrondi au plus proche, demi vers le haut, insensible aux artefacts binaires :
// 5 000 × 0,0619 % vaut 3,095 mais est stocké 3,09499999… — sans la marge, la page
// afficherait 3,09 €/h au lieu de 3,10 €/h.
const arrondi = (n: number, decimales: number) => {
  const k = 10 ** decimales;
  return Math.round(n * k + 1e-7) / k;
};

export const fmtEuro = (n: number) => euro.format(arrondi(n, 0));
export const fmtEuro2 = (n: number) => euro2.format(arrondi(n, 2));
export const fmtHeure = (n: number) => `${fmtEuro2(n)}/h`;
export const fmtDateFr = (iso: string) => dateFr.format(new Date(iso));
/** Ordinal français : 1 → « 1ᵉʳ », 12 → « 12ᵉ ». */
export const fmtRang = (n: number) => (n === 1 ? "1ᵉʳ" : `${n}ᵉ`);
