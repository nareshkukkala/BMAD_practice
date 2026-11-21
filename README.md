# BMAD — Uber-Style Ride-Hailing MVP Planning

This repository holds the end-to-end planning artifacts for a pilot, Uber-style ride-hailing MVP, produced with the [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) (BMad Builder) agent framework. It covers one city, defined service zones, and one economy ride category — from product requirements through UX strategy, epics, and user stories — ready to hand off to implementation.

The project is currently in the **planning stage**: no application code has been written yet. Every epic and story in [`sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml) is still `backlog`.

## What's in scope

**Product surfaces:** Rider app, driver app, and an operations console.

**In scope for the pilot:** on-demand point-to-point rides, one digital payment method, upfront quotes, driver verification, dispatch, live trip tracking, pickup verification (PIN), receipts, ratings, support/safety flows, and driver payouts.

**Deferred:** scheduled and shared rides, multi-stop itineraries, cash payments, subscriptions, promotions, airport-specific flows, and dynamic pricing.

## Repository layout

```
.
├── input/                          Source documents fed into the BMAD workflow
│   ├── Uber_Ride_Hailing_PRD.md        Product Requirements Document (v0.1)
│   └── Ride-Hailing MVP · UX Strategy.md   UX strategy and principles
│
├── _bmad-output/                   Generated planning & implementation artifacts
│   ├── planning-artifacts/
│   │   ├── epics.md                    Epic breakdown, requirements inventory, FR coverage map
│   │   └── ux-designs/                 Generated UX design assets
│   └── implementation-artifacts/
│       └── sprint-status.yaml          Live tracking of epic/story/retrospective status
│
├── _bmad/                          BMAD Method installation (core + bmm modules, config, scripts)
├── .claude/ .agent/ .agents/       Per-tool skill definitions used by BMAD agents
│   skills/                             (Claude Code, generic "Agents" format, etc.)
└── .github/agents/                 GitHub Copilot-style agent definitions for the BMAD personas
```

## Product requirements (PRD)

[`input/Uber_Ride_Hailing_PRD.md`](input/Uber_Ride_Hailing_PRD.md) defines:

- **Users:** rider, driver, operations agent, and their primary jobs.
- **Trip lifecycle:** `Searching → Assigned → Driver arrived → In progress → Completed`, with `No driver found` and `Cancelled` as alternate outcomes, and payment status tracked independently of trip status.
- **Functional requirements (R01–R11)** covering sign-in, quoting, driver onboarding, dispatch, live trip and pickup verification, cancellations/no-shows, fare and payment, earnings/payouts, safety and support, trip history, and the operations console.
- **Non-functional requirements** for recovery/idempotency, performance targets (e.g. p95 quote response ≤ 3s), data protection, accessibility, and observability.
- **Pilot measures and release criteria** across three stages: internal field test → closed pilot → controlled expansion.

## UX strategy

[`input/Ride-Hailing MVP · UX Strategy.md`](input/Ride-Hailing%20MVP%20·%20UX%20Strategy.md) translates the PRD into design principles and an end-to-end experience map, anchored on one idea: **certainty under uncertainty**. Key bets:

1. One source of truth on screen — trip state and payment state are always shown as distinct, labelled things, with staleness surfaced rather than hidden.
2. Make the offer legible — ETA, price breakdown, currency, and quote expiry are shown before confirmation.
3. Every failure has a designed next step — no generic error toasts.

It also defines seven ranked UX principles, user/context profiles for riders, drivers, and operations agents, and edge personas (low-vision/screen-reader users, location-denied riders, new drivers, riders in unsafe situations) to design for from day one.

## Epics and stories

[`_bmad-output/planning-artifacts/epics.md`](_bmad-output/planning-artifacts/epics.md) breaks the PRD into 6 epics, each mapped back to specific functional requirements:

| Epic | Theme |
| --- | --- |
| 1 | Driver onboarding and eligibility |
| 2 | Book a ride and find a driver |
| 3 | Meet the driver and complete the trip |
| 4 | Settle the fare and pay the driver |
| 5 | Safety, support, and trip history |
| 6 | Pilot measurement and marketplace controls |

Each epic is broken into user stories with Given/When/Then acceptance criteria, cross-referenced to the PRD's requirement IDs. Current sprint status for every epic and story is tracked in [`sprint-status.yaml`](_bmad-output/implementation-artifacts/sprint-status.yaml).

## About BMAD

[BMAD](https://github.com/bmad-code-org/BMAD-METHOD) ("Builder Method for Agentic Development") is an agent framework that drives structured product planning through specialized personas — analyst, PM, architect, UX designer, and developer — each implemented as a skill/agent definition. This repo includes the installed BMAD core and `bmm` (BMAD Method Module) modules under `_bmad/`, along with per-tool skill definitions so the same personas are available in Claude Code, GitHub Copilot, Cursor, and other supported agent runtimes.

Agent personas available in this project:

- **Analyst (Mary)** — market research, competitive analysis, requirements discovery
- **PM (John)** — PRD creation
- **Architect (Winston)** — system architecture and technical design
- **UX Designer (Sally)** — UX strategy and UI specification
- **Dev (Amelia)** — implementation of stories and code changes

## Status

- [x] Product Requirements Document
- [x] UX strategy
- [x] Epic and story breakdown with FR coverage map
- [x] Sprint status scaffolding generated
- [ ] Story implementation (all epics currently `backlog`)
