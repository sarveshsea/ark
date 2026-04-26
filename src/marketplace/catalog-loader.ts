import { readFile } from "node:fs/promises";

import { packagePath } from "../utils/asset-path.js";
import {
  findMarketplaceEntry,
  MARKETPLACE_CATALOG_FILENAME,
  parseMarketplaceCatalog,
  type MarketplaceCatalog,
  type MarketplaceCatalogEntry,
} from "./catalog.js";

let cachedCatalog: MarketplaceCatalog | undefined;

export async function loadMarketplaceCatalog(): Promise<MarketplaceCatalog> {
  if (cachedCatalog) return cachedCatalog;

  const catalogPath = packagePath("assets", MARKETPLACE_CATALOG_FILENAME);
  const raw = JSON.parse(await readFile(catalogPath, "utf8"));
  cachedCatalog = parseMarketplaceCatalog(raw);
  return cachedCatalog;
}

export async function resolveMarketplaceAlias(ref: string): Promise<MarketplaceCatalogEntry | undefined> {
  const catalog = await loadMarketplaceCatalog();
  return findMarketplaceEntry(catalog, ref);
}

export async function resolveMarketplacePackageName(ref: string): Promise<string> {
  const entry = await resolveMarketplaceAlias(ref);
  return entry?.packageName ?? ref;
}

export function __resetMarketplaceCatalogCache(): void {
  cachedCatalog = undefined;
}
