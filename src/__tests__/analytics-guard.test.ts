import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

// /confidentialite affirme que les paramètres de l'adresse (revenu, code postal…)
// « sont retirés avant tout envoi ». C'est une promesse écrite sur une page
// légale : elle doit être vérifiée, pas supposée. Ce test exécute le garde-fou
// réellement livré dans Layout.astro.

const layoutPath = fileURLToPath(new URL("../layouts/Layout.astro", import.meta.url));
const layout = readFileSync(layoutPath, "utf8");

function guardFromLayout(): (e: { url: string }) => { url: string } {
  const m = layout.match(/<script is:inline>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("garde-fou beforeSend introuvable dans Layout.astro");
  const sandbox: Record<string, unknown> = {
    window: { location: { origin: "https://creche-ou-nounou.fr" } },
    URL,
    Object,
  };
  vm.createContext(sandbox);
  vm.runInContext(m[1], sandbox);
  const w = sandbox.window as { webAnalyticsBeforeSend?: (e: { url: string }) => { url: string } };
  if (typeof w.webAnalyticsBeforeSend !== "function") {
    throw new Error("window.webAnalyticsBeforeSend n'est pas défini");
  }
  return w.webAnalyticsBeforeSend;
}

describe("garde-fou analytics (promesse de /confidentialite)", () => {
  const guard = guardFromLayout();

  it("retire le scénario de l'utilisateur de l'URL envoyée", () => {
    const e = guard({ url: "https://creche-ou-nounou.fr/?r=4200&s=couple&n=2&cp=75011" });
    expect(e.url).toBe("https://creche-ou-nounou.fr/");
    expect(e.url).not.toContain("4200");
    expect(e.url).not.toContain("75011");
  });

  it("préserve le chemin des pages programmatiques (la mesure reste utile)", () => {
    expect(guard({ url: "https://creche-ou-nounou.fr/cout-garde-enfant/paris?r=9000" }).url).toBe(
      "https://creche-ou-nounou.fr/cout-garde-enfant/paris",
    );
  });

  it("aucune query string ne survit, quel que soit le paramètre", () => {
    for (const q of ["?r=1", "?cp=13001&ag=1,3", "?ta=5.5&fa=200", "?x=%20&y=#frag"]) {
      expect(guard({ url: `https://creche-ou-nounou.fr/methodologie${q}` }).url).toBe(
        "https://creche-ou-nounou.fr/methodologie",
      );
    }
  });

  it("une URL illisible ne fait pas échouer la page (repli sur l'événement d'origine)", () => {
    expect(guard({ url: "pas-une-url::" }).url).toBeDefined();
  });

  it("le garde-fou est défini avant le composant Analytics (sinon il ne s'applique pas)", () => {
    const iGuard = layout.indexOf("webAnalyticsBeforeSend");
    const iAnalytics = layout.indexOf("<Analytics />");
    expect(iGuard).toBeGreaterThan(-1);
    expect(iAnalytics).toBeGreaterThan(iGuard);
    // …et dans le <head>, donc exécuté avant le script de module différé.
    expect(iGuard).toBeLessThan(layout.indexOf("</head>"));
  });

  it("aucun script d'analytics envoyant location.href n'est rebranché", () => {
    expect(layout).not.toMatch(/plausible|googletagmanager|google-analytics|gtag/i);
  });
});
