export const PAGE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>committee</title>
<style>
  :root { color-scheme: light dark; }
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; display: flex; height: 100vh; }
  #sidebar { width: 280px; border-right: 1px solid #8884; padding: 1rem; overflow-y: auto; }
  #main { flex: 1; padding: 1.5rem; overflow-y: auto; }
  h1 { font-size: 1.1rem; margin: 0 0 1rem; }
  #goalForm { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
  #goalInput { flex: 1; padding: 0.5rem; }
  button { padding: 0.5rem 1rem; cursor: pointer; }
  .conv-item { padding: 0.5rem; border-radius: 4px; cursor: pointer; margin-bottom: 0.25rem; }
  .conv-item:hover { background: #8882; }
  .conv-item .status { font-size: 0.75rem; opacity: 0.7; }
  .turn { margin-bottom: 1.25rem; padding: 0.75rem 1rem; border-radius: 8px; border: 1px solid #8884; }
  .turn .speaker { font-weight: 600; margin-bottom: 0.35rem; }
  .turn .intent { font-size: 0.7rem; opacity: 0.6; font-weight: normal; }
  .turn.finalize { border-color: #4a4; background: #4a41; }
  .plan { margin-top: 1.5rem; padding: 1rem; border: 2px solid #4a4; border-radius: 8px; }
  .plan ol { padding-left: 1.25rem; }
  #status { font-size: 0.85rem; opacity: 0.7; margin-bottom: 1rem; }
</style>
</head>
<body>
  <div id="sidebar">
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
const transcript = document.getElementById('transcript');
const planOutput = document.getElementById('planOutput');
const statusEl = document.getElementById('status');

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
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderTurn(m) {
  const div = document.createElement('div');
  div.className = 'turn' + (m.intent === 'finalize' ? ' finalize' : '');
  div.innerHTML = \`<div class="speaker">\${escapeHtml(m.fromAgentId)} <span class="intent">(\${m.intent})</span></div>\${escapeHtml(m.content)}\`;
  transcript.appendChild(div);
}

async function viewConversation(id) {
  transcript.innerHTML = '';
  planOutput.innerHTML = '';
  const res = await fetch('/api/conversations/' + id);
  const { conversation, transcript: msgs } = await res.json();
  statusEl.textContent = 'Status: ' + conversation.status;
  msgs.forEach(renderTurn);
  if (conversation.status === 'in_progress') watch(id);
  else if (conversation.status === 'finalized') {
    const finalizeMsg = msgs.find(m => m.intent === 'finalize');
    if (finalizeMsg) renderPlan(finalizeMsg.payload);
  }
}

function renderPlan(plan) {
  if (!plan) return;
  planOutput.innerHTML = \`<div class="plan"><strong>Plan:</strong> \${escapeHtml(plan.summary)}
    <ol>\${plan.tasks.map(t => \`<li><strong>\${escapeHtml(t.title)}</strong><br>\${escapeHtml(t.description)}</li>\`).join('')}</ol>
  </div>\`;
}

function watch(id) {
  const es = new EventSource('/api/conversations/' + id + '/events');
  es.addEventListener('message', (e) => renderTurn(JSON.parse(e.data)));
  es.addEventListener('finalized', async () => {
    es.close();
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
  statusEl.textContent = 'Starting...';
  const res = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal }) });
  const { conversationId } = await res.json();
  statusEl.textContent = 'In progress...';
  watch(conversationId);
  await loadConversations();
});

loadConversations();
</script>
</body>
</html>
`;
