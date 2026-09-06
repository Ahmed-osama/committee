export const PAGE_HTML = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>committee</title>
<style>
  :root {
    color-scheme: light dark;
    --bg: #ffffff; --bg-raised: #ffffff; --fg: #16181d; --muted: #6b7280; --border: #e5e7eb; --panel: #f7f8fa;
    --planner: #2563eb; --architect: #7c3aed; --skeptic: #ea580c; --agree: #0d9488; --finalize: #16a34a; --human: #475569;
    --devils-advocate: #db2777; --estimator: #0891b2; --reviewer: #65a30d; --danger: #dc2626;
    --shadow: 0 1px 2px rgba(16,24,40,0.06), 0 1px 3px rgba(16,24,40,0.08);
  }
  @media (prefers-color-scheme: dark) {
    :root { --bg: #0d0e12; --bg-raised: #16181e; --fg: #edeef2; --muted: #9096a3; --border: #262933; --panel: #14161b;
      --shadow: 0 1px 2px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.35); }
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "Segoe UI", system-ui, sans-serif; margin: 0; display: flex; height: 100vh; background: var(--bg); color: var(--fg); font-size: 14px; }
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 999px; }

  #sidebar { width: 420px; min-width: 420px; border-right: 1px solid var(--border); padding: 1.1rem; overflow-y: auto; overflow-x: hidden; background: var(--panel); flex-shrink: 0; display: flex; flex-direction: column; gap: 1.5rem; }
  #brand { font-weight: 800; font-size: 1.05rem; letter-spacing: -0.01em; margin-bottom: 0.25rem; }
  #newConvBtn { width: 100%; background: var(--bg-raised); color: var(--fg); border: 1px solid var(--border); box-shadow: none; margin-top: -0.75rem; }
  #newConvBtn:hover { border-color: var(--planner); opacity: 1; }
  h1 { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); margin: 0 0 0.6rem; font-weight: 700; }
  #roster { display: flex; flex-direction: column; gap: 0.35rem; }
  .roster-chip { display: flex; align-items: center; gap: 0.55rem; font-size: 0.82rem; padding: 0.5rem 0.65rem; border-radius: 9px; background: var(--bg-raised); border: 1px solid var(--border); min-width: 0; transition: border-color .15s, box-shadow .15s; }
  .roster-chip .info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .roster-chip .name-row { display: flex; align-items: center; gap: 0.4rem; min-width: 0; }
  .roster-chip .name { font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .roster-chip .role { color: var(--muted); font-size: 0.72rem; }
  .roster-chip .model { color: var(--muted); font-size: 0.68rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .roster-chip.active { border-color: var(--planner); box-shadow: 0 0 0 3px color-mix(in srgb, var(--planner) 18%, transparent); }
  .roster-chip .live { margin-left: auto; flex-shrink: 0; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; color: var(--planner); display: flex; align-items: center; gap: 0.3rem; }
  .roster-chip .live .dot { animation: pulse 1.2s infinite ease-in-out; }
  .dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
  .avatar { width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 0.72rem; }

  #convList { display: flex; flex-direction: column; gap: 0.35rem; }
  .conv-item { padding: 0.55rem 0.65rem; border-radius: 9px; cursor: pointer; font-size: 0.83rem; line-height: 1.4; display: flex; align-items: flex-start; justify-content: space-between; gap: 0.4rem; background: var(--bg-raised); border: 1px solid transparent; transition: border-color .12s; min-width: 0; }
  .conv-item:hover { border-color: var(--border); }
  .conv-item.active { border-color: var(--planner); }
  .conv-item .goal { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .conv-item .status { font-size: 0.68rem; color: var(--muted); margin-top: 0.2rem; text-transform: capitalize; }
  .conv-item .remove-btn { flex-shrink: 0; background: none !important; border: none; color: var(--muted); font-size: 0.95rem; line-height: 1; padding: 0.1rem 0.3rem; font-weight: 400; box-shadow: none; }
  .conv-item .remove-btn:hover { color: var(--danger); opacity: 1; }

  #main { flex: 1; display: flex; flex-direction: column; height: 100vh; min-width: 0; }
  #mainHeader { padding: 1.25rem 2rem 0.75rem; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  #goalForm { display: flex; gap: 0.5rem; }
  #goalInput { flex: 1; padding: 0.7rem 0.9rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-raised); color: var(--fg); font-size: 0.95rem; }
  #goalInput:focus, #injectInput:focus { outline: none; border-color: var(--planner); }
  #maxTurnsInput { width: 5.5rem; padding: 0.7rem 0.5rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-raised); color: var(--fg); font-size: 0.9rem; }
  button { padding: 0.7rem 1.15rem; cursor: pointer; border-radius: 10px; border: none; background: var(--planner); color: white; font-weight: 600; font-size: 0.88rem; box-shadow: var(--shadow); transition: opacity .12s, transform .05s; }
  button:hover { opacity: 0.88; }
  button:active { transform: scale(0.98); }
  button:disabled { opacity: 0.5; cursor: default; }
  #status { font-size: 0.8rem; color: var(--muted); margin: 0.6rem 0 0.9rem; min-height: 1.2em; }
  #status.finalized { color: var(--finalize); font-weight: 600; }
  #status.error { color: var(--danger); font-weight: 600; }

  #chatBody { flex: 1; overflow-y: auto; padding: 1.5rem 2rem; }
  #transcript, #planOutput { max-width: 760px; }
  .turn { margin-bottom: 0.9rem; padding: 0.85rem 1.05rem; border-radius: 12px; border: 1px solid var(--border); background: var(--bg-raised); box-shadow: var(--shadow); display: flex; gap: 0.7rem; }
  .turn .bubble { flex: 1; min-width: 0; }
  .turn .speaker { font-weight: 700; margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.5rem; font-size: 0.88rem; }
  .turn .intent { font-size: 0.63rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; padding: 0.12rem 0.5rem; border-radius: 999px; color: white; }
  .turn .model { font-size: 0.7rem; color: var(--muted); font-weight: 500; }
  .turn .content { white-space: pre-wrap; line-height: 1.55; font-size: 0.9rem; }
  .turn.human { background: var(--panel); }
  .turn.error { border-color: var(--danger); }

  #composer { display: none; flex-shrink: 0; border-top: 1px solid var(--border); padding: 0.9rem 2rem; background: var(--panel); }
  #composerHint { font-size: 0.78rem; color: var(--muted); margin-bottom: 0.5rem; max-width: 760px; }
  #injectForm { display: flex; gap: 0.5rem; max-width: 760px; align-items: flex-end; }
  #injectInput { flex: 1; min-height: 5.5rem; padding: 0.75rem 0.9rem; border-radius: 10px; border: 1px solid var(--border); background: var(--bg-raised); color: var(--fg); font-size: 0.9rem; font-family: inherit; resize: vertical; }
  #liveControls { display: none; gap: 0.5rem; margin-top: 0.55rem; max-width: 760px; }
  #pauseBtn { background: var(--bg-raised); color: var(--fg); border: 1px solid var(--border); box-shadow: none; }
  #stopBtn { background: var(--danger); }
  #pausedBanner { display: none; font-size: 0.8rem; color: var(--human); font-weight: 600; margin: 0.4rem 0 0; }

  .thinking { display: flex; align-items: center; gap: 0.5rem; color: var(--muted); font-size: 0.83rem; padding: 0.4rem 0.1rem; }
  .thinking .dots { display: flex; gap: 3px; }
  .thinking .dots span { width: 5px; height: 5px; border-radius: 50%; background: var(--muted); animation: pulse 1.2s infinite ease-in-out; }
  .thinking .dots span:nth-child(2) { animation-delay: .15s; }
  .thinking .dots span:nth-child(3) { animation-delay: .3s; }
  @keyframes pulse { 0%, 80%, 100% { opacity: 0.25; } 40% { opacity: 1; } }

  .plan { margin-top: 1rem; padding: 1.25rem; border: 1px solid var(--finalize); border-radius: 14px; background: var(--bg-raised); box-shadow: var(--shadow); }
  .plan h2 { margin: 0 0 0.5rem; font-size: 1rem; color: var(--finalize); }
  .plan ol { padding-left: 1.4rem; margin: 0.75rem 0 0; }
  .plan li { margin-bottom: 0.75rem; line-height: 1.4; }
  .plan li strong { display: block; margin-bottom: 0.15rem; }

  .plan-visual { margin-top: 1rem; padding: 1rem; border: 1px solid var(--border); border-radius: 14px; background: #ffffff; box-shadow: var(--shadow); text-align: center; }
  .plan-visual svg { max-width: 100%; height: auto; }

  #emptyState { color: var(--muted); font-size: 0.88rem; padding: 2rem 0; }
  .empty-panel { color: var(--muted); font-size: 0.9rem; padding: 3rem 1rem; text-align: center; max-width: 460px; margin: 0 auto; }
</style>
</head>
<body>
  <div id="sidebar">
    <div id="brand">committee</div>
    <button id="newConvBtn" type="button">+ New conversation</button>
    <div>
      <h1>Roster</h1>
      <div id="roster"></div>
    </div>
    <div>
      <h1>Past conversations</h1>
      <div id="convList"></div>
    </div>
  </div>
  <div id="main">
    <div id="mainHeader">
      <form id="goalForm">
        <input id="goalInput" placeholder="What do you want done?" required>
        <input id="maxTurnsInput" type="number" min="1" max="100" placeholder="max turns">
        <button type="submit">Plan it</button>
      </form>
      <div id="status"></div>
    </div>
    <div id="chatBody">
      <div id="transcript"></div>
      <div id="planOutput"></div>
    </div>
    <div id="composer">
      <div id="composerHint"></div>
      <div id="pausedBanner">⏸ Paused — waiting for you</div>
      <form id="injectForm">
        <textarea id="injectInput" rows="3" placeholder="Type a message…"></textarea>
        <button type="submit" data-mode="execute">Send</button>
        <button type="submit" data-mode="regenerate" id="regenerateBtn" style="display:none">Reopen &amp; regenerate</button>
      </form>
      <div id="liveControls">
        <button id="pauseBtn" type="button">Pause</button>
        <button id="stopBtn" type="button">Stop conversation</button>
      </div>
    </div>
  </div>

<script>
const convList = document.getElementById('convList');
const rosterEl = document.getElementById('roster');
const chatBody = document.getElementById('chatBody');
const transcript = document.getElementById('transcript');
const planOutput = document.getElementById('planOutput');
const statusEl = document.getElementById('status');
const goalForm = document.getElementById('goalForm');
const composer = document.getElementById('composer');
const composerHint = document.getElementById('composerHint');
const injectForm = document.getElementById('injectForm');
const injectInput = document.getElementById('injectInput');
const regenerateBtn = document.getElementById('regenerateBtn');
const liveControls = document.getElementById('liveControls');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const pausedBanner = document.getElementById('pausedBanner');
const newConvBtn = document.getElementById('newConvBtn');

const ROLE_COLOR = {
  planner: 'var(--planner)', architect: 'var(--architect)', skeptic: 'var(--skeptic)',
  devils_advocate: 'var(--devils-advocate)', estimator: 'var(--estimator)', reviewer: 'var(--reviewer)',
};
const INTENT_COLOR = { propose: 'var(--planner)', challenge: 'var(--skeptic)', agree: 'var(--agree)', finalize: 'var(--finalize)', clarify: 'var(--architect)', human: 'var(--human)', error: '#dc2626' };

let agentsById = {};
let agentsList = [];
let currentConversationId = null;
let activeAgentId = null;
let conversationCount = 0;
let titleRefreshed = false;

function truncate(s, n) {
  s = String(s);
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s;
}

async function loadAgents() {
  const res = await fetch('/api/agents');
  agentsList = await res.json();
  agentsById = Object.fromEntries(agentsList.map(a => [a.id, a]));
  renderRoster();
}

function renderRoster() {
  rosterEl.innerHTML = agentsList.map(a => {
    const model = a.modelId ? \`<span class="model">\${escapeHtml(a.providerId + '/' + a.modelId)}</span>\` : '<span class="model">no provider available</span>';
    const isActive = a.id === activeAgentId;
    return \`<div class="roster-chip\${isActive ? ' active' : ''}">
      <span class="dot" style="background:\${ROLE_COLOR[a.role] || '#888'}"></span>
      <div class="info">
        <div class="name-row"><span class="name">\${escapeHtml(a.name)}</span><span class="role">\${escapeHtml(a.role)}</span></div>
        \${model}
      </div>
      \${isActive ? '<span class="live"><span class="dot" style="background:var(--planner)"></span>speaking</span>' : ''}
    </div>\`;
  }).join('');
}

function setActiveAgent(id) {
  if (activeAgentId === id) return;
  activeAgentId = id;
  renderRoster();
}

function agentName(id) {
  if (id === 'human') return 'You';
  return (agentsById[id] && agentsById[id].name) || id;
}
function agentColor(id) {
  if (id === 'human') return 'var(--human)';
  const role = agentsById[id] && agentsById[id].role;
  return ROLE_COLOR[role] || '#888';
}

async function loadConversations() {
  const res = await fetch('/api/conversations');
  const rows = await res.json();
  conversationCount = rows.length;
  convList.innerHTML = rows.length ? rows.map(c =>
    \`<div class="conv-item\${c.id === currentConversationId ? ' active' : ''}" onclick="viewConversation('\${c.id}')">
       <div><span class="goal">\${escapeHtml(truncate(c.title || c.goal, 48))}</span><div class="status">\${escapeHtml(c.status)}</div></div>
       <button class="remove-btn" title="Delete conversation" onclick="removeConversation(event, '\${c.id}')">✕</button>
     </div>\`
  ).join('') : '<div id="emptyState">No conversations yet.</div>';
}

async function removeConversation(e, id) {
  e.stopPropagation();
  if (!confirm('Delete this conversation?')) return;
  await fetch('/api/conversations/' + id, { method: 'DELETE' });
  if (currentConversationId === id) showNewConversationForm();
  await loadConversations();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function scrollToBottom() {
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeThinking() {
  const t = document.getElementById('thinkingRow');
  if (t) t.remove();
}

function showThinking(label) {
  removeThinking();
  const div = document.createElement('div');
  div.id = 'thinkingRow';
  div.className = 'thinking';
  div.innerHTML = '<span class="dots"><span></span><span></span><span></span></span> ' + escapeHtml(label || 'someone is thinking…');
  transcript.appendChild(div);
  scrollToBottom();
}

function thinkingLabel(info) {
  const model = info.modelId || info.providerId || 'unknown model';
  return \`\${model} (\${info.name}) is thinking…\`;
}

function initials(name) {
  return String(name).trim().split(/\\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function renderTurn(m) {
  removeThinking();
  const div = document.createElement('div');
  const color = agentColor(m.fromAgentId);
  const name = agentName(m.fromAgentId);
  div.className = 'turn' + (m.fromAgentId === 'human' ? ' human' : '') + (m.intent === 'error' ? ' error' : '');
  const intentColor = INTENT_COLOR[m.intent] || '#888';
  const modelBadge = m.modelId ? \`<span class="model">\${escapeHtml(m.providerId + '/' + m.modelId)}</span>\` : '';
  div.innerHTML = \`<span class="avatar" style="background:\${color}">\${escapeHtml(initials(name))}</span>
    <div class="bubble">
      <div class="speaker"><span>\${escapeHtml(name)}</span>\${modelBadge}
        <span class="intent" style="background:\${intentColor}">\${escapeHtml(m.intent)}</span></div>
      <div class="content">\${escapeHtml(m.content)}</div>
    </div>\`;
  transcript.appendChild(div);
  scrollToBottom();
}

function setLiveControlsVisible(visible) {
  liveControls.style.display = visible ? 'flex' : 'none';
  if (!visible) setPaused(false);
}

function setPaused(paused) {
  pausedBanner.style.display = paused ? 'block' : 'none';
  pauseBtn.textContent = paused ? 'Resume' : 'Pause';
}

function setStatus(text, cls) {
  statusEl.textContent = text;
  statusEl.className = cls || '';
}

function setComposerHint(status) {
  composerHint.textContent = status === 'in_progress'
    ? 'This gets read out loud to the agents before the next one speaks.'
    : 'Tell an agent what to actually do in the codebase (it\\'ll use real tools), or reopen the debate with new feedback.';
  regenerateBtn.style.display = status === 'finalized' ? 'inline-block' : 'none';
}

let currentEventSource = null;
function closeWatch() {
  if (currentEventSource) { currentEventSource.close(); currentEventSource = null; }
}

const EMPTY_NO_CONVERSATIONS = '<div class="empty-panel">No conversations yet — describe a goal above to start your first committee debate.</div>';
const EMPTY_NO_SELECTION = '<div class="empty-panel">Select a conversation on the left, or start a new one above.</div>';

/** No conversation selected yet — show the goal form, hide the chat composer. */
function showNewConversationForm(pushUrl) {
  closeWatch();
  currentConversationId = null;
  setActiveAgent(null);
  transcript.innerHTML = conversationCount === 0 ? EMPTY_NO_CONVERSATIONS : EMPTY_NO_SELECTION;
  planOutput.innerHTML = '';
  setStatus('', '');
  goalForm.style.display = 'flex';
  composer.style.display = 'none';
  document.querySelectorAll('.conv-item').forEach(el => el.classList.remove('active'));
  if (pushUrl !== false) history.pushState(null, '', '/');
}

async function viewConversation(id, pushUrl) {
  closeWatch();
  currentConversationId = id;
  titleRefreshed = false;
  transcript.innerHTML = '';
  planOutput.innerHTML = '';
  setActiveAgent(null);
  goalForm.style.display = 'none';
  composer.style.display = 'block';
  if (pushUrl !== false) history.pushState(null, '', '/c/' + id);
  const res = await fetch('/api/conversations/' + id);
  const { conversation, transcript: msgs } = await res.json();
  if (conversation.status === 'failed') setStatus('⚠ Stopped — every configured model became unavailable (rate limit/quota). Try again, or check server logs.', 'error');
  else if (conversation.status === 'stopped') setStatus('⏹ Stopped by user.', '');
  else if (conversation.status === 'finalized') setStatus('✓ Plan finalized', 'finalized');
  else setStatus('Status: ' + conversation.status, '');
  setComposerHint(conversation.status);
  msgs.forEach(renderTurn);
  removeThinking();
  if (conversation.status === 'in_progress') { showThinking(); setLiveControlsVisible(true); watch(id); }
  else {
    setLiveControlsVisible(false);
    if (conversation.status === 'finalized') {
      const finalizeMsg = msgs.slice().reverse().find(m => m.intent === 'finalize');
      if (finalizeMsg) renderPlan(finalizeMsg.payload);
      renderPlanVisual(conversation.planVisualSvg);
    }
  }
  await loadConversations();
}

function renderPlan(plan) {
  if (!plan) return;
  planOutput.innerHTML = \`<div class="plan"><h2>✓ Plan finalized</h2>\${escapeHtml(plan.summary)}
    <ol>\${plan.tasks.map(t => \`<li><strong>\${escapeHtml(t.title)}</strong>\${escapeHtml(t.description)}</li>\`).join('')}</ol>
  </div>\`;
}

function renderPlanVisual(svg) {
  // Not user-supplied: the visualizer agent is invoked once, server-side,
  // after the plan is finalized — same trust level as any other server-
  // rendered content on this page, so no extra escaping beyond that.
  if (!svg) return;
  planOutput.innerHTML += \`<div class="plan-visual">\${svg}</div>\`;
}

function watch(id) {
  closeWatch();
  const es = new EventSource('/api/conversations/' + id + '/events');
  currentEventSource = es;
  es.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    setActiveAgent(null);
    renderTurn(m);
    if (m.intent !== 'finalize') showThinking();
    if (!titleRefreshed) { titleRefreshed = true; loadConversations(); }
  });
  es.addEventListener('thinking', (e) => {
    const info = JSON.parse(e.data);
    setActiveAgent(info.agentId);
    showThinking(thinkingLabel(info));
  });
  es.addEventListener('paused', (e) => {
    const { paused } = JSON.parse(e.data);
    setPaused(paused);
    if (paused) removeThinking();
  });
  es.addEventListener('finalized', async () => {
    closeWatch();
    removeThinking();
    setActiveAgent(null);
    setLiveControlsVisible(false);
    await viewConversation(id, false);
  });
}

newConvBtn.addEventListener('click', () => showNewConversationForm());

goalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const goal = document.getElementById('goalInput').value.trim();
  if (!goal) return;
  const maxTurnsRaw = document.getElementById('maxTurnsInput').value;
  const maxTurns = maxTurnsRaw ? Number(maxTurnsRaw) : undefined;
  transcript.innerHTML = '';
  planOutput.innerHTML = '';
  setStatus('Starting…', '');
  const res = await fetch('/api/plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal, maxTurns }) });
  const { conversationId } = await res.json();
  currentConversationId = conversationId;
  titleRefreshed = false;
  history.pushState(null, '', '/c/' + conversationId);
  goalForm.style.display = 'none';
  composer.style.display = 'block';
  setStatus('In progress…', '');
  setComposerHint('in_progress');
  showThinking();
  setLiveControlsVisible(true);
  watch(conversationId);
  await loadConversations();
});

stopBtn.addEventListener('click', async () => {
  if (!currentConversationId) return;
  stopBtn.disabled = true;
  await fetch('/api/conversations/' + currentConversationId + '/stop', { method: 'POST' });
  stopBtn.disabled = false;
});

pauseBtn.addEventListener('click', async () => {
  if (!currentConversationId) return;
  pauseBtn.disabled = true;
  const action = pauseBtn.textContent === 'Resume' ? 'resume' : 'pause';
  await fetch('/api/conversations/' + currentConversationId + '/' + action, { method: 'POST' });
  pauseBtn.disabled = false;
});

injectInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    injectForm.requestSubmit();
  }
});

injectForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = injectInput.value.trim();
  if (!content || !currentConversationId) return;
  const mode = (e.submitter && e.submitter.dataset.mode) || 'execute';
  injectInput.value = '';

  if (mode === 'regenerate') {
    setPaused(false);
    planOutput.innerHTML = '';
    setStatus('Reopening debate…', '');
    setComposerHint('in_progress');
    showThinking();
    setLiveControlsVisible(true);
    const res = await fetch('/api/conversations/' + currentConversationId + '/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      watch(currentConversationId);
    } else {
      const { error } = await res.json().catch(() => ({ error: 'request failed' }));
      setStatus('⚠ ' + (error || 'request failed'), 'error');
      setLiveControlsVisible(false);
      removeThinking();
    }
    return;
  }

  const wasLive = liveControls.style.display !== 'none';
  if (!wasLive) showThinking('running your command…');
  const res = await fetch('/api/conversations/' + currentConversationId + '/inject', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!wasLive) {
    removeThinking();
    if (res.ok) {
      const { messages } = await res.json();
      (messages || []).forEach(renderTurn);
    } else {
      const { error } = await res.json().catch(() => ({ error: 'request failed' }));
      setStatus('⚠ ' + (error || 'request failed'), 'error');
    }
  }
});

window.addEventListener('popstate', () => {
  const m = location.pathname.match(/^\\/c\\/(.+)$/);
  if (m) viewConversation(decodeURIComponent(m[1]), false);
  else showNewConversationForm(false);
});

loadAgents().then(async () => {
  await loadConversations();
  const m = location.pathname.match(/^\\/c\\/(.+)$/);
  if (m) viewConversation(decodeURIComponent(m[1]), false);
  else showNewConversationForm(false);
});
</script>
</body>
</html>
`;
