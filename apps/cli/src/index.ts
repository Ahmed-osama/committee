#!/usr/bin/env node
import { Command } from 'commander';
import { generateText } from 'ai';
import {
  runPlanningSession,
  getOrCreateDefaultPlanner,
  getOrCreateDefaultArchitect,
  getOrCreateDefaultSkeptic,
  createConversation,
  updateConversationStatus,
  getConversationTranscript,
  PROVIDER_REGISTRY,
  startWebServer,
  type Message,
} from '@committee/core';

const program = new Command();

program.name('committee').description('A small AI-agent company: give it a goal, watch agents plan it together');

program
  .command('ping')
  .description('Smoke test: send a prompt straight to one provider/model and print the response')
  .argument('[prompt]', 'prompt to send', 'Reply with exactly one short sentence confirming you can hear me.')
  .option('-p, --provider <id>', 'provider id (ollama, groq, gemini, anthropic, deepseek, glm)', 'ollama')
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
  .option('--max-turns <n>', 'safety ceiling on conversation length', (v) => parseInt(v, 10), 12)
  .action(async (goal: string, opts: { maxTurns: number }) => {
    const planner = getOrCreateDefaultPlanner();
    const architect = getOrCreateDefaultArchitect();
    const skeptic = getOrCreateDefaultSkeptic();
    const conversation = createConversation(goal);

    console.log(`Conversation ${conversation.id}\nGoal: ${goal}\n`);

    const result = await runPlanningSession({
      conversationId: conversation.id,
      goal,
      agents: [planner, architect, skeptic],
      finalizerAgentId: architect.id,
      maxTurns: opts.maxTurns,
      onMessage: (message: Message) => {
        const speaker = [planner, architect, skeptic].find((a) => a.id === message.fromAgentId)?.name ?? message.fromAgentId;
        console.log(`--- turn ${message.turn} | ${speaker} (${message.intent}) ---\n${message.content}\n`);
      },
    });

    if (result.finalized && result.plan) {
      updateConversationStatus(conversation.id, 'finalized');
      console.log(`=== Plan finalized after ${result.turnsUsed} turns ===\n`);
      console.log(result.plan.summary + '\n');
      result.plan.tasks.forEach((t, i) => console.log(`${i + 1}. ${t.title}\n   ${t.description}`));
      console.log(`\nLinear isn't connected yet, so nothing was published — this plan only exists here.`);
      console.log(`Once you have a Linear workspace, publishing this plan there is next.`);
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
    for (const m of getConversationTranscript(conversationId)) {
      console.log(`--- turn ${m.turn} | ${m.fromAgentId} (${m.intent}) ---\n${m.content}\n`);
    }
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
