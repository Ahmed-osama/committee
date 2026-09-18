import { db, users } from '@committee/db';
import { eq } from 'drizzle-orm';
import { expect, test } from '@playwright/test';

// COM-35's actual safety requirement, made concrete: an operator-role session must
// never be able to complete a negotiation or deal action, even though the API
// routes take a raw userId from the session rather than checking role deeply in
// every state-machine function. This test exercises the real routes over HTTP
// against a real operator session, not a mocked one — proving the explicit
// role check added to each route (see COM-35's requireOperatorSession work)
// actually rejects the request, and that logging an assisted session still works.
test('operator session is rejected by negotiation/deal endpoints but can log an assisted session', async ({
  page,
}) => {
  const operatorPhone = `+2010${Math.floor(10000000 + Math.random() * 89999999)}`;
  const callerPhone = `+2010${Math.floor(10000000 + Math.random() * 89999999)}`;

  async function loginAs(phone: string) {
    const send = await page.request.post('/api/auth/otp/send', { data: { phone } });
    if (!send.ok()) {
      throw new Error(`otp/send failed: ${send.status()} ${await send.text()}`);
    }
    const { requestId } = (await send.json()) as { requestId: string };
    const verify = await page.request.post('/api/auth/otp/verify', {
      data: { requestId, code: '000000' },
    });
    if (!verify.ok()) {
      throw new Error(`otp/verify failed: ${verify.status()} ${await verify.text()}`);
    }
  }

  // Create the caller account first (plain 'user' role, never promoted).
  await loginAs(callerPhone);

  // Create the operator account, then promote it directly in the DB — there's no
  // self-serve path to any elevated role (same as 'admin' today), then re-login so
  // the session cookie actually carries the updated role.
  await loginAs(operatorPhone);
  await db.update(users).set({ role: 'operator' }).where(eq(users.phone, operatorPhone));
  await loginAs(operatorPhone);

  const negotiationAttempt = await page.request.post(
    '/api/listings/00000000-0000-0000-0000-000000000000/negotiations',
    { data: { offerPriceEgp: 1000 } },
  );
  expect(negotiationAttempt.status()).toBe(403);

  const respondAttempt = await page.request.post(
    '/api/negotiations/00000000-0000-0000-0000-000000000000/respond',
    { data: { action: 'accept' } },
  );
  expect(respondAttempt.status()).toBe(403);

  const confirmAttempt = await page.request.post(
    '/api/deals/00000000-0000-0000-0000-000000000000/confirm',
  );
  expect(confirmAttempt.status()).toBe(403);

  // The one thing an operator *can* do: look up the caller's account and log which
  // canned script they played — never a free-text message.
  await page.goto(`/operator?phone=${encodeURIComponent(callerPhone)}`);
  await expect(page.getByText('KYC status:')).toBeVisible();
  await page.locator('select[name="scriptId"]').selectOption('welcome');
  await page.getByRole('button', { name: 'Log script played' }).click();
  await page.waitForURL('**/operator?**logged=1**');
  await expect(page.getByText('Script play logged.')).toBeVisible();

  const [caller] = await db.select().from(users).where(eq(users.phone, callerPhone)).limit(1);
  const [operator] = await db.select().from(users).where(eq(users.phone, operatorPhone)).limit(1);
  expect(caller?.role).toBe('user');
  expect(operator?.role).toBe('operator');
});
