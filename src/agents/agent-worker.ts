/**
 * AgentWorker — Standalone agent process that registers with the daemon,
 * polls the task queue, and executes tasks.
 *
 * Usage:
 *   Spawned by `memi agent spawn <role>` or run directly.
 *   Connects to the bridge, registers itself, sends heartbeats,
 *   and claims tasks matching its role.
 */

import { createLogger } from "../engine/logger.js";
import type { AgentRegistryEntry, AgentRole } from "../plugin/shared/contracts.js";

const log = createLogger("agent-worker");

export interface AgentWorkerConfig {
  id: string;
  name: string;
  role: AgentRole;
  daemonPort: number;
  heartbeatIntervalMs: number;
}

const DEFAULT_HEARTBEAT_MS = 10_000;

export class AgentWorker {
  private config: AgentWorkerConfig;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(config: Partial<AgentWorkerConfig> & { role: AgentRole }) {
    this.config = {
      id: config.id ?? `agent-${config.role}-${Date.now().toString(36)}`,
      name: config.name ?? `${config.role}-worker`,
      role: config.role,
      daemonPort: config.daemonPort ?? 9223,
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? DEFAULT_HEARTBEAT_MS,
    };
  }

  /** Build the registry entry for this worker. */
  toRegistryEntry(): AgentRegistryEntry {
    return {
      id: this.config.id,
      name: this.config.name,
      role: this.config.role,
      pid: process.pid,
      port: this.config.daemonPort,
      status: "online",
      lastHeartbeat: Date.now(),
      registeredAt: Date.now(),
      capabilities: this.getCapabilities(),
    };
  }

  /** Start the worker — register and begin heartbeat. */
  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    log.info({ id: this.config.id, role: this.config.role }, "Agent worker starting");

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatIntervalMs);

    log.info({ id: this.config.id }, "Agent worker started — waiting for tasks");
  }

  /** Stop the worker. */
  stop(): void {
    this.running = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    log.info({ id: this.config.id }, "Agent worker stopped");
  }

  get id(): string {
    return this.config.id;
  }

  get role(): AgentRole {
    return this.config.role;
  }

  get name(): string {
    return this.config.name;
  }

  get isRunning(): boolean {
    return this.running;
  }

  /** Get capabilities for this role. */
  private getCapabilities(): string[] {
    switch (this.config.role) {
      case "token-engineer":
        return ["token-create", "token-update", "token-delete", "color-palette", "spacing-system"];
      case "component-architect":
        return ["component-create", "component-modify", "spec-create", "atomic-design"];
      case "layout-designer":
        return ["page-layout", "responsive-layout", "template-create"];
      case "dataviz-specialist":
        return ["dataviz-create", "chart-config", "data-mapping"];
      case "code-generator":
        return ["code-generate", "shadcn-map", "tailwind-style"];
      case "accessibility-checker":
        return ["wcag-audit", "aria-check", "contrast-check", "focus-order"];
      case "design-auditor":
        return ["design-audit", "token-coverage", "naming-check", "consistency"];
      case "research-analyst":
        return ["research-synthesis", "persona-create", "insight-extract"];
      case "general":
        return ["general-task"];
      default:
        return [];
    }
  }

  private sendHeartbeat(): void {
    // Heartbeat is handled by the registry when the worker
    // is registered in-process. For remote workers, this would
    // send a WebSocket message.
    log.debug({ id: this.config.id }, "Heartbeat");
  }
}
