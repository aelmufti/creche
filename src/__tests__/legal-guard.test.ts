import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { EDITEUR, HEBERGEUR, SOURCES_DONNEES, ODBL_URL } from "../data/legal";

// Garde-fou juridique. Les pages légales ont déjà été mises en production avec
// « à compléter avant mise en production » à la place de l'hébergeur, et les
// données Urssaf (ODbL) annoncées sous Licence Ouverte Etalab. Ces tests
// empêchent ces deux régressions de revenir.

const SRC = fileURLToPath(new URL("../", import.meta.url));
const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (p: string) => readFileSync(p, "utf8");

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "__tests__" ? [] : sources(p);
    return /\.(astro|tsx?|mjs)$/.test(f) ? [p] : [];
  });
}
const files = [...sources(SRC), join(ROOT, "public/llms.txt"), join(ROOT, "README.md")];

describe("mentions légales (LCEN art. 1-1)", () => {
  it("aucun texte provisoire n'est publié", () => {
    for (const f of files) {
      expect(read(f), f).not.toMatch(/à compléter|a completer|lorem ipsum|TODO légal/i);
    }
  });

  it("l'hébergeur est entièrement identifié", () => {
    expect(HEBERGEUR.nom).toBeTruthy();
    expect(HEBERGEUR.adresse).toBeTruthy();
    expect(HEBERGEUR.telephone).toBeTruthy();
  });

  it("un éditeur professionnel publie adresse, téléphone et contact", () => {
    if (EDITEUR.statut !== "professionnel") return;
    expect(EDITEUR.adresse, "adresse obligatoire").toBeTruthy();
    expect(EDITEUR.telephone, "téléphone obligatoire").toBeTruthy();
    expect(EDITEUR.email, "e-mail obligatoire").toBeTruthy();
  });

  it("les pages légales sont liées depuis toutes les pages (pied de page)", () => {
    const layout = read(join(SRC, "layouts/Layout.astro"));
    for (const href of ["/mentions-legales", "/confidentialite", "/conditions-utilisation"]) {
      expect(layout).toContain(`href="${href}"`);
    }
  });
});

describe("licences des données", () => {
  it("les données Urssaf sont déclarées sous ODbL", () => {
    const urssaf = SOURCES_DONNEES.find((s) => s.id === "urssaf");
    expect(urssaf?.licenceUrl).toBe(ODBL_URL);
  });

  it("aucune page n'annonce les données Urssaf sous licence Etalab", () => {
    for (const f of files) {
      const txt = read(f);
      if (!/urssaf/i.test(txt)) continue;
      expect(txt, f).not.toMatch(/licence ouverte \(Etalab\)|licence ouverte Etalab\]/i);
    }
    const obs = read(join(SRC, "pages/observatoire-cout-garde-2026.astro"));
    expect(obs).not.toContain('license: "https://www.etalab.gouv.fr');
  });

  it("la licence de la police est servie avec les fichiers de police", () => {
    expect(read(join(ROOT, "public/fonts/OFL.txt"))).toContain("SIL OPEN FONT LICENSE Version 1.1");
  });
});

describe("mesure d'audience", () => {
  it("l'opposition et Global Privacy Control bloquent l'envoi", () => {
    const layout = read(join(SRC, "layouts/Layout.astro"));
    expect(layout).toMatch(/globalPrivacyControl === true\) return null/);
    expect(layout).toMatch(/cn-audience-optout"\) === "1"\) return null/);
    expect(read(join(SRC, "pages/confidentialite.astro"))).toContain("cn-audience-optout");
  });
});
