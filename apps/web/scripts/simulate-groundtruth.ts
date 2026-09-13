// Data-simulation harness for GroundTruth (see docs/projects/groundtruth.md and
// apps/web/CLAUDE.md). Plays many simulated dual-role (buyer + seller) personas
// through the REAL app: real OTP/KYC signup routes, real listing-creation Server
// Action gate, real negotiation state machine, real dual-confirmed deal closure,
// real credit-purchase + webhook + pay-to-reveal flow. Nothing here writes rows
// directly except one read-only lookup (deal id by negotiation id, since the app
// itself doesn't expose that as JSON) — every state change goes through the
// running Next.js dev server's actual HTTP routes.
//
// Run with the dev server already up on BASE_URL, and DATABASE_URL loaded:
//   node --import tsx --env-file=.env scripts/simulate-groundtruth.ts
import { createHmac, randomInt } from 'node:crypto';
import { db, deals } from '@committee/db';
import { eq } from 'drizzle-orm';

const BASE_URL = process.env.SIMULATE_BASE_URL ?? 'http://localhost:3001';
const MOCK_OTP_CODE = '000000';
const MOCK_WEBHOOK_SECRET = 'mock-paymob-webhook-secret-dev-only';
const WEBHOOK_SIGNATURE_HEADER = 'x-paymob-signature';

type Persona = {
  index: number;
  phone: string;
  nationalIdNumber: string;
  userId: string;
  cookie: string;
};

function log(msg: string): void {
  console.log(`[sim] ${msg}`);
}

async function api(
  persona: Persona | null,
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; json: any; setCookie: string | null }> {
  const headers: Record<string, string> = {};
  if (persona) headers.Cookie = persona.cookie;
  let requestBody: BodyInit | undefined;
  if (body instanceof FormData) {
    requestBody = body;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: requestBody });
  const setCookieList =
    typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const setCookie = setCookieList[0]?.split(';')[0] ?? null;
  const json = await res.json().catch(() => null);
  if (res.status >= 500) {
    throw new Error(`${method} ${path} -> ${res.status}: ${JSON.stringify(json)}`);
  }
  return { status: res.status, json, setCookie };
}

// --- Phase 1: personas sign up (real OTP flow) and submit KYC (real KYC flow,
// always approved by MockKycProvider — see packages/auth-providers/src/mock.ts) ---

const EGYPT_PREFIXES = ['10', '11', '12', '15'];

function phoneFor(index: number): string {
  const prefix = EGYPT_PREFIXES[index % EGYPT_PREFIXES.length];
  return `+20${prefix}${String(10000000 + index).padStart(8, '0')}`;
}

function nationalIdFor(index: number): string {
  return `2900101${String(100000 + index).padStart(7, '0')}`;
}

async function signupPersona(index: number): Promise<Persona> {
  const phone = phoneFor(index);
  const sendRes = await api(null, 'POST', '/api/auth/otp/send', { phone });
  const requestId = sendRes.json.requestId as string;
  const verifyRes = await api(null, 'POST', '/api/auth/otp/verify', {
    requestId,
    code: MOCK_OTP_CODE,
  });
  const cookie = verifyRes.setCookie;
  if (!cookie) throw new Error(`no session cookie for persona ${index}`);
  return {
    index,
    phone,
    nationalIdNumber: nationalIdFor(index),
    userId: verifyRes.json.userId,
    cookie,
  };
}

async function submitKyc(persona: Persona): Promise<void> {
  const form = new FormData();
  form.set(
    'document',
    new File([new Uint8Array([1, 2, 3, 4])], 'id-document.jpg', { type: 'image/jpeg' }),
  );
  form.set(
    'selfie',
    new File([new Uint8Array([5, 6, 7, 8])], 'selfie.jpg', { type: 'image/jpeg' }),
  );
  form.set('nationalIdNumber', persona.nationalIdNumber);
  await api(persona, 'POST', '/api/kyc/submit', form);
}

// --- Phase 2: KYC-approved sellers publish listings across zones/property types ---

const ZONES = ['دمنهور', 'كفر الدوار', 'أبو حمص', 'رشيد', 'إيتاي البارود'];
const PROPERTY_TYPES = ['apartment', 'house', 'land', 'commercial'] as const;

type ListingSpec = {
  sellerIndex: number;
  title: string;
  description: string;
  zone: string;
  propertyType: (typeof PROPERTY_TYPES)[number];
  areaSqm: number;
  priceEgp: number;
  cell?: 'A' | 'B';
};

type CreatedListing = ListingSpec & { id: string };

function jitter(base: number, pct: number): number {
  const delta = base * pct * (randomInt(-100, 101) / 100);
  return Math.round(base + delta);
}

function buildListingSpecs(personaCount: number): ListingSpec[] {
  const specs: ListingSpec[] = [];
  let seller = 0;
  const nextSeller = () => {
    const s = seller % personaCount;
    seller += 1;
    return s;
  };

  // Cell A: apartments in زوodmanhour, ~70-100 sqm, ~8000 EGP/sqm baseline (band "0-100").
  for (let i = 0; i < 5; i += 1) {
    const area = jitter(85, 0.12);
    specs.push({
      sellerIndex: nextSeller(),
      title: `شقة للبيع في ${ZONES[0]}`,
      description: 'شقة نضيفة قريبة من الخدمات، جاهزة للمعاينة.',
      zone: ZONES[0],
      propertyType: 'apartment',
      areaSqm: area,
      priceEgp: jitter(area * 8000, 0.05),
      cell: 'A',
    });
  }

  // Cell B: houses in كفر الدوار, ~210-290 sqm, ~4500 EGP/sqm baseline (band "200-300").
  for (let i = 0; i < 5; i += 1) {
    const area = jitter(250, 0.14);
    specs.push({
      sellerIndex: nextSeller(),
      title: `بيت للبيع في ${ZONES[1]}`,
      description: 'بيت عائلي واسع، فيه مساحة كويسة ومطل جيد.',
      zone: ZONES[1],
      propertyType: 'house',
      areaSqm: area,
      priceEgp: jitter(area * 4500, 0.05),
      cell: 'B',
    });
  }

  // Noise listings: browsable inventory spread across all zones/types, no forced closure.
  // Skips the exact (zone, propertyType) pairs used for Cell A/B above (even with a
  // different area/price baseline, a noise deal landing in the same 100-sqm area band
  // would blend into that cell's average and dilute the deliberate price-outlier
  // signal below) — every other zone/type combination is still fair game.
  const noiseCount = 26;
  let noiseCreated = 0;
  for (let i = 0; noiseCreated < noiseCount; i += 1) {
    const zone = ZONES[i % ZONES.length];
    const propertyType = PROPERTY_TYPES[i % PROPERTY_TYPES.length];
    if (
      (zone === ZONES[0] && propertyType === 'apartment') ||
      (zone === ZONES[1] && propertyType === 'house')
    ) {
      continue;
    }
    noiseCreated += 1;
    const area = jitter(
      propertyType === 'land' ? 400 : propertyType === 'commercial' ? 150 : 120,
      0.3,
    );
    const pricePerSqm =
      propertyType === 'land' ? 1200 : propertyType === 'commercial' ? 6000 : 5000;
    specs.push({
      sellerIndex: nextSeller(),
      title: `${propertyType === 'land' ? 'أرض' : propertyType === 'commercial' ? 'محل' : propertyType === 'house' ? 'بيت' : 'شقة'} للبيع في ${zone}`,
      description: 'إعلان حقيقي معروض للبيع، للتواصل قدّم عرضك.',
      zone,
      propertyType,
      areaSqm: area,
      priceEgp: jitter(area * pricePerSqm, 0.2),
    });
  }

  return specs;
}

async function createListing(persona: Persona, spec: ListingSpec): Promise<CreatedListing> {
  const res = await api(persona, 'POST', '/api/listings', {
    title: spec.title,
    description: spec.description,
    zone: spec.zone,
    propertyType: spec.propertyType,
    areaSqm: spec.areaSqm,
    priceEgp: spec.priceEgp,
  });
  if (res.status !== 201) throw new Error(`listing creation failed: ${JSON.stringify(res.json)}`);
  return { ...spec, id: res.json.id };
}

// --- Phase 3: negotiations + dual-confirmed closure ---

async function respond(
  actor: Persona,
  negotiationId: string,
  action: 'counter' | 'accept' | 'reject',
  counterPriceEgp?: number,
): Promise<any> {
  const res = await api(actor, 'POST', `/api/negotiations/${negotiationId}/respond`, {
    action,
    counterPriceEgp,
  });
  if (res.status !== 200) throw new Error(`respond ${action} failed: ${JSON.stringify(res.json)}`);
  return res.json;
}

// A negotiation opens with turn='seller' (buyer just made the opening offer).
// `sellerSteps` is what the seller does on their turns; on a 'counter', the buyer
// automatically accepts next (keeps the simulation simple while still exercising
// multi-round state transitions for some threads).
async function runNegotiationToClose(
  buyer: Persona,
  seller: Persona,
  listing: CreatedListing,
  openOfferEgp: number,
  sellerCounterEgp?: number,
): Promise<{ negotiationId: string; agreedPriceEgp: number }> {
  const opened = await api(buyer, 'POST', `/api/listings/${listing.id}/negotiations`, {
    offerPriceEgp: openOfferEgp,
  });
  if (opened.status !== 201)
    throw new Error(`open negotiation failed: ${JSON.stringify(opened.json)}`);
  const negotiationId = opened.json.id as string;

  if (sellerCounterEgp) {
    await respond(seller, negotiationId, 'counter', sellerCounterEgp);
    await respond(buyer, negotiationId, 'accept');
    return { negotiationId, agreedPriceEgp: sellerCounterEgp };
  }
  await respond(seller, negotiationId, 'accept');
  return { negotiationId, agreedPriceEgp: openOfferEgp };
}

async function runNegotiationToReject(
  buyer: Persona,
  seller: Persona,
  listing: CreatedListing,
  openOfferEgp: number,
): Promise<void> {
  const opened = await api(buyer, 'POST', `/api/listings/${listing.id}/negotiations`, {
    offerPriceEgp: openOfferEgp,
  });
  if (opened.status !== 201)
    throw new Error(`open negotiation failed: ${JSON.stringify(opened.json)}`);
  await respond(seller, opened.json.id, 'reject');
}

async function openNegotiationAndLeaveIt(
  buyer: Persona,
  listing: CreatedListing,
  openOfferEgp: number,
): Promise<void> {
  const opened = await api(buyer, 'POST', `/api/listings/${listing.id}/negotiations`, {
    offerPriceEgp: openOfferEgp,
  });
  if (opened.status !== 201)
    throw new Error(`open negotiation failed: ${JSON.stringify(opened.json)}`);
}

async function dealIdForNegotiation(negotiationId: string): Promise<string> {
  const [row] = await db
    .select({ id: deals.id })
    .from(deals)
    .where(eq(deals.negotiationId, negotiationId))
    .limit(1);
  if (!row) throw new Error(`no deal found for negotiation ${negotiationId}`);
  return row.id;
}

async function closeDeal(buyer: Persona, seller: Persona, negotiationId: string): Promise<void> {
  const dealId = await dealIdForNegotiation(negotiationId);
  await api(buyer, 'POST', `/api/deals/${dealId}/confirm`);
  await api(seller, 'POST', `/api/deals/${dealId}/confirm`);
}

// --- Phase 4: credits + pay-to-reveal (real MockPaymentProvider webhook signature) ---

function signWebhookPayload(rawBody: string): string {
  return createHmac('sha256', MOCK_WEBHOOK_SECRET).update(rawBody).digest('hex');
}

async function buyCreditsAndComplete(
  persona: Persona,
  packageId: 'starter' | 'standard',
): Promise<void> {
  const purchase = await api(persona, 'POST', '/api/credits/purchase', { packageId });
  if (purchase.status !== 201)
    throw new Error(`credit purchase failed: ${JSON.stringify(purchase.json)}`);
  const rawBody = JSON.stringify({
    providerReference: purchase.json.providerReference,
    status: 'succeeded',
  });
  const res = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: { [WEBHOOK_SIGNATURE_HEADER]: signWebhookPayload(rawBody) },
    body: rawBody,
  });
  if (res.status !== 200) throw new Error(`webhook completion failed: ${res.status}`);
}

async function revealContact(buyer: Persona, listingId: string): Promise<void> {
  const res = await api(buyer, 'POST', `/api/listings/${listingId}/reveal-contact`);
  if (res.status !== 200) throw new Error(`reveal-contact failed: ${JSON.stringify(res.json)}`);
}

// --- Orchestration ---

async function main(): Promise<void> {
  const PERSONA_COUNT = 40;

  log(`signing up ${PERSONA_COUNT} personas (real OTP flow)...`);
  const personas: Persona[] = [];
  for (let i = 0; i < PERSONA_COUNT; i += 1) {
    personas.push(await signupPersona(i));
  }

  log('submitting KYC for every persona (dual-role: everyone can also sell)...');
  for (const persona of personas) {
    await submitKyc(persona);
  }

  log('publishing listings...');
  const specs = buildListingSpecs(PERSONA_COUNT);
  const listings: CreatedListing[] = [];
  for (const spec of specs) {
    listings.push(await createListing(personas[spec.sellerIndex], spec));
  }
  log(`created ${listings.length} listings across ${ZONES.length} zones.`);

  const cellA = listings.filter((l) => l.cell === 'A');
  const cellB = listings.filter((l) => l.cell === 'B');

  const buyerPool = (excludeSellerIndex: number) =>
    personas.filter((p) => p.index !== excludeSellerIndex);
  const pickBuyer = (excludeSellerIndex: number, salt: number) => {
    const pool = buyerPool(excludeSellerIndex);
    return pool[salt % pool.length];
  };

  log('closing deals in valuation Cell A (apartments, دمنهور)...');
  for (let i = 0; i < 4; i += 1) {
    const listing = cellA[i];
    const seller = personas[listing.sellerIndex];
    const buyer = pickBuyer(listing.sellerIndex, i + 7);
    const openOffer = Math.round(listing.priceEgp * 0.92);
    const counter = i % 2 === 0 ? Math.round(listing.priceEgp * 0.97) : undefined;
    const { negotiationId } = await runNegotiationToClose(
      buyer,
      seller,
      listing,
      openOffer,
      counter,
    );
    await closeDeal(buyer, seller, negotiationId);
  }
  // 5th Cell A listing: a deliberate price outlier close (~40% of the going per-sqm
  // rate) so COM-24's price-outlier heuristic has a real flag to surface once this
  // cell's valuation is established by the four closes above.
  {
    const listing = cellA[4];
    const seller = personas[listing.sellerIndex];
    const buyer = pickBuyer(listing.sellerIndex, 99);
    const lowballAgreed = Math.round(listing.areaSqm * 8000 * 0.25);
    const { negotiationId } = await runNegotiationToClose(buyer, seller, listing, lowballAgreed);
    await closeDeal(buyer, seller, negotiationId);
    log(
      `Cell A outlier deal closed at ~${Math.round(lowballAgreed / listing.areaSqm)} EGP/sqm (baseline ~8000).`,
    );
  }

  log('closing deals in valuation Cell B (houses, كفر الدوار)...');
  for (let i = 0; i < 4; i += 1) {
    const listing = cellB[i];
    const seller = personas[listing.sellerIndex];
    const buyer = pickBuyer(listing.sellerIndex, i + 13);
    const openOffer = Math.round(listing.priceEgp * 0.9);
    const counter = i % 2 === 1 ? Math.round(listing.priceEgp * 0.96) : undefined;
    const { negotiationId } = await runNegotiationToClose(
      buyer,
      seller,
      listing,
      openOffer,
      counter,
    );
    await closeDeal(buyer, seller, negotiationId);
  }
  // Leave cellB[4] with just an open negotiation, no close — realistic "still talking".
  {
    const listing = cellB[4];
    const buyer = pickBuyer(listing.sellerIndex, 41);
    await openNegotiationAndLeaveIt(buyer, listing, Math.round(listing.priceEgp * 0.85));
  }

  log('running scattered negotiations across noise listings (mix of close/reject/open)...');
  const noiseListings = listings.filter((l) => !l.cell);
  for (let i = 0; i < noiseListings.length; i += 1) {
    const listing = noiseListings[i];
    const seller = personas[listing.sellerIndex];
    const buyer = pickBuyer(listing.sellerIndex, i + 21);
    const outcome = i % 3;
    if (outcome === 0) {
      const openOffer = Math.round(listing.priceEgp * 0.88);
      const { negotiationId } = await runNegotiationToClose(
        buyer,
        seller,
        listing,
        openOffer,
        Math.round(listing.priceEgp * 0.95),
      );
      await closeDeal(buyer, seller, negotiationId);
    } else if (outcome === 1) {
      await runNegotiationToReject(buyer, seller, listing, Math.round(listing.priceEgp * 0.5));
    } else {
      await openNegotiationAndLeaveIt(buyer, listing, Math.round(listing.priceEgp * 0.9));
    }
  }

  log(
    'spamming one buyer persona across 5 distinct listings with zero closes (anti-gaming signal)...',
  );
  const flaggedBuyer = personas[PERSONA_COUNT - 1];
  const spamTargets = listings.filter((l) => l.sellerIndex !== flaggedBuyer.index).slice(0, 5);
  for (const listing of spamTargets) {
    await openNegotiationAndLeaveIt(flaggedBuyer, listing, Math.round(listing.priceEgp * 0.6));
  }

  log('buyers purchasing credits and revealing seller contacts...');
  const revealBuyers = personas.slice(0, 15);
  for (let i = 0; i < revealBuyers.length; i += 1) {
    const buyer = revealBuyers[i];
    await buyCreditsAndComplete(buyer, i % 3 === 0 ? 'standard' : 'starter');
    const targets = listings.filter((l) => l.sellerIndex !== buyer.index).slice(i, i + 2);
    for (const listing of targets) {
      await revealContact(buyer, listing.id);
    }
  }

  log('simulation complete.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('[sim] failed:', error);
    process.exit(1);
  });
