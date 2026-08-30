import type { AgentConfig } from '../domain/agent.js';
import { nextTick } from '../persistence/repositories/scheduler-repo.js';
import { takeAgentTurn, type AgentTurnOutcome } from './agent-turn.js';
import { EventBus } from './event-bus.js';

export interface AdvanceTicksOptions {
  agents: AgentConfig[];
  bus?: EventBus;
  onTick?: (tick: number, outcomes: AgentTurnOutcome[]) => void;
}

/**
 * The Game-of-Life clock. Each tick, every agent gets a chance to react —
 * dispatched concurrently (Promise.all), not one after another, so a tick
 * never waits on one slow LLM call before letting other agents take their
 * turn in the same generation. The tick counter is persisted, so calling
 * this again in a later CLI invocation continues counting rather than
 * restarting at 0.
 */
export async function advanceTicks(count: number, opts: AdvanceTicksOptions): Promise<void> {
  const bus = opts.bus ?? new EventBus();
  for (let i = 0; i < count; i++) {
    const tick = nextTick();
    bus.emitTick(tick);
    const outcomes = await Promise.all(opts.agents.map((agent) => takeAgentTurn(agent, tick, bus)));
    opts.onTick?.(tick, outcomes);
  }
}
