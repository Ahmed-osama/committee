export const PAGE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>committee</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --fg: #1a1a1a; --muted: #6b7280; --border: #e5e7eb; --panel: #f9fafb;
    --planner: #2563eb; --architect: #7c3aed; --skeptic: #ea580c; --agree: #0d9488; --finalize: #16a34a;
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #111318; --fg: #e8e8ec; --muted: #9096a3; --border: #2a2d35; --panel: #191b21; }
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; margin: 0; display: flex; height: 100vh; background: var(--bg); color: var(--fg); }
  #sidebar { width: 300px; border-right: 1px solid var(--border); padding: 1.25rem; overflow-y: auto; background: var(--panel); flex-shrink: 0; }
  #main { flex: 1; padding: 2rem; overflow-y: auto; max-width: 760px; }
  h1 { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted); margin: 0 0 1rem; }
  #roster { display: flex; flex-direction: column; gap: 0.4rem; margin-bottom: 1.5rem; }
  .roster-chip { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
  .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  #goalForm { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  #goalInput { flex: 1; padding: 0.65rem 0.85rem; border-radius: 8px; border: 1px solid var(--border); background: var(--bg); color: var(--fg); font-size: 0.95rem; }
  button { padding: 0.65rem 1.1rem; cursor: pointer; border-radius: 8px; border: none; background: var(--planner); color: white; font-weight: 600; font-size: 0.9rem; }
  button:hover { opacity: 0.9; }
  .conv-item { padding: 0.6rem 0.7rem; border-radius: 8px; cursor: pointer; margin-bottom: 0.3rem; font-size: 0.85rem; line-height: 1.4; }
  .conv-item:hover { background: var(--border); }
  .conv-item .status { font-size: 0.7rem; color: var(--muted); margin-top: 0.15rem; }
  #status { font-size: 0.85rem; color: var(--muted); margin-bottom: 1.25rem; min-height: 1.2em; }
  .turn { margin-bottom: 1rem; padding: 0.9rem 1.1rem; border-radius: 10px; border: 1px solid var(--border); border-left-width: 4px; background: var(--panel); }
  .turn .speaker { font-weight: 700; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 0.5rem; }
  .turn .intent { font-size: 0.68rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.1rem 0.45rem; border-radius: 999px; color: white; }
  .turn .content { white-space: pre-wrap; line-height: 1.5; font-size: 0.92rem; }
  .thinking { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); font-size: 0.85rem; padding: 0.5rem 0; }
  .thinking .dot { animation: pulse 1.2s infinite ease-in-out; }
  @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
  .plan { margin-top: 1.5rem; padding: 1.25rem; border: 2px solid var(--finalize); border-radius: 12px; background: var(--panel); }
  .plan h2 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--finalize); }
  .plan ol { padding-left: 1.4rem; margin: 0.75rem 0 0; }
  .plan li { margin-bottom: 0.75rem; line-height: 1.4; }
  .plan li strong { display: block; margin-bottom: 0.15rem; }
</style>
</head>
<body>
  <div id="sidebar">
    <h1>Roster</h1>
    <div id="roster"></div>
    <h1>Past conversations</h1>
    <div id="convList"></div>
  </div>
  <div id="main">
    <form id="goalForm">
      <input id="goalInput" placeholder="What do you want done?" required>
      <button type="submit">Plan it</button>
    </form>
    <div id="status"></div>
    <div id="transcript"></div>
    <div id="planOutput"></div>
  </div>

<script>
const convList = document.getElementById('convList');
const rosterEl = document.getElementById('roster');
const transcript = document.getElementById('transcript');
const planOutput = document.getElementById('planOutput');
const statusEl = document.getElementById('status');

const ROLE_COLOR = { planner: 'var(--planner)', architect: 'var(--architect)', skeptic: 'var(--skeptic)' };
const INTENT_COLOR = { propose: 'var(--planner)', challenge: 'var(--skeptic)', agree: 'var(--agree)', finalize: 'var(--finalize)', clarify: 'var(--architect)' };

let agentsById = {};

async function loadAgents() {
  const res = await fetch('/api/agents');
  const agents = await res.json();
  agentsById = Object.fromEntries(agents.map(a => [a.id, a]));
  rosterEl.innerHTML = agents.map(a =>
    \`<div class="roster-chip"><span class="dot" style="background:\${ROLE_COLOR[a.role] || '#888'}"></span>\${a.name} <span style="color:var(--muted)">(\${a.role})</span></div>\`
  ).join('');
}

function agentName(id) {
  return (agentsById[id] && agentsById[id].name) || id;
}
function agentColor(id) {
  const role = agentsById[id] && agentsById[id].role;
  return ROLE_COLOR[role] || '#888';
}

async function loadConversations() {
  const res = await fetch('/api/conversations');
  const rows = await res.json();
  convList.innerHTML = rows.map(c =>
    \`<div class="conv-item" onclick="viewConversation('\${c.id}')">
       \${escapeHtml(c.goal)}<div class="status">\${c.status}</div>
     </div>\`
  ).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function removeThinking() {
  const t = document.getElementById('thinkingRow');
  if (t) t.remove();
}

function showThinking() {
  removeThinking();
  const div = document.createElement('div');
  div.id = 'thinkingRow';
  div.className = 'thinking';
  div.innerHTML = '<span class="dot" style="width:6px;height:6px;background:var(--muted);border-radius:50%"></span> someone is thinking…';
  transcript.appendChild(div);
}

function renderTurn(m) {
  removeThinking();
  const div = document.createElement('div');
  const color = agentColor(m.fromAgentId);
  div.className = 'turn';
  div.style.borderLeftColor = color;
  const intentColor = INTENT_COLOR[m.intent] || '#888';
  div.innerHTML = \`<div class="speaker"><span style="color:\${color}">\${escapeHtml(agentName(m.fromAgentId))}</span>
    <span class="intent" style="background:\${intentColor}">\${m.intent}</span></div>
    <div class="content">\${escapeHtml(m.content)}</div>\`;
  transcript.appendChild(div);
  if (m.intent !== 'finalize') showThinking();
}

async function viewConversation(id) {
  transcript.innerHTML = '';
  planOutput.innerHTML = '';
  const res = await fetch('/api/conversations/' + id);
  const { conversation, transcript: msgs } = await res.json();
  statusEl.textContent = 'Status: ' + conversation.status;
  msgs.forEach(renderTurn);
  removeThinking();
  if (conversation.status === 'in_progress') { showThinking(); watch(id); }
  else if (conversation.status === 'finalized') {
    const finalizeMsg = msgs.find(m => m.intent === 'finalize');
    if (finalizeMsg) renderPlan(finalizeMsg.payload);
  }
}

function renderPlan(plan) {
  if (!plan) return;
  planOutput.innerHTML = \`<div class="plan"><h2>✓ Plan finalized</h2>\${escapeHtml(plan.summary)}
    <ol>\${plan.tasks.map(t => \`<li><strong>\${escapeHtml(t.title)}</strong>\${escapeHtml(t.description)}</li>\`).join('')}</ol>
  </div>\`;
}

function watch(id) {
  const es = new EventSource('/api/conversations/' + id + '/events');
  es.addEventListener('message', (e) => renderTurn(JSON.parse(e.data)));
  es.addEventListener('finalized', async () => {
    es.close();
    removeThinking();
    await viewConversation(id);
    await loadConversations();
  });
}

document.getElementById('goalForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const goal = document.getElementById('goalInput').value.trim();
  if (!goal) return;
  transcript.innerHTML = '';
  planOutput.innerHTML = '';
  statusEl.textContent = 'Starting…';
  const res = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal }) });
  const { conversationId } = await res.json();
  statusEl.textContent = 'In progress…';
  showThinking();
  watch(conversationId);
  await loadConversations();
});

loadAgents().then(loadConversations);
</script>
</body>
</html>
`;
