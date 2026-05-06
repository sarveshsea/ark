export type StudioHarnessId =
  | "memoire"
  | "claude-code"
  | "codex"
  | "opencode"
  | "gemini"
  | "ollama"
  | "hermes"
  | "shell";

export type StudioHarnessKind = "memoire" | "external-cli" | "local-model" | "shell";
export type StudioRunAction = "compose" | "design-doc" | "audit" | "references" | "video" | "raw";
export type StudioVideoAdapterId = "remotion" | "hyperframes";
export type ProjectMemoryKind = "home" | "research" | "spec" | "system" | "monitor" | "changelog";
export type StudioFigmaAction =
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
export type StudioHarnessProvider = "memoire" | "anthropic" | "openai" | "google" | "local" | "shell";
export type StudioHarnessAuthStatus = "missing" | "needs_login" | "signed_in" | "ready" | "not_required";
export type StudioEnvPolicy = "provider" | "local-model" | "safe-inherit" | "shell";
export type StudioWorkspacePolicy = "workspace-required" | "trusted-shell";
export type StudioOutputParser =
  | "memoire-jsonl"
  | "claude-stream-json"
  | "codex-jsonl"
  | "hermes-text"
  | "stdio"
  | "ollama"
  | "shell";

export interface StudioHarnessManifest {
  schemaVersion: 1;
  hardlineBlockedPatterns: Array<{
    pattern: string;
    description: string;
  }>;
  harnesses: StudioHarnessManifestEntry[];
}

export interface StudioHarnessManifestEntry {
  id: StudioHarnessId;
  label: string;
  kind: StudioHarnessKind;
  provider: StudioHarnessProvider;
  command: string;
  description: string;
  enabledByDefault: boolean;
  installProbe: string[];
  capabilities: StudioRunAction[];
  commandTemplates: Partial<Record<StudioRunAction, string[]>>;
  envPolicy: StudioEnvPolicy;
  workspacePolicy: StudioWorkspacePolicy;
  supportsStreaming: boolean;
  supportsCancel: boolean;
  outputParser: StudioOutputParser;
  defaultModel?: string | null;
}

export interface StudioHarnessConfig extends StudioHarnessManifestEntry {
  id: StudioHarnessId;
  enabled: boolean;
}

export interface StudioHarnessStatus extends StudioHarnessConfig {
  installed: boolean;
  resolvedPath: string | null;
  probeAgeMs: number;
  authStatus: StudioHarnessAuthStatus;
  authMessage: string;
}

export interface StudioProviderConfig {
  anthropic: { enabled: boolean; envKey: "ANTHROPIC_API_KEY" };
  openai: { enabled: boolean; envKey: "OPENAI_API_KEY" };
  openaiCompatible: { enabled: boolean; baseUrl: string | null; envKey: string | null };
  ollama: { enabled: boolean; baseUrl: string; defaultModel: string };
}

export interface StudioConfig {
  schemaVersion: 1;
  workspaceRoots: string[];
  defaultHarness: StudioHarnessId;
  defaultModel: string | null;
  providers: StudioProviderConfig;
  harnesses: StudioHarnessConfig[];
  enabledTools: {
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

export type StudioEventType =
  | "session_started"
  | "stdout"
  | "stderr"
  | "package_log"
  | "harness_log"
  | "auth_status"
  | "reasoning"
  | "tool_call"
  | "approval_request"
  | "artifact"
  | "file_change"
  | "screenshot"
  | "design_preview"
  | "research_note"
  | "design_decision"
  | "token_usage"
  | "session_result"
  | "session_done"
  | "session_error"
  | "memory_indexed"
  | "memory_item_updated"
  | "figma_bridge_started"
  | "figma_bridge_stopped"
  | "figma_plugin_connected"
  | "figma_action_started"
  | "figma_action_completed"
  | "figma_action_failed"
  | "video_project_created"
  | "video_render_started"
  | "video_render_completed"
  | "video_render_failed";

export interface StudioEvent {
  id: string;
  sessionId: string;
  type: StudioEventType;
  timestamp: string;
  message: string;
  data?: unknown;
}

export interface StudioSession {
  id: string;
  harness: StudioHarnessId;
  action: StudioRunAction;
  cwd: string;
  prompt: string;
  status: "running" | "completed" | "failed" | "cancelled";
  startedAt: string;
  completedAt: string | null;
  exitCode: number | null;
  activeStreamId: string | null;
  pendingPrompt: string | null;
  events: StudioEvent[];
}

export interface StudioRunRequest {
  harnessId: StudioHarnessId;
  action?: StudioRunAction;
  cwd: string;
  prompt: string;
  agentContext?: StudioAgentContext;
}

export interface StudioCommandSpec {
  command: string;
  args: string[];
  cwd: string;
  action: StudioRunAction;
  harness: StudioHarnessId;
  outputParser: StudioOutputParser;
  env?: NodeJS.ProcessEnv;
}

export interface StudioAgentContext {
  workspaceLabel: string;
  projectRoot: string;
  action: StudioRunAction;
  harness: StudioHarnessId;
  prompt: string;
  memory: {
    counts: Record<ProjectMemoryKind, number>;
    recent: Array<{
      kind: ProjectMemoryKind | string;
      title: string;
      summary: string;
    }>;
  };
  figma: {
    enabled: boolean;
    status: string;
    clients: number;
    port: number | null;
  };
}

export interface StudioRuntimeInfo {
  host: string;
  port: number;
  url: string;
}

export interface StudioRuntimeMetrics {
  uptimeMs: number;
  indexedSessions: number;
  activeProcesses: number;
  activeStreams: number;
  eventBufferSize: number;
  harnessProbeCacheAgeMs: number;
  enabledHarnesses: number;
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

export type StudioMarketplaceNoteSource =
  | "built-in-note"
  | "legacy-skill"
  | "workspace-skill"
  | "installed-note";

export interface StudioMarketplaceNote {
  id: string;
  name: string;
  title: string;
  category: string;
  description: string;
  source: StudioMarketplaceNoteSource;
  sourcePath: string;
  sourceUrl: string | null;
  packageName: string | null;
  version: string;
  installed: boolean;
  builtIn: boolean;
  installable: boolean;
  tags: string[];
}

export interface StudioMarketplaceNotesPayload {
  notes: StudioMarketplaceNote[];
  summary: {
    total: number;
    builtIn: number;
    installed: number;
    installable: number;
    categories: Record<string, number>;
  };
}

export interface StudioFigmaClientStatus {
  id: string;
  file: string;
  fileKey?: string;
  editor: string;
  connectedAt: string;
  lastPing?: string;
}

export interface StudioFigmaStatus {
  running: boolean;
  port: number | null;
  clients: StudioFigmaClientStatus[];
  connectionState: "connected" | "reconnecting" | "disconnected";
  reconnectAttempts: number;
  lastConnectedAt: string | null;
  lastDisconnectedAt: string | null;
}

export interface StudioFigmaActionRequest {
  action: StudioFigmaAction;
  nodeId?: string;
  format?: "PNG" | "SVG";
  scale?: number;
  tokens?: { name: string; values: Record<string, string | number> }[];
}

export interface StudioFigmaActionResult {
  action: StudioFigmaAction;
  status: "completed";
  completedAt: string;
  result: unknown;
  artifactPath: string | null;
}

export interface StudioFigmaOpenRequest {
  fileKey?: string | null;
}

export interface StudioFigmaOpenResult {
  status: "opened";
  target: string;
  openedAt: string;
}

export interface StudioVideoManifest {
  schemaVersion: 1;
  id: string;
  title: string;
  prompt: string;
  adapter: StudioVideoAdapterId;
  status: "created" | "preview-ready" | "render-ready" | "rendered" | "missing-adapter";
  createdAt: string;
  updatedAt: string;
  files: string[];
}
