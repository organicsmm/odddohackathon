import type { Trip, User, PackItem, Stop, Friend, TripInvite } from './types';
import { DEFAULT_PACKING } from './catalog';

const TRIPS_KEY = 'traveloop:trips';
const USERS_KEY = 'traveloop:users';
const SESSION_KEY = 'traveloop:session';

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function loadTrips(): Trip[] {
  try { return JSON.parse(localStorage.getItem(TRIPS_KEY) || '[]'); } catch { return []; }
}
export function saveTrips(trips: Trip[]) {
  localStorage.setItem(TRIPS_KEY, JSON.stringify(trips));
  window.dispatchEvent(new Event('traveloop:trips-changed'));
}
export function upsertTrip(trip: Trip) {
  const all = loadTrips();
  const idx = all.findIndex(t => t.id === trip.id);
  trip.updatedAt = new Date().toISOString();
  if (idx >= 0) all[idx] = trip; else all.push(trip);
  saveTrips(all);
  // Fire-and-forget cloud sync (so admins can see all trips)
  void syncTripToCloud(trip);
}

async function syncTripToCloud(trip: Trip) {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase.from('trips').upsert({
      user_id: session.user.id,
      client_trip_id: trip.id,
      name: trip.name,
      start_date: trip.startDate,
      end_date: trip.endDate,
      data: trip as never,
    }, { onConflict: 'user_id,client_trip_id' });
  } catch { /* offline ok */ }
}
export function deleteTrip(id: string) {
  saveTrips(loadTrips().filter(t => t.id !== id));
}
export function getTrip(id: string): Trip | undefined {
  return loadTrips().find(t => t.id === id);
}
export function getTripByShare(shareId: string): Trip | undefined {
  return loadTrips().find(t => t.shareId === shareId && t.isPublic);
}
// Private-access lookup: returns trip if shareId matches AND viewer's email is in sharedWith.
export function getTripByShareForViewer(shareId: string, viewerEmail: string | null): Trip | undefined {
  const t = loadTrips().find(tr => tr.shareId === shareId);
  if (!t) return undefined;
  if (t.isPublic) return t;
  if (!viewerEmail) return undefined;
  if (t.ownerEmail === viewerEmail) return t;
  if ((t.sharedWith || []).includes(viewerEmail)) return t;
  return undefined;
}

// ---- Friends ----
export function getFriends(): Friend[] {
  const u = currentUser();
  return (u?.friends || []) as Friend[];
}
export function addFriend(email: string, name: string): Friend {
  const me = currentUser();
  if (!me) throw new Error('Not signed in');
  if (email === me.email) throw new Error("That's you!");
  const friends = (me.friends || []).slice();
  if (friends.find(f => f.email === email)) throw new Error('Already in your friends list');
  const friend: Friend = { email, name: name || email.split('@')[0], addedAt: new Date().toISOString() };
  friends.push(friend);
  updateUser({ friends });
  return friend;
}
export function removeFriend(email: string) {
  const me = currentUser();
  if (!me) return;
  updateUser({ friends: (me.friends || []).filter(f => f.email !== email) });
}

// ---- Invites ----
export function createInvite(tripId: string, invitedEmail?: string): TripInvite {
  const trip = getTrip(tripId);
  if (!trip) throw new Error('Trip not found');
  const invite: TripInvite = {
    token: uid() + uid(),
    invitedEmail: invitedEmail?.trim().toLowerCase() || undefined,
    createdAt: new Date().toISOString(),
    acceptedBy: [],
  };
  const next: Trip = { ...trip, invites: [...(trip.invites || []), invite] };
  upsertTrip(next);
  return invite;
}
export function revokeInvite(tripId: string, token: string) {
  const trip = getTrip(tripId);
  if (!trip) return;
  upsertTrip({ ...trip, invites: (trip.invites || []).filter(i => i.token !== token) });
}
export function findInvite(token: string): { trip: Trip; invite: TripInvite } | undefined {
  for (const t of loadTrips()) {
    const inv = (t.invites || []).find(i => i.token === token);
    if (inv) return { trip: t, invite: inv };
  }
  return undefined;
}
export function acceptInvite(token: string, viewerEmail: string): Trip {
  const found = findInvite(token);
  if (!found) throw new Error('Invite not found or revoked');
  const { trip, invite } = found;
  if (invite.invitedEmail && invite.invitedEmail !== viewerEmail) {
    throw new Error('This invite is for a different email address');
  }
  const sharedWith = Array.from(new Set([...(trip.sharedWith || []), viewerEmail]));
  const invites = (trip.invites || []).map(i =>
    i.token === token ? { ...i, acceptedBy: Array.from(new Set([...i.acceptedBy, viewerEmail])) } : i
  );
  const next: Trip = { ...trip, sharedWith, invites };
  upsertTrip(next);
  return next;
}
export function unshareWith(tripId: string, email: string) {
  const trip = getTrip(tripId);
  if (!trip) return;
  upsertTrip({ ...trip, sharedWith: (trip.sharedWith || []).filter(e => e !== email) });
}
export function tripsSharedWithMe(viewerEmail: string): Trip[] {
  return loadTrips().filter(t => t.ownerEmail !== viewerEmail && (t.sharedWith || []).includes(viewerEmail));
}

export function newTrip(ownerEmail: string, partial: Partial<Trip>): Trip {
  const id = uid();
  return {
    id,
    ownerEmail,
    name: partial.name || 'My Trip',
    description: partial.description || '',
    cover: partial.cover,
    startDate: partial.startDate || new Date().toISOString().slice(0, 10),
    endDate: partial.endDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    isPublic: false,
    shareId: uid(),
    stops: [],
    packing: DEFAULT_PACKING.map(p => ({ id: uid(), label: p.label, category: p.category, packed: false } as PackItem)),
    notes: [],
    budget: partial.budget,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ---- User extras (per-email localStorage), keyed by current Supabase session email ----
type Extras = Pick<User, 'name' | 'language' | 'saved' | 'friends'>;
const extrasKey = (email: string) => `traveloop:extras:${email}`;
const SESSION_EMAIL_KEY = 'traveloop:session-email';

export function setSessionEmail(email: string | null) {
  if (email) localStorage.setItem(SESSION_EMAIL_KEY, email);
  else localStorage.removeItem(SESSION_EMAIL_KEY);
  window.dispatchEvent(new Event('traveloop:auth-changed'));
}
export function getSessionEmail(): string | null {
  return localStorage.getItem(SESSION_EMAIL_KEY);
}
export function getExtras(email: string): Extras {
  try { return JSON.parse(localStorage.getItem(extrasKey(email)) || '{}'); } catch { return {} as Extras; }
}
export function setExtras(email: string, patch: Partial<Extras>) {
  const cur = getExtras(email);
  const next = { ...cur, ...patch };
  localStorage.setItem(extrasKey(email), JSON.stringify(next));
  window.dispatchEvent(new Event('traveloop:auth-changed'));
}
export function currentUser(): User | null {
  const email = getSessionEmail();
  if (!email) return null;
  const ex = getExtras(email);
  return { email, name: ex.name || email.split('@')[0], language: ex.language || 'en', saved: ex.saved || [], friends: ex.friends || [] };
}
export function updateUser(patch: Partial<User>) {
  const email = getSessionEmail();
  if (!email) return;
  setExtras(email, patch as Partial<Extras>);
}
export function logout() { /* legacy no-op; auth handled by Supabase */ setSessionEmail(null); }
export function deleteAccount() {
  const email = getSessionEmail();
  if (!email) return;
  localStorage.removeItem(extrasKey(email));
  saveTrips(loadTrips().filter(t => t.ownerEmail !== email));
  setSessionEmail(null);
}
// Legacy stubs (no longer used; kept to avoid breaking imports if any remain)
export function signup(_email: string, _password: string, _name: string): User { throw new Error('Use Supabase auth'); }
export function login(_email: string, _password: string): User { throw new Error('Use Supabase auth'); }
export function getUsers(): User[] { return []; }

// ---- Compute helpers ----
export function tripDays(trip: Trip): number {
  const a = new Date(trip.startDate).getTime();
  const b = new Date(trip.endDate).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
export function stopDays(s: { startDate: string; endDate: string }): number {
  const a = new Date(s.startDate).getTime();
  const b = new Date(s.endDate).getTime();
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}
export function tripCost(trip: Trip) {
  let stay = 0, meals = 0, transport = 0, activities = 0;
  trip.stops.forEach(s => {
    const days = stopDays(s);
    stay += (s.costs.stay || 0) * Math.max(0, days - 1);
    meals += (s.costs.meals || 0) * days;
    transport += s.costs.transport || 0;
    s.activities.forEach(a => activities += a.cost);
  });
  const total = stay + meals + transport + activities;
  return { stay, meals, transport, activities, total };
}

// Re-assign sequential startDate/endDate to stops based on each stop's current duration.
// Keeps the trip's startDate as the anchor and extends trip.endDate to fit.
export function resequenceStops(trip: Trip, stops: Stop[]): Trip {
  if (stops.length === 0) return { ...trip, stops };
  const anchor = new Date(trip.startDate);
  let cursor = new Date(anchor);
  const next: Stop[] = stops.map(s => {
    const d = stopDays(s);
    const start = new Date(cursor);
    const end = new Date(cursor);
    end.setDate(end.getDate() + d - 1);
    cursor = new Date(end);
    cursor.setDate(cursor.getDate() + 1);
    return { ...s, startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  });
  const lastEnd = next[next.length - 1].endDate;
  const tripEnd = lastEnd > trip.endDate ? lastEnd : trip.endDate;
  return { ...trip, stops: next, endDate: tripEnd };
}
