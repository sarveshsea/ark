import { describe, expect, it } from "vitest";
import { createDesignAgentEnvelope, summarizeAgentContext } from "../agent-envelope.js";
import type { StudioAgentContext } from "../types.js";

function context(overrides: Partial<StudioAgentContext> = {}): StudioAgentContext {
  return {
    workspaceLabel: "Memoire workspace",
    projectRoot: "/tmp/memoire",
    action: "compose",
    harness: "codex",
    prompt: "Design a new onboarding flow",
    memory: {
      counts: { home: 1, research: 2, spec: 3, system: 4, monitor: 1, changelog: 0 },
      recent: [
        { kind: "research", title: "Interview themes", summary: "Screenwriter users need faster capture." },
        { kind: "spec", title: "NoteCard", summary: "Molecule for note previews." },
      ],
    },
    figma: {
      enabled: true,
      status: "connected",
      clients: 1,
      port: 9223,
    },
    ...overrides,
  };
}

describe("studio design agent envelope", () => {
  it("wraps external harness prompts in a UX research and design-system lens", () => {
    const envelope = createDesignAgentEnvelope(context());

    expect(envelope).toContain("# Mémoire Studio Agent Task");
    expect(envelope).toContain("Design/research lens");
    expect(envelope).toContain("Atomic design levels");
    expect(envelope).toContain("Project memory");
    expect(envelope).toContain("Research: 2");
    expect(envelope).toContain("Specs: 3");
    expect(envelope).toContain("Figma bridge: connected");
    expect(envelope).toContain("Design a new onboarding flow");
    expect(envelope).toContain("research_note");
    expect(envelope).toContain("design_decision");
    expect(envelope).not.toMatch(/\bark\b/i);
  });

  it("summarizes context compactly for run blocks", () => {
    const summary = summarizeAgentContext(context({ harness: "claude-code", action: "audit" }));

    expect(summary).toEqual({
      workspace: "Memoire workspace",
      harness: "claude-code",
      action: "audit",
      memory: "home 1 / research 2 / spec 3 / system 4 / monitor 1 / changelog 0",
      figma: "connected on 9223 with 1 client",
    });
  });
});
