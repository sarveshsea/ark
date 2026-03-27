import { readFile, stat } from "fs/promises";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { NoteManifestSchema } from "../types.js";

describe("codex-ops note", () => {
  it("ships a valid manifest and JSON-first operating guidance", async () => {
    const noteDir = join(process.cwd(), "notes", "codex-ops");
    const manifestPath = join(noteDir, "note.json");
    const markdownPath = join(noteDir, "codex-ops.md");

    const manifestRaw = await readFile(manifestPath, "utf-8");
    const manifest = NoteManifestSchema.parse(JSON.parse(manifestRaw));

    const markdownStat = await stat(markdownPath);
    expect(markdownStat.isFile()).toBe(true);
    expect(manifest.name).toBe("codex-ops");
    expect(manifest.category).toBe("connect");
    expect(manifest.skills[0].file).toBe("codex-ops.md");
    expect(manifest.skills[0].activateOn).toBe("always");

    const markdown = await readFile(markdownPath, "utf-8");
    expect(markdown).toContain("Prefer machine-readable command output");
    expect(markdown).toContain("memi compose");
    expect(markdown).toContain("memi doctor --json");
    expect(markdown).toContain("Commit and push each lane separately");
    expect(markdown).toContain("reconcile local work to `HEAD`");
  });
});
