import { z } from "zod";

export const MARKETPLACE_CATALOG_VERSION = 1;
export const MARKETPLACE_CATALOG_FILENAME = "marketplace-catalog.v1.json";

export const MarketplaceCatalogComponentSchema = z.object({
  name: z.string().min(1),
  level: z.enum(["atom", "molecule", "organism", "template"]).optional(),
  category: z.string().min(1).optional(),
});

export const MarketplaceCatalogEntrySchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(1),
  packageName: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1),
  featured: z.boolean().default(false),
  installCommand: z.string().min(1),
  componentCount: z.number().int().nonnegative(),
  components: z.array(MarketplaceCatalogComponentSchema),
  sourcePath: z.string().min(1),
  sourceUrl: z.string().url(),
  screenshotPath: z.string().min(1),
  screenshotUrl: z.string().url(),
});

export const MarketplaceCatalogSchema = z.object({
  version: z.literal(MARKETPLACE_CATALOG_VERSION),
  generatedAt: z.string().datetime(),
  source: z.literal("memoire-repo"),
  entries: z.array(MarketplaceCatalogEntrySchema),
});

export type MarketplaceCatalogComponent = z.infer<typeof MarketplaceCatalogComponentSchema>;
export type MarketplaceCatalogEntry = z.infer<typeof MarketplaceCatalogEntrySchema>;
export type MarketplaceCatalog = z.infer<typeof MarketplaceCatalogSchema>;

export function parseMarketplaceCatalog(raw: unknown): MarketplaceCatalog {
  const catalog = MarketplaceCatalogSchema.parse(raw);
  return {
    ...catalog,
    entries: catalog.entries.map((entry) => ({
      ...entry,
      componentCount: entry.components.length,
    })),
  };
}

export function safeParseMarketplaceCatalog(
  raw: unknown,
): { success: true; data: MarketplaceCatalog } | { success: false; error: string } {
  const result = MarketplaceCatalogSchema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      error: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
    };
  }

  return { success: true, data: parseMarketplaceCatalog(result.data) };
}

export function findMarketplaceEntry(
  catalog: MarketplaceCatalog,
  ref: string,
): MarketplaceCatalogEntry | undefined {
  const normalized = ref.trim().toLowerCase();
  return catalog.entries.find((entry) => {
    return (
      entry.slug === normalized ||
      entry.packageName.toLowerCase() === normalized ||
      entry.title.toLowerCase() === normalized
    );
  });
}
