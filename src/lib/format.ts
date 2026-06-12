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

export const fmtEuro = (n: number) => euro.format(Math.round(n));
export const fmtEuro2 = (n: number) => euro2.format(n);
export const fmtHeure = (n: number) => `${euro2.format(n)}/h`;
