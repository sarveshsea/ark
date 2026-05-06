import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export type HarnessId =
  | "memoire"
  | "claude-code"
  | "codex"
  | "opencode"
  | "gemini"
  | "ollama"
  | "hermes"
  | "shell";
export type StudioAction = "compose" | "design-doc" | "audit" | "references" | "video" | "raw";

export interface Harness {
  id: HarnessId;
  label: string;
  kind: string;
  provider: string;
  description: string;
  command: string;
  enabled: boolean;
  installed: boolean;
  resolvedPath?: string | null;
  authStatus?: "missing" | "needs_login" | "signed_in" | "ready" | "not_required";
  authMessage?: string;
  supportsCancel: boolean;
  outputParser: string;
}

export interface StudioProviderConfig {
  anthropic?: { enabled: boolean; envKey: "ANTHROPIC_API_KEY" };
  openai?: { enabled: boolean; envKey: "OPENAI_API_KEY" };
  openaiCompatible?: { enabled: boolean; baseUrl: string | null; envKey: string | null };
  ollama?: { enabled: boolean; baseUrl: string; defaultModel: string };
}

export interface StudioConfig {
  schemaVersion?: 1;
  workspaceRoots: string[];
  defaultHarness: HarnessId;
  defaultModel?: string | null;
  providers?: StudioProviderConfig;
  harnesses?: Array<Harness & { enabledByDefault?: boolean; installProbe?: string[]; capabilities?: StudioAction[] }>;
  enabledTools?: {
    shell: boolean;
    browser: boolean;
    figma: boolean;
    mcp: boolean;
  };
  figma?: {
    autoStartBridge: boolean;
    preferredPort: number | null;
    portRange: [number, number];
    lastFileKey: string | null;
    lastConnectedAt: string | null;
  };
}

export interface StudioStatus {
  status: string;
  projectRoot: string;
  config: StudioConfig;
  harnesses?: Harness[];
  metrics?: {
    uptimeMs: number;
    indexedSessions: number;
    activeProcesses: number;
    activeStreams: number;
    eventBufferSize: number;
    harnessProbeCacheAgeMs: number;
    enabledHarnesses: number;
  };
}

export interface SessionSummary {
  id: string;
  harness: HarnessId;
  action?: string;
  cwd: string;
  prompt: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
  exitCode: number | null;
  eventCount: number;
}

export interface StudioEvent {
  id: string;
  sessionId: string;
  type: string;
  timestamp: string;
  message: string;
  data?: unknown;
}

export type ProjectMemoryKind = "home" | "research" | "spec" | "system" | "monitor" | "changelog";

export interface MarketplaceNote {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string;
  source: "built-in-note" | "legacy-skill" | "workspace-skill" | "installed-note";
  sourcePath: string;
  sourceUrl: string | null;
  packageName: string | null;
  version: string;
  installed: boolean;
  builtIn: boolean;
  installable: boolean;
  tags: string[];
}

export interface MarketplaceNotesPayload {
  notes: MarketplaceNote[];
  summary: {
    total: number;
    builtIn: number;
    installed: number;
    installable: number;
    categories: Record<string, number>;
  };
}

export interface ProjectMemoryItem {
  id: string;
  kind: ProjectMemoryKind;
  title: string;
  summary: string;
  status: string;
  tags: string[];
  sourcePath: string;
  createdAt: string;
  updatedAt: string;
  links: Array<{ label: string; href: string }>;
  data: Record<string, unknown>;
}

export interface ProjectMemoryIndex {
  schemaVersion: 1;
  projectRoot: string;
  generatedAt: string;
  counts: Record<ProjectMemoryKind, number>;
  items: ProjectMemoryItem[];
}

export interface FigmaStatus {
  running: boolean;
  port: number | null;
  clients: Array<{
    id: string;
    file: string;
    fileKey?: string;
    editor: string;
    connectedAt: string;
    lastPing?: string;
  }>;
  connectionState: "connected" | "reconnecting" | "disconnected";
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
}

export type FigmaAction =
  | "inspectSelection"
  | "pullTokens"
  | "pullComponents"
  | "pullStyles"
  | "pullStickies"
  | "pageTree"
  | "widgetSnapshot"
  | "captureScreenshot"
  | "pushTokens"
  | "fullSync";

export interface FigmaActionResult {
  action: FigmaAction;
  status: "completed";
  completedAt: string;
  result: unknown;
  artifactPath: string | null;
}

export interface FigmaOpenResult {
  status: "opened";
  target: string;
  openedAt: string;
}

export interface MarkdownCorpusRepoStatus {
  repo: string;
  license: string;
  commit: string;
  files: number;
  bytes: number;
  skipped: number;
  errors: string[];
  fetchedAt: string;
}

export interface MarkdownCorpusStatus {
  status: "ready" | "downloading" | "partial" | "failed";
  repos: MarkdownCorpusRepoStatus[];
}

export interface MarkdownDiagramCandidate {
  title: string;
  sourcePath: string;
  kind: string;
  confidence: number;
  diagnostics: string[];
  cleanSource: string;
}

export interface MarkdownAnalysisReport {
  status: "ready";
  candidates: MarkdownDiagramCandidate[];
  summary: {
    headings: number;
    lists: number;
    codeFences: number;
    mermaidBlocks: number;
    links: number;
    tables: number;
    frontmatter: boolean;
  };
}

export interface MarkdownFigJamSyncResult {
  status: "ready";
  candidates: MarkdownDiagramCandidate[];
  figjam: {
    bridgeState: "connected";
    createdNodeCount: number;
    artifactPath: string | null;
    diagnostics: string[];
  };
}

const runtimeBase = import.meta.env.VITE_MEMOIRE_STUDIO_RUNTIME
  || (window.location.protocol.startsWith("http") ? window.location.origin : "http://127.0.0.1:8765");

function hasTauri(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

export async function getStatus(): Promise<StudioStatus> {
  if (hasTauri()) return invoke<StudioStatus>("studio_status");
  return fetchJSON<StudioStatus>("/api/status");
}

export async function listHarnesses(): Promise<Harness[]> {
  if (hasTauri()) return invoke<Harness[]>("list_harnesses");
  const payload = await fetchJSON<{ harnesses: Harness[] }>("/api/harnesses");
  return payload.harnesses;
}

export async function getConfig(): Promise<StudioConfig> {
  if (hasTauri()) return invoke<StudioConfig>("studio_config");
  const payload = await fetchJSON<{ config: StudioConfig }>("/api/config");
  return payload.config;
}

export async function saveConfig(config: StudioConfig): Promise<StudioConfig> {
  if (hasTauri()) {
    await invoke<boolean>("save_config", { config });
    return config;
  }
  const payload = await fetchJSON<{ config: StudioConfig }>("/api/config", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(config),
  });
  return payload.config;
}

export async function startSession(input: { harness: HarnessId; cwd: string; prompt: string; action?: StudioAction }): Promise<SessionSummary> {
  if (hasTauri()) {
    return invoke<SessionSummary>("start_session", {
      harness: input.harness,
      cwd: input.cwd,
      prompt: input.prompt,
      action: input.action,
    });
  }
  const payload = await fetchJSON<{ session: SessionSummary }>("/api/sessions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return payload.session;
}

export async function cancelSession(id: string): Promise<boolean> {
  if (hasTauri()) return invoke<boolean>("cancel_session", { id });
  const payload = await fetchJSON<{ cancelled: boolean }>(`/api/sessions/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  return payload.cancelled;
}

export function subscribeSession(id: string, onEvent: (event: StudioEvent) => void): () => void {
  if (hasTauri()) {
    let unlisten: (() => void) | null = null;
    void listen<StudioEvent>("studio-event", (event) => {
      if (event.payload.sessionId === id) onEvent(event.payload);
    }).then((dispose) => {
      unlisten = dispose;
    });
    return () => unlisten?.();
  }
  const source = new EventSource(`${runtimeBase}/api/sessions/${encodeURIComponent(id)}/events`);
  const types = [
    "session_started",
    "stdout",
    "stderr",
    "package_log",
    "harness_log",
    "auth_status",
    "reasoning",
    "tool_call",
    "approval_request",
    "artifact",
    "file_change",
    "screenshot",
    "design_preview",
    "research_note",
    "design_decision",
    "token_usage",
    "session_result",
    "session_done",
    "session_error",
    "video_project_created",
    "video_render_started",
    "video_render_completed",
    "video_render_failed",
  ];
  for (const type of types) {
    source.addEventListener(type, (message) => {
      onEvent(JSON.parse((message as MessageEvent).data) as StudioEvent);
    });
  }
  return () => source.close();
}

export async function getProjectMemory(): Promise<ProjectMemoryIndex> {
  return fetchJSON<ProjectMemoryIndex>("/api/project-memory");
}

export async function refreshProjectMemory(): Promise<ProjectMemoryIndex> {
  return fetchJSON<ProjectMemoryIndex>("/api/project-memory/refresh", { method: "POST" });
}

export async function getMarketplaceNotes(): Promise<MarketplaceNotesPayload> {
  return fetchJSON<MarketplaceNotesPayload>("/api/marketplace/notes");
}

export async function installMarketplaceNote(input: { noteId?: string; source?: string }): Promise<MarketplaceNotesPayload> {
  return fetchJSON<MarketplaceNotesPayload>("/api/marketplace/notes/install", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function removeMarketplaceNote(name: string): Promise<MarketplaceNotesPayload> {
  return fetchJSON<MarketplaceNotesPayload>("/api/marketplace/notes/remove", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function getProjectMemoryItem(id: string): Promise<ProjectMemoryItem> {
  const payload = await fetchJSON<{ item: ProjectMemoryItem }>(`/api/project-memory/${encodeURIComponent(id)}`);
  return payload.item;
}

export async function getFigmaStatus(): Promise<FigmaStatus> {
  return fetchJSON<FigmaStatus>("/api/figma/status");
}

export async function connectFigma(preferredPort?: number | null): Promise<FigmaStatus> {
  return fetchJSON<FigmaStatus>("/api/figma/connect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ preferredPort: preferredPort ?? null }),
  });
}

export async function disconnectFigma(): Promise<FigmaStatus> {
  return fetchJSON<FigmaStatus>("/api/figma/disconnect", { method: "POST" });
}

export async function runFigmaAction(input: { action: FigmaAction; nodeId?: string; tokens?: unknown[] }): Promise<FigmaActionResult> {
  return fetchJSON<FigmaActionResult>("/api/figma/action", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function openFigma(fileKey?: string | null): Promise<FigmaOpenResult> {
  return fetchJSON<FigmaOpenResult>("/api/figma/open", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ fileKey: fileKey ?? null }),
  });
}

export async function getMarkdownCorpusStatus(): Promise<MarkdownCorpusStatus> {
  if (hasTauri()) return invoke<MarkdownCorpusStatus>("get_markdown_corpus_status");
  return fetchJSON<MarkdownCorpusStatus>("/api/markdown-corpus/status");
}

export async function setupMarkdownCorpus(): Promise<MarkdownCorpusStatus> {
  if (hasTauri()) return invoke<MarkdownCorpusStatus>("setup_markdown_corpus");
  return fetchJSON<MarkdownCorpusStatus>("/api/markdown-corpus/setup", { method: "POST" });
}

export async function cancelMarkdownCorpusSetup(): Promise<boolean> {
  if (hasTauri()) return invoke<boolean>("cancel_markdown_corpus_setup");
  const payload = await fetchJSON<{ cancelled: boolean }>("/api/markdown-corpus/cancel", { method: "POST" });
  return payload.cancelled;
}

export async function analyzeMarkdownForFigJam(input: { sourcePath: string }): Promise<MarkdownAnalysisReport> {
  if (hasTauri()) return invoke<MarkdownAnalysisReport>("analyze_markdown_for_fig_jam", { path: input.sourcePath });
  return fetchJSON<MarkdownAnalysisReport>("/api/markdown-corpus/analyze", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function syncMarkdownToFigJam(input: { sourcePath?: string; source?: string }): Promise<MarkdownFigJamSyncResult> {
  return fetchJSON<MarkdownFigJamSyncResult>("/api/markdown-corpus/sync-to-figjam", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${runtimeBase}${path}`, init);
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(payload.error ?? response.statusText);
  }
  return response.json() as Promise<T>;
}
