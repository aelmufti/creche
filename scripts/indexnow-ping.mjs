// Notifie IndexNow (Bing, Yandex, et l'écosystème Copilot/ChatGPT-search) des
// URLs du site, pour une indexation quasi instantanée.
//
// Lancé automatiquement en `postbuild` : ne pinge que sur Vercel en production
// (VERCEL_ENV=production). Pour forcer un ping manuel :
//
//   FORCE_INDEXNOW=1 node scripts/indexnow-ping.mjs
//
// La clé est le nom du fichier public/<clé>.txt (cf. .env.example).
// Le script ne fait jamais échouer le build : toute erreur est loggée puis ignorée.

import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

if (process.env.VERCEL_ENV !== "production" && !process.env.FORCE_INDEXNOW) {
  console.log("IndexNow : ignoré (ni VERCEL_ENV=production, ni FORCE_INDEXNOW=1).");
  process.exit(0);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const HOST = process.env.HOST || "creche-ou-nounou.fr";

try {
  // Clé = nom du fichier public/<clé>.txt (32 hex).
  const keyFile = readdirSync(join(ROOT, "public")).find((f) => /^[0-9a-f]{32}\.txt$/.test(f));
  if (!keyFile) throw new Error("Aucun fichier-clé IndexNow (public/<clé>.txt) trouvé.");
  const key = keyFile.replace(/\.txt$/, "");

  // URLs depuis le sitemap généré (dist/sitemap-0.xml).
  const sitemap = readFileSync(join(ROOT, "dist/sitemap-0.xml"), "utf8");
  const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  if (!urls.length) throw new Error("Aucune URL dans dist/sitemap-0.xml.");

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
} catch (err) {
  console.warn(`IndexNow : échec ignoré — ${err.message}`);
}
