import { assistedSessionLogs, cannedScripts, db, users } from '@committee/db';
import { eq } from 'drizzle-orm';

export class UnknownScriptError extends Error {}
export class UnknownUserError extends Error {}

export async function listCannedScripts() {
  return db.select().from(cannedScripts);
}

// The actual audit trail COM-35's acceptance criteria requires: every assisted
// interaction writes a row here, tagged with channel/operator/script/timestamp.
// `scriptId` is validated against the fixed, seeded set (see packages/db's
// canned_scripts migration) rather than trusted as free text — this is the
// structural half of the "no free-form operator messaging" constraint, the other
// half being that the operator UI itself has no free-text field to begin with.
export async function logAssistedSession(input: {
  userId: string;
  operatorId: string;
  channel: 'scout_witnessed' | 'phone_operator';
  scriptId: string;
}) {
  const [user] = await db.select().from(users).where(eq(users.id, input.userId)).limit(1);
  if (!user) {
    throw new UnknownUserError('no such user');
  }

  const [script] = await db
    .select()
    .from(cannedScripts)
    .where(eq(cannedScripts.id, input.scriptId))
    .limit(1);
  if (!script) {
    throw new UnknownScriptError('scriptId must match a seeded canned script');
  }

  const [row] = await db
    .insert(assistedSessionLogs)
    .values({
      userId: input.userId,
      operatorId: input.operatorId,
      channel: input.channel,
      scriptId: input.scriptId,
    })
    .returning();
  return row;
}
