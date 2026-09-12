---
title: 'Plan visualizer'
order: 3
---

<p>Once a plan is finalized, <code>generatePlanVisual</code>
      (<code>conversation/generate-plan-visual.ts</code>) makes one extra
      call — deliberately outside the round-robin debate — asking a
      dedicated Visualizer agent for a single <code>&lt;svg&gt;</code>
      diagram of the plan's tasks in order. The result is stored via
      <code>setConversationPlanVisual</code> and shown by both the web
      viewer and the <code>committee_plan</code> MCP tool's reply.</p>
      <div class="art">
        <svg viewBox="0 0 400 220" width="400" height="220">
          <rect width="400" height="220" fill="#ffffff"/>
          <!-- plan document -->
          <rect x="44" y="54" width="110" height="130" rx="10" fill="var(--cream-dk)" transform="translate(4,4)"/>
          <rect x="40" y="50" width="110" height="130" rx="10" fill="var(--cream)" stroke="var(--ink)" stroke-width="4"/>
          <rect x="48" y="58" width="40" height="14" rx="7" fill="#ffffff" opacity="0.35"/>
          <circle cx="60" cy="100" r="8" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <text x="60" y="104" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">1</text>
          <line x1="76" y1="100" x2="130" y2="100" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="60" cy="126" r="8" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <text x="60" y="130" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">2</text>
          <line x1="76" y1="126" x2="130" y2="126" stroke="var(--ink)" stroke-width="3"/>
          <circle cx="60" cy="152" r="8" fill="#ffffff" stroke="var(--ink)" stroke-width="3"/>
          <text x="60" y="156" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="10" fill="var(--ink)">3</text>
          <line x1="76" y1="152" x2="130" y2="152" stroke="var(--ink)" stroke-width="3"/>
          <text x="95" y="204" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">PLAN</text>
          <!-- sparkle -->
          <g stroke="var(--ink)" stroke-width="4" stroke-linecap="round">
            <line x1="196" y1="98" x2="196" y2="120"/>
            <line x1="185" y1="109" x2="207" y2="109"/>
          </g>
          <path d="M170 118 H222" stroke="var(--ink)" stroke-width="5" stroke-linecap="round" fill="none"/>
          <path d="M222 118 L208 110 M222 118 L208 126" stroke="var(--ink)" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- framed svg output -->
          <rect x="254" y="44" width="130" height="140" rx="12" fill="var(--blue-dk)" transform="translate(4,4)"/>
          <rect x="250" y="40" width="130" height="140" rx="12" fill="var(--blue)" stroke="var(--ink)" stroke-width="5"/>
          <rect x="264" y="54" width="102" height="88" rx="4" fill="#ffffff" stroke="var(--ink)" stroke-width="4"/>
          <circle cx="335" cy="72" r="10" fill="var(--yellow)" stroke="var(--ink)" stroke-width="3"/>
          <path d="M264 138 L296 100 L316 122 L340 88 L366 138 Z" fill="var(--coral)" stroke="var(--ink)" stroke-width="4" stroke-linejoin="round"/>
          <ellipse cx="270" cy="62" rx="14" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(-20 270 62)"/>
          <text x="315" y="200" text-anchor="middle" font-family="'Baloo 2',Arial" font-weight="700" font-size="13" fill="var(--ink)">SVG DIAGRAM</text>
        </svg>
      </div>
