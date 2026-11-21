import assert from 'node:assert/strict';
import { test } from 'node:test';
import { demoPaymentOutcome, resolveDemoRoute, simulateDemoMessage, verifyDemoPhone } from './providers.ts';
import { acceptsLocationSample, actorMayTakeTripAction, nextTripStatus, quoteIsCurrent, tripVersionMatches } from './trip-rules.ts';
import { driverIsEligible, requiredDocumentTypes } from './driver-eligibility.ts';

test('demo phone verification accepts only the configured code', () => {
  assert.equal(verifyDemoPhone('424242'), true);
  assert.equal(verifyDemoPhone(''), false);
  assert.equal(verifyDemoPhone(undefined), false);
  assert.equal(verifyDemoPhone('000000'), false);
});

test('demo maps produce a supported quote and explain unsupported endpoints', () => {
  const route = resolveDemoRoute('North entrance', 'Market Street');
  assert.equal(route.ok, true);
  if (route.ok) {
    assert.equal(route.zone, 'central');
    assert.equal(route.totalMinor, 24500);
    assert.equal(route.breakdown.baseMinor + route.breakdown.distanceMinor + route.breakdown.serviceMinor, route.totalMinor);
  }
  assert.deepEqual(resolveDemoRoute('outside the zone', 'Market Street'), { ok: false, reason: 'pickup' });
  assert.deepEqual(resolveDemoRoute('North entrance', 'unsupported destination'), { ok: false, reason: 'destination' });
});

test('booking quotes expire and stale trip versions are rejected', () => {
  assert.equal(quoteIsCurrent(new Date(20_000).toISOString(), 10_000), true);
  assert.equal(quoteIsCurrent(new Date(10_000).toISOString(), 10_000), false);
  assert.equal(tripVersionMatches('4', 4), true);
  assert.equal(tripVersionMatches('3', 4), false);
  assert.equal(tripVersionMatches('not-a-version', 4), false);
});

test('trip lifecycle allows the intended rider and driver actions only', () => {
  assert.equal(actorMayTakeTripAction('rider', 'cancel'), true);
  assert.equal(actorMayTakeTripAction('rider', 'start'), false);
  assert.equal(actorMayTakeTripAction('driver', 'start'), true);
  assert.equal(actorMayTakeTripAction('driver', 'rematch'), false);
  assert.equal(nextTripStatus('arrive', 'Assigned'), 'Driver arrived');
  assert.equal(nextTripStatus('start', 'Driver arrived'), 'In progress');
  assert.equal(nextTripStatus('complete', 'In progress'), 'Completed');
  assert.equal(nextTripStatus('complete', 'Assigned'), undefined);
  assert.equal(nextTripStatus('search_timeout', 'Searching'), 'No driver found');
  assert.equal(nextTripStatus('rematch', 'Cancelled'), 'Searching');
});

test('location updates require the active epoch and a strictly newer sequence', () => {
  assert.equal(acceptsLocationSample('epoch-2', 'epoch-2', 10, 9), true);
  assert.equal(acceptsLocationSample('epoch-1', 'epoch-2', 10, 9), false);
  assert.equal(acceptsLocationSample('epoch-2', 'epoch-2', 9, 9), false);
});

test('drivers need every configured current document to go online or accept offers', () => {
  const now = Date.parse('2026-11-21T00:00:00Z');
  const data = { documents: Object.fromEntries(requiredDocumentTypes().map((type) => [type, { status: 'approved', expiresAt: '2027-01-01T00:00:00Z' }])) };
  assert.equal(driverIsEligible('approved', data, now), true);
  assert.equal(driverIsEligible('suspended', data, now), false);
  assert.equal(driverIsEligible('approved', { documents: { ...data.documents, license: { status: 'approved', expiresAt: '2026-01-01T00:00:00Z' } } }, now), false);
  assert.equal(driverIsEligible('approved', { documents: { identity: { status: 'approved' } } }, now), false);
});

test('local payments expose deterministic failure and unknown outcomes', () => {
  const previous = process.env.DEMO_PROVIDER_OUTCOME;
  try {
    delete process.env.DEMO_PROVIDER_OUTCOME;
    assert.equal(demoPaymentOutcome(), 'paid');
    process.env.DEMO_PROVIDER_OUTCOME = 'failed';
    assert.equal(demoPaymentOutcome(), 'failed');
    process.env.DEMO_PROVIDER_OUTCOME = 'unknown';
    assert.equal(demoPaymentOutcome(), 'unknown');
  } finally {
    if (previous === undefined) delete process.env.DEMO_PROVIDER_OUTCOME;
    else process.env.DEMO_PROVIDER_OUTCOME = previous;
  }
});

test('payment operations can use independent demo outcomes', () => {
  const previousProvider = process.env.DEMO_PROVIDER_OUTCOME;
  const previousCapture = process.env.DEMO_CAPTURE_OUTCOME;
  try {
    process.env.DEMO_PROVIDER_OUTCOME = 'unknown';
    process.env.DEMO_CAPTURE_OUTCOME = 'failed';
    assert.equal(demoPaymentOutcome('authorize'), 'unknown');
    assert.equal(demoPaymentOutcome('capture'), 'failed');
  } finally {
    if (previousProvider === undefined) delete process.env.DEMO_PROVIDER_OUTCOME;
    else process.env.DEMO_PROVIDER_OUTCOME = previousProvider;
    if (previousCapture === undefined) delete process.env.DEMO_CAPTURE_OUTCOME;
    else process.env.DEMO_CAPTURE_OUTCOME = previousCapture;
  }
});

test('local messaging does not send an external message', () => {
  assert.deepEqual(simulateDemoMessage('masked-driver-contact'), {
    mode: 'demo',
    queued: false,
    template: 'masked-driver-contact',
    message: 'External messaging is disabled in local demo mode.',
  });
});
