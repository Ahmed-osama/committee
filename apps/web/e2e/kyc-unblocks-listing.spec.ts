import { expect, test } from '@playwright/test';

// This is the exact path that was silently broken: COM-18 (auth/KYC) and COM-17
// (listings) were both marked Done in Linear, but there was no UI that could ever
// carry a real user from login to an approved KYC status, so listing creation was an
// unreachable dead end for everyone (see COM-49-53). This test exists specifically so
// that regression can't ship silently again — it's the actual definition of "done"
// for that gap-fill, not the individual pieces in isolation.
test('login -> KYC dead-end CTA -> submit -> approved -> listing form reachable', async ({
  page,
}) => {
  // A fresh phone number per run — MockOtpProvider's state is in-memory/process-local
  // (see apps/web/CLAUDE.md), so a random number avoids colliding with a prior run
  // against a reused dev server.
  const phone = `+2010${Math.floor(10000000 + Math.random() * 89999999)}`;

  await page.goto('/ar/login');
  await page.getByPlaceholder('+201001234567').fill(phone);
  await page.getByRole('button', { name: 'إرسال الكود' }).click();

  // Labels here aren't programmatically associated (`<label>` sibling, no htmlFor) —
  // use type/name selectors rather than getByLabel, which would silently fail to match.
  await page.locator('input[type="text"]').fill('000000');
  await page.getByRole('button', { name: 'تأكيد' }).click();
  await page.waitForURL('**/ar');

  // Dead end before the fix: static "kycRequired" text with no way forward.
  await page.goto('/ar/listings/new');
  await expect(page.getByText('لازم يتم قبول توثيق هويتك الأول')).toBeVisible();
  await page.getByRole('link', { name: 'وثّق هويتك' }).click();
  await page.waitForURL('**/ar/account/kyc');

  await page.locator('input[name="nationalIdNumber"]').fill('29001010123456');
  const fakeImage = { name: 'id.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('fake') };
  await page.locator('input[name="documentFront"]').setInputFiles(fakeImage);
  await page.locator('input[name="selfie"]').setInputFiles(fakeImage);
  await page.getByRole('button', { name: 'إرسال للتوثيق' }).click();

  // The mock KYC provider resolves synchronously to 'approved' (see kyc-flow.ts) —
  // a real vendor is async/webhook-driven, so this assertion is what "approved"
  // looks like today, not the final design.
  await expect(page.getByText('تم توثيق هويتك.')).toBeVisible();

  await page.goto('/ar/listings/new');
  await expect(page.getByRole('button', { name: 'نشر الإعلان' })).toBeVisible();
});
