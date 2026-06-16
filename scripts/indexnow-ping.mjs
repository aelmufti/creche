// Notifie IndexNow (Bing, Yandex, et l'écosystème Copilot/ChatGPT-search) des
// URLs du site, pour une indexation quasi instantanée. À lancer APRÈS déploiement
// (le site doit être en ligne et le fichier-clé accessible à la racine).
//
//   HOST=creche-ou-nounou.fr node scripts/indexnow-ping.mjs
//
// La clé est le nom du fichier public/<clé>.txt (cf. .env.example).

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.HOST || "creche-ou-nounou.fr";

// Clé = nom du fichier public/<clé>.txt (32 hex).
const keyFile = readdirSync(join(ROOT, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error("Aucun fichier-clé IndexNow (public/<clé>.txt) trouvé.");
  process.exit(1);
}
const key = keyFile.replace(/\.txt$/, "");

// URLs depuis le sitemap généré (dist/sitemap-0.xml).
const sitemap = readFileSync(join(ROOT, "dist/sitemap-0.xml"), "utf8");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
if (!urls.length) {
  console.error("Aucune URL dans dist/sitemap-0.xml (lancer `npm run build` d'abord).");
  process.exit(1);
}

const body = {
  host: HOST,
  key,
  keyLocation: `https://${HOST}/${keyFile}`,
  urlList: urls,
};

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(body),
});
console.log(`IndexNow → ${res.status} ${res.statusText} (${urls.length} URLs)`);
