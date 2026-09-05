#!/usr/bin/env node
import { Command } from 'commander';
import { generateText } from 'ai';
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
  deleteConversation,
  getConversation,
  getConversationTranscript,
  isAgentReady,
  PROVIDER_REGISTRY,
  startWebServer,
  type Message,
  type AgentConfig,
} from '@committee/core';

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

const program = new Command();

program.name('committee').description('A small AI-agent company: give it a goal, watch agents plan it together');

program
  .command('ping')
  .description('Smoke test: send a prompt straight to one provider/model and print the response')
  .argument('[prompt]', 'prompt to send', 'Reply with exactly one short sentence confirming you can hear me.')
  .option('-p, --provider <id>', 'provider id (ollama, groq, gemini, anthropic, deepseek, glm, openrouter, perplexity)', 'ollama')
  .option('-m, --model <model>', 'model id', 'llama3.1:8b')
  .action(async (prompt: string, opts: { provider: string; model: string }) => {
    const provider = PROVIDER_REGISTRY[opts.provider];
    if (!provider) throw new Error(`Unknown provider '${opts.provider}'. Known: ${Object.keys(PROVIDER_REGISTRY).join(', ')}`);
    const { text, usage } = await generateText({ model: provider.model(opts.model), prompt });
    console.log(text);
    console.log(`\n[tokens: ${usage.inputTokens} in / ${usage.outputTokens} out]`);
  });

program
  .command('plan')
  .description('Give a goal to the Planner/Architect/Skeptic and watch them work out a plan together')
  .argument('<goal>', 'what you want done, in plain language')
  .option('--max-turns <n>', 'safety ceiling on conversation length', (v) => parseInt(v, 10), 36)
  .option('--no-visual', 'skip the visualizer step after finalization')
  .action(async (goal: string, opts: { maxTurns: number; visual: boolean }) => {
    const pool = agentPool();
    const architect = pool.find((a) => a.role === 'architect')!;
    // Only seat agents that actually have a usable provider right now —
    // otherwise an unconfigured/rate-limited agent just fails every turn.
    // With shared strength-ordered providers, this naturally grows the
    // committee to as many roles as providers currently support.
    const roster = pool.filter(isAgentReady);
    if (roster.length === 0) throw new Error('No agent has a usable provider right now — check API keys / rate limits.');
    const finalizer = roster.find((a) => a.id === architect.id) ?? roster[0];
    if (roster.length < pool.length) {
      const missing = pool.filter((a) => !roster.includes(a)).map((a) => a.name);
      console.log(`Note: ${missing.join(', ')} has no usable provider right now — proceeding without ${missing.length > 1 ? 'them' : 'it'}.\n`);
    }
    const conversation = createConversation(goal);

    console.log(`Conversation ${conversation.id}\nGoal: ${goal}\n`);

    const result = await runPlanningSession({
      conversationId: conversation.id,
      goal,
      agents: roster,
      finalizerAgentId: finalizer.id,
      maxTurns: opts.maxTurns,
      onThinking: (info) => {
        const model = info.modelId || info.providerId || 'unknown model';
        console.log(`… ${model} (${info.name}) is thinking…`);
      },
      onMessage: (message: Message) => {
        const speaker = roster.find((a) => a.id === message.fromAgentId)?.name ?? message.fromAgentId;
        const model = message.modelId ? ` [${message.providerId}/${message.modelId}]` : '';
        console.log(`--- turn ${message.turn} | ${speaker} (${message.intent})${model} ---\n${message.content}\n`);
      },
    });

    if (result.finalized && result.plan) {
      updateConversationStatus(conversation.id, 'finalized');
      console.log(`=== Plan finalized after ${result.turnsUsed} turns ===\n`);
      console.log(result.plan.summary + '\n');
      result.plan.tasks.forEach((t, i) => console.log(`${i + 1}. ${t.title}\n   ${t.description}`));
      console.log(`\nLinear isn't connected yet, so nothing was published — this plan only exists here.`);
      console.log(`Once you have a Linear workspace, publishing this plan there is next.`);

      // One-shot, outside the round-robin debate above — invoked exactly
      // once now that a plan actually exists. Skippable via --no-visual.
      if (opts.visual) {
        const visualizer = getOrCreateDefaultVisualizer();
        if (isAgentReady(visualizer)) {
          try {
            const svg = await generatePlanVisual({ agent: visualizer, plan: result.plan });
            setConversationPlanVisual(conversation.id, svg);
            console.log(`\nVisual saved — run 'committee serve' and open this conversation to see it.`);
          } catch (err) {
            console.log(`\n(Visualizer couldn't produce a diagram: ${err instanceof Error ? err.message : String(err)})`);
          }
        }
      }
    } else {
      updateConversationStatus(conversation.id, 'failed');
      console.log(`=== No plan reached within ${result.turnsUsed} turns ===`);
      console.log(`Run 'committee transcript ${conversation.id}' to see how the conversation went.`);
    }
  });

program
  .command('transcript')
  .description('Show a past conversation')
  .argument('<conversationId>')
  .action((conversationId: string) => {
    const roster = agentPool();
    for (const m of getConversationTranscript(conversationId)) {
      const speaker = roster.find((a) => a.id === m.fromAgentId)?.name ?? m.fromAgentId;
      console.log(`--- turn ${m.turn} | ${speaker} (${m.intent}) ---\n${m.content}\n`);
    }
  });

program
  .command('remove')
  .description('Delete a conversation and its transcript')
  .argument('<conversationId>')
  .action((conversationId: string) => {
    if (!getConversation(conversationId)) throw new Error(`Conversation not found: ${conversationId}`);
    deleteConversation(conversationId);
    console.log(`Deleted conversation ${conversationId}`);
  });

program
  .command('serve')
  .description('Start the web viewer — submit a goal, watch the agents plan it live')
  .option('-p, --port <port>', 'port to listen on', (v) => parseInt(v, 10), 3000)
  .action(async (opts: { port: number }) => {
    const handle = await startWebServer(opts.port);
    console.log(`Listening on http://localhost:${handle.port}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
