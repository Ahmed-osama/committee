import type { Tool } from 'ai';

export type ToolCostClass = 'free' | 'llm-call' | 'destructive';

export interface ToolMetadata {
  requiresApproval: boolean;
  costClass: ToolCostClass;
  allowedRoles: string[];
}

/**
 * Wraps the AI SDK's own tool type instead of redefining tool-call shapes —
 * we only add the metadata the safety/approval layer needs.
 */
export interface ToolDefinition {
  name: string;
  tool: Tool<any, any, any>;
  metadata: ToolMetadata;
}
