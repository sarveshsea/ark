import type { StudioEventType, StudioOutputParser } from "./types.js";

export interface StudioNormalizedOutputEvent {
  type: StudioEventType;
  message: string;
  data?: unknown;
}

export interface StudioOutputNormalizerState {
  parser: StudioOutputParser;
  stdoutBuffer: string;
}

const STRUCTURED_EVENT_TYPES = new Set<StudioEventType>([
  "package_log",
  "harness_log",
  "auth_status",
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
  "video_project_created",
  "video_render_started",
  "video_render_completed",
  "video_render_failed",
]);

export function createStudioOutputNormalizer(parser: StudioOutputParser): StudioOutputNormalizerState {
  return { parser, stdoutBuffer: "" };
}

export function normalizeStudioOutputChunk(
  state: StudioOutputNormalizerState,
  stream: "stdout" | "stderr",
  chunk: string,
): StudioNormalizedOutputEvent[] {
  if (stream === "stderr") {
    const message = stripKnownStderrNoise(state.parser, chunk);
    return message.trim() ? [{ type: "stderr", message }] : [];
  }
  if (state.parser === "hermes-text") {
    state.stdoutBuffer += chunk;
    return [];
  }
  if (state.parser !== "memoire-jsonl" && state.parser !== "claude-stream-json" && state.parser !== "codex-jsonl") {
    return chunk ? [{ type: "stdout", message: chunk }] : [];
  }

  state.stdoutBuffer += chunk;
  return drainStructuredBuffer(state, false);
}

function stripKnownStderrNoise(parser: StudioOutputParser, chunk: string): string {
  if (parser !== "codex-jsonl") return chunk;
  return chunk
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "Reading additional input from stdin...")
    .join("\n");
}

export function flushStudioOutputNormalizer(state: StudioOutputNormalizerState): StudioNormalizedOutputEvent[] {
  if (!state.stdoutBuffer.trim()) {
    state.stdoutBuffer = "";
    return [];
  }
  if (state.parser === "hermes-text") {
    const message = state.stdoutBuffer.trim();
    state.stdoutBuffer = "";
    return message ? [{ type: "session_result", message, data: { result: message, parser: "hermes-text" } }] : [];
  }
  if (state.parser !== "memoire-jsonl" && state.parser !== "claude-stream-json" && state.parser !== "codex-jsonl") {
    const message = state.stdoutBuffer;
    state.stdoutBuffer = "";
    return [{ type: "stdout", message }];
  }
  return drainStructuredBuffer(state, true);
}

function drainStructuredBuffer(state: StudioOutputNormalizerState, force: boolean): StudioNormalizedOutputEvent[] {
  const raw = state.stdoutBuffer;
  const trimmed = raw.trim();
  if (!trimmed) {
    state.stdoutBuffer = "";
    return [];
  }

  const parsedWhole = parseJSON(trimmed);
  if (parsedWhole && state.parser === "memoire-jsonl") {
    state.stdoutBuffer = "";
    return [eventFromParsedMemoirePayload(parsedWhole)];
  }

  const lineEvents = parseCompleteJSONLines(raw, (parsed) => eventsFromParsedPayload(state.parser, parsed));
  if (lineEvents.events.length > 0) {
    state.stdoutBuffer = lineEvents.remainder;
    return lineEvents.events;
  }

  if (looksLikePendingJSON(trimmed) && !force) return [];

  state.stdoutBuffer = "";
  return [{ type: "stdout", message: raw }];
}

function parseCompleteJSONLines(
  raw: string,
  mapParsed: (parsed: unknown) => StudioNormalizedOutputEvent[],
): { events: StudioNormalizedOutputEvent[]; remainder: string } {
  const lines = raw.split(/\r?\n/);
  const hasTrailingNewline = /\r?\n$/.test(raw);
  const completeLines = hasTrailingNewline ? lines.filter((line) => line.length > 0) : lines.slice(0, -1);
  const remainder = hasTrailingNewline ? "" : (lines.at(-1) ?? "");
  const events: StudioNormalizedOutputEvent[] = [];

  for (const line of completeLines) {
    const parsed = parseJSON(line.trim());
    if (!parsed) return { events: [], remainder: raw };
    events.push(...mapParsed(parsed));
  }
  return { events, remainder };
}

function eventsFromParsedPayload(parser: StudioOutputParser, parsed: unknown): StudioNormalizedOutputEvent[] {
  if (parser === "claude-stream-json") return eventsFromClaudePayload(parsed);
  if (parser === "codex-jsonl") return eventsFromCodexPayload(parsed);
  return [eventFromParsedMemoirePayload(parsed)];
}

function eventFromParsedMemoirePayload(parsed: unknown): StudioNormalizedOutputEvent {
  if (isRecord(parsed) && typeof parsed.type === "string" && STRUCTURED_EVENT_TYPES.has(parsed.type as StudioEventType)) {
    return {
      type: parsed.type as StudioEventType,
      message: stringField(parsed.message) ?? stringField(parsed.path) ?? parsed.type,
      data: isRecord(parsed.data) ? parsed.data : parsed,
    };
  }

  return {
    type: "session_result",
    message: summarizeMemoireResult(parsed),
    data: parsed,
  };
}

function eventsFromClaudePayload(parsed: unknown): StudioNormalizedOutputEvent[] {
  if (!isRecord(parsed)) return [{ type: "stdout", message: JSON.stringify(parsed) }];
  const type = stringField(parsed.type);
  if (type === "assistant") {
    const message = isRecord(parsed.message) ? parsed.message : parsed;
    const content = Array.isArray(message.content) ? message.content : [];
    const events: StudioNormalizedOutputEvent[] = [];
    for (const part of content) {
      if (!isRecord(part)) continue;
      if (part.type === "text" && typeof part.text === "string" && part.text.trim()) {
        events.push({ type: "reasoning", message: part.text, data: part });
      }
      if (part.type === "tool_use") {
        const name = stringField(part.name) ?? "tool";
        events.push({ type: "tool_call", message: name, data: part });
      }
    }
    return events.length > 0 ? events : [{ type: "stdout", message: JSON.stringify(parsed) }];
  }
  if (type === "result") {
    const result = stringField(parsed.result) ?? stringField(parsed.message) ?? "Claude result";
    return [{ type: "session_result", message: result, data: parsed }];
  }
  if (type === "tool_use") {
    const name = stringField(parsed.name) ?? "tool";
    return [{ type: "tool_call", message: name, data: parsed }];
  }
  if (type === "error") {
    return [{ type: "session_error", message: stringField(parsed.message) ?? "Claude error", data: parsed }];
  }
  return [];
}

function eventsFromCodexPayload(parsed: unknown): StudioNormalizedOutputEvent[] {
  if (!isRecord(parsed)) return [{ type: "stdout", message: JSON.stringify(parsed) }];
  const type = stringField(parsed.type);
  const item = isRecord(parsed.item) ? parsed.item : null;

  if (item && (item.type === "function_call" || item.type === "tool_call")) {
    const name = stringField(item.name) ?? stringField(item.tool_name) ?? "tool";
    return [{ type: "tool_call", message: name, data: item }];
  }

  if (type === "agent_message" || type === "message" || type === "turn.completed") {
    const message = stringField(parsed.message) ?? stringField(parsed.text) ?? extractCodexItemText(item) ?? "Codex result";
    return [{ type: "session_result", message, data: parsed }];
  }

  if (item && item.type === "message") {
    const message = extractCodexItemText(item);
    return message ? [{ type: "reasoning", message, data: parsed }] : [];
  }

  if (type === "token_count" || type === "token_usage") {
    return [{ type: "token_usage", message: "Token usage", data: parsed }];
  }

  if (type === "error" || type === "turn.failed") {
    return [{ type: "session_error", message: stringField(parsed.message) ?? "Codex error", data: parsed }];
  }

  return [];
}

function extractCodexItemText(item: Record<string, unknown> | null): string | null {
  if (!item) return null;
  if (typeof item.text === "string") return item.text;
  if (typeof item.message === "string") return item.message;
  const content = item.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return null;
  const text = content
    .map((part) => isRecord(part) ? stringField(part.text) ?? stringField(part.content) : null)
    .filter((part): part is string => Boolean(part))
    .join("\n")
    .trim();
  return text || null;
}

function summarizeMemoireResult(parsed: unknown): string {
  if (!isRecord(parsed)) return "Memoire result";
  const category = stringField(parsed.category) ?? stringField(parsed.status) ?? "Memoire";
  const execution = isRecord(parsed.execution) ? parsed.execution : null;
  const resultStatus = execution ? stringField(execution.status) : stringField(parsed.status);
  const completedTasks = execution && typeof execution.completedTasks === "number" ? execution.completedTasks : null;
  const totalTasks = execution && typeof execution.totalTasks === "number" ? execution.totalTasks : null;
  if (resultStatus && completedTasks !== null && totalTasks !== null) {
    return `${category} ${resultStatus}: ${completedTasks}/${totalTasks} tasks`;
  }
  if (resultStatus) return `${category} ${resultStatus}`;
  if (typeof parsed.intent === "string") return parsed.intent;
  return "Memoire result";
}

function parseJSON(value: string): unknown | null {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function looksLikePendingJSON(value: string): boolean {
  return value.startsWith("{") || value.startsWith("[");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}
