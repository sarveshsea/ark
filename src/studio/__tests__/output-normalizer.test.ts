import { describe, expect, it } from "vitest";
import {
  createStudioOutputNormalizer,
  flushStudioOutputNormalizer,
  normalizeStudioOutputChunk,
} from "../output-normalizer.js";

describe("studio output normalizer", () => {
  it("turns pretty Memoire JSON stdout into one session_result event", () => {
    const state = createStudioOutputNormalizer("memoire-jsonl");
    const prettyJson = `{
  "intent": "Design a notes app hero",
  "category": "general",
  "execution": {
    "status": "completed",
    "completedTasks": 2,
    "totalTasks": 2,
    "mutationCount": 0
  }
}`;

    expect(normalizeStudioOutputChunk(state, "stdout", prettyJson.slice(0, 40))).toEqual([]);
    const events = normalizeStudioOutputChunk(state, "stdout", prettyJson.slice(40));

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      type: "session_result",
      message: "general completed: 2/2 tasks",
    });
    expect(events[0].data).toMatchObject({
      intent: "Design a notes app hero",
      execution: { status: "completed", completedTasks: 2, totalTasks: 2 },
    });
  });

  it("groups non-json stdout and stderr into block-friendly chunks", () => {
    const state = createStudioOutputNormalizer("stdio");

    expect(normalizeStudioOutputChunk(state, "stdout", "first\nsecond\n")).toEqual([
      { type: "stdout", message: "first\nsecond\n" },
    ]);
    expect(normalizeStudioOutputChunk(state, "stderr", "warning\nmore warning\n")).toEqual([
      { type: "stderr", message: "warning\nmore warning\n" },
    ]);
    expect(flushStudioOutputNormalizer(state)).toEqual([]);
  });

  it("maps Claude stream-json tool use and final result into Studio events", () => {
    const state = createStudioOutputNormalizer("claude-stream-json");
    const events = normalizeStudioOutputChunk(state, "stdout", [
      JSON.stringify({
        type: "assistant",
        message: {
          content: [
            { type: "text", text: "I will inspect the specs first." },
            { type: "tool_use", name: "Read", input: { file_path: "specs/pages/Home.json" } },
          ],
        },
      }),
      JSON.stringify({
        type: "result",
        result: "Audited the design system and found no blockers.",
        usage: { input_tokens: 20, output_tokens: 30 },
      }),
      "",
    ].join("\n"));

    expect(events).toEqual([
      expect.objectContaining({ type: "reasoning", message: "I will inspect the specs first." }),
      expect.objectContaining({
        type: "tool_call",
        message: "Read",
        data: expect.objectContaining({ name: "Read" }),
      }),
      expect.objectContaining({
        type: "session_result",
        message: "Audited the design system and found no blockers.",
      }),
    ]);
  });

  it("maps Codex JSONL tool calls and final messages into Studio events", () => {
    const state = createStudioOutputNormalizer("codex-jsonl");
    const events = normalizeStudioOutputChunk(state, "stdout", [
      JSON.stringify({
        type: "item.completed",
        item: {
          type: "function_call",
          name: "shell",
          arguments: "{\"cmd\":\"rg specs\"}",
        },
      }),
      JSON.stringify({
        type: "agent_message",
        message: "Design audit complete.",
      }),
      "",
    ].join("\n"));

    expect(events).toEqual([
      expect.objectContaining({
        type: "tool_call",
        message: "shell",
        data: expect.objectContaining({ name: "shell" }),
      }),
      expect.objectContaining({
        type: "session_result",
        message: "Design audit complete.",
      }),
    ]);
  });

  it("drops Codex stdin chatter from stderr blocks", () => {
    const state = createStudioOutputNormalizer("codex-jsonl");

    expect(normalizeStudioOutputChunk(state, "stderr", "Reading additional input from stdin...\n")).toEqual([]);
    expect(normalizeStudioOutputChunk(state, "stderr", "Reading additional input from stdin...\nreal warning\n")).toEqual([
      { type: "stderr", message: "real warning\n" },
    ]);
  });
});
