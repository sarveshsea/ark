import { readFile, stat } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { NoteManifestSchema } from "../types.js";

describe("packaged note assets", () => {
  it("keeps the self-improving-agent manifest aligned with shipped files", async () => {
    const noteDir = join(process.cwd(), "notes", "self-improving-agent");
    const manifestPath = join(noteDir, "note.json");

    const manifestRaw = await readFile(manifestPath, "utf-8");
    const manifest = NoteManifestSchema.parse(JSON.parse(manifestRaw));

    const noteMarkdown = await stat(join(noteDir, "self-improving-agent.md"));
    expect(noteMarkdown.isFile()).toBe(true);

    for (const skill of manifest.skills) {
      const skillPath = join(noteDir, skill.file);
      const skillStat = await stat(skillPath);
      expect(skillStat.isFile()).toBe(true);
    }

    const markdown = await readFile(join(noteDir, "self-improving-agent.md"), "utf-8");
    const packagedRefs = extractPackagedNoteRefs(markdown, manifest.name);

    for (const ref of packagedRefs) {
      const assetPath = join(process.cwd(), ref.replace(/^\.\//, ""));
      const assetStat = await stat(assetPath);
      expect(assetStat.isFile() || assetStat.isDirectory()).toBe(true);
    }
  });
});

function extractPackagedNoteRefs(markdown: string, noteName: string): string[] {
  const pattern = new RegExp(`\\./notes/${noteName}/[A-Za-z0-9._/-]+`, "g");
  const matches = markdown.match(pattern) ?? [];
  return [...new Set(matches)];
}
