# Ride-hailing MVP

A local/demo implementation of the one-city ride-hailing pilot described in the PRD. It contains a rider app, driver app, operations console, NestJS API and worker, shared contracts, and PostgreSQL storage.

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

The API listens on port 3000, the operations console on port 5173, and Expo prints the rider/driver preview URLs. To use a physical device, set `EXPO_PUBLIC_API_URL` in the shell to the development machine's LAN address before starting Expo.

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

Document contents are encrypted with AES-256-GCM and written under `UPLOAD_DIR`; the local key and database credentials in `.env.example` are for development only. Keep `.env` private and never use demo data or keys for a real pilot.

The database volume is named `ride-db`. To reset local demo data, stop the stack and remove that volume with Docker Compose. This permanently deletes its local database contents.

## Planning sources

- [Product requirements](input/Uber_Ride_Hailing_PRD.md)
- [UX strategy](input/Ride-Hailing%20MVP%20%C2%B7%20UX%20Strategy.md)
- [Epics and user stories](_bmad-output/planning-artifacts/epics.md)
- [Design specification](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/DESIGN.md)
- [Experience specification](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/EXPERIENCE.md)
- [Key-screen mockup](_bmad-output/planning-artifacts/ux-designs/ux-BMAD-2026-11-21/mockups/key-screens.html)
