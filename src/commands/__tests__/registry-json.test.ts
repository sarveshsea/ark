import { describe, expect, it } from "vitest";

import { loadMarketplaceCatalog } from "../../marketplace/catalog-loader.js";
import {
  findRegistryDiscoveryEntry,
  searchRegistryEntries,
  toRegistryDiscoveryEntry,
} from "../registry.js";

describe("registry discovery command helpers", () => {
  it("returns stable JSON fields for registry list output", async () => {
    const catalog = await loadMarketplaceCatalog();
    const entries = catalog.entries.map(toRegistryDiscoveryEntry);
    expect(entries.length).toBeGreaterThanOrEqual(11);
    expect(entries[0]).toEqual(expect.objectContaining({
      slug: "starter-saas",
      packageName: "@memoire-examples/starter-saas",
      installCommand: "memi add Button --from @memoire-examples/starter-saas",
      tags: expect.any(Array),
      components: expect.any(Array),
      screenshotUrl: expect.stringContaining("starter-saas.svg"),
      sourceUrl: expect.stringContaining("examples/presets/starter-saas"),
    }));
  });

  it("searches by tag, category, component, and package name", async () => {
    const catalog = await loadMarketplaceCatalog();
    const chat = searchRegistryEntries(catalog.entries, "chat");
    expect(chat.map((entry) => entry.slug)).toContain("ai-chat");
    expect(chat.find((entry) => entry.slug === "ai-chat")?.installCommand).toBe(
      "memi add ChatComposer --from @memoire-examples/ai-chat",
    );
    expect(searchRegistryEntries(catalog.entries, "auth").map((entry) => entry.slug)).toContain("auth-flow");
    expect(searchRegistryEntries(catalog.entries, "ProductCard").map((entry) => entry.slug)).toEqual(["ecommerce"]);
    expect(searchRegistryEntries(catalog.entries, "@memoire-examples/landing-page").map((entry) => entry.slug)).toEqual(["landing-page"]);
  });

  it("finds registry info by slug, package name, or title", async () => {
    const catalog = await loadMarketplaceCatalog();
    expect(findRegistryDiscoveryEntry(catalog.entries, "ai-chat")?.packageName).toBe("@memoire-examples/ai-chat");
    expect(findRegistryDiscoveryEntry(catalog.entries, "@memoire-examples/auth-flow")?.slug).toBe("auth-flow");
    expect(findRegistryDiscoveryEntry(catalog.entries, "Ecommerce")?.slug).toBe("ecommerce");
  });
});
