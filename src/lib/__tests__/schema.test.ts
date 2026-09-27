import { describe, it, expect } from "vitest";
import { enrichJsonLd, ORG_ID, PERSON_ID, WEBSITE_ID } from "../schema";

const ctx = {
  canonical: "https://creche-ou-nounou.fr/guides/x",
  image: "https://creche-ou-nounou.fr/og/x.png",
};

describe("enrichJsonLd", () => {
  it("relie chaque Article aux entités du site", () => {
    const [a] = enrichJsonLd([{ "@type": "Article", headline: "X" }], ctx);
    expect(a["@id"]).toBe(`${ctx.canonical}#article`);
    expect(a.mainEntityOfPage).toBe(ctx.canonical);
    expect(a.image).toBe(ctx.image);
    expect((a.author as Record<string, unknown>)["@id"]).toBe(PERSON_ID);
    expect((a.publisher as Record<string, unknown>)["@id"]).toBe(ORG_ID);
    expect(a.isPartOf).toEqual({ "@id": WEBSITE_ID });
  });

  it("conserve les champs fournis par la page", () => {
    const dataset = { "@type": "Dataset", name: "URSSAF 2024" };
    const [a] = enrichJsonLd([{ "@type": "Article", image: "/custom.png", isPartOf: dataset }], ctx);
    expect(a.image).toBe("/custom.png");
    expect(a.isPartOf).toEqual(dataset);
  });

  it("laisse passer les autres types intacts", () => {
    const faq = { "@type": "FAQPage", mainEntity: [] };
    expect(enrichJsonLd([faq], ctx)).toEqual([faq]);
  });
});
