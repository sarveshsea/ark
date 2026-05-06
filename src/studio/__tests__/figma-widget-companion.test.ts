import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("figma widget studio companion", () => {
  it("surfaces Studio bridge context and active sync actions", async () => {
    const ui = await readFile(join(process.cwd(), "src", "plugin", "ui", "main.ts"), "utf-8");
    const styles = await readFile(join(process.cwd(), "src", "plugin", "ui", "styles.css"), "utf-8");

    expect(ui).toContain("Studio companion");
    expect(ui).toContain("studio-runtime");
    expect(ui).toContain("data-action=\"studio-full-sync\"");
    expect(ui).toContain("data-action=\"studio-pull-stickies\"");
    expect(ui).toContain("data-action=\"studio-open\"");
    expect(ui).toContain("lastSyncAt");
    expect(ui).toContain("agentStatuses");

    expect(styles).toContain(".studio-companion");
    expect(styles).toContain(".studio-companion-grid");
  });
});
