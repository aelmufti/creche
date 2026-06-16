// Génère l'image Open Graph par défaut (public/og-default.png, 1200×630)
// au style néo-brutalisme, par rasterisation d'un SVG via sharp.
// Régénérer : node scripts/build-og.mjs

import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#EDE8E0"/>
  <rect x="24" y="24" width="1152" height="582" fill="none" stroke="#0D0D0D" stroke-width="10"/>
  <!-- carte biberon -->
  <g transform="translate(80,150)">
    <rect x="0" y="0" width="300" height="300" fill="#1754CC" stroke="#0D0D0D" stroke-width="10"/>
    <g transform="translate(110,55)" fill="#FFFFFF" stroke="#0D0D0D" stroke-width="9">
      <rect x="20" y="0" width="40" height="34"/>
      <rect x="4" y="34" width="72" height="28"/>
      <rect x="-4" y="62" width="88" height="120"/>
    </g>
    <g stroke="#0D0D0D" stroke-width="9">
      <line x1="120" y1="105" x2="150" y2="105"/>
      <line x1="120" y1="135" x2="150" y2="135"/>
    </g>
  </g>
  <!-- texte -->
  <text x="430" y="250" font-family="JetBrains Mono, monospace" font-size="78" font-weight="800" fill="#0D0D0D">Crèche ou</text>
  <text x="430" y="340" font-family="JetBrains Mono, monospace" font-size="78" font-weight="800" fill="#0D0D0D">nounou ?</text>
  <rect x="430" y="380" width="640" height="64" fill="#1754CC"/>
  <text x="450" y="424" font-family="JetBrains Mono, monospace" font-size="34" font-weight="700" fill="#FFFFFF">Le moins cher pour votre famille</text>
  <text x="430" y="510" font-family="JetBrains Mono, monospace" font-size="28" font-weight="500" fill="#0D0D0D">Comparateur 2026 · CMG · crédit d'impôt · sans inscription</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(join(ROOT, "public/og-default.png"));
console.log("OK — public/og-default.png (1200×630) généré.");
