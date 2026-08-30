import type { AgentConfig } from '../domain/agent.js';
import { recordAlert } from '../persistence/repositories/alert-repo.js';
import { isPaused, nextTick } from '../persistence/repositories/scheduler-repo.js';
import { takeAgentTurn, type AgentTurnOutcome } from './agent-turn.js';
import { EventBus } from './event-bus.js';

export interface AdvanceTicksOptions {
  agents: AgentConfig[];
  bus?: EventBus;
  onTick?: (tick: number, outcomes: AgentTurnOutcome[]) => void;
  onPaused?: () => void;
}

/**
 * The Game-of-Life clock. Each tick, every agent gets a chance to react —
 * dispatched concurrently (Promise.all), not one after another, so a tick
 * never waits on one slow LLM call before letting other agents take their
 * turn in the same generation. The tick counter is persisted, so calling
 * this again in a later CLI invocation continues counting rather than
 * restarting at 0.
 *
 * The kill switch is checked before every single tick, not just once at
 * the start — pausing mid-batch (e.g. `committee daemon pause` run from
 * another terminal while this is looping) stops it before the next tick
 * starts, rather than only taking effect on the next separate invocation.
 * One agent's turn throwing (a ceiling hit, a crashed tool call) is caught
 * per-agent so it can't take down every other agent's turn in the same
 * tick — recorded as an alert instead, since nothing else is watching.
 *
 * Returns the number of ticks actually completed, which can be less than
 * requested if the scheduler got paused partway through.
 */
export async function advanceTicks(count: number, opts: AdvanceTicksOptions): Promise<number> {
  const bus = opts.bus ?? new EventBus();
  let completed = 0;
  for (let i = 0; i < count; i++) {
    if (isPaused()) {
      opts.onPaused?.();
      break;
    }
    const tick = nextTick();
    bus.emitTick(tick);
    const outcomes = await Promise.all(
      opts.agents.map(async (agent): Promise<AgentTurnOutcome> => {
        try {
          return await takeAgentTurn(agent, tick, bus);
        } catch (err) {
          const message = (err as Error).message;
          recordAlert({
            kind: message.includes('ceiling') ? 'ceiling_hit' : 'turn_error',
            message,
            agentId: agent.id,
          });
          return { agentId: agent.id, action: 'error', detail: message };
        }
      }),
    );
    opts.onTick?.(tick, outcomes);
    completed++;
  }
  return completed;
}
