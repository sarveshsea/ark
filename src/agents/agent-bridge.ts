/**
 * AgentBridge — Agent-to-agent messaging via the WebSocket bridge.
 *
 * Routes task assignments and results between the orchestrator and
 * external agent workers. Messages are tagged with agent IDs for routing.
 */

import { EventEmitter } from "events";
import { createLogger } from "../engine/logger.js";
import type { MemoireWsServer } from "../figma/ws-server.js";
import type { AgentTaskEnvelope, AgentRegistryEntry } from "../plugin/shared/contracts.js";
import { serializeBridgeEnvelope } from "../plugin/shared/bridge.js";

const log = createLogger("agent-bridge");

export class AgentBridge extends EventEmitter {
  private wsServer: MemoireWsServer;
  private msgCounter = 0;

  constructor(wsServer: MemoireWsServer) {
    super();
    this.wsServer = wsServer;
  }

  /** Broadcast an agent registration to all connected clients. */
  broadcastRegistration(entry: AgentRegistryEntry): void {
    this.wsServer.broadcast(
      serializeBridgeEnvelope({
        channel: "memoire.bridge.v2",
        source: "server",
        type: "agent-register",
        data: entry,
      }),
    );
  }

  /** Broadcast an agent deregistration. */
  broadcastDeregistration(agentId: string): void {
    this.wsServer.broadcast(
      serializeBridgeEnvelope({
        channel: "memoire.bridge.v2",
        source: "server",
        type: "agent-deregister",
        data: { agentId },
      }),
    );
  }

  /** Send a task assignment to all connected clients (agent workers listen). */
  sendTaskAssignment(agentId: string, taskId: string, payload: unknown): void {
    const envelope: AgentTaskEnvelope = {
      id: `msg-${++this.msgCounter}-${Date.now().toString(36)}`,
      type: "task-assign",
      agentId,
      taskId,
      payload,
    };

    this.wsServer.broadcast(
      serializeBridgeEnvelope({
        channel: "memoire.bridge.v2",
        source: "server",
        type: "agent-message",
        data: envelope,
      }),
    );

    log.info({ agentId, taskId }, "Task assignment sent");
  }

  /** Send a task cancellation. */
  sendTaskCancel(agentId: string, taskId: string): void {
    const envelope: AgentTaskEnvelope = {
      id: `msg-${++this.msgCounter}-${Date.now().toString(36)}`,
      type: "task-cancel",
      agentId,
      taskId,
    };

    this.wsServer.broadcast(
      serializeBridgeEnvelope({
        channel: "memoire.bridge.v2",
        source: "server",
        type: "agent-message",
        data: envelope,
      }),
    );

    log.info({ agentId, taskId }, "Task cancellation sent");
  }

  /** Handle an incoming agent message (task result from a worker). */
  handleAgentMessage(data: AgentTaskEnvelope): void {
    switch (data.type) {
      case "task-result":
        this.emit("task-result", {
          agentId: data.agentId,
          taskId: data.taskId,
          result: data.result,
          error: data.error,
        });
        log.info({ agentId: data.agentId, taskId: data.taskId }, "Task result received");
        break;

      case "task-assign":
        // Forward to any listening agents
        this.emit("task-assign", data);
        break;

      case "task-cancel":
        this.emit("task-cancel", data);
        break;
    }
  }
}
