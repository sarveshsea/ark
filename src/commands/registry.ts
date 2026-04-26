import type { Command } from "commander";

import { loadMarketplaceCatalog } from "../marketplace/catalog-loader.js";
import type { MarketplaceCatalogEntry } from "../marketplace/catalog.js";

export interface RegistryDiscoveryEntry {
  slug: string;
  title: string;
  packageName: string;
  description: string;
  category: string;
  tags: string[];
  featured: boolean;
  installCommand: string;
  componentCount: number;
  components: Array<{ name: string; level?: string; category?: string }>;
  screenshotUrl: string;
  sourceUrl: string;
}

export function toRegistryDiscoveryEntry(entry: MarketplaceCatalogEntry): RegistryDiscoveryEntry {
  return {
    slug: entry.slug,
    title: entry.title,
    packageName: entry.packageName,
    description: entry.description,
    category: entry.category,
    tags: [...entry.tags],
    featured: entry.featured,
    installCommand: entry.installCommand,
    componentCount: entry.componentCount,
    components: entry.components.map((component) => ({ ...component })),
    screenshotUrl: entry.screenshotUrl,
    sourceUrl: entry.sourceUrl,
  };
}

export function searchRegistryEntries(
  entries: MarketplaceCatalogEntry[],
  query: string,
): MarketplaceCatalogEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;

  return entries.filter((entry) => {
    const haystack = [
      entry.slug,
      entry.title,
      entry.packageName,
      entry.description,
      entry.category,
      ...entry.tags,
      ...entry.components.map((component) => component.name),
      ...entry.components.map((component) => component.category ?? ""),
    ].join(" ").toLowerCase();
    return haystack.includes(needle);
  });
}

export function findRegistryDiscoveryEntry(
  entries: MarketplaceCatalogEntry[],
  ref: string,
): MarketplaceCatalogEntry | undefined {
  const needle = ref.trim().toLowerCase();
  return entries.find((entry) => {
    return (
      entry.slug === needle ||
      entry.packageName.toLowerCase() === needle ||
      entry.title.toLowerCase() === needle
    );
  });
}

export function registerRegistryCommand(program: Command) {
  const registry = program
    .command("registry")
    .description("Discover installable Memoire registries")
    .addHelpText("after", [
      "",
      "Examples:",
      "  memi registry list",
      "  memi registry search chat --json",
      "  memi registry info ai-chat",
    ].join("\n"));

  registry
    .command("list")
    .description("List featured and first-party marketplace registries")
    .option("--json", "Output stable JSON")
    .action(async (opts: { json?: boolean }) => {
      const catalog = await loadMarketplaceCatalog();
      const entries = catalog.entries.map(toRegistryDiscoveryEntry);
      if (opts.json) {
        console.log(JSON.stringify({ count: entries.length, registries: entries }, null, 2));
        return;
      }
      printRegistryTable(entries);
    });

  registry
    .command("search")
    .argument("<query>", "Search term, tag, category, component, or package name")
    .description("Search marketplace registries")
    .option("--json", "Output stable JSON")
    .action(async (query: string, opts: { json?: boolean }) => {
      const catalog = await loadMarketplaceCatalog();
      const results = searchRegistryEntries(catalog.entries, query).map(toRegistryDiscoveryEntry);
      if (opts.json) {
        console.log(JSON.stringify({ query, count: results.length, registries: results }, null, 2));
        return;
      }
      if (results.length === 0) {
        console.log(`\n  No registries found for "${query}". Try: ai-chat, auth, ecommerce, dashboard, tweakcn.\n`);
        return;
      }
      printRegistryTable(results);
    });

  registry
    .command("info")
    .argument("<slug>", "Registry slug, package name, or title")
    .description("Show install and metadata for one registry")
    .option("--json", "Output stable JSON")
    .action(async (slug: string, opts: { json?: boolean }) => {
      const catalog = await loadMarketplaceCatalog();
      const entry = findRegistryDiscoveryEntry(catalog.entries, slug);
      if (!entry) {
        const suggestions = catalog.entries.slice(0, 6).map((candidate) => candidate.slug);
        if (opts.json) {
          console.log(JSON.stringify({ error: "registry_not_found", query: slug, suggestions }, null, 2));
          process.exitCode = 1;
          return;
        }
        console.error(`\n  Registry not found: ${slug}`);
        console.error(`  Try: ${suggestions.join(", ")}\n`);
        process.exitCode = 1;
        return;
      }

      const payload = toRegistryDiscoveryEntry(entry);
      if (opts.json) {
        console.log(JSON.stringify(payload, null, 2));
        return;
      }
      printRegistryInfo(payload);
    });
}

function printRegistryTable(entries: RegistryDiscoveryEntry[]): void {
  console.log();
  for (const entry of entries) {
    const tags = entry.tags.slice(0, 5).join(", ");
    console.log(`  ${entry.slug}  ${entry.packageName}`);
    console.log(`    ${entry.description}`);
    console.log(`    install: ${entry.installCommand}`);
    console.log(`    tags: ${tags}`);
    console.log();
  }
}

function printRegistryInfo(entry: RegistryDiscoveryEntry): void {
  console.log();
  console.log(`  ${entry.title} (${entry.slug})`);
  console.log(`  ${entry.description}`);
  console.log();
  console.log(`  Package:     ${entry.packageName}`);
  console.log(`  Category:    ${entry.category}`);
  console.log(`  Install:     ${entry.installCommand}`);
  console.log(`  Screenshot:  ${entry.screenshotUrl}`);
  console.log(`  Source:      ${entry.sourceUrl}`);
  console.log(`  Components:  ${entry.components.map((component) => component.name).join(", ")}`);
  console.log(`  Tags:        ${entry.tags.join(", ")}`);
  console.log();
}
