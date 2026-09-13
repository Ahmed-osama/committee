'use server';

import { redirect } from 'next/navigation';
import { requireOperatorSession } from '@/app/api/_lib/session';
import { logAssistedSession } from '@/lib/operator/assisted-sessions';

// The only write path anywhere in the operator tool: logging which canned script
// (by id — never free text) an operator played to a caller. Everything else in
// (operator)/operator is a read query. `channel` is hardcoded to 'phone_operator'
// here — 'scout_witnessed' belongs to the separate in-person GTM scout flow
// (COM-31), not this phone tool.
export async function logScriptAction(formData: FormData): Promise<void> {
  const session = await requireOperatorSession();
  if (!session) {
    redirect('/operator');
  }

  const userId = formData.get('userId');
  const scriptId = formData.get('scriptId');
  if (typeof userId !== 'string' || typeof scriptId !== 'string') {
    redirect('/operator');
  }

  await logAssistedSession({
    userId,
    operatorId: session.userId,
    channel: 'phone_operator',
    scriptId,
  });

  redirect(`/operator?phone=${encodeURIComponent(formData.get('phone')?.toString() ?? '')}&logged=1`);
}
