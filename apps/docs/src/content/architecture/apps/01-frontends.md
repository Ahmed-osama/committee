---
title: 'Front doors: CLI, web & MCP'
order: 1
---

<p>Three thin front ends share the same <code>@committee/core</code>
      engine. <code>apps/cli</code> (<code>committee plan</code>,
      <code>transcript</code>, <code>serve</code>, ...) drives it from a
      terminal. <code>server/web-server.ts</code> drives the same
      <code>runPlanningSession</code> from an HTTP API with an SSE stream, so
      you can watch a conversation live, inject messages, pause/resume it, or
      stop it from a browser at <code>localhost:3000</code> — each
      conversation also gets a deep link (<code>/c/:id</code>) and a short
      generated sidebar title (<code>generateConversationTitle</code>, one
      out-of-band call fired right after creation) instead of the raw goal
      text. <code>apps/mcp-server</code>
      exposes the same loop as a <code>committee_plan</code> MCP tool, so
      another AI agent — not just a human — can delegate a planning task
      here without spending its own model usage on the debate. It also
      exposes <code>committee_resolve_linear_target</code>, a small
      keyword-config-driven lookup (<code>linear-target-rules.ts</code>)
      that says which Linear team/labels/project a spec belongs under —
      without calling Linear itself, since the calling session already has
      the official Linear MCP server connected for that.</p>
      <div class="art">
        <svg viewBox="0 0 480 220" width="480" height="220">
          <rect width="480" height="220" fill="#ffffff"/>
          <!-- terminal window -->
          <rect x="14" y="24" width="120" height="86" rx="12" fill="var(--purple-dk)" transform="translate(4,4)"/>
          <rect x="10" y="20" width="120" height="86" rx="12" fill="var(--purple)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="20" y="38" width="100" height="52" rx="5" fill="#0e0e0e"/>
          <text x="28" y="66" font-family="monospace" font-weight="bold" font-size="14" fill="var(--green)">&gt;_</text>
          <text x="70" y="130" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">CLI</text>
          <!-- browser window -->
          <rect x="180" y="24" width="120" height="86" rx="12" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="176" y="20" width="120" height="86" rx="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="176" y="20" width="120" height="20" rx="12" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <circle cx="187" cy="30" r="3" fill="var(--coral)"/>
          <circle cx="197" cy="30" r="3" fill="var(--yellow)"/>
          <circle cx="207" cy="30" r="3" fill="var(--green)"/>
          <line x1="190" y1="58" x2="280" y2="58" stroke="var(--ink)" stroke-width="3"/>
          <line x1="190" y1="72" x2="260" y2="72" stroke="var(--ink)" stroke-width="3"/>
          <line x1="190" y1="86" x2="270" y2="86" stroke="var(--ink)" stroke-width="3"/>
          <text x="236" y="130" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">WEB VIEWER</text>
          <!-- mcp: another agent, chat bubble -->
          <rect x="346" y="24" width="120" height="86" rx="12" fill="var(--coral-dk)" transform="translate(4,4)"/>
          <rect x="342" y="20" width="120" height="86" rx="12" fill="var(--coral)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="352" y="32" width="52" height="34" rx="10" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <path d="M362 66 v10 l12 -10 z" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="368" cy="49" r="3" fill="var(--ink)"/>
          <circle cx="380" cy="49" r="3" fill="var(--ink)"/>
          <circle cx="392" cy="49" r="3" fill="var(--ink)"/>
          <text x="402" y="130" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="12" fill="var(--ink)">MCP TOOL</text>
          <!-- shared core -->
          <circle cx="240" cy="172" r="30" fill="var(--yellow-dk)" transform="translate(3,4)"/>
          <circle cx="237" cy="168" r="30" fill="var(--yellow)" stroke="var(--ink)" stroke-width="5"/>
          <ellipse cx="227" cy="157" rx="10" ry="5" fill="#ffffff" opacity="0.4"/>
          <text x="237" y="173" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="11" fill="var(--ink)">CORE</text>
          <path d="M70 110 V150 Q70 160 130 168" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M236 110 V138" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
          <path d="M402 110 V150 Q402 160 344 168" stroke="var(--ink)" stroke-width="4" fill="none" stroke-linecap="round"/>
        </svg>
      </div>
