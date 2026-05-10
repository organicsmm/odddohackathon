import type { Trip, Stop } from './types';
import { uid } from './store';

const mkStop = (s: Omit<Stop, 'id' | 'activities'> & { activities: Omit<Stop['activities'][number], 'id'>[] }): Stop => ({
  ...s,
  id: uid(),
  activities: s.activities.map(a => ({ ...a, id: uid() })),
});

export type TripTemplate = {
  id: string;
  title: string;
  emoji: string;
  tagline: string;
  days: number;
  estimate: number;
  cover: string;
  countries: string[];
  build: () => Pick<Trip, 'name' | 'description' | 'startDate' | 'endDate' | 'budget' | 'stops'>;
};

const cover = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1000&q=70`;

const offsetDate = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const TEMPLATES: TripTemplate[] = [
  {
    id: 'greek',
    title: 'Greek Island Hop',
    emoji: '🏝️',
    tagline: 'Whitewashed villages and Aegean sunsets',
    days: 8,
    estimate: 1850,
    cover: cover('1570077188670-e3a8d69ac5ff'),
    countries: ['Greece'],
    build: () => ({
      name: 'Greek Island Hop',
      description: '8 days exploring Athens, Mykonos and Santorini.',
      startDate: offsetDate(14),
      endDate: offsetDate(21),
      budget: 1850,
      stops: [
        mkStop({
          city: 'Athens', country: 'Greece',
          startDate: offsetDate(14), endDate: offsetDate(16),
          costs: { transport: 180, stay: 90, meals: 35 },
          activities: [
            { name: 'Acropolis & Parthenon', category: 'culture', cost: 30, durationHours: 3, time: '09:00' },
            { name: 'Plaka neighborhood food walk', category: 'food', cost: 55, durationHours: 3, time: '18:00' },
          ],
        }),
        mkStop({
          city: 'Mykonos', country: 'Greece',
          startDate: offsetDate(16), endDate: offsetDate(19),
          costs: { transport: 120, stay: 140, meals: 50 },
          activities: [
            { name: 'Paradise Beach day', category: 'nature', cost: 25, durationHours: 5 },
            { name: 'Little Venice sunset cocktails', category: 'nightlife', cost: 45, durationHours: 2, time: '20:00' },
          ],
        }),
        mkStop({
          city: 'Santorini', country: 'Greece',
          startDate: offsetDate(19), endDate: offsetDate(21),
          costs: { transport: 90, stay: 180, meals: 55 },
          activities: [
            { name: 'Caldera sunset cruise', category: 'sightseeing', cost: 120, durationHours: 4, time: '16:00' },
            { name: 'Oia photo walk', category: 'sightseeing', cost: 0, durationHours: 2 },
          ],
        }),
      ],
    }),
  },
  {
    id: 'japan',
    title: 'Japan Discovery',
    emoji: '🗾',
    tagline: 'Tokyo neon to Kyoto temples',
    days: 10,
    estimate: 2600,
    cover: cover('1493976040374-85c8e12f0c0e'),
    countries: ['Japan'],
    build: () => ({
      name: 'Japan Discovery',
      description: '10 days across Tokyo, Kyoto and Osaka.',
      startDate: offsetDate(30),
      endDate: offsetDate(40),
      budget: 2600,
      stops: [
        mkStop({
          city: 'Tokyo', country: 'Japan',
          startDate: offsetDate(30), endDate: offsetDate(34),
          costs: { transport: 200, stay: 110, meals: 45 },
          activities: [
            { name: 'Shibuya & Harajuku walk', category: 'sightseeing', cost: 0, durationHours: 4 },
            { name: 'Sushi at Tsukiji', category: 'food', cost: 60, durationHours: 2, time: '12:00' },
            { name: 'TeamLab Planets', category: 'culture', cost: 35, durationHours: 3 },
          ],
        }),
        mkStop({
          city: 'Kyoto', country: 'Japan',
          startDate: offsetDate(34), endDate: offsetDate(37),
          costs: { transport: 130, stay: 95, meals: 40 },
          activities: [
            { name: 'Fushimi Inari hike', category: 'adventure', cost: 0, durationHours: 4, time: '08:00' },
            { name: 'Arashiyama bamboo grove', category: 'nature', cost: 10, durationHours: 3 },
            { name: 'Tea ceremony in Gion', category: 'culture', cost: 50, durationHours: 2 },
          ],
        }),
        mkStop({
          city: 'Osaka', country: 'Japan',
          startDate: offsetDate(37), endDate: offsetDate(40),
          costs: { transport: 70, stay: 85, meals: 50 },
          activities: [
            { name: 'Dotonbori street food crawl', category: 'food', cost: 45, durationHours: 3, time: '19:00' },
            { name: 'Osaka Castle visit', category: 'culture', cost: 15, durationHours: 2 },
          ],
        }),
      ],
    }),
  },
  {
    id: 'iberia',
    title: 'Iberian Tapas Tour',
    emoji: '🥘',
    tagline: 'Lisbon to Barcelona via Madrid',
    days: 9,
    estimate: 1700,
    cover: cover('1583422409516-2895a77efded'),
    countries: ['Portugal', 'Spain'],
    build: () => ({
      name: 'Iberian Tapas Tour',
      description: '9 day food + culture tour through Portugal & Spain.',
      startDate: offsetDate(45),
      endDate: offsetDate(54),
      budget: 1700,
      stops: [
        mkStop({
          city: 'Lisbon', country: 'Portugal',
          startDate: offsetDate(45), endDate: offsetDate(48),
          costs: { transport: 150, stay: 75, meals: 35 },
          activities: [
            { name: 'Alfama tram ride', category: 'sightseeing', cost: 5, durationHours: 2 },
            { name: 'Pastéis de Belém tasting', category: 'food', cost: 15, durationHours: 1, time: '10:00' },
            { name: 'Fado night', category: 'nightlife', cost: 50, durationHours: 3, time: '21:00' },
          ],
        }),
        mkStop({
          city: 'Madrid', country: 'Spain',
          startDate: offsetDate(48), endDate: offsetDate(51),
          costs: { transport: 90, stay: 95, meals: 40 },
          activities: [
            { name: 'Prado museum', category: 'culture', cost: 20, durationHours: 3 },
            { name: 'Tapas crawl in La Latina', category: 'food', cost: 50, durationHours: 3, time: '20:00' },
          ],
        }),
        mkStop({
          city: 'Barcelona', country: 'Spain',
          startDate: offsetDate(51), endDate: offsetDate(54),
          costs: { transport: 70, stay: 110, meals: 45 },
          activities: [
            { name: 'Sagrada Família tour', category: 'culture', cost: 40, durationHours: 2 },
            { name: 'Barceloneta beach day', category: 'nature', cost: 0, durationHours: 4 },
            { name: 'Park Güell sunset', category: 'sightseeing', cost: 12, durationHours: 2, time: '18:00' },
          ],
        }),
      ],
    }),
  },
  {
    id: 'india',
    title: 'Golden Triangle India',
    emoji: '🕌',
    tagline: 'Delhi · Agra · Jaipur',
    days: 6,
    estimate: 950,
    cover: cover('1599661046289-e31897846e41'),
    countries: ['India'],
    build: () => ({
      name: 'Golden Triangle India',
      description: '6 days through Delhi, Agra and Jaipur — palaces, monuments and street food.',
      startDate: offsetDate(60),
      endDate: offsetDate(66),
      budget: 950,
      stops: [
        mkStop({
          city: 'Delhi', country: 'India',
          startDate: offsetDate(60), endDate: offsetDate(62),
          costs: { transport: 120, stay: 45, meals: 18 },
          activities: [
            { name: 'Old Delhi food tour', category: 'food', cost: 25, durationHours: 3, time: '17:00' },
            { name: 'Qutub Minar', category: 'culture', cost: 8, durationHours: 2 },
          ],
        }),
        mkStop({
          city: 'Agra', country: 'India',
          startDate: offsetDate(62), endDate: offsetDate(64),
          costs: { transport: 60, stay: 50, meals: 20 },
          activities: [
            { name: 'Taj Mahal at sunrise', category: 'sightseeing', cost: 15, durationHours: 3, time: '06:00' },
            { name: 'Agra Fort', category: 'culture', cost: 8, durationHours: 2 },
          ],
        }),
        mkStop({
          city: 'Jaipur', country: 'India',
          startDate: offsetDate(64), endDate: offsetDate(66),
          costs: { transport: 80, stay: 60, meals: 22 },
          activities: [
            { name: 'Amber Fort & elephant ride', category: 'culture', cost: 30, durationHours: 4 },
            { name: 'Bazaar shopping', category: 'shopping', cost: 60, durationHours: 3 },
          ],
        }),
      ],
    }),
  },
];
