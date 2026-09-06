import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionPayload = {
  userId: string;
  role: 'user' | 'admin';
};

// TODO(human): SESSION_SECRET must be a real random secret in every deployed
// environment (see .env.example) — this signs the session cookie, so a weak or
// shared secret lets anyone forge a session for any user/role.
export function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error('SESSION_SECRET is required');
  }
  return secret;
}

function sign(data: string, secret: string): string {
  return createHmac('sha256', secret).update(data).digest('base64url');
}

// Compact `<payload>.<hmac>` token, not a JWT library — the payload is small and
// fixed-shape (userId + role), so a full JWT implementation (header, alg negotiation,
// etc.) would be unused complexity for what this needs.
export function createSessionToken(payload: SessionPayload, secret: string): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${data}.${sign(data, secret)}`;
}

export function verifySessionToken(token: string, secret: string): SessionPayload | null {
  const [data, signature] = token.split('.');
  if (!data || !signature) {
    return null;
  }

  const expectedSignature = Buffer.from(sign(data, secret));
  const actualSignature = Buffer.from(signature);
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'userId' in parsed &&
      'role' in parsed &&
      typeof (parsed as SessionPayload).userId === 'string' &&
      ((parsed as SessionPayload).role === 'user' || (parsed as SessionPayload).role === 'admin')
    ) {
      return parsed as SessionPayload;
    }
    return null;
  } catch {
    return null;
  }
}
