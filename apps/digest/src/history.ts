import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

// Plain JSON, not a Drizzle/SQLite schema of its own — core's persistence pattern
// (agents/conversations/messages, all planning-conversation-shaped) didn't transfer, and
// digest's actual need (a flat history of past runs) was simple enough not to need it.
// See FRICTION.md.
const HISTORY_PATH = join(dirname(fileURLToPath(import.meta.url)), '..', 'digest-history.json');

export interface DigestEntry {
  topic: string;
  digest: string;
  at: string;
}

export function appendHistory(entry: DigestEntry): void {
  const history: DigestEntry[] = existsSync(HISTORY_PATH) ? JSON.parse(readFileSync(HISTORY_PATH, 'utf8')) : [];
  history.push(entry);
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}
