import { requireAdminSession } from '@/app/api/_lib/session';
import { getHighActivityBuyersWithNoClose, getPriceOutlierDeals, getRejectedKycSubmissions } from '@/lib/admin/moderation';

// Direct DB queries, no DB at build time in this repo — see (site)'s listings/page.tsx
// comment for the same reasoning.
export const dynamic = 'force-dynamic';

// Deliberately plain English strings, no next-intl — see layout.tsx's comment on why
// this dashboard stays unlocalized.
export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  if (!session) {
    return (
      <main>
        <h1>GroundTruth admin</h1>
        <p>Not authorized.</p>
      </main>
    );
  }

  const [rejectedKyc, highActivityBuyers, priceOutliers] = await Promise.all([
    getRejectedKycSubmissions(),
    getHighActivityBuyersWithNoClose(),
    getPriceOutlierDeals(),
  ]);

  return (
    <main>
      <h1>GroundTruth admin</h1>
      <p>Read-only review lists. Nothing here takes action automatically — a human decides.</p>

      <section>
        <h2>Rejected KYC submissions</h2>
        {rejectedKyc.length === 0 ? (
          <p>None.</p>
        ) : (
          <ul>
            {rejectedKyc.map((row) => (
              <li key={row.id}>
                {row.phone} — {row.rejectionReason ?? '(no reason recorded)'} — {row.createdAt.toISOString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>High-activity buyers with no closed deals</h2>
        <p>Buyers with an unusually high negotiation count and zero closed deals.</p>
        {highActivityBuyers.length === 0 ? (
          <p>None.</p>
        ) : (
          <ul>
            {highActivityBuyers.map((row) => (
              <li key={row.buyerId}>
                {row.phone} — {row.negotiationCount} negotiations, {row.closedDealCount} closed
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Deals priced far from the local valuation</h2>
        {priceOutliers.length === 0 ? (
          <p>None.</p>
        ) : (
          <ul>
            {priceOutliers.map((row) => (
              <li key={row.dealId}>
                Deal {row.dealId} — {row.pricePerSqmEgp.toLocaleString()} EGP/m² vs. a {row.cellAvgPricePerSqmEgp.toLocaleString()} EGP/m²
                area average
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
