import type { Trip, User, PackItem } from './types';
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

// ---- Auth (mock, localStorage based) ----
type StoredUser = User & { password: string };

export function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]'); } catch { return []; }
}
function setUsers(u: StoredUser[]) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }

export function signup(email: string, password: string, name: string): User {
  const users = getUsers();
  if (users.find(u => u.email === email)) throw new Error('Account already exists');
  const user: StoredUser = { email, password, name, language: 'en', saved: [] };
  users.push(user);
  setUsers(users);
  setSession(email);
  return user;
}
export function login(email: string, password: string): User {
  const u = getUsers().find(x => x.email === email && x.password === password);
  if (!u) throw new Error('Invalid email or password');
  setSession(email);
  return u;
}
export function logout() { localStorage.removeItem(SESSION_KEY); window.dispatchEvent(new Event('traveloop:auth-changed')); }
export function setSession(email: string) {
  localStorage.setItem(SESSION_KEY, email);
  window.dispatchEvent(new Event('traveloop:auth-changed'));
}
export function currentUser(): User | null {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  const u = getUsers().find(x => x.email === email);
  return u ? { email: u.email, name: u.name, language: u.language, saved: u.saved } : null;
}
export function updateUser(patch: Partial<User>) {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return;
  const users = getUsers();
  const idx = users.findIndex(u => u.email === email);
  if (idx < 0) return;
  users[idx] = { ...users[idx], ...patch };
  setUsers(users);
  window.dispatchEvent(new Event('traveloop:auth-changed'));
}
export function deleteAccount() {
  const email = localStorage.getItem(SESSION_KEY);
  if (!email) return;
  setUsers(getUsers().filter(u => u.email !== email));
  saveTrips(loadTrips().filter(t => t.ownerEmail !== email));
  logout();
}

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
