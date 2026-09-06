import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockKycProvider, MockOtpProvider } from './mock.js';

test('MockOtpProvider verifies only the matching phone + code for a request', async () => {
  const provider = new MockOtpProvider();
  const { requestId } = await provider.sendOtp('+201234567890');

  assert.equal((await provider.checkOtp('+201234567890', requestId, '000000')).verified, true);
  assert.equal((await provider.checkOtp('+201234567890', requestId, '111111')).verified, false);
  assert.equal((await provider.checkOtp('+20999999999', requestId, '000000')).verified, false);
});

test('MockKycProvider approves a submission and reports its status', async () => {
  const provider = new MockKycProvider();
  const { verificationId } = await provider.submitVerification({
    userId: 'user-1',
    documentImage: { url: 'https://example.test/doc.jpg' },
    selfieImage: { url: 'https://example.test/selfie.jpg' },
    nationalIdNumber: '12345678901234',
  });

  assert.deepEqual(await provider.getVerificationStatus(verificationId), { status: 'approved' });
});
