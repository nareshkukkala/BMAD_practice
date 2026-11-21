---
name: Ride-Hailing MVP
description: Visual specification for the rider and driver apps and the operations console.
updated: 2026-11-21
status: draft
sources:
  - "../../../../input/Uber_Ride_Hailing_PRD.md"
  - "../../../../input/Ride-Hailing MVP · UX Strategy.md"
colors:
  surface: '#FFFFFF'
  ink: '#17252B'
  secondary: '#42545A'
  action: '#005B55'
  attention: '#8A351A'
  night: '#142428'
  night-ink: '#F2F8F6'
  night-action: '#96E6D4'
typography:
  body: {fontFamily: system-ui, fontSize: 16px, lineHeight: '1.5'}
  label: {fontFamily: system-ui, fontSize: 14px, fontWeight: '600'}
  identifier: {fontFamily: system-ui, fontSize: 32px, fontWeight: '700'}
spacing:
  inset: 16px
  group: 24px
  target: 48px
  driver-target: 56px
rounded:
  control: 8px
  card: 16px
components:
  status-card: {surface: '{colors.surface}', radius: '{rounded.card}'}
  confirm: {fill: '{colors.action}', text: '{colors.surface}', radius: '{rounded.control}'}
---

# Ride-hailing pilot

## Brand & Style

At pickup, the rider should be able to glance down, read the plate and look up at the approaching car. Give that identifier the strongest weight. Keep the driver’s mounted screen legible from a greater distance. On the console, use the same state names and make timestamps and amounts easy to compare.

[ASSUMPTION] The source sets density and contrast goals but supplies no brand palette or type scale. The tokens above are proposed implementation defaults. Native text sizing and user preferences take precedence.

## Colors

Use ink and secondary on surface, white on action, and attention on white for an error with its written label. In driver night mode, use night-ink on night and night on night-action. Target 4.5:1 for normal text and 3:1 for large text, essential boundaries and focus indicators. Map labels sit on opaque surfaces. Use text and an icon for state changes.

## Typography

Use native scalable text on mobile and system UI on the web. Use identifier for the plate or PIN according to the task. Speak the plate and PIN character by character when the rider focuses them. Keep currency with its amount. Use tabular digits for the console’s amounts and time columns.

## Layout & Spacing

Rider screens have one scroll column with the status card anchored below the optional map. At large text sizes the map yields space first. The driver sees one task with controls at least {spacing.driver-target} in logical units. Rider hit areas use {spacing.target}. On desktop, put the queue beside trip evidence and keep the action next to its evidence. When columns stop fitting, open detail as a separate view with a return to the selected queue row.

## Elevation & Depth

Use solid cards over maps. Use a bordered panel for evidence on the console. Reserve an overlay for a decision that needs confirmation. On small screens let a long confirmation fill the viewport and scroll.

## Shapes

Apply {rounded.control} to fields and buttons, {rounded.card} to grouped status and quote surfaces. Use rectangular rows for tabular records so timestamps align down the column.

## Components

| Component | Visual anatomy |
| --- | --- |
| Trip status card | State heading, pickup estimate and freshness, driver identity, prominent plate, then pickup PIN and actions. Give **Call emergency services** its own labeled button in both safety bars. Use {spacing.target} for riders and {spacing.driver-target} for drivers. Allow it to wrap at large text sizes. |
| Quote sheet | Display the resolved pickup address beside its edit control. Show destination, pickup estimate, total and currency, breakdown and expiry. After refresh, keep the previous and new localized totals visible beside a **Confirm** button labeled with the current fare. |
| Offer card | Large pickup estimate, area and expiry text. One large Accept control with the remaining duration visible. |
| Status labels | Pair each label with its domain, such as Trip · Completed and Payment · Pending. Stale location includes its last-update time. |
| PIN display and pad | Group rider digits on an opaque surface. Driver entry has a persistent label, inline error and a support action reachable from the keypad. |
| Recovery panel | Place the booking outcome above the payment outcome. A declined authorization shows the search outcome and **Review payment method**. A dispatch timeout shows **No fare charged** and any hold-release status above **Try again**. A completed trip with failed capture shows the outstanding amount and currency above **Resolve payment**. Keep both choices on the rematch panel. |
| Safe-action dialog | Name the dialog and group the trip, amount, masked destination from the original capture, and reason above its buttons. Give Cancel visible initial focus. Return focus to the opener after dismissal. |
| Timeline | Timestamp, event, actor, reason and case reference in reading order. Align amounts and distinguish provider status from trip state. |

The [screen preview](mockups/key-screens.html) illustrates pickup, driver verification, quote refresh, payment recovery and refund review with fictional data. The two specifications take precedence over the illustration.

## Do's and Don'ts

Keep plate, price and emergency calling readable with large text. Stop marker interpolation when location is stale. Never encode a financial outcome solely by color, hide a fee behind confirmation, or require a swipe to finish a trip.
