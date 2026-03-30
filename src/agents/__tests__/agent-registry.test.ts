import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdir, rm } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { AgentRegistry } from "../agent-registry.js";
import type { AgentRegistryEntry } from "../../plugin/shared/contracts.js";

let testDir: string;
let registry: AgentRegistry;

beforeEach(async () => {
  testDir = join(tmpdir(), `memoire-agent-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  await mkdir(testDir, { recursive: true });
  registry = new AgentRegistry(testDir);
  await registry.load();
});

afterEach(async () => {
  registry.stopHealthCheck();
  await rm(testDir, { recursive: true, force: true });
});

function makeEntry(overrides: Partial<AgentRegistryEntry> = {}): AgentRegistryEntry {
  return {
    id: `agent-test-${Date.now().toString(36)}`,
    name: "test-worker",
    role: "token-engineer",
    pid: process.pid, // use own PID so isProcessAlive returns true
    port: 9223,
    status: "online",
    lastHeartbeat: Date.now(),
    registeredAt: Date.now(),
    capabilities: ["token-create"],
    ...overrides,
  };
}

describe("AgentRegistry", () => {
  it("starts empty", () => {
    expect(registry.getAll()).toHaveLength(0);
    expect(registry.onlineCount).toBe(0);
  });

  it("registers an agent", async () => {
    const entry = makeEntry();
    await registry.register(entry);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get(entry.id)).not.toBeNull();
    expect(registry.get(entry.id)!.role).toBe("token-engineer");
  });

  it("deregisters an agent", async () => {
    const entry = makeEntry();
    await registry.register(entry);
    const removed = await registry.deregister(entry.id);
    expect(removed).toBe(true);
    expect(registry.getAll()).toHaveLength(0);
  });

  it("deregister returns false for unknown ID", async () => {
    const result = await registry.deregister("nonexistent");
    expect(result).toBe(false);
  });

  it("heartbeat updates timestamp", async () => {
    const entry = makeEntry({ lastHeartbeat: 1000 });
    await registry.register(entry);
    const result = registry.heartbeat(entry.id);
    expect(result).toBe(true);
    expect(registry.get(entry.id)!.lastHeartbeat).toBeGreaterThan(1000);
  });

  it("heartbeat returns false for unknown ID", () => {
    expect(registry.heartbeat("nonexistent")).toBe(false);
  });

  it("markBusy / markOnline changes status", async () => {
    const entry = makeEntry();
    await registry.register(entry);
    registry.markBusy(entry.id);
    expect(registry.get(entry.id)!.status).toBe("busy");
    registry.markOnline(entry.id);
    expect(registry.get(entry.id)!.status).toBe("online");
  });

  it("getAvailableAgent returns matching role", async () => {
    const entry = makeEntry({ role: "design-auditor" });
    await registry.register(entry);
    expect(registry.getAvailableAgent("design-auditor")).not.toBeNull();
    expect(registry.getAvailableAgent("code-generator")).toBeNull();
  });

  it("getAvailableAgent falls back to general role", async () => {
    const entry = makeEntry({ role: "general" });
    await registry.register(entry);
    expect(registry.getAvailableAgent("code-generator")).not.toBeNull();
  });

  it("getAvailableAgent skips busy agents", async () => {
    const entry = makeEntry();
    await registry.register(entry);
    registry.markBusy(entry.id);
    expect(registry.getAvailableAgent("token-engineer")).toBeNull();
  });

  it("getByRole filters correctly", async () => {
    await registry.register(makeEntry({ id: "a", role: "token-engineer" }));
    await registry.register(makeEntry({ id: "b", role: "design-auditor" }));
    await registry.register(makeEntry({ id: "c", role: "token-engineer" }));
    expect(registry.getByRole("token-engineer")).toHaveLength(2);
    expect(registry.getByRole("design-auditor")).toHaveLength(1);
  });

  it("emits agent-registered event", async () => {
    const events: unknown[] = [];
    registry.on("agent-registered", (entry) => events.push(entry));
    await registry.register(makeEntry());
    expect(events).toHaveLength(1);
  });

  it("emits agent-deregistered event", async () => {
    const events: unknown[] = [];
    registry.on("agent-deregistered", (data) => events.push(data));
    const entry = makeEntry();
    await registry.register(entry);
    await registry.deregister(entry.id);
    expect(events).toHaveLength(1);
  });

  it("persists to disk and reloads", async () => {
    const entry = makeEntry();
    await registry.register(entry);

    // Create new registry, load from disk
    const registry2 = new AgentRegistry(testDir);
    await registry2.load();
    expect(registry2.getAll()).toHaveLength(1);
    expect(registry2.get(entry.id)!.role).toBe("token-engineer");
    registry2.stopHealthCheck();
  });

  it("evicts dead PIDs on load", async () => {
    // Register with a PID that doesn't exist
    const entry = makeEntry({ pid: 999999 });
    await registry.register(entry);

    // Reload — should evict the stale entry
    const registry2 = new AgentRegistry(testDir);
    await registry2.load();
    expect(registry2.getAll()).toHaveLength(0);
    registry2.stopHealthCheck();
  });
});
