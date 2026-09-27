// Génère les icônes raster à partir de public/favicon.svg :
//   favicon.ico (48×48)      → favicon des résultats Google (multiple de 48 px)
//   apple-touch-icon.png     → iOS ne lit pas les SVG en apple-touch-icon
//   icon-192.png, icon-512.png → manifeste web + logo Organization (JSON-LD)
// Régénérer : node scripts/build-icons.mjs (fichiers versionnés dans public/).

import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const PUBLIC = join(dirname(fileURLToPath(import.meta.url)), "..", "public");
const svg = readFileSync(join(PUBLIC, "favicon.svg"));

const png = (size) => sharp(svg, { density: 72 * (size / 32) * 2 }).resize(size, size).png().toBuffer();

for (const [name, size] of [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
]) {
  writeFileSync(join(PUBLIC, name), await png(size));
}

// ICO minimal à une image PNG embarquée (format accepté par tous les navigateurs).
const ico48 = await png(48);
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); // réservé
header.writeUInt16LE(1, 2); // type : icône
header.writeUInt16LE(1, 4); // nombre d'images
header.writeUInt8(48, 6); // largeur
header.writeUInt8(48, 7); // hauteur
header.writeUInt8(0, 8); // palette
header.writeUInt8(0, 9); // réservé
header.writeUInt16LE(1, 10); // plans
header.writeUInt16LE(32, 12); // bits par pixel
header.writeUInt32LE(ico48.length, 14); // taille des données
header.writeUInt32LE(22, 18); // offset des données
writeFileSync(join(PUBLIC, "favicon.ico"), Buffer.concat([header, ico48]));

console.log("OK — favicon.ico, apple-touch-icon.png, icon-192.png, icon-512.png générés dans public/.");
