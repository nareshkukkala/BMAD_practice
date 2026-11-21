export type TripAction = 'arrive' | 'start' | 'complete' | 'end' | 'cancel' | 'no_show' | 'driver_cancel' | 'rematch' | 'search_timeout';
const roles: Record<string, string[]> = {
  rider: ['cancel', 'rematch', 'end-rematch'],
  driver: ['arrive', 'start', 'complete', 'end', 'no_show', 'driver_cancel'],
  system: ['search_timeout'],
};
const transitions: Record<string, Record<string, string>> = {
  arrive: { Assigned: 'Driver arrived' },
  start: { 'Driver arrived': 'In progress' },
  complete: { 'In progress': 'Completed' },
  end: { 'In progress': 'Completed' },
  cancel: { Searching: 'Cancelled', Assigned: 'Cancelled', 'Driver arrived': 'Cancelled' },
  no_show: { 'Driver arrived': 'Cancelled' },
  driver_cancel: { Assigned: 'Cancelled', 'Driver arrived': 'Cancelled' },
  rematch: { Cancelled: 'Searching' },
  'end-rematch': { Cancelled: 'Cancelled' },
  search_timeout: { Searching: 'No driver found' },
};

export function actorMayTakeTripAction(role: string, action: string) {
  return !!roles[role]?.includes(action);
}

export function nextTripStatus(action: string, currentStatus: string): string | undefined {
  return transitions[action]?.[currentStatus];
}

export function tripVersionMatches(expected: unknown, current: unknown) {
  return Number.isInteger(Number(expected)) && Number(expected) === Number(current);
}

export function acceptsLocationSample(epoch: string, currentEpoch: string, sequence: number, lastSequence: number) {
  return epoch === currentEpoch && Number.isSafeInteger(sequence) && sequence > lastSequence;
}

export function quoteIsCurrent(expiresAt: string, now = Date.now()) {
  const expiry = Date.parse(expiresAt);
  return Number.isFinite(expiry) && expiry > now;
}
