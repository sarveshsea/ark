import { z } from "zod";

export const SHADCN_REGISTRY_SCHEMA_URL = "https://ui.shadcn.com/schema/registry.json";
export const SHADCN_REGISTRY_ITEM_SCHEMA_URL = "https://ui.shadcn.com/schema/registry-item.json";

export const ShadcnRegistryItemTypeSchema = z.enum([
  "registry:style",
  "registry:theme",
  "registry:block",
  "registry:component",
  "registry:ui",
  "registry:lib",
  "registry:hook",
  "registry:page",
  "registry:file",
]);

export const ShadcnRegistryFileTypeSchema = ShadcnRegistryItemTypeSchema;

export const ShadcnCssVarGroupSchema = z.record(z.string());

export const ShadcnCssVarsSchema = z.object({
  theme: ShadcnCssVarGroupSchema.optional(),
  light: ShadcnCssVarGroupSchema.optional(),
  dark: ShadcnCssVarGroupSchema.optional(),
}).partial().passthrough();

export const ShadcnRegistryFileSchema = z.object({
  path: z.string().min(1),
  type: ShadcnRegistryFileTypeSchema,
  target: z.string().min(1).optional(),
  content: z.string().optional(),
}).passthrough();

export const ShadcnRegistryItemSchema = z.object({
  $schema: z.string().url().default(SHADCN_REGISTRY_ITEM_SCHEMA_URL),
  name: z.string().min(1),
  type: ShadcnRegistryItemTypeSchema,
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  author: z.string().optional(),
  registryDependencies: z.array(z.string().min(1)).optional(),
  dependencies: z.array(z.string().min(1)).optional(),
  devDependencies: z.array(z.string().min(1)).optional(),
  files: z.array(ShadcnRegistryFileSchema).default([]),
  tailwind: z.record(z.unknown()).optional(),
  cssVars: ShadcnCssVarsSchema.optional(),
  categories: z.array(z.string().min(1)).optional(),
  docs: z.string().optional(),
  meta: z.record(z.unknown()).optional(),
}).passthrough();

export const ShadcnRegistrySchema = z.object({
  $schema: z.string().url().default(SHADCN_REGISTRY_SCHEMA_URL),
  name: z.string().min(1),
  homepage: z.string().url().optional(),
  items: z.array(ShadcnRegistryItemSchema).default([]),
  meta: z.record(z.unknown()).optional(),
}).passthrough();

export type ShadcnRegistryItemType = z.infer<typeof ShadcnRegistryItemTypeSchema>;
export type ShadcnRegistryFileType = z.infer<typeof ShadcnRegistryFileTypeSchema>;
export type ShadcnCssVars = z.infer<typeof ShadcnCssVarsSchema>;
export type ShadcnRegistryFile = z.infer<typeof ShadcnRegistryFileSchema>;
export type ShadcnRegistryItem = z.infer<typeof ShadcnRegistryItemSchema>;
export type ShadcnRegistry = z.infer<typeof ShadcnRegistrySchema>;

export function parseShadcnRegistry(raw: unknown): ShadcnRegistry {
  return ShadcnRegistrySchema.parse(raw);
}

export function parseShadcnRegistryItem(raw: unknown): ShadcnRegistryItem {
  return ShadcnRegistryItemSchema.parse(raw);
}

export function safeParseShadcnRegistry(raw: unknown): { success: true; data: ShadcnRegistry } | { success: false; error: string } {
  const result = ShadcnRegistrySchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: formatZodError(result.error) };
}

export function safeParseShadcnRegistryItem(raw: unknown): { success: true; data: ShadcnRegistryItem } | { success: false; error: string } {
  const result = ShadcnRegistryItemSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, error: formatZodError(result.error) };
}

export function shadcnItemRoute(name: string): string {
  return `/r/${toShadcnItemName(name)}.json`;
}

export function toShadcnItemName(name: string): string {
  return name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function formatZodError(error: z.ZodError): string {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  }).join("; ");
}
