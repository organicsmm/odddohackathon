import { z } from 'zod';
import type { Stop, Activity } from './types';

export const ACTIVITY_CATEGORIES = ['sightseeing', 'food', 'adventure', 'culture', 'nightlife', 'shopping', 'nature'] as const;
export type ActivityCategory = typeof ACTIVITY_CATEGORIES[number];

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM').optional().or(z.literal(''));

export const activitySchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Name required').max(120, 'Name too long'),
  category: z.enum(ACTIVITY_CATEGORIES),
  cost: z.number().min(0, 'Must be ≥ 0').max(100000, 'Too high').finite(),
  durationHours: z.number().min(0.25, 'Min 0.25h').max(24, 'Max 24h').finite(),
  time: timeStr,
  description: z.string().max(500).optional(),
});

export const stopSchema = z.object({
  id: z.string(),
  city: z.string().trim().min(1, 'City required').max(80),
  country: z.string().trim().min(1, 'Country required').max(80),
  startDate: isoDate,
  endDate: isoDate,
  notes: z.string().max(500).optional(),
  activities: z.array(activitySchema).max(40, 'Too many activities'),
  costs: z.object({
    transport: z.number().min(0).max(100000),
    stay: z.number().min(0).max(100000),
    meals: z.number().min(0).max(100000),
  }),
});

export const tripDraftSchema = z.object({
  name: z.string().trim().min(1, 'Trip name required').max(100),
  description: z.string().max(500).optional(),
  startDate: isoDate,
  endDate: isoDate,
  budget: z.number().min(0).max(1_000_000).optional(),
  stops: z.array(stopSchema).min(1, 'Add at least one stop'),
});

export type TripDraft = z.infer<typeof tripDraftSchema>;

export type FieldErrors = Record<string, string>;

export function validateDraft(d: TripDraft): { ok: boolean; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const r = tripDraftSchema.safeParse(d);
  if (!r.success) {
    for (const issue of r.error.issues) errors[issue.path.join('.')] = issue.message;
  }
  // Cross-field checks
  if (d.endDate && d.startDate && d.endDate < d.startDate) {
    errors['endDate'] = 'Trip end must be on or after start';
  }
  d.stops.forEach((s, i) => {
    if (s.endDate && s.startDate && s.endDate < s.startDate) {
      errors[`stops.${i}.endDate`] = 'End date must be on or after start date';
    }
    if (d.startDate && s.startDate && s.startDate < d.startDate) {
      errors[`stops.${i}.startDate`] = 'Stop starts before trip';
    }
    if (d.endDate && s.endDate && s.endDate > d.endDate) {
      errors[`stops.${i}.endDate`] = 'Stop ends after trip';
    }
    if (i > 0) {
      const prev = d.stops[i - 1];
      if (prev.endDate && s.startDate && s.startDate < prev.endDate) {
        errors[`stops.${i}.startDate`] = `Overlaps stop ${i}`;
      }
    }
  });
  return { ok: Object.keys(errors).length === 0, errors };
}

// Coerce a raw AI payload into a safe TripDraft (best-effort, never throws).
type RawActivity = { name?: unknown; category?: unknown; cost?: unknown; durationHours?: unknown; time?: unknown; description?: unknown };
type RawStop = { city?: unknown; country?: unknown; startDate?: unknown; endDate?: unknown; activities?: unknown; costs?: { transport?: unknown; stay?: unknown; meals?: unknown } };
type RawTrip = { name?: unknown; description?: unknown; startDate?: unknown; endDate?: unknown; budget?: unknown; stops?: unknown };

const num = (v: unknown, fb: number) => {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : fb;
};
const str = (v: unknown, fb = '') => (typeof v === 'string' ? v : fb);
const dateOr = (v: unknown, fb: string) => {
  const s = str(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : fb;
};
const cat = (v: unknown): ActivityCategory => {
  const s = String(v).toLowerCase();
  return (ACTIVITY_CATEGORIES as readonly string[]).includes(s) ? (s as ActivityCategory) : 'sightseeing';
};

export function coerceAiTrip(raw: RawTrip, mkId: () => string, fallbackBudget: number): TripDraft {
  const todayIso = new Date().toISOString().slice(0, 10);
  const startDate = dateOr(raw.startDate, todayIso);
  const endDate = dateOr(raw.endDate, startDate);
  const stopsRaw = Array.isArray(raw.stops) ? (raw.stops as RawStop[]) : [];
  const stops: Stop[] = stopsRaw.map(s => {
    const sStart = dateOr(s.startDate, startDate);
    const sEnd = dateOr(s.endDate, sStart);
    const acts: Activity[] = Array.isArray(s.activities)
      ? (s.activities as RawActivity[]).map(a => ({
          id: mkId(),
          name: str(a.name, 'Activity').slice(0, 120),
          category: cat(a.category),
          cost: Math.max(0, Math.min(100000, num(a.cost, 0))),
          durationHours: Math.max(0.25, Math.min(24, num(a.durationHours, 2))),
          time: typeof a.time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(a.time) ? a.time : undefined,
          description: typeof a.description === 'string' ? a.description.slice(0, 500) : undefined,
        }))
      : [];
    return {
      id: mkId(),
      city: str(s.city, 'City').slice(0, 80),
      country: str(s.country, '').slice(0, 80),
      startDate: sStart,
      endDate: sEnd,
      activities: acts,
      costs: {
        transport: Math.max(0, num(s.costs?.transport, 100)),
        stay: Math.max(0, num(s.costs?.stay, 80)),
        meals: Math.max(0, num(s.costs?.meals, 30)),
      },
    };
  });
  return {
    name: str(raw.name, 'AI Trip').slice(0, 100),
    description: typeof raw.description === 'string' ? raw.description.slice(0, 500) : undefined,
    startDate,
    endDate,
    budget: typeof raw.budget === 'number' ? raw.budget : fallbackBudget,
    stops,
  };
}
