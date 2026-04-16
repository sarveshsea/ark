import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdir, readFile, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import type { DesignSystem } from "../../engine/registry.js";
import {
  applyThemeToProject,
  buildStoredTheme,
  createThemeVariants,
  diffThemes,
  getTheme,
  importThemeFromSource,
  writeThemePreview,
} from "../workflow.js";

const FULL_THEME = `
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 222.2 47.4% 21.2%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.75rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --primary-foreground: 222.2 47.4% 11.2%;
  --secondary: 217.2 32.6% 17.5%;
  --secondary-foreground: 210 40% 98%;
  --accent: 217.2 32.6% 17.5%;
  --accent-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --muted-foreground: 210 40% 78%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --popover: 222.2 84% 4.9%;
  --popover-foreground: 210 40% 98%;
  --destructive: 0 62.8% 30.6%;
  --destructive-foreground: 210 40% 98%;
  --border: 217.2 32.6% 17.5%;
  --input: 217.2 32.6% 17.5%;
  --ring: 224.3 76.3% 48%;
}
`;

const BAD_THEME = FULL_THEME
  .replace("--primary-foreground: 210 40% 98%;", "--primary-foreground: 221.2 83.2% 53.3%;")
  .replace("--primary-foreground: 222.2 47.4% 11.2%;", "--primary-foreground: 217.2 91.2% 59.8%;");

let projectRoot: string;
let arkDir: string;

beforeEach(async () => {
  projectRoot = join(tmpdir(), `memoire-theme-workflow-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  arkDir = join(projectRoot, ".memoire");
  await mkdir(arkDir, { recursive: true });
});

afterEach(async () => {
  await rm(projectRoot, { recursive: true, force: true });
});

describe("theme workflow", () => {
  it("imports and retrieves a theme from disk", async () => {
    const sourcePath = join(projectRoot, "acme.css");
    await writeFile(sourcePath, FULL_THEME, "utf-8");

    const imported = await importThemeFromSource({
      arkDir,
      source: sourcePath,
      name: "Acme Theme",
      cwd: projectRoot,
    });

    expect(imported.theme.name).toBe("Acme Theme");
    expect(imported.theme.tokens.length).toBeGreaterThan(10);

    const reloaded = await getTheme(arkDir, "Acme Theme");
    expect(reloaded?.slug).toBe("acme-theme");
    expect(reloaded?.source.kind).toBe("file");
  });

  it("applies a theme and writes app-ready files", async () => {
    const theme = buildStoredTheme({
      name: "Acme Theme",
      source: { kind: "file", value: "acme.css" },
      css: FULL_THEME,
    });

    const designSystem: DesignSystem = {
      tokens: [
        {
          name: "legacy-primary",
          collection: "legacy",
          type: "color",
          values: { default: "#111111" },
          cssVariable: "--legacy-primary",
        },
      ],
      components: [],
      styles: [],
      lastSync: "never",
    };

    const outDir = join(projectRoot, "generated", "themes", theme.slug);
    const applied = await applyThemeToProject({
      theme,
      designSystem,
      outputDir: outDir,
      mode: "merge",
    });

    expect(applied.designSystem.tokens.some((token) => token.name === "background")).toBe(true);
    expect(applied.designSystem.tokens.some((token) => token.name === "legacy-primary")).toBe(true);
    expect(applied.filesWritten).toHaveLength(4);
    const shadcnCss = await readFile(join(outDir, "shadcn-theme.css"), "utf-8");
    expect(shadcnCss).toContain("--primary");
  });

  it("generates named variants with lineage metadata", () => {
    const theme = buildStoredTheme({
      name: "Acme Theme",
      source: { kind: "file", value: "acme.css" },
      css: FULL_THEME,
    });

    const variants = createThemeVariants(theme, ["warm", "high-contrast"]);
    expect(variants).toHaveLength(2);
    expect(variants[0].name).toBe("Acme Theme Warm");
    expect(variants[1].lineage?.recipe).toBe("high-contrast");
    expect(variants[1].slug).toBe("acme-theme-high-contrast");
  });

  it("detects semantic changes and contrast regressions between themes", () => {
    const base = buildStoredTheme({
      name: "Acme Theme",
      source: { kind: "file", value: "acme.css" },
      css: FULL_THEME,
    });
    const broken = buildStoredTheme({
      name: "Acme Theme Broken",
      source: { kind: "file", value: "broken.css" },
      css: BAD_THEME,
    });

    const diff = diffThemes(base, broken);
    expect(diff.highlights).toContain("primary changed");
    expect(diff.highlights).toContain("contrast regressed");
    expect(diff.contrastRegressions.length).toBeGreaterThan(0);
  });

  it("writes an HTML preview for a theme", async () => {
    const theme = buildStoredTheme({
      name: "Acme Theme",
      source: { kind: "file", value: "acme.css" },
      css: FULL_THEME,
    });

    const outFile = join(projectRoot, "preview", "generated", "theme-acme.html");
    const preview = await writeThemePreview(theme, outFile);
    const html = await readFile(preview.outFile, "utf-8");

    expect(html).toContain("Acme Theme");
    expect(html).toContain("Memoire Theme Preview");
  });
});
