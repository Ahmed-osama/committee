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
  createConversation,
  updateConversationStatus,
  setConversationPlanVisual,
  isAgentReady,
  type AgentConfig,
} from '@committee/core';

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

const server = new McpServer({ name: 'committee', version: '0.1.0' });

server.registerTool(
  'committee_plan',
  {
    title: 'Run the committee planning session',
    description:
      "Delegate a planning task to the committee: a round-robin debate among independently provider-routed " +
      "agents (Planner, Architect, Skeptic, Devil's Advocate, Estimator, Reviewer — mostly non-Anthropic " +
      'providers by default) that stress-tests a goal into a finalized task breakdown, without spending the ' +
      "calling session's own model usage. Decide first whether a task actually warrants this: reach for it on " +
      'genuinely substantial planning/architecture decisions worth an independent multi-perspective debate, not ' +
      'as a substitute for directly answering something you can just answer yourself. A real debate can take a ' +
      'couple of minutes to converge.',
    inputSchema: {
      goal: z.string().describe('The goal to plan, in plain language.'),
      maxTurns: z.number().int().min(1).max(100).optional().describe('Safety ceiling on conversation length (default 36).'),
      visual: z.boolean().optional().describe('Also generate an SVG diagram of the finalized plan once it lands (default true).'),
    },
  },
  async ({ goal, maxTurns, visual }) => {
    const pool = agentPool();
    const architect = pool.find((a) => a.role === 'architect')!;
    // Only seat agents with a usable provider right now — see apps/cli's plan command for why.
    const roster = pool.filter(isAgentReady);
    if (roster.length === 0) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: 'No committee agent has a usable provider right now — check API keys / rate limits.' }],
      };
    }
    const finalizer = roster.find((a) => a.id === architect.id) ?? roster[0];
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

const transport = new StdioServerTransport();
await server.connect(transport);
