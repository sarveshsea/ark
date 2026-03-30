import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { TaskQueue } from "../task-queue.js";

let queue: TaskQueue;

beforeEach(() => {
  queue = new TaskQueue();
});

afterEach(() => {
  queue.stop();
});

describe("TaskQueue", () => {
  it("starts empty", () => {
    const stats = queue.getStats();
    expect(stats.total).toBe(0);
    expect(stats.pending).toBe(0);
  });

  it("enqueues a task and returns an ID", () => {
    const id = queue.enqueue({
      role: "token-engineer",
      name: "update-colors",
      intent: "Update the primary color",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });
    expect(id).toBeTruthy();
    expect(queue.getStats().pending).toBe(1);
  });

  it("get retrieves a task by ID", () => {
    const id = queue.enqueue({
      role: "token-engineer",
      name: "update-colors",
      intent: "Update the primary color",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });
    const task = queue.get(id);
    expect(task).not.toBeNull();
    expect(task!.name).toBe("update-colors");
    expect(task!.status).toBe("pending");
  });

  it("get returns null for unknown ID", () => {
    expect(queue.get("nonexistent")).toBeNull();
  });

  it("claim assigns a pending task to an agent", () => {
    queue.enqueue({
      role: "token-engineer",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    const claimed = queue.claim("agent-1", "token-engineer");
    expect(claimed).not.toBeNull();
    expect(claimed!.status).toBe("claimed");
    expect(claimed!.claimedBy).toBe("agent-1");
  });

  it("claim returns null when no matching role", () => {
    queue.enqueue({
      role: "token-engineer",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    const claimed = queue.claim("agent-1", "design-auditor");
    expect(claimed).toBeNull();
  });

  it("claim respects dependencies", () => {
    const id1 = queue.enqueue({
      role: "token-engineer",
      name: "task-1",
      intent: "First",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    queue.enqueue({
      role: "token-engineer",
      name: "task-2",
      intent: "Second",
      payload: {},
      dependencies: [id1],
      timeoutMs: 30000,
    });

    // task-2 can't be claimed because task-1 isn't complete
    // But task-1 should be claimable
    const claimed = queue.claim("agent-1", "token-engineer");
    expect(claimed).not.toBeNull();
    expect(claimed!.name).toBe("task-1");

    // task-2 still not claimable
    const claimed2 = queue.claim("agent-2", "token-engineer");
    expect(claimed2).toBeNull();

    // Complete task-1, now task-2 should be claimable
    queue.complete(id1, "agent-1", { done: true });
    const claimed3 = queue.claim("agent-2", "token-engineer");
    expect(claimed3).not.toBeNull();
    expect(claimed3!.name).toBe("task-2");
  });

  it("markRunning transitions from claimed to running", () => {
    const id = queue.enqueue({
      role: "general",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    queue.claim("agent-1", "general");
    const result = queue.markRunning(id, "agent-1");
    expect(result).toBe(true);
    expect(queue.get(id)!.status).toBe("running");
  });

  it("markRunning rejects wrong agent", () => {
    const id = queue.enqueue({
      role: "general",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    queue.claim("agent-1", "general");
    expect(queue.markRunning(id, "agent-2")).toBe(false);
  });

  it("complete sets result and status", () => {
    const id = queue.enqueue({
      role: "general",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    queue.claim("agent-1", "general");
    queue.complete(id, "agent-1", { output: "done" });

    const task = queue.get(id);
    expect(task!.status).toBe("completed");
    expect(task!.result).toEqual({ output: "done" });
    expect(task!.completedAt).not.toBeNull();
  });

  it("fail sets error and status", () => {
    const id = queue.enqueue({
      role: "general",
      name: "task-1",
      intent: "Do stuff",
      payload: {},
      dependencies: [],
      timeoutMs: 30000,
    });

    queue.claim("agent-1", "general");
    queue.fail(id, "agent-1", "Something broke");

    const task = queue.get(id);
    expect(task!.status).toBe("failed");
    expect(task!.error).toBe("Something broke");
  });

  it("getStats returns correct counts", () => {
    const id1 = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.enqueue({ role: "general", name: "t2", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.enqueue({ role: "general", name: "t3", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });

    // claim picks t1 (first pending)
    queue.claim("a", "general");
    queue.complete(id1, "a", null);

    const stats = queue.getStats();
    expect(stats.pending).toBe(2);
    expect(stats.completed).toBe(1);
    expect(stats.total).toBe(3);
  });

  it("getPendingForRole filters by role", () => {
    queue.enqueue({ role: "token-engineer", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.enqueue({ role: "design-auditor", name: "t2", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });

    expect(queue.getPendingForRole("token-engineer")).toHaveLength(1);
    expect(queue.getPendingForRole("design-auditor")).toHaveLength(1);
    expect(queue.getPendingForRole("code-generator")).toHaveLength(0);
  });

  it("prune removes old completed tasks", () => {
    const id = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("a", "general");
    queue.complete(id, "a", null);

    // Force old completedAt
    queue.get(id)!.completedAt = Date.now() - 600_000;

    const pruned = queue.prune(300_000);
    expect(pruned).toBe(1);
    expect(queue.getAll()).toHaveLength(0);
  });

  it("prune preserves recent completed tasks", () => {
    const id = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("a", "general");
    queue.complete(id, "a", null);

    const pruned = queue.prune(300_000);
    expect(pruned).toBe(0);
    expect(queue.getAll()).toHaveLength(1);
  });

  it("emits task-enqueued event", () => {
    const events: unknown[] = [];
    queue.on("task-enqueued", (task) => events.push(task));
    queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    expect(events).toHaveLength(1);
  });

  it("emits task-claimed event", () => {
    const events: unknown[] = [];
    queue.on("task-claimed", (data) => events.push(data));
    queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("agent-1", "general");
    expect(events).toHaveLength(1);
  });

  it("emits task-completed event", () => {
    const events: unknown[] = [];
    queue.on("task-completed", (data) => events.push(data));
    const id = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("agent-1", "general");
    queue.complete(id, "agent-1", "result");
    expect(events).toHaveLength(1);
  });

  it("waitForTask resolves on completion", async () => {
    const id = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("agent-1", "general");

    // Complete after a short delay
    setTimeout(() => queue.complete(id, "agent-1", "done"), 10);

    const task = await queue.waitForTask(id, 5000);
    expect(task.status).toBe("completed");
    expect(task.result).toBe("done");
  });

  it("waitForTask resolves immediately for already-completed tasks", async () => {
    const id = queue.enqueue({ role: "general", name: "t1", intent: "", payload: {}, dependencies: [], timeoutMs: 30000 });
    queue.claim("agent-1", "general");
    queue.complete(id, "agent-1", "done");

    const task = await queue.waitForTask(id, 1000);
    expect(task.status).toBe("completed");
  });

  it("waitForTask rejects for unknown task", async () => {
    await expect(queue.waitForTask("nope", 100)).rejects.toThrow("not found");
  });
});
