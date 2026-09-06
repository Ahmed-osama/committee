# packages/auth-providers

Vendor-agnostic KYC/OTP interfaces for GroundTruth (COM-15). Exists so COM-18's auth flow
never imports a vendor SDK directly — see `docs/projects/groundtruth-vendor-spike.md` for
the vendor research this interface is designed against (Sumsub for KYC, Twilio Verify for
OTP are the current lead candidates, both unconfirmed).

## Layout
- `src/otp.ts` / `src/kyc.ts` — the two provider interfaces, no implementation.
- `src/mock.ts` — `MockOtpProvider` / `MockKycProvider`, used by `apps/web` and tests until
  a real vendor is wired up. `MockKycProvider` always approves; `MockOtpProvider` accepts
  a fixed `000000` code — neither should be reachable outside dev/test.

## Conventions
- A real vendor adapter is a new sibling file (e.g. `src/twilio-verify.ts`) implementing
  `OtpProvider`, not a change to the interface files — the interface is the contract
  `apps/web` codes against, and shouldn't need to change when the vendor does.
- Don't put vendor credentials or SDK calls here directly without also updating
  `.env.example` with placeholder-only values and a TODO comment on what a human must
  provision.
