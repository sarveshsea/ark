/**
 * Project Context Detection — Scans the project to understand
 * framework, existing components, design tokens, and conventions.
 */

import { readFile, access, readdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";

export const ProjectContextSchema = z.object({
  framework: z.enum(["nextjs", "remix", "vite", "cra", "astro", "unknown"]),
  language: z.enum(["typescript", "javascript"]),
  styling: z.object({
    tailwind: z.boolean(),
    tailwindVersion: z.string().optional(),
    cssModules: z.boolean(),
    styledComponents: z.boolean(),
  }),
  shadcn: z.object({
    installed: z.boolean(),
    components: z.array(z.string()),
    config: z.record(z.unknown()).optional(),
  }),
  designTokens: z.object({
    source: z.enum(["figma", "local", "none"]),
    lastSync: z.string().optional(),
    tokenCount: z.number(),
  }),
  paths: z.object({
    components: z.string(),
    pages: z.string().optional(),
    styles: z.string().optional(),
    public: z.string().optional(),
  }),
  detectedAt: z.string(),
});

export type ProjectContext = z.infer<typeof ProjectContextSchema>;

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function readJsonSafe(path: string): Promise<Record<string, unknown> | null> {
  try {
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function fileContains(path: string, patterns: RegExp[]): Promise<boolean> {
  try {
    const content = await readFile(path, "utf-8");
    return patterns.some((pattern) => pattern.test(content));
  } catch {
    return false;
  }
}

export async function detectProject(root: string): Promise<ProjectContext> {
  const pkg = await readJsonSafe(join(root, "package.json"));
  const deps = {
    ...(pkg?.dependencies as Record<string, string> | undefined),
    ...(pkg?.devDependencies as Record<string, string> | undefined),
  };

  // Detect framework
  let framework: ProjectContext["framework"] = "unknown";
  if (deps?.next) framework = "nextjs";
  else if (deps?.["@remix-run/react"]) framework = "remix";
  else if (deps?.astro) framework = "astro";
  else if (deps?.vite || (await fileExists(join(root, "vite.config.ts")))) framework = "vite";
  else if (deps?.["react-scripts"]) framework = "cra";

  // Detect language
  const hasTs = await fileExists(join(root, "tsconfig.json"));
  const language: ProjectContext["language"] = hasTs ? "typescript" : "javascript";

  const tailwindCssFiles = [
    join(root, "src", "index.css"),
    join(root, "src", "app.css"),
    join(root, "src", "globals.css"),
    join(root, "src", "styles", "globals.css"),
    join(root, "src", "styles", "app.css"),
    join(root, "app", "globals.css"),
    join(root, "styles", "globals.css"),
    join(root, "styles", "app.css"),
    join(root, "tailwind.css"),
  ];

  const hasTailwindFromCss = (await Promise.all(
    tailwindCssFiles.map((path) => fileContains(path, [/@import\s+["']tailwindcss["']/, /@tailwind\b/, /@theme\b/])),
  )).some(Boolean);

  // Detect Tailwind
  const hasTailwind = !!(
    deps?.tailwindcss ||
    deps?.["@tailwindcss/vite"] ||
    (await fileExists(join(root, "tailwind.config.ts"))) ||
    (await fileExists(join(root, "tailwind.config.js"))) ||
    (await fileExists(join(root, "tailwind.config.mjs"))) ||
    (await fileExists(join(root, "tailwind.config.cjs"))) ||
    hasTailwindFromCss
  );

  let tailwindVersion: string | undefined;
  if (hasTailwind && deps?.tailwindcss) {
    tailwindVersion = deps.tailwindcss.replace(/^\^|~/, "");
  }

  // Detect shadcn
  const shadcnConfig = await readJsonSafe(join(root, "components.json"));
  const shadcnDirs = [
    join(root, "components", "ui"),
    join(root, "src", "components", "ui"),
  ];
  let shadcnComponents: string[] = [];

  for (const uiDir of shadcnDirs) {
    try {
      const files = await readdir(uiDir);
      const detected = files
        .filter((f) => f.endsWith(".tsx") || f.endsWith(".ts") || f.endsWith(".jsx") || f.endsWith(".js"))
        .map((f) => f.replace(/\.(tsx?|jsx?)$/, ""));

      if (detected.length > 0) {
        shadcnComponents = detected;
        break;
      }
    } catch {
      // ui dir doesn't exist
    }
  }

  const hasShadcn = !!shadcnConfig || shadcnComponents.length > 0;

  // Detect CSS modules / styled-components
  const hasCssModules = !!(deps?.["css-loader"] || deps?.["@vanilla-extract/css"]);
  const hasStyledComponents = !!(deps?.["styled-components"] || deps?.["@emotion/react"]);

  // Detect paths
  const componentsPath = (await fileExists(join(root, "src", "components")))
    ? "src/components"
    : (await fileExists(join(root, "components")))
      ? "components"
      : "src/components";

  const pagesPath = framework === "nextjs"
    ? (await fileExists(join(root, "app")))
      ? "app"
      : "pages"
    : (await fileExists(join(root, "src", "pages")))
      ? "src/pages"
      : undefined;

  return {
    framework,
    language,
    styling: {
      tailwind: hasTailwind,
      tailwindVersion,
      cssModules: hasCssModules,
      styledComponents: hasStyledComponents,
    },
    shadcn: {
      installed: hasShadcn,
      components: shadcnComponents,
      config: shadcnConfig ?? undefined,
    },
    designTokens: {
      source: "none",
      tokenCount: 0,
    },
    paths: {
      components: componentsPath,
      pages: pagesPath,
      public: (await fileExists(join(root, "public"))) ? "public" : undefined,
    },
    detectedAt: new Date().toISOString(),
  };
}
