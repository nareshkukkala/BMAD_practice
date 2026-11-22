# Ride-hailing MVP

A local/demo implementation of the one-city ride-hailing pilot described in the PRD. It contains a rider app, driver app, operations console, NestJS API and worker, shared contracts, and PostgreSQL storage.

## Implementation status

All 6 epics from [epics.md](_bmad-output/planning-artifacts/epics.md) have working backend logic and a functional UI, verified end-to-end against the live stack.

| Epic | Status | Notes |
| --- | --- | --- |
| 1 — Driver onboarding | ✅ | Document submission, review, suspension, eligibility gating |
| 2 — Book a ride & find a driver | ✅ | Quote, dispatch, offer/accept, retry-safe confirmation |
| 3 — Meet the driver & complete the trip | ✅ | PIN verification, cancellation, no-show, rematch, automatic simulated driver location + rider distance tracking |
| 4 — Settle the fare & pay the driver | ✅ | Capture/release/refund, earnings, and an automatic payout cadence (no manual trigger required) |
| 5 — Safety, support & trip history | ✅ | Incident reporting, case resolution, trip sharing, ratings, ops console refund/document review dialogs |
| 6 — Pilot measurement | ✅ | Zero-filled hourly metrics, zone pause/reopen, work-item failure alerts |

"Implemented" means the core acceptance-criteria flows work through the real API and database, not that every polish detail is finished. Known gaps and planned follow-ups — console UI polish, a readable driver-side earnings/payout view, end-to-end acceptance-test coverage, and a couple of UX questions worth raising against the mockup — are tracked in [deferred-work.md](_bmad-output/implementation-artifacts/deferred-work.md).

## Local setup

Requirements: Node.js 22.13 or newer, npm, and Docker Compose.

```sh
cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run demo:seed
npm run dev
```

Then start each mobile app in a separate terminal:

```sh
npm run dev:rider
npm run dev:driver
```

The API listens on port 3000, the operations console on port 5173, and Postgres on port 5433 (mapped this way to avoid clashing with a locally-installed Postgres on the default 5432, and because the Postgres 18 image's data directory layout needs a mount at `/var/lib/postgresql` rather than `/var/lib/postgresql/data` — both reflected in `docker-compose.yml`). `npm run dev:rider` / `npm run dev:driver` launch the Expo CLI, which opens a QR code and dev-tools menu for a simulator or Expo Go; press `w` there (or run `npx expo start --web` directly from `apps/rider`/`apps/driver`) to preview in a browser instead. To use a physical device, set `EXPO_PUBLIC_API_URL` in the shell to the development machine's LAN address before starting Expo.

## Demo accounts

| Surface | Demo user | Verification code |
| --- | --- | --- |
| Rider | Mira | `424242` |
| Driver | Ravi | `424242` |
| Operations | Jo | `424242` |
| Safety responder | Responder | `424242` |
| Pilot analyst | Analyst | `424242` |

Ravi is seeded as an approved driver with an example vehicle. Submitting documents moves the application to pending review and takes the driver offline until an operations agent reviews it.

## Local adapters and data

Phone verification, route/quote calculation, masked contact, messaging, payment authorization, captures, refunds, and payouts are deterministic demo integrations. They do not contact vendors or move real money. `DEMO_PROVIDER_OUTCOME` sets the default outcome (`paid`, `failed`, or `unknown`). Override one operation independently when exercising a later payment state, for example `DEMO_AUTHORIZE_OUTCOME=paid DEMO_CAPTURE_OUTCOME=failed` to simulate a successful authorization followed by a declined capture.

The driver app reports location automatically (simulated, interpolated movement — no real GPS or mapping service) while a trip is active, and the rider app shows a live distance-remaining readout computed from those samples. The worker also runs an automatic payout cadence: every `PAYOUT_CADENCE_SECONDS` (default 24h; lower it in `.env` for local testing) a driver's `available` earnings are swept into a payout automatically, using the same idempotent flow as the operations console's manual payout action — they can run side by side without double-paying.

Document contents are encrypted with AES-256-GCM and written under `UPLOAD_DIR`; the local key and database credentials in `.env.example` are for development only. Keep `.env` private and never use demo data or keys for a real pilot.

The database volume is named `ride-db`. To reset local demo data, stop the stack and remove that volume with Docker Compose. This permanently deletes its local database contents.

## Planning sources

- [Product requirements](input/Uber_Ride_Hailing_PRD.md)
- [UX strategy](input/Ride-Hailing%20MVP%20%C2%B7%20UX%20Strategy.md)
- [Epics and user stories](_bmad-output/planning-artifacts/epics.md)
- [Design specification](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/DESIGN.md)
- [Experience specification](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/EXPERIENCE.md)
- [Key-screen mockup](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html)
- [Deferred work / known gaps](_bmad-output/implementation-artifacts/deferred-work.md)
