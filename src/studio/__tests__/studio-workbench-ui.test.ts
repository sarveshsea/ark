import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("studio workbench UI", () => {
  it("exposes a Hermes/Warp terminal workbench shared by desktop and web", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");

    expect(app).toContain('data-studio-workbench="hermes-warp-terminal"');
    expect(app).toContain('data-chat-workbench="input-output"');
    expect(app).toContain('data-message-feed="chat-output"');
    expect(app).toContain('data-block-feed="terminal-blocks"');
    expect(app).toContain('data-command-editor="bottom-pinned"');
    expect(app).toContain('data-result-inspector="studio-context"');
    expect(app).toContain('data-user-settings="studio-settings"');
    expect(app).toContain('data-warp-ui-adapted="mit-concepts"');
    expect(app).toContain('data-active-widgets');
    expect(app).toContain("TopWidget");
    expect(app).toContain("WorkbenchPanel");
    expect(app).toContain("CommandBar");
    expect(app).toContain("SideList");
    expect(app).toContain("terminal-block");
    expect(app).toContain("blockActions");
    expect(app).toContain("inspectorTab");
    expect(app).toContain("settingsDraft");
    expect(app).toContain("themeMode");
    expect(app).toContain('data-theme-toggle');

    expect(css).toContain(".command-dock");
    expect(css).toContain(".terminal-block");
    expect(css).toContain(".chat-home");
    expect(css).toContain(".theme-dark");
    expect(css).toContain(".harness-switcher");
    expect(css).toContain("--accent: #d96d3b");
    expect(css).not.toMatch(/background-size:\s*(?:28px|32px)\s+(?:28px|32px)/i);
  });

  it("uses the old Memoire project-memory IA and visual language", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");
    const css = await readFile(join(process.cwd(), "apps", "studio", "src", "styles.css"), "utf-8");

    expect(app).toContain('data-studio-workbench="memoire-project-memory"');
    expect(app).toContain('data-memory-nav="Home Research Specs Systems Monitor Marketplace Changelog"');
    expect(app).toContain('data-memory-page="home"');
    expect(app).toContain('data-memory-page="research"');
    expect(app).toContain('data-memory-page="specs"');
    expect(app).toContain('data-memory-page="systems"');
    expect(app).toContain('data-memory-page="monitor"');
    expect(app).toContain('data-memory-page="marketplace"');
    expect(app).toContain('data-memory-page="changelog"');
    expect(app).toContain('data-figma-settings="active-driver"');
    expect(app).toContain("projectMemory");
    expect(app).toContain("figmaStatus");

    expect(css).toContain("--font-mono: 'JetBrains Mono'");
    expect(css).toContain("--font-serif: 'Cormorant Garamond'");
    expect(css).toContain("--surface-bg: #fafaf9");
    expect(css).toContain("--radius-default: 4px");
    expect(css).not.toContain("--color-cerulean-accent");
  });

  it("keeps the home page chat-first with less static copy", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");

    expect(app).toContain('title="Conversation"');
    expect(app).toContain('title="Context"');
    expect(app).toContain("Start with a prompt.");
    expect(app).not.toContain("Recent memory");
    expect(app).not.toContain("Product status");
    expect(app).not.toContain("Run a project command.");
  });

  it("uses a neutral Memoire workspace label and compact Figma bridge card", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");

    expect(app).toContain('const WORKSPACE_LABEL = "Memoire workspace"');
    expect(app).not.toContain("const workspaceName =");
    expect(app).not.toContain("<span>{workspaceName}</span>");
    expect(app).not.toContain("compactName(status.projectRoot)");
    expect(app).toContain('data-figma-bridge-card="compact"');
    expect(app).toContain('data-figma-state={bridgeState}');
    expect(app).toContain("figmaActionRunning");
    expect(app).toContain("disabled={!isBridgeConnected || figmaActionRunning}");
    expect(app).toContain("Full sync");
    expect(app).toContain("Pull tokens");
    expect(app).toContain("Pull components");
    expect(app).toContain("Pull stickies");
    expect(app).toContain("Screenshot");
  });

  it("renders agentic harness event blocks beyond raw stdout", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");

    expect(app).toContain("design_decision");
    expect(app).toContain("research_note");
    expect(app).toContain("tool_call");
    expect(app).toContain("approval_request");
    expect(app).toContain("agentic_group");
  });

  it("renders a first-class Notes marketplace", async () => {
    const app = await readFile(join(process.cwd(), "apps", "studio", "src", "App.tsx"), "utf-8");
    const api = await readFile(join(process.cwd(), "apps", "studio", "src", "studio-api.ts"), "utf-8");

    expect(app).toContain("marketplaceNotes");
    expect(app).toContain('data-marketplace-notes');
    expect(app).toContain('data-marketplace-note-id');
    expect(app).toContain("Install");
    expect(app).toContain("Remove");
    expect(api).toContain("getMarketplaceNotes");
    expect(api).toContain("installMarketplaceNote");
    expect(api).toContain("removeMarketplaceNote");
    expect(app).toContain("displaySourceLabel");
    expect(app).not.toContain("{note.packageName ?? note.sourcePath}");
  });
});
