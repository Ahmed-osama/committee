export interface LinearTarget {
  team: string;
  labels: string[];
  project: string | null;
}

export interface LinearTargetRule extends LinearTarget {
  name: string;
  keywords: string[];
}

/** Only one team exists in this workspace right now — resolution falls back here when nothing more specific matches. */
export const DEFAULT_LINEAR_TARGET: LinearTarget = {
  team: 'Committee',
  labels: [],
  project: null,
};

/**
 * Keyword rules, first match wins. Kept to what's actually true of this workspace today
 * rather than speculative categories — add a rule here once a new initiative/Epic exists
 * for it to point at, not before.
 */
export const LINEAR_TARGET_RULES: LinearTargetRule[] = [
  {
    name: 'launchpad-platform-enhancements',
    keywords: ['launchpad', 'mini-startup', 'mini startup', 'platform enhancement'],
    team: 'Committee',
    labels: [],
    project: 'Platform Enhancements: Committee as a Launchpad',
  },
];

export function resolveLinearTarget(summary: string): { matchedRule: string | null } & LinearTarget {
  const haystack = summary.toLowerCase();
  const rule = LINEAR_TARGET_RULES.find((r) => r.keywords.some((k) => haystack.includes(k.toLowerCase())));
  if (!rule) {
    return { matchedRule: null, ...DEFAULT_LINEAR_TARGET };
  }
  return { matchedRule: rule.name, team: rule.team, labels: rule.labels, project: rule.project };
}
