import { readFile, stat } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { NoteManifestSchema } from "../types.js";

describe("figma-web-capture note", () => {
  it("ships a valid manifest and markdown skill file", async () => {
    const noteDir = join(process.cwd(), "notes", "figma-web-capture");
    const manifestPath = join(noteDir, "note.json");
    const markdownPath = join(noteDir, "figma-web-capture.md");

    const manifestRaw = await readFile(manifestPath, "utf-8");
    const manifest = NoteManifestSchema.parse(JSON.parse(manifestRaw));

    const markdownStat = await stat(markdownPath);
    expect(markdownStat.isFile()).toBe(true);
    expect(manifest.name).toBe("figma-web-capture");
    expect(manifest.category).toBe("connect");
    expect(manifest.skills[0].file).toBe("figma-web-capture.md");
    expect(manifest.skills[0].activateOn).toBe("figma-canvas-operation");

    const markdown = await readFile(markdownPath, "utf-8");
    expect(markdown).toContain("https://mcp.figma.com/mcp/html-to-design/capture.js");
    expect(markdown).toContain("HTTP 200");
    expect(markdown).toContain("Copy to clipboard");
    expect(markdown).toContain("Select element");
    expect(markdown).toContain("implementation detail");
  });
});
