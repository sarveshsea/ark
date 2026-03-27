import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { NoteManifestSchema } from "../types.js";

describe("packaged note assets", () => {
  it("ships manifest-declared files for every built-in note package", async () => {
    const notesRoot = join(process.cwd(), "notes");
    const entries = await readdir(notesRoot, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const noteDir = join(notesRoot, entry.name);
      let manifestRaw: string;
      try {
        manifestRaw = await readFile(join(noteDir, "note.json"), "utf-8");
      } catch {
        continue;
      }
      const manifest = NoteManifestSchema.parse(JSON.parse(manifestRaw));

      for (const skill of manifest.skills) {
        const skillStat = await stat(join(noteDir, skill.file));
        expect(skillStat.isFile()).toBe(true);
      }
    }
  });

  it("does not reference missing packaged assets in self-improving-agent", async () => {
    const noteDir = join(process.cwd(), "notes", "self-improving-agent");
    const manifestRaw = await readFile(join(noteDir, "note.json"), "utf-8");
    const manifest = NoteManifestSchema.parse(JSON.parse(manifestRaw));
    const markdown = await readFile(join(noteDir, manifest.skills[0].file), "utf-8");

    for (const ref of extractPackagedNoteRefs(markdown, manifest.name)) {
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
