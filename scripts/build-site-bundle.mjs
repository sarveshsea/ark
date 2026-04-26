#!/usr/bin/env node

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "examples", "site-bundle");
const catalog = JSON.parse(await readFile(join(root, "examples", "marketplace-catalog.v1.json"), "utf8"));

await rm(outDir, { recursive: true, force: true });
await mkdir(join(outDir, "items"), { recursive: true });
await mkdir(join(outDir, "screenshots"), { recursive: true });

const bundleCatalog = {
  ...catalog,
  entries: [],
};
const sitemapUrls = ["https://www.memoire.cv/components"];
const seoPages = [];
const snippets = [
  "# Memoire Site Copy Snippets",
  "",
  "Hero: Shadcn-native Design CI for Tailwind apps.",
  "Subhead: Turn an existing app into a registry that works with shadcn, v0, AI editors, npm, and Memoire.",
  "Primary CTA: https://www.npmjs.com/package/@sarveshsea/memoire",
  "",
  "## Registry Cards",
  "",
];

for (const entry of catalog.entries) {
  const presetRoot = join(root, entry.sourcePath);
  const registry = JSON.parse(await readFile(join(presetRoot, "registry.json"), "utf8"));
  const entryItems = [];
  const screenshotName = basename(entry.screenshotPath);
  if (existsSync(join(root, entry.screenshotPath))) {
    await cp(join(root, entry.screenshotPath), join(outDir, "screenshots", screenshotName));
  }

  await mkdir(join(outDir, "items", entry.slug), { recursive: true });
  for (const component of registry.components) {
    const spec = JSON.parse(await readFile(join(presetRoot, normalize(component.href)), "utf8"));
    const itemName = toItemName(component.name);
    const codePath = component.code?.href ? join(presetRoot, normalize(component.code.href)) : "";
    const content = codePath && existsSync(codePath) ? await readFile(codePath, "utf8") : fallbackComponent(component.name);
    const itemUrl = `https://www.memoire.cv/r/${entry.slug}/${itemName}.json`;
    const item = {
      "$schema": "https://ui.shadcn.com/schema/registry-item.json",
      name: itemName,
      type: shadcnType(component.level),
      title: component.name,
      description: spec.purpose ?? entry.description,
      registryDependencies: (spec.shadcnBase ?? []).map(toItemName),
      files: [{
        path: `registry/${entry.slug}/${itemName}.tsx`,
        type: "registry:component",
        target: targetFor(component.name, component.level),
        content,
      }],
      categories: [entry.category, component.level, ...entry.tags].filter(Boolean),
      meta: {
        memoire: {
          sourcePackage: entry.packageName,
          sourcePath: entry.sourcePath,
          itemRoute: `/r/${entry.slug}/${itemName}.json`,
          registryItemUrl: itemUrl,
          openInV0Url: openInV0Url(itemUrl),
          atomicLevel: component.level,
        },
      },
    };
    await writeFile(join(outDir, "items", entry.slug, `${itemName}.json`), `${JSON.stringify(item, null, 2)}\n`);
    entryItems.push({
      name: component.name,
      itemName,
      registryItemUrl: itemUrl,
      openInV0Url: openInV0Url(itemUrl),
    });
  }

  const pageUrl = `https://www.memoire.cv/components/${entry.slug}`;
  sitemapUrls.push(pageUrl);
  seoPages.push({
    slug: entry.slug,
    title: `${entry.title} shadcn registry | Memoire`,
    description: entry.description,
    canonicalUrl: pageUrl,
    keywords: unique(["shadcn registry", "Tailwind design system", "installable components", ...entry.tags]),
    ogImage: `https://www.memoire.cv/screenshots/${screenshotName}`,
  });
  snippets.push(`- ${entry.title}: ${entry.description}`);
  snippets.push(`  Install: ${entry.installCommand}`);
  snippets.push(`  Open in v0: ${entry.openInV0Url}`);
  snippets.push("");

  bundleCatalog.entries.push({
    ...entry,
    screenshotPath: `screenshots/${screenshotName}`,
    items: entryItems,
  });
}

await writeFile(join(outDir, "catalog.json"), `${JSON.stringify(bundleCatalog, null, 2)}\n`);
await writeFile(join(outDir, "seo.json"), `${JSON.stringify({ pages: seoPages }, null, 2)}\n`);
await writeFile(join(outDir, "sitemap.xml"), renderSitemap(sitemapUrls));
await writeFile(join(outDir, "copy-snippets.md"), `${snippets.join("\n")}\n`);

console.log(`wrote ${outDir}`);

function normalize(path) {
  return path.replace(/^\.\//, "");
}

function toItemName(name) {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function shadcnType(level) {
  if (level === "organism" || level === "template") return "registry:block";
  if (level === "molecule") return "registry:component";
  return "registry:ui";
}

function targetFor(name, level) {
  const file = `${toItemName(name)}.tsx`;
  if (level === "atom") return `components/ui/${file}`;
  if (level === "molecule") return `components/molecules/${file}`;
  if (level === "organism") return `components/organisms/${file}`;
  return `components/templates/${file}`;
}

function openInV0Url(itemUrl) {
  return `https://v0.dev/chat/api/open?url=${encodeURIComponent(itemUrl)}`;
}

function fallbackComponent(name) {
  return `export function ${name}() {\n  return <div />\n}\n`;
}

function unique(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function renderSitemap(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${url}</loc></url>`),
    '</urlset>',
    '',
  ].join("\n");
}
