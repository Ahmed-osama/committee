import type { ToolSet } from 'ai';
import type { ToolDefinition } from '../domain/tool.js';

/** Extracts the AI-SDK-facing tool set from our metadata-carrying definitions. */
export function toToolSet(defs: Record<string, ToolDefinition>): ToolSet {
  return Object.fromEntries(Object.entries(defs).map(([name, def]) => [name, def.tool]));
}

/** Filters tools to what an agent is actually allowed to call. */
export function filterForAgent(defs: Record<string, ToolDefinition>, toolAllowList: string[]): Record<string, ToolDefinition> {
  return Object.fromEntries(Object.entries(defs).filter(([name]) => toolAllowList.includes(name)));
}
