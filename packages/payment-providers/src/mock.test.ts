import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MockPaymentProvider } from './mock.js';

test('createCheckout returns a distinct reference and an in-app mock checkout URL', async () => {
  const provider = new MockPaymentProvider();
  const a = await provider.createCheckout({ userId: 'user-1', creditPackage: { id: 'small', credits: 5, priceEgp: 50 } });
  const b = await provider.createCheckout({ userId: 'user-1', creditPackage: { id: 'small', credits: 5, priceEgp: 50 } });

  assert.notEqual(a.providerReference, b.providerReference);
  assert.equal(a.checkoutUrl, `/credits/mock-checkout/${a.providerReference}`);
});

test('a correctly-signed webhook payload parses to a normalized event', () => {
  const provider = new MockPaymentProvider();
  const body = JSON.stringify({ providerReference: 'ref-1', status: 'succeeded' });
  const signature = provider.signWebhookPayload(body);

  assert.deepEqual(provider.parseWebhookEvent(body, signature), { providerReference: 'ref-1', status: 'succeeded' });
});

test('a tampered body fails signature verification', () => {
  const provider = new MockPaymentProvider();
  const body = JSON.stringify({ providerReference: 'ref-1', status: 'succeeded' });
  const signature = provider.signWebhookPayload(body);
  const tampered = JSON.stringify({ providerReference: 'ref-1', status: 'failed' });

  assert.equal(provider.parseWebhookEvent(tampered, signature), null);
});

test('an unsigned or missing signature is rejected', () => {
  const provider = new MockPaymentProvider();
  const body = JSON.stringify({ providerReference: 'ref-1', status: 'succeeded' });

  assert.equal(provider.parseWebhookEvent(body, ''), null);
  assert.equal(provider.parseWebhookEvent(body, 'not-a-real-signature'), null);
});

test('a malformed or incomplete payload is rejected even with a valid signature', () => {
  const provider = new MockPaymentProvider();
  const body = JSON.stringify({ providerReference: 'ref-1' });
  const signature = provider.signWebhookPayload(body);

  assert.equal(provider.parseWebhookEvent(body, signature), null);
});
