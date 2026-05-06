import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("0.15.0 release metadata", () => {
  it("aligns package, MCP, widget, and changelog versions", async () => {
    const root = process.cwd();
    const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf-8"));
    const lock = JSON.parse(await readFile(join(root, "package-lock.json"), "utf-8"));
    const server = JSON.parse(await readFile(join(root, "server.json"), "utf-8"));
    const widget = JSON.parse(await readFile(join(root, "plugin", "widget-meta.json"), "utf-8"));
    const studioPkg = JSON.parse(await readFile(join(root, "apps", "studio", "package.json"), "utf-8"));
    const studioLock = JSON.parse(await readFile(join(root, "apps", "studio", "package-lock.json"), "utf-8"));
    const studioTauri = JSON.parse(await readFile(join(root, "apps", "studio", "src-tauri", "tauri.conf.json"), "utf-8"));
    const studioCargo = await readFile(join(root, "apps", "studio", "src-tauri", "Cargo.toml"), "utf-8");
    const changelog = await readFile(join(root, "CHANGELOG.md"), "utf-8");

    expect(pkg.version).toBe("0.15.0");
    expect(lock.version).toBe("0.15.0");
    expect(lock.packages[""].version).toBe("0.15.0");
    expect(server.version).toBe("0.15.0");
    expect(server.packages.find((entry: { registryType?: string }) => entry.registryType === "npm")?.version).toBe("0.15.0");
    expect(widget.packageVersion).toBe("0.15.0");
    expect(studioPkg.version).toBe("0.15.0");
    expect(studioLock.version).toBe("0.15.0");
    expect(studioLock.packages[""].version).toBe("0.15.0");
    expect(studioTauri.version).toBe("0.15.0");
    expect(studioCargo).toMatch(/^version = "0\.15\.0"$/m);
    expect(changelog).toMatch(/^## v0\.15\.0\b/m);
    expect(changelog).toContain("Studio");
    expect(changelog).toContain("Claude Code");
    expect(changelog).toContain("Codex");
    expect(changelog).toContain("Hermes");
  });
});
