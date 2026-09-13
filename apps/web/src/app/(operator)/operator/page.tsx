import { requireOperatorSession } from '@/app/api/_lib/session';
import { findAccountByPhone } from '@/lib/operator/account-lookup';
import { listCannedScripts } from '@/lib/operator/assisted-sessions';
import { logScriptAction } from './actions';

// Direct DB queries, no DB at build time in this repo — same reasoning as (site)'s
// listings page and (admin)'s dashboard.
export const dynamic = 'force-dynamic';

// Deliberately plain English strings, no next-intl — see layout.tsx's comment.
// Read-only account lookup + a script-play logger; nothing here can open a
// negotiation, respond to one, or confirm a deal (see the three API routes' explicit
// operator-role rejection) — COM-35's whole point is that the account owner's own
// device does that, not this tool.
export default async function OperatorPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; logged?: string }>;
}) {
  const session = await requireOperatorSession();
  if (!session) {
    return (
      <main>
        <h1>GroundTruth operator tool</h1>
        <p>Not authorized.</p>
      </main>
    );
  }

  const { phone, logged } = await searchParams;
  const [account, scripts] = await Promise.all([
    phone ? findAccountByPhone(phone) : null,
    listCannedScripts(),
  ]);

  return (
    <main>
      <h1>GroundTruth operator tool</h1>
      <p>Narrate the caller&apos;s own account state to them. You cannot act on their behalf.</p>

      <form method="GET">
        <label>
          Caller&apos;s phone number
          <input type="tel" name="phone" defaultValue={phone ?? ''} required />
        </label>
        <button type="submit">Look up</button>
      </form>

      {logged === '1' ? <p role="status">Script play logged.</p> : null}

      {phone && !account ? <p>No account found for that number.</p> : null}

      {account ? (
        <>
          <section>
            <h2>Account</h2>
            <p>Phone: {account.user.phone}</p>
            <p>KYC status: {account.kyc?.status ?? 'not submitted'}</p>
          </section>

          <section>
            <h2>Listings ({account.listings.length})</h2>
            <ul>
              {account.listings.map((listing) => (
                <li key={listing.id}>
                  {listing.title} — {listing.priceEgp.toLocaleString()} EGP — {listing.status}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Negotiations ({account.negotiations.length})</h2>
            <ul>
              {account.negotiations.map((negotiation) => (
                <li key={negotiation.id}>
                  {negotiation.currentPriceEgp.toLocaleString()} EGP — {negotiation.status} — their
                  turn: {negotiation.turn}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Deals ({account.deals.length})</h2>
            <ul>
              {account.deals.map((deal) => (
                <li key={deal.id}>
                  {deal.agreedPriceEgp.toLocaleString()} EGP — {deal.status}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Log a canned script</h2>
            <form action={logScriptAction}>
              <input type="hidden" name="userId" value={account.user.id} />
              <input type="hidden" name="phone" value={phone} />
              <label>
                Script
                <select name="scriptId" required defaultValue="">
                  <option value="" disabled>
                    —
                  </option>
                  {scripts.map((script) => (
                    <option key={script.id} value={script.id}>
                      {script.label}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Log script played</button>
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}
