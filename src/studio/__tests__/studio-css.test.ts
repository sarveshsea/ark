import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("studio visual cleanup", () => {
  it("does not use decorative grid texture backgrounds", async () => {
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");

    expect(css).not.toMatch(/linear-gradient\([^;\n]*(?:1px|32px)[^;\n]*transparent/i);
    expect(css).not.toMatch(/background-size:\s*32px\s+32px/i);
  });

  it("uses one font family and only three font-size tokens", async () => {
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");
    const fontFamilies = Array.from(css.matchAll(/font-family:\s*([^;]+);/g)).map((match) => match[1].trim());
    const rawFontSizes = Array.from(css.matchAll(/font-size:\s*([^;]+);/g)).map((match) => match[1].trim());

    expect(css).toContain("--font-studio:");
    expect(css).toContain("--font-size-xs:");
    expect(css).toContain("--font-size-sm:");
    expect(css).toContain("--font-size-md:");
    expect(new Set(fontFamilies)).toEqual(new Set(["var(--font-studio)"]));
    expect(new Set(rawFontSizes)).toEqual(new Set([
      "var(--font-size-xs)",
      "var(--font-size-sm)",
      "var(--font-size-md)",
    ]));
  });

  it("keeps memory rows dense and clipped instead of overflowing columns", async () => {
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");

    expect(css).toContain(".active-widgets");
    expect(css).toContain(".memory-row > span");
    expect(css).toContain("min-width: 0");
    expect(css).toContain("text-overflow: ellipsis");
    expect(css).toContain("overflow: hidden");
    expect(css).toContain(".tag-list");
    expect(css).toContain(".memory-table.compact");
  });

  it("defines explicit dark-mode contrast for chat, memory, and marketplace text", async () => {
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");

    expect(css).toContain(".studio-shell.theme-dark .terminal-block pre");
    expect(css).toContain(".studio-shell.theme-dark .block-run_context pre");
    expect(css).toContain(".studio-shell.theme-dark .memory-title strong");
    expect(css).toContain(".studio-shell.theme-dark .marketplace-note strong");
    expect(css).toContain(".studio-shell.theme-dark .marketplace-note footer span");
    expect(css).toContain(".studio-shell.theme-dark .empty-state h2");
  });
});
