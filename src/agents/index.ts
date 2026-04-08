/**
 * Agent system — re-exports for clean imports.
 */

export { AgentOrchestrator, classifyIntent } from "./orchestrator.js";
export type {
  IntentCategory,
  AgentPlan,
  SubTask,
  SubAgentType,
  AgentContext,
  AgentExecutionResult,
  DesignMutation,
} from "./orchestrator.js";

// Direct exports from extracted modules for independent use
export { classifyIntent as classifyIntentDirect, INTENT_PATTERNS } from "./intent-classifier.js";
export type { IntentCategory as IntentClass } from "./intent-classifier.js";
export { PlanBuilder } from "./plan-builder.js";
export type { AgentPlan as Plan, SubTask as PlanTask } from "./plan-builder.js";

export { AGENT_PROMPTS } from "./prompts.js";
