export type Role = 'rider' | 'driver' | 'ops' | 'responder' | 'analyst';
export type TripStatus = 'Searching' | 'Assigned' | 'Driver arrived' | 'In progress' | 'Completed' | 'Cancelled' | 'No driver found';
export type PaymentStatus = 'Not required' | 'Authorising' | 'Authorised' | 'Pending' | 'Paid' | 'Failed' | 'Partially refunded' | 'Refunded' | 'Release requested' | 'Released' | 'Release failed';
export type Actor = { id: string; role: Role; name: string };
export type Trip = { id: string; riderId: string; driverId?: string; zone: string; pickup: string; destination: string; pickupNote?: string; status: TripStatus; paymentStatus: PaymentStatus; version: number; quoteMinor: number; finalMinor?: number; currency: string; createdAt: string; updatedAt: string; etaMinutes: number; pin?: string; driver?: { name: string; photoUrl?: string; plate: string }; location?: { lat: number; lng: number; receivedAt: string; stale: boolean } };
export type ApiError = { statusCode: number; code: string; message: string; details?: unknown };
export type Quote = { id: string; pickup: string; destination: string; etaMinutes: number; currency: string; totalMinor: number; breakdown: { baseMinor: number; distanceMinor: number; serviceMinor: number }; expiresAt: string; zone: string };
export const states: TripStatus[] = ['Searching','Assigned','Driver arrived','In progress','Completed','Cancelled','No driver found'];
