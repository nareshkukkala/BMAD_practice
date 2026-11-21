/** Deterministic local adapters. These never contact external providers. */
export type DemoProviderOutcome = 'paid' | 'failed' | 'unknown';

export function verifyDemoPhone(code: unknown): boolean {
  return typeof code === 'string' && code === (process.env.DEMO_PHONE_OTP || '424242');
}

export function resolveDemoRoute(pickup: string, destination: string) {
  const unsupported = /outside|unsupported/i;
  if (unsupported.test(pickup)) return { ok: false as const, reason: 'pickup' as const };
  if (unsupported.test(destination)) return { ok: false as const, reason: 'destination' as const };
  return {
    ok: true as const,
    zone: process.env.PILOT_ZONE || 'central',
    etaMinutes: 4,
    currency: process.env.PILOT_CURRENCY || 'INR',
    totalMinor: 24500,
    breakdown: { baseMinor: 12000, distanceMinor: 9500, serviceMinor: 3000 },
  };
}

export function demoPaymentOutcome(operation = 'payment'): DemoProviderOutcome {
  const key = `DEMO_${operation.replace(/[^a-z0-9]/gi, '_').toUpperCase()}_OUTCOME`;
  const value = process.env[key] || process.env.DEMO_PROVIDER_OUTCOME;
  return value === 'failed' || value === 'unknown' ? value : 'paid';
}

export function simulateDemoMessage(template: string) {
  return { mode: 'demo' as const, queued: false, template, message: 'External messaging is disabled in local demo mode.' };
}
