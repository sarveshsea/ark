import type { ProjectMemoryKind, StudioAgentContext, StudioHarnessId, StudioRunAction } from "./types.js";

const KIND_LABELS: Record<ProjectMemoryKind, string> = {
  home: "Home",
  research: "Research",
  spec: "Specs",
  system: "Systems",
  monitor: "Monitor",
  changelog: "Changelog",
};

export function createDesignAgentSystemPrompt(context: StudioAgentContext): string {
  return [
    "You are the Mémoire Studio design harness.",
    "Act as a product design, UX research, and design-system agent before acting as a coding agent.",
    "Preserve Atomic Design levels: atom, molecule, organism, template, page.",
    "Use project memory, specs, reference corpus, and Figma bridge state as first-class context.",
    "Ask for approval before destructive host actions; avoid broad filesystem changes.",
    "Report useful discoveries as research_note, design_decision, tool_call, artifact, and session_result events when the harness supports structured output.",
    `Current action: ${context.action}. Current harness: ${context.harness}.`,
  ].join(" ");
}

export function createDesignAgentEnvelope(context: StudioAgentContext): string {
  const memoryLines = Object.entries(context.memory.counts)
    .map(([kind, count]) => `- ${KIND_LABELS[kind as ProjectMemoryKind] ?? kind}: ${count}`)
    .join("\n");
  const recent = context.memory.recent.length > 0
    ? context.memory.recent
      .slice(0, 6)
      .map((item) => `- ${item.kind}: ${item.title} — ${compact(item.summary, 160)}`)
      .join("\n")
    : "- No recent memory items indexed.";
  const figma = context.figma.enabled
    ? `Figma bridge: ${context.figma.status}${context.figma.port ? ` on ${context.figma.port}` : ""} with ${context.figma.clients} client${context.figma.clients === 1 ? "" : "s"}`
    : "Figma bridge: disabled";

  return [
    "# Mémoire Studio Agent Task",
    "",
    "## Design/research lens",
    "- Start from UX research, user experience, research evidence, information architecture, accessibility, and design-system coherence.",
    "- Treat implementation as the final handoff of a design decision, not the starting point.",
    "- Keep all component thinking in Atomic design levels: atom -> molecule -> organism -> template -> page.",
    "- Prefer existing specs, tokens, references, and Figma state before creating new abstractions.",
    "- If a workflow is learned, write it down as a durable research_note or design_decision in the final response.",
    "",
    "## Harness behavior",
    `- Harness: ${context.harness}`,
    `- Action: ${context.action}`,
    "- Use tools carefully and summarize tool calls so Studio can render them as blocks.",
    "- Do not run destructive commands without explicit approval.",
    "- Produce a concise final session_result with artifacts, files changed, assumptions, and next design/research step.",
    "",
    "## Project memory",
    memoryLines,
    "",
    "## Recent context",
    recent,
    "",
    "## Figma and design system",
    `- ${figma}`,
    "- If Figma is connected, use it for selection inspection, token pulls, components, screenshots, and full sync when relevant.",
    "- If Figma is offline, continue from filesystem memory and say what could be improved after connection.",
    "",
    "## Studio event hints",
    "- research_note: evidence, user insight, assumption, source, or question worth saving.",
    "- design_decision: a product/design-system choice and why it improves the experience.",
    "- tool_call: any file, terminal, browser, Figma, or MCP action that materially changes context.",
    "- artifact: generated specs, docs, screenshots, patches, token exports, or reference pulls.",
    "",
    "## User request",
    context.prompt.trim(),
  ].join("\n");
}

export function summarizeAgentContext(context: StudioAgentContext): {
  workspace: string;
  harness: StudioHarnessId;
  action: StudioRunAction;
  memory: string;
  figma: string;
} {
  const memory = Object.entries(context.memory.counts)
    .map(([kind, count]) => `${kind} ${count}`)
    .join(" / ");
  const figma = context.figma.enabled
    ? `${context.figma.status}${context.figma.port ? ` on ${context.figma.port}` : ""} with ${context.figma.clients} client${context.figma.clients === 1 ? "" : "s"}`
    : "disabled";

  return {
    workspace: context.workspaceLabel,
    harness: context.harness,
    action: context.action,
    memory,
    figma,
  };
}

export function basicAgentContext(input: {
  workspaceLabel?: string;
  projectRoot: string;
  action: StudioRunAction;
  harness: StudioHarnessId;
  prompt: string;
}): StudioAgentContext {
  return {
    workspaceLabel: input.workspaceLabel ?? "Memoire workspace",
    projectRoot: input.projectRoot,
    action: input.action,
    harness: input.harness,
    prompt: input.prompt,
    memory: {
      counts: { home: 0, research: 0, spec: 0, system: 0, monitor: 0, changelog: 0 },
      recent: [],
    },
    figma: {
      enabled: false,
      status: "unknown",
      clients: 0,
      port: null,
    },
  };
}

function compact(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}...`;
}
