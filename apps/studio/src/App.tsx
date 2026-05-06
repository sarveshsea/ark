import { useEffect, useMemo, useRef, useState } from "react";
import {
  cancelSession,
  cancelMarkdownCorpusSetup,
  connectFigma,
  disconnectFigma,
  analyzeMarkdownForFigJam,
  getConfig,
  getFigmaStatus,
  getMarkdownCorpusStatus,
  getMarketplaceNotes,
  getProjectMemory,
  getStatus,
  installMarketplaceNote,
  listHarnesses,
  openFigma,
  refreshProjectMemory,
  removeMarketplaceNote,
  runFigmaAction,
  saveConfig,
  setupMarkdownCorpus,
  startSession,
  subscribeSession,
  syncMarkdownToFigJam,
  type FigmaAction,
  type FigmaActionResult,
  type FigmaStatus,
  type Harness,
  type HarnessId,
  type MarkdownAnalysisReport,
  type MarkdownCorpusStatus,
  type MarkdownFigJamSyncResult,
  type MarketplaceNote,
  type MarketplaceNotesPayload,
  type ProjectMemoryIndex,
  type ProjectMemoryItem,
  type ProjectMemoryKind,
  type SessionSummary,
  type StudioAction,
  type StudioConfig,
  type StudioEvent,
  type StudioStatus,
} from "./studio-api";
import {
  CommandBar,
  SideList,
  TerminalBlock as TerminalBlockSurface,
  TopWidget,
  WorkbenchPanel,
} from "./studio-primitives";

const STARTER_PROMPTS = [
  { label: "Hero", prompt: "Design a notes-app hero with references, tokens, and React handoff." },
  { label: "Audit", prompt: "Audit this workspace for design-system drift." },
  { label: "Spec", prompt: "Create an atomic dashboard shell spec." },
];

const ACTIONS: Array<{ id: StudioAction; label: string }> = [
  { id: "compose", label: "Compose" },
  { id: "design-doc", label: "Doc" },
  { id: "audit", label: "Audit" },
  { id: "references", label: "Refs" },
  { id: "video", label: "Video" },
  { id: "raw", label: "Raw" },
];

const DESIGN_FLOW = ["Brief", "Refs", "Specs", "Audit"];
const WORKSPACE_LABEL = "Memoire workspace";
type StudioPageId = ProjectMemoryKind | "marketplace";
const MEMORY_PAGES: Array<{ id: StudioPageId; label: string }> = [
  { id: "home", label: "Home" },
  { id: "research", label: "Research" },
  { id: "spec", label: "Specs" },
  { id: "system", label: "Systems" },
  { id: "monitor", label: "Monitor" },
  { id: "marketplace", label: "Marketplace" },
  { id: "changelog", label: "Changelog" },
];

function MemoireLogoMark() {
  return (
    <svg className="memoire-logo-mark" viewBox="0 0 512 512" width="24" height="24" aria-hidden="true">
      <defs>
        <path
          id="memoire-studio-petal"
          d="M256 220C236 194 196 176 181 139C167 104 184 72 217 67C237 64 250 75 256 88C262 75 275 64 295 67C328 72 345 104 331 139C316 176 276 194 256 220Z"
        />
        <mask id="memoire-studio-flower-mask" maskUnits="userSpaceOnUse">
          <rect width="512" height="512" fill="black" />
          <use href="#memoire-studio-petal" fill="white" />
          <use href="#memoire-studio-petal" fill="white" transform="rotate(90 256 256)" />
          <use href="#memoire-studio-petal" fill="white" transform="rotate(180 256 256)" />
          <use href="#memoire-studio-petal" fill="white" transform="rotate(270 256 256)" />
          <path d="M256 204C264 232 280 248 308 256C280 264 264 280 256 308C248 280 232 264 204 256C232 248 248 232 256 204Z" fill="black" />
          <g fill="black">
            <path d="M256 126C243 154 244 188 256 220C268 188 269 154 256 126Z" />
            <circle cx="256" cy="145" r="15" />
            <path d="M256 126C243 154 244 188 256 220C268 188 269 154 256 126Z" transform="rotate(90 256 256)" />
            <circle cx="367" cy="256" r="15" />
            <path d="M256 126C243 154 244 188 256 220C268 188 269 154 256 126Z" transform="rotate(180 256 256)" />
            <circle cx="256" cy="367" r="15" />
            <path d="M256 126C243 154 244 188 256 220C268 188 269 154 256 126Z" transform="rotate(270 256 256)" />
            <circle cx="145" cy="256" r="15" />
          </g>
        </mask>
      </defs>
      <rect width="512" height="512" fill="currentColor" mask="url(#memoire-studio-flower-mask)" />
    </svg>
  );
}

const FIGMA_ACTIONS: Array<{ id: FigmaAction; label: string; primary?: boolean }> = [
  { id: "fullSync", label: "Full sync", primary: true },
  { id: "inspectSelection", label: "Inspect" },
  { id: "pullTokens", label: "Pull tokens" },
  { id: "pullComponents", label: "Pull components" },
  { id: "pullStickies", label: "Pull stickies" },
  { id: "captureScreenshot", label: "Screenshot" },
];

const INSPECTOR_TABS = [
  { id: "result", label: "Result" },
  { id: "files", label: "Files" },
  { id: "references", label: "Refs" },
  { id: "settings", label: "Settings" },
  { id: "raw", label: "Raw" },
] as const;

type InspectorTab = (typeof INSPECTOR_TABS)[number]["id"];
type TerminalBlockKind =
  | "run_context"
  | "stdout_group"
  | "stderr_group"
  | "session_result"
  | "artifact_group"
  | "agentic_group"
  | "lifecycle";

interface TerminalBlock {
  id: string;
  kind: TerminalBlockKind;
  title: string;
  meta: string;
  timestamp: string | null;
  messages: string[];
  data?: unknown;
  events: StudioEvent[];
}

const ARTIFACT_EVENT_TYPES = new Set([
  "artifact",
  "file_change",
  "screenshot",
  "design_preview",
  "token_usage",
  "video_project_created",
  "video_render_started",
  "video_render_completed",
  "video_render_failed",
]);

const AGENTIC_EVENT_TYPES = new Set([
  "reasoning",
  "tool_call",
  "approval_request",
  "auth_status",
  "harness_log",
  "package_log",
  "research_note",
  "design_decision",
]);

export function App() {
  const feedRef = useRef<HTMLElement | null>(null);
  const [status, setStatus] = useState<StudioStatus | null>(null);
  const [harnesses, setHarnesses] = useState<Harness[]>([]);
  const [selectedHarness, setSelectedHarness] = useState<HarnessId>("memoire");
  const [selectedAction, setSelectedAction] = useState<StudioAction>("compose");
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("result");
  const [themeMode, setThemeMode] = useState<"light" | "dark">("light");
  const [prompt, setPrompt] = useState(STARTER_PROMPTS[0].prompt);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMemoryPage, setActiveMemoryPage] = useState<StudioPageId>("home");
  const [projectMemory, setProjectMemory] = useState<ProjectMemoryIndex | null>(null);
  const [marketplaceNotes, setMarketplaceNotes] = useState<MarketplaceNote[]>([]);
  const [marketplaceSummary, setMarketplaceSummary] = useState<MarketplaceNotesPayload["summary"] | null>(null);
  const [marketplaceQuery, setMarketplaceQuery] = useState("");
  const [marketplaceCategory, setMarketplaceCategory] = useState("all");
  const [marketplaceBusy, setMarketplaceBusy] = useState<string | null>(null);
  const [figmaStatus, setFigmaStatus] = useState<FigmaStatus | null>(null);
  const [figmaActionResult, setFigmaActionResult] = useState<FigmaActionResult | null>(null);
  const [figmaConnecting, setFigmaConnecting] = useState(false);
  const [figmaActionRunning, setFigmaActionRunning] = useState(false);
  const [figmaError, setFigmaError] = useState<string | null>(null);
  const [markdownCorpusStatus, setMarkdownCorpusStatus] = useState<MarkdownCorpusStatus | null>(null);
  const [markdownCorpusBusy, setMarkdownCorpusBusy] = useState(false);
  const [markdownCorpusError, setMarkdownCorpusError] = useState<string | null>(null);
  const [markdownSourcePath, setMarkdownSourcePath] = useState("");
  const [markdownAnalysis, setMarkdownAnalysis] = useState<MarkdownAnalysisReport | null>(null);
  const [markdownSyncResult, setMarkdownSyncResult] = useState<MarkdownFigJamSyncResult | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<StudioConfig | null>(null);
  const [settingsSavedAt, setSettingsSavedAt] = useState<string | null>(null);
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!session) return;
    return subscribeSession(session.id, (event) => {
      setEvents((current) => [...current, event]);
    });
  }, [session]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight });
  }, [events.length, session?.id]);

  const currentHarness = useMemo(
    () => harnesses.find((harness) => harness.id === selectedHarness),
    [harnesses, selectedHarness],
  );

  const effectiveAction: StudioAction = selectedHarness === "memoire" ? selectedAction : "raw";
  const latestResult = [...events].reverse().find((event) => event.type === "session_result") ?? null;
  const artifactEvents = events.filter((event) => ARTIFACT_EVENT_TYPES.has(event.type));
  const sessionStatus = deriveSessionStatus(session, events);
  const visibleSessionStatus = isStartingSession ? "starting" : sessionStatus;
  const isSessionActive = isStartingSession || sessionStatus === "running";
  const memoryItems = projectMemory?.items ?? [];
  const itemsByKind = useMemo(
    () => MEMORY_PAGES.reduce((acc, page) => {
      if (page.id === "marketplace") return acc;
      acc[page.id] = memoryItems.filter((item) => item.kind === page.id);
      return acc;
    }, {} as Record<ProjectMemoryKind, ProjectMemoryItem[]>),
    [memoryItems],
  );
  const marketplaceCategories = useMemo(
    () => ["all", ...Array.from(new Set(marketplaceNotes.map((note) => note.category))).sort()],
    [marketplaceNotes],
  );
  const filteredMarketplaceNotes = useMemo(() => {
    const query = marketplaceQuery.trim().toLowerCase();
    return marketplaceNotes.filter((note) => {
      const matchesCategory = marketplaceCategory === "all" || note.category === marketplaceCategory;
      const haystack = `${note.title} ${note.name} ${note.description} ${note.tags.join(" ")}`.toLowerCase();
      return matchesCategory && (!query || haystack.includes(query));
    });
  }, [marketplaceCategory, marketplaceNotes, marketplaceQuery]);

  const terminalBlocks = useMemo(
    () => buildTerminalBlocks({
      session,
      events,
      harnessLabel: currentHarness?.label ?? selectedHarness,
      action: effectiveAction,
      prompt,
    }),
    [currentHarness?.label, effectiveAction, events, prompt, selectedHarness, session],
  );

  async function refresh() {
    try {
      const nextStatus = await getStatus();
      const [nextHarnesses, nextConfig, nextMemory, nextFigma, nextMarketplace] = await Promise.all([
        listHarnesses(),
        getConfig().catch(() => nextStatus.config),
        getProjectMemory().catch(() => null),
        getFigmaStatus().catch(() => null),
        getMarketplaceNotes().catch(() => null),
      ]);
      const nextMarkdownCorpus = await getMarkdownCorpusStatus().catch(() => null);
      setStatus(nextStatus);
      setHarnesses(nextHarnesses);
      setSettingsDraft(nextConfig);
      setSelectedHarness(nextConfig.defaultHarness);
      setProjectMemory(nextMemory);
      setFigmaStatus(nextFigma);
      setMarkdownCorpusStatus(nextMarkdownCorpus);
      setMarkdownSourcePath((current) => current || `${nextStatus.projectRoot}/README.md`);
      if (nextMarketplace) {
        setMarketplaceNotes(nextMarketplace.notes);
        setMarketplaceSummary(nextMarketplace.summary);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function chooseHarness(id: HarnessId) {
    setSelectedHarness(id);
    setSettingsDraft((current) => current ? { ...current, defaultHarness: id } : current);
    setSelectedAction((current) => {
      if (id !== "memoire") return "raw";
      return current === "raw" ? "compose" : current;
    });
  }

  async function saveSettings() {
    if (!settingsDraft) return;
    try {
      const saved = await saveConfig(settingsDraft);
      setSettingsDraft(saved);
      setSelectedHarness(saved.defaultHarness);
      setSettingsSavedAt(formatTime(new Date().toISOString()));
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshMemory() {
    try {
      setProjectMemory(await refreshProjectMemory());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function refreshMarketplace() {
    try {
      const nextMarketplace = await getMarketplaceNotes();
      setMarketplaceNotes(nextMarketplace.notes);
      setMarketplaceSummary(nextMarketplace.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleMarketplaceInstall(note: MarketplaceNote) {
    setMarketplaceBusy(note.id);
    try {
      const nextMarketplace = await installMarketplaceNote({ noteId: note.id });
      setMarketplaceNotes(nextMarketplace.notes);
      setMarketplaceSummary(nextMarketplace.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMarketplaceBusy(null);
    }
  }

  async function handleMarketplaceRemove(note: MarketplaceNote) {
    setMarketplaceBusy(note.id);
    try {
      const nextMarketplace = await removeMarketplaceNote(note.name);
      setMarketplaceNotes(nextMarketplace.notes);
      setMarketplaceSummary(nextMarketplace.summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setMarketplaceBusy(null);
    }
  }

  async function handleFigmaConnect() {
    setFigmaConnecting(true);
    setFigmaError(null);
    try {
      setFigmaStatus(await connectFigma(settingsDraft?.figma?.preferredPort ?? null));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFigmaError(message);
      setError(message);
    } finally {
      setFigmaConnecting(false);
    }
  }

  async function handleFigmaDisconnect() {
    setFigmaError(null);
    try {
      setFigmaStatus(await disconnectFigma());
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFigmaError(message);
      setError(message);
    }
  }

  async function handleFigmaAction(action: FigmaAction) {
    setFigmaActionRunning(true);
    setFigmaError(null);
    try {
      const result = await runFigmaAction({ action });
      setFigmaActionResult(result);
      await refreshMemory();
      setFigmaStatus(await getFigmaStatus().catch(() => figmaStatus));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFigmaError(message);
      setError(message);
    } finally {
      setFigmaActionRunning(false);
    }
  }

  async function handleFigmaOpen() {
    setFigmaError(null);
    try {
      await openFigma(settingsDraft?.figma?.lastFileKey ?? null);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setFigmaError(message);
      setError(message);
    }
  }

  async function refreshMarkdownCorpus() {
    try {
      setMarkdownCorpusStatus(await getMarkdownCorpusStatus());
      setMarkdownCorpusError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMarkdownCorpusError(message);
      setError(message);
    }
  }

  async function handleMarkdownCorpusSetup() {
    setMarkdownCorpusBusy(true);
    setMarkdownCorpusError(null);
    try {
      const next = await setupMarkdownCorpus();
      setMarkdownCorpusStatus(next);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMarkdownCorpusError(message);
      setError(message);
    } finally {
      setMarkdownCorpusBusy(false);
    }
  }

  async function handleMarkdownCancel() {
    try {
      await cancelMarkdownCorpusSetup();
      setMarkdownCorpusBusy(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMarkdownCorpusError(message);
      setError(message);
    }
  }

  async function handleMarkdownAnalyze() {
    if (!markdownSourcePath.trim()) return;
    setMarkdownCorpusBusy(true);
    setMarkdownCorpusError(null);
    try {
      setMarkdownAnalysis(await analyzeMarkdownForFigJam({ sourcePath: markdownSourcePath.trim() }));
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMarkdownCorpusError(message);
      setError(message);
    } finally {
      setMarkdownCorpusBusy(false);
    }
  }

  async function handleMarkdownSync() {
    if (!markdownSourcePath.trim()) return;
    setMarkdownCorpusBusy(true);
    setMarkdownCorpusError(null);
    try {
      const result = await syncMarkdownToFigJam({ sourcePath: markdownSourcePath.trim() });
      setMarkdownSyncResult(result);
      setMarkdownAnalysis({ status: result.status, candidates: result.candidates, summary: markdownAnalysis?.summary ?? {
        headings: 0,
        lists: 0,
        codeFences: 0,
        mermaidBlocks: 0,
        links: 0,
        tables: 0,
        frontmatter: false,
      } });
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setMarkdownCorpusError(message);
      setError(message);
    } finally {
      setMarkdownCorpusBusy(false);
    }
  }

  function patchSettings(update: (current: StudioConfig) => StudioConfig) {
    setSettingsDraft((current) => current ? update(current) : current);
  }

  async function run() {
    if (!status) return;
    setEvents([]);
    setError(null);
    setCollapsedBlockIds(new Set());
    setIsStartingSession(true);
    try {
      const nextSession = await startSession({
        harness: selectedHarness,
        action: effectiveAction,
        cwd: status.projectRoot,
        prompt,
      });
      setSession(nextSession);
      setInspectorTab("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsStartingSession(false);
    }
  }

  async function cancel() {
    if (!session) return;
    await cancelSession(session.id);
  }

  function toggleBlock(blockId: string) {
    setCollapsedBlockIds((current) => {
      const next = new Set(current);
      if (next.has(blockId)) next.delete(blockId);
      else next.add(blockId);
      return next;
    });
  }

  function attachBlock(block: TerminalBlock) {
    const snippet = block.messages.join("").trim();
    if (!snippet) return;
    setPrompt((current) => `${current.trim()}\n\nUse this ${block.title} as context:\n${trimText(snippet, 1200)}`.trim());
  }

  function countForPage(page: StudioPageId): number {
    if (page === "marketplace") return marketplaceSummary?.total ?? marketplaceNotes.length;
    return projectMemory?.counts[page] ?? 0;
  }

  function renderActiveWidgets() {
    const memoryCount = memoryItems.length;
    return (
      <section className="active-widgets" data-active-widgets data-warp-ui-adapted="mit-concepts" aria-label="Active Studio widgets">
        <TopWidget label="Session" value={visibleSessionStatus} detail={`${events.length}`} active={isSessionActive} onClick={() => setActiveMemoryPage("monitor")} />
        <TopWidget label="Harness" value={currentHarness?.label ?? selectedHarness} detail={effectiveAction} onClick={() => setActiveMemoryPage("monitor")} />
        <TopWidget label="Auth" value={currentHarness?.authStatus ?? "unknown"} detail={currentHarness?.installed ? "provider" : "missing"} onClick={() => setActiveMemoryPage("monitor")} />
        <TopWidget label="Figma" value={figmaStatus?.connectionState ?? "offline"} detail={`${figmaStatus?.clients.length ?? 0} clients`} onClick={() => setActiveMemoryPage("system")} />
        <TopWidget label="Corpus" value={markdownCorpusStatus?.status ?? "missing"} detail={`${markdownCorpusStatus?.repos.length ?? 0} repos`} onClick={() => setActiveMemoryPage("system")} />
        <TopWidget label="Memory" value={String(memoryCount)} detail="indexed" onClick={() => setActiveMemoryPage("home")} />
        <TopWidget label="Market" value={String(marketplaceSummary?.total ?? 0)} detail={`${marketplaceSummary?.installed ?? 0} installed`} onClick={() => setActiveMemoryPage("marketplace")} />
      </section>
    );
  }

  function renderConsolePanel(compact = false) {
    return (
      <section
        className={compact ? "console-panel compact" : "console-panel"}
        data-chat-workbench="input-output"
        title="Conversation"
        aria-label="Conversation"
      >
        <header className="panel-head">
          <div>
            <p className="eyebrow">Chat</p>
            <h2>Conversation</h2>
          </div>
          <div className="inline-actions">
            {session && isSessionActive ? <button type="button" onClick={cancel}>Cancel</button> : null}
            <button type="button" onClick={refresh}>Refresh</button>
          </div>
        </header>

        <section
          className="block-feed"
          data-block-feed="terminal-blocks"
          data-message-feed="chat-output"
          aria-label="Conversation output"
          ref={feedRef}
        >
          {terminalBlocks.map((block) => (
            <TerminalBlockSurface kind={block.kind} key={block.id}>
              <header>
                <div>
                  <span>{block.title}</span>
                  <small>{block.meta}</small>
                </div>
                <div className="blockActions">
                  {block.timestamp ? <time dateTime={block.timestamp}>{formatTime(block.timestamp)}</time> : null}
                  <button type="button" onClick={() => void copyText(block.messages.join(""))}>Copy</button>
                  <button type="button" onClick={() => attachBlock(block)}>Context</button>
                  <button type="button" onClick={() => toggleBlock(block.id)}>
                    {collapsedBlockIds.has(block.id) ? "Expand" : "Collapse"}
                  </button>
                </div>
              </header>
              {!collapsedBlockIds.has(block.id) ? <BlockBody block={block} /> : null}
            </TerminalBlockSurface>
          ))}

          {events.length === 0 ? (
            <div className="empty-state">
              <h2>Start with a prompt.</h2>
              <div className="starter-grid">
                {STARTER_PROMPTS.map((starter) => (
                  <button key={starter.label} type="button" onClick={() => setPrompt(starter.prompt)}>
                    {starter.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <CommandBar data-command-editor="bottom-pinned">
          <div className="command-strip">
            <label>
              <span>Harness</span>
              <select value={selectedHarness} onChange={(event) => chooseHarness(event.target.value as HarnessId)}>
                {harnesses.map((harness) => (
                  <option key={harness.id} value={harness.id} disabled={!harness.enabled}>
                    {harness.label}{harness.installed ? "" : " (missing)"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Action</span>
              <select
                value={effectiveAction}
                onChange={(event) => setSelectedAction(event.target.value as StudioAction)}
                disabled={selectedHarness !== "memoire"}
              >
                {ACTIONS.map((action) => (
                  <option key={action.id} value={action.id}>{action.label}</option>
                ))}
              </select>
            </label>
            <div className="quick-actions" aria-label="Quick actions">
              {ACTIONS.filter((action) => action.id !== "raw").map((action) => (
                <button
                  className={effectiveAction === action.id ? "active" : ""}
                  disabled={selectedHarness !== "memoire"}
                  key={action.id}
                  onClick={() => setSelectedAction(action.id)}
                  type="button"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            aria-label="Prompt"
            placeholder="Ask for a design run..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <div className="dock-actions">
            <span>{currentHarness?.label ?? selectedHarness} / {effectiveAction}</span>
            <button className="primary run-button" type="button" onClick={run} disabled={!status || !prompt.trim() || isSessionActive}>
              {isStartingSession ? "Starting..." : sessionStatus === "running" ? "Running" : status ? "Run" : "Connecting"}
            </button>
          </div>
        </CommandBar>
      </section>
    );
  }

  return (
    <main className={`studio-shell theme-${themeMode}`} data-studio-workbench="hermes-warp-terminal" data-theme={themeMode}>
      <div className="memory-shell" data-studio-workbench="memoire-project-memory">
        <header className="memory-topbar">
          <div className="wordmark-row">
            <MemoireLogoMark />
            <span className="memoire-wordmark">MEMOIRE</span>
          </div>
          <div className="topbar-actions">
            <div className="theme-toggle" data-theme-toggle aria-label="Theme">
              <button
                aria-pressed={themeMode === "light"}
                className={themeMode === "light" ? "active" : ""}
                type="button"
                onClick={() => setThemeMode("light")}
              >
                Light
              </button>
              <button
                aria-pressed={themeMode === "dark"}
                className={themeMode === "dark" ? "active" : ""}
                type="button"
                onClick={() => setThemeMode("dark")}
              >
                Dark
              </button>
            </div>
            <button type="button" onClick={refreshMemory}>Index memory</button>
            <button type="button" onClick={handleFigmaConnect}>Connect Figma</button>
          </div>
        </header>

        {renderActiveWidgets()}

        <nav className="memory-nav" data-memory-nav="Home Research Specs Systems Monitor Marketplace Changelog" aria-label="Project memory">
          {MEMORY_PAGES.map((page) => (
            <button
              aria-pressed={activeMemoryPage === page.id}
              className={activeMemoryPage === page.id ? "active" : ""}
              key={page.id}
              onClick={() => setActiveMemoryPage(page.id)}
              type="button"
            >
              {page.label}
              <span>{countForPage(page.id)}</span>
            </button>
          ))}
        </nav>

        {error ? <div className="error">{error}</div> : null}

        <section className="memory-page home-page chat-home" data-memory-page="home" hidden={activeMemoryPage !== "home"}>
          <section className="memory-layout chat-layout">
            {renderConsolePanel(true)}
            <aside className="context-rail" aria-label="Context">
              <MemoryTable compact title="Context" items={memoryItems.slice(0, 4)} empty="No context indexed." />
              <section className="panel run-state-panel">
                <div className="panel-head">
                  <div><p className="eyebrow">Run</p><h2>{visibleSessionStatus}</h2></div>
                  <span>{events.length}</span>
                </div>
                <div className="system-list compact">
                  {DESIGN_FLOW.slice(0, 3).map((step) => (
                    <article key={step}><strong>{step}</strong><span>{visibleSessionStatus}</span></article>
                  ))}
                </div>
              </section>
            </aside>
          </section>
        </section>

        <section className="memory-page" data-memory-page="research" hidden={activeMemoryPage !== "research"}>
          <MemoryTable title="Research" items={itemsByKind.research} empty="No research docs found under research/." />
        </section>

        <section className="memory-page" data-memory-page="specs" hidden={activeMemoryPage !== "spec"}>
          <MemoryTable title="Specs" items={itemsByKind.spec} empty="No specs found under specs/." />
        </section>

        <section className="memory-page" data-memory-page="systems" hidden={activeMemoryPage !== "system"}>
          <section className="memory-layout two-col">
            <MemoryTable title="Systems" items={itemsByKind.system} empty="No dashboard or preview system artifacts found." />
            <aside className="system-rail">
              <FigmaDriver
                figmaStatus={figmaStatus}
                figmaActionResult={figmaActionResult}
                figmaConnecting={figmaConnecting}
                figmaActionRunning={figmaActionRunning}
                figmaError={figmaError}
                settingsDraft={settingsDraft}
                onConnect={handleFigmaConnect}
                onDisconnect={handleFigmaDisconnect}
                onOpen={handleFigmaOpen}
                onAction={handleFigmaAction}
                onPatchSettings={patchSettings}
                onSaveSettings={saveSettings}
                settingsSavedAt={settingsSavedAt}
              />
              <MarkdownCorpusPanel
                analysis={markdownAnalysis}
                busy={markdownCorpusBusy}
                error={markdownCorpusError}
                sourcePath={markdownSourcePath}
                status={markdownCorpusStatus}
                syncResult={markdownSyncResult}
                onAnalyze={handleMarkdownAnalyze}
                onCancel={handleMarkdownCancel}
                onRefresh={refreshMarkdownCorpus}
                onSetup={handleMarkdownCorpusSetup}
                onSourcePathChange={setMarkdownSourcePath}
                onSync={handleMarkdownSync}
              />
            </aside>
          </section>
        </section>

        <section className="memory-page monitor-page" data-memory-page="monitor" hidden={activeMemoryPage !== "monitor"}>
          <section className="memory-layout split-console">
            <section className="panel" data-result-inspector="studio-context">
              <div className="panel-head">
                <div><p className="eyebrow">Monitor</p><h2>Harnesses and events</h2></div>
                <span>{status?.metrics?.activeProcesses ?? 0} proc</span>
              </div>
              <div className="harness-switcher" role="listbox" aria-label="Harnesses">
                {harnesses.map((harness) => (
                  <button
                    className={harness.id === selectedHarness ? "harness-row active" : "harness-row"}
                    data-harness-state={harness.installed ? "ready" : "missing"}
                    disabled={!harness.enabled}
                    key={harness.id}
                    onClick={() => chooseHarness(harness.id)}
                    type="button"
                  >
                    <span className="status-dot" aria-hidden="true" />
                    <strong>{harness.label}</strong>
                    <small>{harness.installed ? harness.outputParser : "missing"}</small>
                  </button>
                ))}
              </div>
              <nav className="inspector-tabs" aria-label="Inspector tabs">
                {INSPECTOR_TABS.map((tab) => (
                  <button
                    aria-pressed={inspectorTab === tab.id}
                    className={inspectorTab === tab.id ? "active" : ""}
                    key={tab.id}
                    onClick={() => setInspectorTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
              <InspectorPanel
                inspectorTab={inspectorTab}
                latestResult={latestResult}
                artifactEvents={artifactEvents}
                sessionStatus={sessionStatus}
                events={events}
                settingsDraft={settingsDraft}
                settingsSavedAt={settingsSavedAt}
                selectedHarness={selectedHarness}
                harnesses={harnesses}
                onPatchSettings={patchSettings}
                onSaveSettings={saveSettings}
              />
            </section>
            {renderConsolePanel(false)}
          </section>
        </section>

        <section className="memory-page" data-memory-page="marketplace" hidden={activeMemoryPage !== "marketplace"}>
          <MarketplaceNotes
            categories={marketplaceCategories}
            marketplaceBusy={marketplaceBusy}
            notes={filteredMarketplaceNotes}
            query={marketplaceQuery}
            selectedCategory={marketplaceCategory}
            summary={marketplaceSummary}
            onCategoryChange={setMarketplaceCategory}
            onInstall={handleMarketplaceInstall}
            onQueryChange={setMarketplaceQuery}
            onRefresh={refreshMarketplace}
            onRemove={handleMarketplaceRemove}
          />
        </section>

        <section className="memory-page" data-memory-page="changelog" hidden={activeMemoryPage !== "changelog"}>
          <MemoryTable title="Changelog" items={itemsByKind.changelog} empty="No CHANGELOG.md found." />
        </section>
      </div>
    </main>
  );
}

function MemoryTable(props: {
  title: string;
  items: ProjectMemoryItem[];
  empty: string;
  compact?: boolean;
  expandable?: boolean;
}) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const expandable = props.expandable ?? true;

  function toggleRow(id: string) {
    if (!expandable) return;
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <WorkbenchPanel className="memory-table-panel" eyebrow="Memory" title={props.title} meta={String(props.items.length)}>
      <div className={props.compact ? "memory-table compact" : "memory-table"} role="table">
        <div className="memory-row head" role="row">
          <span>Title</span>
          <span>Status</span>
          <span>Source</span>
          <span>Tags</span>
        </div>
        {props.items.length === 0 ? <p className="empty">{props.empty}</p> : null}
        {props.items.map((item) => {
          const expanded = expandedRows.has(item.id);
          return (
          <article
            className={expanded ? "memory-row expanded" : "memory-row"}
            key={item.id}
            onClick={() => toggleRow(item.id)}
            role="row"
            tabIndex={expandable ? 0 : undefined}
          >
            <span className="memory-title">
              <strong>{item.title}</strong>
              <small>{trimText(item.summary, 140)}</small>
            </span>
            <span className="memory-status">{item.status}</span>
            <span className="memory-source" title={item.sourcePath}>{displaySourceLabel(item.sourcePath)}</span>
            <span className="tag-list" title={item.tags.join(", ")}>
              {item.tags.slice(0, 4).map((tag) => <em key={tag}>{tag}</em>)}
              {item.tags.length === 0 ? <em>--</em> : null}
            </span>
            {expanded ? (
              <div className="memory-row-detail">
                <span>{item.summary || item.title}</span>
                <small>{item.sourcePath}</small>
              </div>
            ) : null}
          </article>
        );})}
      </div>
    </WorkbenchPanel>
  );
}

function MarketplaceNotes(props: {
  categories: string[];
  marketplaceBusy: string | null;
  notes: MarketplaceNote[];
  query: string;
  selectedCategory: string;
  summary: MarketplaceNotesPayload["summary"] | null;
  onCategoryChange: (category: string) => void;
  onInstall: (note: MarketplaceNote) => void;
  onQueryChange: (query: string) => void;
  onRefresh: () => void;
  onRemove: (note: MarketplaceNote) => void;
}) {
  return (
    <WorkbenchPanel
      className="marketplace-panel"
      eyebrow="Marketplace"
      title="Notes and packages"
      meta={`${props.summary?.installed ?? 0}/${props.summary?.total ?? props.notes.length} installed`}
    >
      <div className="marketplace-toolbar">
        <input
          aria-label="Search marketplace notes"
          placeholder="Search notes..."
          value={props.query}
          onChange={(event) => props.onQueryChange(event.target.value)}
        />
        <SideList label="Marketplace categories">
          {props.categories.map((category) => (
            <button
              className={props.selectedCategory === category ? "active" : ""}
              key={category}
              onClick={() => props.onCategoryChange(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </SideList>
        <button type="button" onClick={props.onRefresh}>Refresh</button>
      </div>
      <div className="marketplace-notes" data-marketplace-notes>
        {props.notes.length === 0 ? <p className="empty">No notes match this filter.</p> : null}
        {props.notes.map((note) => (
          <article className={note.installed ? "marketplace-note installed" : "marketplace-note"} data-marketplace-note-id={note.id} key={note.id}>
            <header>
              <div>
                <strong>{note.title}</strong>
                <small>{note.name} / {note.version}</small>
              </div>
              <span>{note.installed ? "installed" : note.installable ? "available" : "included"}</span>
            </header>
            <p>{trimText(note.description, 220)}</p>
            <div className="tag-list">
              <em>{note.category}</em>
              <em>{note.source}</em>
              {note.tags.slice(0, 3).map((tag) => <em key={tag}>{tag}</em>)}
            </div>
            <footer>
              <span title={note.sourcePath}>{displayMarketplaceSourceLabel(note)}</span>
              {note.installed ? (
                <button type="button" onClick={() => props.onRemove(note)} disabled={props.marketplaceBusy === note.id}>Remove</button>
              ) : (
                <button type="button" onClick={() => props.onInstall(note)} disabled={!note.installable || props.marketplaceBusy === note.id}>
                  Install
                </button>
              )}
            </footer>
          </article>
        ))}
      </div>
    </WorkbenchPanel>
  );
}

function MarkdownCorpusPanel(props: {
  analysis: MarkdownAnalysisReport | null;
  busy: boolean;
  error: string | null;
  sourcePath: string;
  status: MarkdownCorpusStatus | null;
  syncResult: MarkdownFigJamSyncResult | null;
  onAnalyze: () => void;
  onCancel: () => void;
  onRefresh: () => void;
  onSetup: () => void;
  onSourcePathChange: (value: string) => void;
  onSync: () => void;
}) {
  const repos = props.status?.repos ?? [];
  const files = repos.reduce((sum, repo) => sum + repo.files, 0);
  const bytes = repos.reduce((sum, repo) => sum + repo.bytes, 0);
  const skipped = repos.reduce((sum, repo) => sum + repo.skipped, 0);
  return (
    <section className="panel markdown-corpus-panel" data-markdown-corpus="native">
      <div className="panel-head">
        <div><p className="eyebrow">Markdown Corpus</p><h2>{props.status?.status ?? "not set up"}</h2></div>
        <span>{repos.length} repos</span>
      </div>
      <div className="figma-status-grid markdown-corpus-stats">
        <span><strong>{files}</strong> files</span>
        <span><strong>{formatBytes(bytes)}</strong> stored</span>
        <span><strong>{skipped}</strong> skipped</span>
      </div>
      <div className="inline-actions">
        <button className="primary" type="button" onClick={props.onSetup} disabled={props.busy}>
          {props.busy ? "Working" : "Setup corpus"}
        </button>
        <button type="button" onClick={props.onCancel} disabled={!props.busy}>Cancel</button>
        <button type="button" onClick={props.onRefresh} disabled={props.busy}>Refresh</button>
      </div>
      <div className="markdown-repo-list" aria-label="Markdown corpus repositories">
        {repos.slice(0, 8).map((repo) => (
          <article key={repo.repo}>
            <strong>{repo.repo}</strong>
            <span>{repo.license} / {repo.files} files / {repo.errors.length ? "error" : repo.commit.slice(0, 7)}</span>
          </article>
        ))}
        {repos.length === 0 ? <p className="empty">No corpus manifest found.</p> : null}
      </div>
      <label className="markdown-source-field">
        <span>Source path</span>
        <input
          value={props.sourcePath}
          placeholder="/path/to/file.md"
          onChange={(event) => props.onSourcePathChange(event.target.value)}
        />
      </label>
      <div className="inline-actions">
        <button type="button" onClick={props.onAnalyze} disabled={props.busy || !props.sourcePath.trim()}>Analyze</button>
        <button className="primary" type="button" onClick={props.onSync} disabled={props.busy || !props.sourcePath.trim()}>Sync to FigJam</button>
      </div>
      {props.error ? <p className="inline-error">{props.error}</p> : null}
      {props.analysis ? (
        <div className="markdown-candidates">
          <span>{props.analysis.candidates.length} candidates</span>
          {props.analysis.candidates.slice(0, 3).map((candidate) => (
            <article key={`${candidate.sourcePath}-${candidate.kind}-${candidate.title}`}>
              <strong>{candidate.title}</strong>
              <span>{candidate.kind} / {Math.round(candidate.confidence * 100)}%</span>
            </article>
          ))}
        </div>
      ) : null}
      {props.syncResult ? (
        <div className="settings-actions">
          <span>{props.syncResult.figjam.createdNodeCount} FigJam nodes</span>
          <span>{props.syncResult.figjam.artifactPath ? displaySourceLabel(props.syncResult.figjam.artifactPath) : "no artifact"}</span>
        </div>
      ) : null}
    </section>
  );
}

function FigmaDriver(props: {
  figmaStatus: FigmaStatus | null;
  figmaActionResult: FigmaActionResult | null;
  figmaConnecting: boolean;
  figmaActionRunning: boolean;
  figmaError: string | null;
  settingsDraft: StudioConfig | null;
  settingsSavedAt: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onOpen: () => void;
  onAction: (action: FigmaAction) => void;
  onPatchSettings: (update: (current: StudioConfig) => StudioConfig) => void;
  onSaveSettings: () => void;
}) {
  const figmaActionRunning = props.figmaActionRunning;
  const isBridgeConnected = props.figmaStatus?.connectionState === "connected";
  const bridgeState = props.figmaError
    ? "failed"
    : props.figmaActionRunning
      ? "action running"
      : props.figmaConnecting
        ? "scanning"
        : isBridgeConnected
          ? "connected"
          : "offline";
  const lastSync = props.figmaActionResult?.completedAt ? formatTime(props.figmaActionResult.completedAt) : "--";
  return (
    <section
      className="panel figma-driver"
      data-figma-bridge-card="compact"
      data-figma-settings="active-driver"
      data-figma-state={bridgeState}
      data-user-settings="studio-settings"
    >
      <div className="panel-head">
        <div><p className="eyebrow">Figma bridge</p><h2>{bridgeState}</h2></div>
        <span>{props.figmaStatus?.clients.length ?? 0} clients</span>
      </div>
      <div className="driver-grid">
        <label>
          <span>Port</span>
          <input
            inputMode="numeric"
            value={props.settingsDraft?.figma?.preferredPort ?? ""}
            onChange={(event) => props.onPatchSettings((current) => ({
              ...current,
              figma: {
                autoStartBridge: current.figma?.autoStartBridge ?? false,
                preferredPort: event.target.value ? Number(event.target.value) : null,
                portRange: current.figma?.portRange ?? [9223, 9232],
                lastFileKey: current.figma?.lastFileKey ?? null,
                lastConnectedAt: current.figma?.lastConnectedAt ?? null,
              },
            }))}
          />
        </label>
        <div className="bridge-state-copy">
          <span>{props.figmaError ?? (isBridgeConnected ? "Plugin bridge ready." : "Start the bridge, then connect the Figma widget.")}</span>
        </div>
      </div>
      <div className="inline-actions">
        <button type="button" onClick={props.onConnect} disabled={props.figmaConnecting || props.figmaActionRunning}>
          {props.figmaConnecting ? "Scanning" : "Start bridge"}
        </button>
        <button type="button" onClick={props.onDisconnect} disabled={!props.figmaStatus?.running || props.figmaActionRunning}>Stop bridge</button>
        <button type="button" onClick={props.onOpen}>Open Figma</button>
        <button className="primary" type="button" onClick={props.onSaveSettings} disabled={!props.settingsDraft}>Save</button>
      </div>
      <div className="figma-status-grid">
        <span><strong>{props.figmaStatus?.port ?? "--"}</strong> port</span>
        <span><strong>{props.figmaStatus?.clients.length ?? 0}</strong> clients</span>
        <span><strong>{lastSync}</strong> last sync</span>
      </div>
      <div className="figma-clients">
        {(props.figmaStatus?.clients ?? []).map((client) => (
          <article key={client.id}>
            <strong>{client.file || client.id}</strong>
            <span>{client.editor} · {client.lastPing ?? client.connectedAt}</span>
          </article>
        ))}
        {props.figmaStatus?.clients.length === 0 ? <p className="empty">No plugin clients.</p> : null}
      </div>
      <div className="figma-actions">
        {FIGMA_ACTIONS.map((action) => (
          <button
            className={action.primary ? "primary" : ""}
            disabled={!isBridgeConnected || figmaActionRunning}
            key={action.id}
            type="button"
            onClick={() => props.onAction(action.id)}
          >
            {action.label}
          </button>
        ))}
      </div>
      {props.figmaActionResult ? (
        <pre>{formatDataPreview(props.figmaActionResult).slice(0, 1800)}</pre>
      ) : null}
      <div className="settings-actions">
        <span>{props.settingsSavedAt ? `saved ${props.settingsSavedAt}` : "local settings"}</span>
      </div>
    </section>
  );
}

function InspectorPanel(props: {
  inspectorTab: InspectorTab;
  latestResult: StudioEvent | null;
  artifactEvents: StudioEvent[];
  sessionStatus: SessionSummary["status"] | "standby";
  events: StudioEvent[];
  settingsDraft: StudioConfig | null;
  settingsSavedAt: string | null;
  selectedHarness: HarnessId;
  harnesses: Harness[];
  onPatchSettings: (update: (current: StudioConfig) => StudioConfig) => void;
  onSaveSettings: () => void;
}) {
  if (props.inspectorTab === "result") {
    return (
      <section className="result-panel">
        <p className="eyebrow">Result</p>
        {props.latestResult ? (
          <>
            <strong>{props.latestResult.message}</strong>
            <pre>{formatDataPreview(props.latestResult.data)}</pre>
          </>
        ) : (
          <span className="empty">No result.</span>
        )}
      </section>
    );
  }

  if (props.inspectorTab === "files") {
    return (
      <section className="context-list">
        <p className="eyebrow">Artifacts</p>
        {props.artifactEvents.length === 0 ? <span className="empty">No artifacts.</span> : null}
        {props.artifactEvents.map((event) => (
          <article key={event.id}>
            <strong>{eventLabel(event.type)}</strong>
            <span>{event.message}</span>
          </article>
        ))}
      </section>
    );
  }

  if (props.inspectorTab === "references") {
    return (
      <section className="context-list">
        <p className="eyebrow">Flow</p>
        {DESIGN_FLOW.map((step) => (
          <article key={step}><strong>{step}</strong><span>{props.sessionStatus}</span></article>
        ))}
      </section>
    );
  }

  if (props.inspectorTab === "settings") {
    return (
      <section className="settings-panel" data-user-settings="studio-settings">
        <p className="eyebrow">Settings</p>
        <label>
          <span>Default</span>
          <select
            value={props.settingsDraft?.defaultHarness ?? props.selectedHarness}
            onChange={(event) => props.onPatchSettings((current) => ({
              ...current,
              defaultHarness: event.target.value as HarnessId,
            }))}
          >
            {props.harnesses.map((harness) => (
              <option key={harness.id} value={harness.id}>{harness.label}</option>
            ))}
          </select>
        </label>
        <div className="settings-toggles">
          {(["browser", "figma", "mcp", "shell"] as const).map((tool) => (
            <label key={tool}>
              <input
                checked={props.settingsDraft?.enabledTools?.[tool] ?? false}
                type="checkbox"
                onChange={(event) => props.onPatchSettings((current) => ({
                  ...current,
                  enabledTools: {
                    browser: current.enabledTools?.browser ?? true,
                    figma: current.enabledTools?.figma ?? true,
                    mcp: current.enabledTools?.mcp ?? true,
                    shell: current.enabledTools?.shell ?? false,
                    [tool]: event.target.checked,
                  },
                }))}
              />
              <span>{tool}</span>
            </label>
          ))}
        </div>
        <div className="settings-actions">
          <span>{props.settingsSavedAt ? `saved ${props.settingsSavedAt}` : "local"}</span>
          <button className="primary" type="button" onClick={props.onSaveSettings} disabled={!props.settingsDraft}>Save</button>
        </div>
      </section>
    );
  }

  return (
    <section className="raw-panel">
      <p className="eyebrow">Raw events</p>
      <pre>{JSON.stringify(props.events.slice(-20), null, 2)}</pre>
    </section>
  );
}

function BlockBody({ block }: { block: TerminalBlock }) {
  if (block.kind === "session_result") {
    return (
      <div className="result-body">
        <strong className="result-summary">{block.messages.join("").trim() || "Result"}</strong>
        <details className="result-details">
          <summary>Data</summary>
          <pre className="result-pre">{formatDataPreview(block.data)}</pre>
        </details>
      </div>
    );
  }
  return (
    <pre>{block.messages.join("").trimEnd() || block.title}</pre>
  );
}

function buildTerminalBlocks(input: {
  session: SessionSummary | null;
  events: StudioEvent[];
  harnessLabel: string;
  action: StudioAction;
  prompt: string;
}): TerminalBlock[] {
  const blocks: TerminalBlock[] = [];
  if (input.session) {
    blocks.push({
      id: "run-context",
      kind: "run_context",
      title: "You",
      meta: `${input.harnessLabel} / ${input.action}`,
      timestamp: input.session.startedAt,
      messages: [trimText(input.prompt, 360)],
      events: [],
    });
  }

  let activeGroup: TerminalBlock | null = null;
  for (const event of input.events) {
    const kind = blockKindForEvent(event);
    if ((kind === "stdout_group" || kind === "stderr_group") && activeGroup !== null && activeGroup.kind === kind) {
      activeGroup.messages.push(event.message);
      activeGroup.events.push(event);
      activeGroup.timestamp = event.timestamp;
      continue;
    }

    activeGroup = {
      id: `${kind}-${event.id}`,
      kind,
      title: titleForBlock(kind, event),
      meta: metaForBlock(kind, event),
      timestamp: event.timestamp,
      messages: [event.message],
      data: event.data,
      events: [event],
    };
    blocks.push(activeGroup);
  }

  return blocks;
}

function blockKindForEvent(event: StudioEvent): TerminalBlockKind {
  if (event.type === "stdout") return "stdout_group";
  if (event.type === "stderr" || event.type === "session_error") return "stderr_group";
  if (event.type === "session_result") return "session_result";
  if (ARTIFACT_EVENT_TYPES.has(event.type)) return "artifact_group";
  if (AGENTIC_EVENT_TYPES.has(event.type)) return "agentic_group";
  return "lifecycle";
}

function titleForBlock(kind: TerminalBlockKind, event: StudioEvent): string {
  if (kind === "stdout_group") return "Output";
  if (kind === "stderr_group") return event.type === "session_error" ? "Error" : "Warnings";
  if (kind === "session_result") return "Result";
  if (kind === "artifact_group") return "Artifact";
  if (kind === "agentic_group") return event.type === "tool_call" ? "Tool" : eventLabel(event.type);
  return eventLabel(event.type);
}

function metaForBlock(kind: TerminalBlockKind, event: StudioEvent): string {
  if (kind === "stdout_group") return "stdout";
  if (kind === "stderr_group") return event.type === "session_error" ? "session" : "stderr";
  if (kind === "session_result") return "parsed JSON";
  if (kind === "artifact_group") return eventLabel(event.type);
  if (kind === "agentic_group") return eventLabel(event.type);
  return "lifecycle";
}

function compactName(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? pathname;
}

function displaySourceLabel(sourcePath: string | null | undefined): string {
  if (!sourcePath) return "--";
  const normalized = sourcePath.replaceAll("\\", "/");
  const noteIndex = normalized.lastIndexOf("/notes/");
  if (noteIndex >= 0) return `notes/${compactName(normalized)}`;
  if (normalized.startsWith("notes/")) return `notes/${compactName(normalized)}`;
  const skillIndex = normalized.lastIndexOf("/skills/");
  if (skillIndex >= 0) return `skills/${compactName(normalized)}`;
  if (normalized.startsWith("skills/")) return `skills/${compactName(normalized)}`;
  if (normalized.startsWith(".memoire/")) return normalized.split("/").slice(-2).join("/");
  if (normalized.startsWith("preview/")) return normalized;
  if (normalized.startsWith("specs/")) return normalized.split("/").slice(-2).join("/");
  const parts = normalized.split("/").filter(Boolean);
  return parts.length > 2 ? parts.slice(-2).join("/") : normalized;
}

function displayMarketplaceSourceLabel(note: MarketplaceNote): string {
  if (note.packageName) return note.packageName;
  if (note.source === "legacy-skill") return "legacy skill";
  return displaySourceLabel(note.sourcePath);
}

function eventLabel(type: string): string {
  return type.replace(/_/g, " ");
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function trimText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatDataPreview(data: unknown): string {
  if (data === undefined || data === null) return "No data.";
  return JSON.stringify(data, null, 2);
}

function deriveSessionStatus(session: SessionSummary | null, events: StudioEvent[]): SessionSummary["status"] | "standby" {
  if (!session) return "standby";
  const latestTerminal = [...events].reverse().find((event) => event.type === "session_done" || event.type === "session_error");
  if (!latestTerminal) return session.status;
  if (latestTerminal.type === "session_error") return "failed";
  if (latestTerminal.message.toLowerCase().includes("cancel")) return "cancelled";
  return "completed";
}

async function copyText(value: string) {
  if (!value.trim()) return;
  await navigator.clipboard?.writeText(value).catch(() => undefined);
}
