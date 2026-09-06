# GroundTruth vendor spike (COM-15)

**Status: research recommendation only — not a signed decision.** Nobody has contacted a
vendor, opened a sales conversation, or committed to pricing. The founder must confirm a
choice before any contract is signed or API keys are provisioned. This doc exists so that
choice is informed, and so COM-18 has a concrete target to implement the pluggable
provider interface against — see `packages/auth-providers` for that interface, which is
deliberately vendor-agnostic so switching the pick below doesn't touch application code.

## Why this matters for GroundTruth specifically

Both KYC and OTP are load-bearing for the anti-collusion mechanism (see
`docs/projects/groundtruth.md`): every account must be provably a distinct real person,
and every phone number must resolve to a real, reachable Egyptian number. A vendor that
silently degrades on Egyptian national IDs or `+20` numbers — rather than cleanly failing
— would let sockpuppets back in through the side door.

## KYC / identity verification vendors

| Vendor | Egypt support | Pricing model | Integration complexity |
|---|---|---|---|
| **Sumsub** | Broad global document coverage (14,000+ document types, 220+ countries/territories), used in production by exchanges accepting Egyptian passport/national ID/driver's license. Egyptian national ID is not called out as a named gap anywhere found. | Custom/quoted, typically per-check tiered pricing negotiated by volume; no Egypt-specific surcharge found. | Well-documented REST API + hosted WebSDK flow (upload or in-app camera capture), webhook-driven status updates — matches a "stub the verification call, add real vendor later" integration shape well. |
| **Shufti Pro** | Explicitly markets Egypt coverage, states alignment with Central Bank of Egypt (CBE) KYC/AML expectations — the closest to a "built for this market" claim among the three. | Not published; third-party estimates ~$0.50–$1.70/verification, quoted via sales, 7-day trial available. | REST API, similar webhook/callback model to Sumsub. Slightly less mainstream than Sumsub/Onfido-tier vendors, so fewer public integration examples. |
| **Didit** | Advertises Egypt as a supported country with a flat global per-check price (no per-country surcharge). | Simple flat-rate published pricing (~$0.33/full KYC bundle: ID + liveness + face match + IP analysis) — the most price-transparent of the three. | Newer/smaller vendor than Sumsub; API-first, comparable integration shape, but less production track record to point to. |

Also surfaced but not shortlisted: **Arya AI** (Egypt National ID field-extraction API —
narrower than full KYC/liveness, could be a cheaper OCR-only building block later),
**uqudo** and **IDMERIT** (both explicitly market Egypt ID/KYB/AML coverage, similar
shape to Shufti Pro), **Digified** (recently licensed specifically to operate eKYC in
Egypt — interesting as a local-compliance signal, but too new to have public pricing or
integration docs to compare against).

**Top recommendation: Sumsub**, as the default target to validate the interface against —
broadest document coverage and the most mainstream integration pattern reduces the risk
that Egyptian IDs hit an undocumented edge case. **Shufti Pro is the fallback** if Sumsub's
sales conversation reveals gaps in Egyptian national ID handling specifically, given its
explicit CBE-alignment claim. Didit is worth a second look purely on price once volume is
real, since its flat-rate model is unusually transparent for this vendor category.

## OTP / SMS verification vendors

| Vendor | Egypt (`+20`) support | Pricing model | Integration complexity |
|---|---|---|---|
| **Twilio Verify** | Global carrier reach including Egypt; Twilio publishes a per-country SMS price list (Egypt-specific per-message rate wasn't retrievable during this spike — see open question below) plus a flat verification fee. | $0.05 per successful verification + destination SMS channel fee (Egypt rate to be confirmed directly with Twilio sales/pricing page). | Purpose-built Verify API (send/check code, not raw SMS) — least integration work of the three, most mainstream, most public documentation/examples. |
| **Vonage Verify** | Multi-channel (SMS, WhatsApp, voice, silent auth) OTP API; general global carrier coverage claimed, but Egypt-specific coverage wasn't confirmed in this spike — flagged as an open question. | Usage-based, comparable shape to Twilio (send + channel fee), not fully itemized in what was retrievable here. | Similar send/check verification-code API to Twilio; WhatsApp-channel OTP is notable given how widely WhatsApp is used in Egypt — could reduce SMS deliverability risk as a fallback channel. |
| **SMS Misr** (local specialist) | Cairo-based, Egypt-first SMS/OTP gateway — the most likely to have direct relationships with Egyptian carriers (Vodafone Egypt, Orange Egypt, Etisalat Misr, WE) rather than routing through international aggregators, which tends to mean better deliverability and lower per-message cost domestically. | Not published; quote-based via direct contact (phone/email) rather than self-serve pricing. | Own OTP-send/OTP-check REST endpoints, but far less public documentation/integration examples than Twilio or Vonage — expect more direct back-and-forth to integrate. |

**Top recommendation: Twilio Verify**, as the default target to validate the interface
against — purpose-built OTP semantics (not raw SMS), best-documented, and least
integration risk. **SMS Misr is worth a direct pricing conversation** before committing,
specifically because local Egyptian carrier relationships can matter a lot for OTP
deliverability and cost at scale in a way that's hard to fully evaluate from vendor
marketing pages alone — this is exactly the kind of thing a sales call should confirm
before signing anything.

## Open questions a real vendor conversation needs to close

These come from what this spike could *not* confirm from public sources alone and should
be asked directly:
1. Twilio's exact Egypt-carrier per-SMS rate (its Egypt pricing page exists but specific
   rates weren't retrievable during this research pass).
2. Whether Vonage Verify has confirmed, current Egyptian carrier coverage (not just
   general "global" marketing language).
3. Whether Egyptian national ID has any format edge cases (e.g. the 14-digit national ID
   number's embedded birthdate/governorate-code structure) that trip up OCR-based
   extraction on any shortlisted KYC vendor — worth a real test upload before committing.
4. Data residency / retention requirements under Egyptian law for KYC documents (feeds
   into the COM-27 legal gate, not blocking here, but the vendor conversation should
   surface it).

## What this spike does NOT do

- No vendor has been contacted, no API keys exist, no contract has been discussed.
- No pricing here should be treated as final — every number above is either a published
  rate that may have changed, or a third-party estimate.
- The founder decides; this doc narrows the field so that decision is fast, not automatic.

## What COM-15 delivered in code

`packages/auth-providers` defines `KycProvider` and `OtpProvider` interfaces plus a
`MockKycProvider`/`MockOtpProvider` pair for local dev and tests. COM-18 (auth/KYC/
compliance infrastructure) implements against these interfaces regardless of which vendor
above is ultimately chosen — swapping vendors later means writing one new adapter file,
not touching `apps/web`.
