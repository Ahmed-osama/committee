#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  runPlanningSession,
  generatePlanVisual,
  getOrCreateDefaultPlanner,
  getOrCreateDefaultArchitect,
  getOrCreateDefaultSkeptic,
  getOrCreateDefaultDevilsAdvocate,
  getOrCreateDefaultEstimator,
  getOrCreateDefaultReviewer,
  getOrCreateDefaultVisualizer,
  getOrCreateAgent,
  createConversation,
  updateConversationStatus,
  setConversationPlanVisual,
  isAgentReady,
  type AgentConfig,
  type AgentRole,
} from '@committee/core';
import { resolveLinearTarget } from './linear-target-rules.js';

/** Same roster construction as apps/cli and the web server — kept local rather than shared, since each front end is free to seat a different pool. */
function agentPool(): AgentConfig[] {
  return [
    getOrCreateDefaultPlanner(),
    getOrCreateDefaultArchitect(),
    getOrCreateDefaultSkeptic(),
    getOrCreateDefaultDevilsAdvocate(),
    getOrCreateDefaultEstimator(),
    getOrCreateDefaultReviewer(),
  ];
}

/** Each custom seat still plays one of the behavioral roles the planning loop dispatches on (skeptic-gating, challenge/propose intent) — only the name and persona are caller-defined. */
const ROLE_DEFAULTS: Record<Exclude<AgentRole, 'visualizer'>, () => AgentConfig> = {
  planner: getOrCreateDefaultPlanner,
  architect: getOrCreateDefaultArchitect,
  skeptic: getOrCreateDefaultSkeptic,
  devils_advocate: getOrCreateDefaultDevilsAdvocate,
  estimator: getOrCreateDefaultEstimator,
  reviewer: getOrCreateDefaultReviewer,
};

interface RosterSeat {
  role: Exclude<AgentRole, 'visualizer'>;
  name: string;
  persona: string;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/** Builds a custom, per-task roster: same behavioral roles as agentPool(), but with caller-chosen titles/personas so the committee can be seated to fit the task instead of always being the same six generic names. */
function customRoster(seats: RosterSeat[]): AgentConfig[] {
  return seats.map((seat) => {
    const base = ROLE_DEFAULTS[seat.role]();
    return getOrCreateAgent({
      ...base,
      id: `custom-${seat.role}-${slugify(seat.name)}`,
      name: seat.name,
      systemPrompt: seat.persona,
    });
  });
}

const server = new McpServer({ name: 'committee', version: '0.1.0' });

server.registerTool(
  'committee_plan',
  {
    title: 'Run the committee planning session',
    description:
      "Delegate a planning task to the committee: a round-robin debate among independently provider-routed " +
      "agents that stress-tests a goal into a finalized task breakdown, without spending the calling session's " +
      "own model usage. Decide first whether a task actually warrants this: reach for it on genuinely substantial " +
      'planning/architecture decisions worth an independent multi-perspective debate, not as a substitute for ' +
      'directly answering something you can just answer yourself. A real debate can take a couple of minutes to ' +
      'converge.\n\n' +
      'By default the roster is the generic six (Planner, Architect, Skeptic, Devil\'s Advocate, Estimator, ' +
      'Reviewer). Prefer passing `roster` instead: pick 3-6 seats and title/brief each one for what this specific ' +
      'goal actually needs — e.g. for a database migration: a Data Modeler (role: architect), a Migration Skeptic ' +
      '(role: skeptic) briefed on data-loss/downtime risk, a Rollback Estimator (role: estimator). The `role` you ' +
      'pick per seat still controls real debate mechanics (only a `skeptic`-role seat gates finalization on ' +
      'raising real objections; `skeptic`/`devils_advocate` seats speak as challengers) — `name` and `persona` are ' +
      'yours to invent freely per task.',
    inputSchema: {
      goal: z.string().describe('The goal to plan, in plain language.'),
      roster: z
        .array(
          z.object({
            role: z
              .enum(['planner', 'architect', 'skeptic', 'devils_advocate', 'estimator', 'reviewer'])
              .describe('Behavioral seat: skeptic gates finalization on real objections; skeptic/devils_advocate speak as challengers; the rest propose.'),
            name: z.string().describe('Creative title for this seat, tailored to the task, e.g. "Migration Skeptic".'),
            persona: z
              .string()
              .describe('1-3 sentence system prompt for this seat: its specific expertise and what it should focus on for this goal.'),
          }),
        )
        .min(2)
        .max(8)
        .optional()
        .describe('Custom per-task roster. Omit to use the generic default pool of six.'),
      maxTurns: z.number().int().min(1).max(100).optional().describe('Safety ceiling on conversation length (default 36).'),
      visual: z.boolean().optional().describe('Also generate an SVG diagram of the finalized plan once it lands (default true).'),
    },
  },
  async ({ goal, roster: customSeats, maxTurns, visual }) => {
    const pool = customSeats?.length ? customRoster(customSeats) : agentPool();
    const architect = pool.find((a) => a.role === 'architect');
    // Only seat agents with a usable provider right now — see apps/cli's plan command for why.
    const roster = pool.filter(isAgentReady);
    if (roster.length === 0) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'No committee agent has a usable provider right now — check API keys / rate limits.' }],
      };
    }
    const finalizer = roster.find((a) => a.id === architect?.id) ?? roster[0];
    const conversation = createConversation(goal);

    const result = await runPlanningSession({
      conversationId: conversation.id,
      goal,
      agents: roster,
      finalizerAgentId: finalizer.id,
      maxTurns,
    });

    if (!result.finalized || !result.plan) {
      updateConversationStatus(conversation.id, 'failed');
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `No plan reached within ${result.turnsUsed} turns. Conversation id: ${conversation.id}` }],
      };
    }

    updateConversationStatus(conversation.id, 'finalized');

    let visualNote = '';
    if (visual ?? true) {
      const visualizer = getOrCreateDefaultVisualizer();
      if (isAgentReady(visualizer)) {
        try {
          const svg = await generatePlanVisual({ agent: visualizer, plan: result.plan });
          setConversationPlanVisual(conversation.id, svg);
          visualNote = '\n\n(A diagram of this plan was also generated — view it via `pnpm run cli serve`.)';
        } catch {
          // Best-effort — a missing visual doesn't invalidate the plan itself.
        }
      }
    }

    const taskList = result.plan.tasks.map((t, i) => `${i + 1}. ${t.title} — ${t.description}`).join('\n');
    const text = `Conversation ${conversation.id} — finalized after ${result.turnsUsed} turns.\n\n${result.plan.summary}\n\n${taskList}${visualNote}`;
    return { content: [{ type: 'text' as const, text }] };
  },
);

server.registerTool(
  'committee_resolve_linear_target',
  {
    title: 'Resolve where a spec should land in Linear',
    description:
      'Given a short summary of a spec/goal, returns which Linear team/labels/project it should be filed under, ' +
      'based on static keyword rules — this does not call Linear itself. Use this before filing issues with the ' +
      "official Linear MCP tools, instead of guessing team/label/project assignment inline in a prompt. A " +
      "`project: null` result means no confident match — ask the user or create a new project (this workspace's " +
      'convention is one project/Epic per initiative), rather than filing a loose top-level issue.',
    inputSchema: {
      summary: z.string().describe('A short summary or title of the spec/goal to resolve a target for.'),
    },
  },
  async ({ summary }) => {
    const target = resolveLinearTarget(summary);
    return { content: [{ type: 'text' as const, text: JSON.stringify(target) }] };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
