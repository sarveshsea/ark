import { spawnSync } from "child_process";
import type { Command } from "commander";
import { join, resolve } from "path";
import type { MemoireEngine } from "../engine/core.js";
import type { ComponentSpec } from "../specs/types.js";
import { publishRegistry } from "../registry/publisher.js";
import { ui } from "../tui/format.js";
import { formatElapsed } from "../utils/format.js";
import { getMemoirePackageVersion } from "../utils/package-version.js";
import {
  applyThemeToProject,
  createThemeVariants,
  diffThemes,
  getTheme,
  importThemeFromSource,
  saveTheme,
  slugifyThemeName,
  writeThemePackageArtifacts,
  writeThemePreview,
  type StoredTheme,
  type ThemeDiffResult,
  type ThemeVariantRecipe,
} from "../themes/workflow.js";

const VALID_VARIANT_RECIPES: ThemeVariantRecipe[] = ["dark", "warm", "enterprise", "high-contrast"];

export function registerThemeCommand(program: Command, engine: MemoireEngine): void {
  const theme = program
    .command("theme")
    .description("Import, validate, preview, diff, apply, variant, and publish tweakcn themes");

  theme
    .command("import <source>")
    .description("Import a tweakcn CSS file or share URL into .memoire/themes")
    .option("--name <name>", "Theme name override")
    .option("--apply", "Apply the imported theme to the current Memoire registry after import")
    .option("-o, --output <dir>", "Output directory for generated theme files")
    .option("--mode <mode>", "Registry merge strategy when used with --apply: replace or merge", "merge")
    .option("--json", "Output results as JSON")
    .action(async (source: string, opts: {
      name?: string;
      apply?: boolean;
      output?: string;
      mode?: string;
      json?: boolean;
    }) => {
      const start = Date.now();
      await engine.init();

      try {
        const imported = await importThemeFromSource({
          arkDir: join(engine.config.projectRoot, ".memoire"),
          source,
          name: opts.name,
          cwd: engine.config.projectRoot,
        });

        let applySummary: ReturnType<typeof serializeApplyPayload> | null = null;
        if (opts.apply) {
          const mode = parseApplyMode(opts.mode);
          const outDir = resolveThemeOutputDir(engine.config.projectRoot, opts.output, imported.theme.slug);
          const applied = await applyThemeToProject({
            theme: imported.theme,
            designSystem: engine.registry.designSystem,
            outputDir: outDir,
            mode,
          });
          await engine.registry.updateDesignSystem(applied.designSystem);
          const preview = await writeThemePreview(imported.theme, join(outDir, "theme-preview.html"));
          applySummary = serializeApplyPayload(imported.theme, mode, applied, true, preview.outFile);
        }

        if (opts.json) {
          console.log(JSON.stringify({
            status: "imported",
            theme: serializeTheme(imported.theme),
            filePath: imported.filePath,
            apply: applySummary,
            elapsedMs: Date.now() - start,
          }, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Imported ${imported.theme.name}`));
        console.log(ui.dots("Stored", imported.filePath));
        console.log(ui.dots("Tokens", String(imported.theme.tokens.length)));
        console.log(ui.dots("Dark mode", imported.theme.hasDarkMode ? "yes" : "no"));
        console.log(ui.dots("Validation", `${imported.theme.validation.summary.errors} errors, ${imported.theme.validation.summary.warnings} warnings`));
        if (applySummary) {
          console.log(ui.dots("Applied", applySummary.outDir));
          console.log(ui.dots("Files", String(applySummary.filesWritten.length)));
        }
        console.log(ui.dim(`  (${formatElapsed(Date.now() - start)})`));
        console.log();
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("preview [name]")
    .description("Build a static preview gallery for a saved tweakcn theme")
    .option("-o, --output <file>", "Output HTML file (default: preview/generated/theme-<slug>.html)")
    .option("--json", "Output results as JSON")
    .action(async (name: string | undefined, opts: { output?: string; json?: boolean }) => {
      const start = Date.now();
      await engine.init();

      try {
        const selected = await requireTheme(engine, name);
        const outFile = opts.output
          ? resolve(opts.output)
          : join(engine.config.projectRoot, "preview", "generated", `theme-${selected.slug}.html`);
        const preview = await writeThemePreview(selected, outFile);

        if (opts.json) {
          console.log(JSON.stringify({
            status: "preview-built",
            theme: serializeTheme(selected),
            outFile: preview.outFile,
            elapsedMs: Date.now() - start,
          }, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Built preview for ${selected.name}`));
        console.log(ui.dots("HTML", preview.outFile));
        console.log(ui.dim(`  (${formatElapsed(Date.now() - start)})`));
        console.log();
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("validate [name]")
    .description("Validate a saved tweakcn theme for semantic coverage and contrast")
    .option("--json", "Output results as JSON")
    .action(async (name: string | undefined, opts: { json?: boolean }) => {
      await engine.init();

      try {
        const selected = await requireTheme(engine, name);
        if (opts.json) {
          console.log(JSON.stringify({
            status: selected.validation.status,
            theme: serializeTheme(selected),
            validation: selected.validation,
          }, null, 2));
          process.exitCode = selected.validation.status === "fail" ? 1 : 0;
          return;
        }

        console.log();
        console.log(ui.section(`THEME VALIDATION — ${selected.name}`));
        console.log();
        if (selected.validation.issues.length === 0) {
          console.log(ui.ok("Theme passed all validation checks"));
        } else {
          for (const issue of selected.validation.issues) {
            const prefix = issue.severity === "error" ? ui.fail(issue.message) : ui.warn(issue.message);
            console.log(prefix);
          }
        }
        console.log();
        process.exitCode = selected.validation.status === "fail" ? 1 : 0;
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("diff <from> <to>")
    .description("Compare two imported themes semantically")
    .option("--json", "Output results as JSON")
    .action(async (from: string, to: string, opts: { json?: boolean }) => {
      await engine.init();

      try {
        const before = await requireTheme(engine, from);
        const after = await requireTheme(engine, to);
        const diff = diffThemes(before, after);

        if (opts.json) {
          console.log(JSON.stringify({ status: "diffed", diff }, null, 2));
          return;
        }

        printThemeDiff(diff);
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("apply [name]")
    .description("Apply an imported theme to the current registry and emit app-ready theme files")
    .option("--mode <mode>", "Registry merge strategy: replace or merge", "merge")
    .option("-o, --output <dir>", "Output directory for generated theme files")
    .option("--no-registry", "Do not update .memoire/design-system.json")
    .option("--json", "Output results as JSON")
    .action(async (name: string | undefined, opts: {
      mode?: string;
      output?: string;
      registry?: boolean;
      json?: boolean;
    }) => {
      const start = Date.now();
      await engine.init();

      try {
        const selected = await requireTheme(engine, name);
        const mode = parseApplyMode(opts.mode);
        const outDir = resolveThemeOutputDir(engine.config.projectRoot, opts.output, selected.slug);
        const applied = await applyThemeToProject({
          theme: selected,
          designSystem: engine.registry.designSystem,
          outputDir: outDir,
          mode,
        });
        const preview = await writeThemePreview(selected, join(outDir, "theme-preview.html"));

        if (opts.registry !== false) {
          await engine.registry.updateDesignSystem(applied.designSystem);
        }

        const payload = serializeApplyPayload(selected, mode, applied, opts.registry !== false, preview.outFile);
        if (opts.json) {
          console.log(JSON.stringify({
            status: "applied",
            ...payload,
            elapsedMs: Date.now() - start,
          }, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Applied ${selected.name}`));
        console.log(ui.dots("Mode", mode));
        console.log(ui.dots("Output", payload.outDir));
        console.log(ui.dots("Registry", payload.registryUpdated ? "updated" : "skipped"));
        console.log(ui.dots("Preview", payload.previewFile ?? "none"));
        console.log(ui.dots("Files", String(payload.filesWritten.length)));
        console.log(ui.dim(`  (${formatElapsed(Date.now() - start)})`));
        console.log();
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("variants [name]")
    .description("Generate saved variants from an imported tweakcn theme")
    .option("--recipe <recipes...>", "Variant recipes: dark, warm, enterprise, high-contrast")
    .option("--json", "Output results as JSON")
    .action(async (name: string | undefined, opts: { recipe?: string[]; json?: boolean }) => {
      await engine.init();

      try {
        const selected = await requireTheme(engine, name);
        const recipes = parseRecipes(opts.recipe);
        const variants = createThemeVariants(selected, recipes);
        const themeDir = join(engine.config.projectRoot, ".memoire");
        const saved: Array<{ theme: ReturnType<typeof serializeTheme>; filePath: string }> = [];

        for (const variant of variants) {
          const filePath = await saveTheme(themeDir, variant);
          saved.push({ theme: serializeTheme(variant), filePath });
        }

        if (opts.json) {
          console.log(JSON.stringify({
            status: "variants-created",
            base: serializeTheme(selected),
            variants: saved,
          }, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Generated ${saved.length} variants from ${selected.name}`));
        for (const entry of saved) {
          console.log(ui.dots(entry.theme.name, entry.filePath));
        }
        console.log();
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });

  theme
    .command("publish [name]")
    .description("Build a publishable npm package from an imported tweakcn theme")
    .requiredOption("--package <name>", "npm package name (e.g. @acme/theme)")
    .option("--version <version>", "Package version", "0.1.0")
    .option("--dir <dir>", "Output directory (default: ./<package-slug>)")
    .option("--description <text>", "Package description")
    .option("--homepage <url>", "Homepage URL")
    .option("--license <spdx>", "License identifier", "MIT")
    .option("--with-components", "Bundle current component specs into the theme package")
    .option("--framework <fw...>", "Bundle code for frameworks when used with --with-components")
    .option("--push", "Run `npm publish --access public` after building the package")
    .option("--json", "Output results as JSON")
    .action(async (name: string | undefined, opts: {
      package: string;
      version?: string;
      dir?: string;
      description?: string;
      homepage?: string;
      license?: string;
      withComponents?: boolean;
      framework?: string[];
      push?: boolean;
      json?: boolean;
    }) => {
      const start = Date.now();
      await engine.init();

      try {
        const selected = await requireTheme(engine, name);
        const packageName = opts.package;
        const componentSpecs = opts.withComponents
          ? (await engine.registry.getAllSpecs()).filter((spec): spec is ComponentSpec => spec.type === "component")
          : [];
        const outDir = opts.dir
          ? resolve(opts.dir)
          : resolve(engine.config.projectRoot, packageName.replace(/^@[^/]+\//, ""));

        const result = await publishRegistry({
          name: packageName,
          version: opts.version ?? "0.1.0",
          description: opts.description ?? `${selected.name} tweakcn theme published with Memoire`,
          homepage: opts.homepage,
          license: opts.license,
          outDir,
          designSystem: {
            tokens: selected.tokens,
            components: engine.registry.designSystem.components,
            styles: engine.registry.designSystem.styles,
            lastSync: selected.importedAt,
          },
          specs: componentSpecs,
          memoireVersion: getMemoirePackageVersion(),
          frameworks: (opts.framework as Array<"react" | "vue" | "svelte"> | undefined) ?? ["react"],
          specsOnly: !opts.withComponents,
        });
        const artifacts = await writeThemePackageArtifacts(result.outDir, selected);

        if (opts.push) {
          const published = spawnSync("npm", ["publish", "--access", "public"], {
            cwd: result.outDir,
            stdio: "inherit",
          });
          if (published.status !== 0) {
            throw new Error(`npm publish exited ${published.status ?? 1}`);
          }
        }

        if (opts.json) {
          console.log(JSON.stringify({
            status: "published",
            theme: serializeTheme(selected),
            packageName,
            version: opts.version ?? "0.1.0",
            outDir: result.outDir,
            filesWritten: result.filesWritten,
            themeArtifact: artifacts.themePath,
            previewArtifact: artifacts.previewPath,
            pushed: Boolean(opts.push),
            elapsedMs: Date.now() - start,
          }, null, 2));
          return;
        }

        console.log();
        console.log(ui.ok(`Built theme package ${packageName}@${opts.version ?? "0.1.0"}`));
        console.log(ui.dots("Output", result.outDir));
        console.log(ui.dots("Theme", artifacts.themePath));
        console.log(ui.dots("Preview", artifacts.previewPath));
        console.log(ui.dots("Files", String(result.filesWritten.length + 2)));
        console.log();
        if (opts.push) {
          console.log(ui.ok(`Published ${packageName} to npm`));
        } else {
          console.log(ui.dim("  Next steps:"));
          console.log(`    cd ${result.outDir}`);
          console.log("    npm publish --access public");
        }
        console.log();
      } catch (err) {
        handleThemeFailure(err, opts.json);
      }
    });
}

async function requireTheme(engine: MemoireEngine, reference?: string): Promise<StoredTheme> {
  const theme = await getTheme(join(engine.config.projectRoot, ".memoire"), reference);
  if (!theme) {
    throw new Error(reference
      ? `Theme "${reference}" not found. Run \`memi theme import <source>\` first.`
      : "No imported themes found. Run `memi theme import <source>` first.");
  }
  return theme;
}

function parseApplyMode(mode: string | undefined): "replace" | "merge" {
  if (!mode || mode === "merge") return "merge";
  if (mode === "replace") return "replace";
  throw new Error(`Invalid apply mode "${mode}". Use "merge" or "replace".`);
}

function parseRecipes(recipes: string[] | undefined): ThemeVariantRecipe[] {
  if (!recipes || recipes.length === 0) return [...VALID_VARIANT_RECIPES];
  const values = recipes.map((recipe) => recipe.toLowerCase());
  const invalid = values.filter((recipe) => !VALID_VARIANT_RECIPES.includes(recipe as ThemeVariantRecipe));
  if (invalid.length > 0) {
    throw new Error(`Invalid theme recipe${invalid.length === 1 ? "" : "s"}: ${invalid.join(", ")}`);
  }
  return [...new Set(values)] as ThemeVariantRecipe[];
}

function resolveThemeOutputDir(projectRoot: string, output: string | undefined, slug: string): string {
  return output
    ? resolve(output)
    : join(projectRoot, "generated", "themes", slugifyThemeName(slug));
}

function serializeTheme(theme: StoredTheme) {
  return {
    name: theme.name,
    slug: theme.slug,
    importedAt: theme.importedAt,
    source: theme.source,
    tokens: theme.tokens.length,
    hasDarkMode: theme.hasDarkMode,
    summary: theme.summary,
    validation: theme.validation.summary,
    lineage: theme.lineage ?? null,
  };
}

function serializeApplyPayload(
  theme: StoredTheme,
  mode: "replace" | "merge",
  applied: Awaited<ReturnType<typeof applyThemeToProject>>,
  registryUpdated: boolean,
  previewFile: string | null,
) {
  return {
    theme: serializeTheme(theme),
    mode,
    outDir: applied.outDir,
    filesWritten: applied.filesWritten,
    registryUpdated,
    previewFile,
  };
}

function printThemeDiff(diff: ThemeDiffResult): void {
  console.log();
  console.log(ui.section(`THEME DIFF — ${diff.from.name} -> ${diff.to.name}`));
  console.log();
  if (diff.highlights.length > 0) {
    for (const highlight of diff.highlights) {
      console.log(ui.active(highlight));
    }
    console.log();
  }
  if (diff.tokens.added.length > 0) console.log(ui.ok(`${diff.tokens.added.length} added token${diff.tokens.added.length === 1 ? "" : "s"}`));
  if (diff.tokens.removed.length > 0) console.log(ui.warn(`${diff.tokens.removed.length} removed token${diff.tokens.removed.length === 1 ? "" : "s"}`));
  if (diff.tokens.changed.length > 0) console.log(ui.active(`${diff.tokens.changed.length} changed token${diff.tokens.changed.length === 1 ? "" : "s"}`));
  if (diff.contrastRegressions.length > 0) {
    console.log();
    console.log(ui.warn(`${diff.contrastRegressions.length} contrast regression${diff.contrastRegressions.length === 1 ? "" : "s"}`));
    for (const regression of diff.contrastRegressions) {
      console.log(`  ${regression.pair} (${regression.mode}) ${regression.from} -> ${regression.to}`);
    }
  }
  console.log();
}

function handleThemeFailure(err: unknown, json: boolean | undefined): void {
  const message = err instanceof Error ? err.message : String(err);
  if (json) {
    console.log(JSON.stringify({ status: "failed", error: message }, null, 2));
  } else {
    console.log();
    console.log(ui.fail(message));
    console.log();
  }
  process.exitCode = 1;
}
