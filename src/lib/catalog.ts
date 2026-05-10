// Curated city + activity catalog for search.
// `image` URLs are Unsplash photos (free to use under the Unsplash license)
// served via the images.unsplash.com CDN with a small width hint for fast tiles.
const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;

export type City = {
  city: string;
  country: string;
  region: string;
  tags: string[];
  image: string;
  bestMonths: string;
  currency: string;
  language: string;
};

export const CITIES: City[] = [
  { city: 'Paris',          country: 'France',       region: 'Europe',      tags: ['romantic', 'art', 'food'],     image: u('1502602898657-3e91760cbb34'), bestMonths: 'Apr–Jun, Sep–Oct', currency: 'EUR', language: 'French' },
  { city: 'Rome',           country: 'Italy',        region: 'Europe',      tags: ['history', 'food', 'art'],      image: u('1552832230-c0197dd311b5'), bestMonths: 'Apr–May, Sep–Oct', currency: 'EUR', language: 'Italian' },
  { city: 'Barcelona',      country: 'Spain',        region: 'Europe',      tags: ['beach', 'culture', 'nightlife'], image: u('1583422409516-2895a77efded'), bestMonths: 'May–Jun, Sep',     currency: 'EUR', language: 'Spanish, Catalan' },
  { city: 'Amsterdam',      country: 'Netherlands',  region: 'Europe',      tags: ['canal', 'art', 'cycling'],     image: u('1534351590666-13e3e96c5017'), bestMonths: 'Apr–May, Sep',     currency: 'EUR', language: 'Dutch' },
  { city: 'Lisbon',         country: 'Portugal',     region: 'Europe',      tags: ['coast', 'food', 'history'],    image: u('1555881400-74d7acaacd8b'), bestMonths: 'Mar–May, Sep–Oct', currency: 'EUR', language: 'Portuguese' },
  { city: 'London',         country: 'UK',           region: 'Europe',      tags: ['museum', 'theatre'],           image: u('1513635269975-59663e0ac1ad'), bestMonths: 'May–Sep',          currency: 'GBP', language: 'English' },
  { city: 'Santorini',      country: 'Greece',       region: 'Europe',      tags: ['island', 'sunset'],            image: u('1570077188670-e3a8d69ac5ff'), bestMonths: 'May–Jun, Sep',     currency: 'EUR', language: 'Greek' },
  { city: 'Reykjavik',      country: 'Iceland',      region: 'Europe',      tags: ['nature', 'aurora'],            image: u('1504829857797-ddff29c27927'), bestMonths: 'Jun–Aug, Feb–Mar', currency: 'ISK', language: 'Icelandic' },
  { city: 'Tokyo',          country: 'Japan',        region: 'Asia',        tags: ['food', 'tech', 'culture'],     image: u('1540959733332-eab4deabeeaf'), bestMonths: 'Mar–May, Oct–Nov', currency: 'JPY', language: 'Japanese' },
  { city: 'Kyoto',          country: 'Japan',        region: 'Asia',        tags: ['temple', 'culture'],           image: u('1493976040374-85c8e12f0c0e'), bestMonths: 'Mar–May, Oct–Nov', currency: 'JPY', language: 'Japanese' },
  { city: 'Bali',           country: 'Indonesia',    region: 'Asia',        tags: ['beach', 'wellness'],           image: u('1537996194471-e657df975ab4'), bestMonths: 'Apr–Oct',          currency: 'IDR', language: 'Indonesian' },
  { city: 'Bangkok',        country: 'Thailand',     region: 'Asia',        tags: ['food', 'temple', 'nightlife'], image: u('1508009603885-50cf7c579365'), bestMonths: 'Nov–Feb',          currency: 'THB', language: 'Thai' },
  { city: 'Singapore',      country: 'Singapore',    region: 'Asia',        tags: ['city', 'food'],                image: u('1525625293386-3f8f99389edd'), bestMonths: 'Feb–Apr',          currency: 'SGD', language: 'English' },
  { city: 'Seoul',          country: 'South Korea',  region: 'Asia',        tags: ['kpop', 'food'],                image: u('1538485399081-7c8970d28933'), bestMonths: 'Mar–May, Sep–Nov', currency: 'KRW', language: 'Korean' },
  { city: 'Mumbai',         country: 'India',        region: 'Asia',        tags: ['city', 'food'],                image: u('1567157577867-05ccb1388e66'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Hindi, English' },
  { city: 'Jaipur',         country: 'India',        region: 'Asia',        tags: ['heritage', 'palace'],          image: u('1599661046289-e31897846e41'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi' },
  { city: 'Goa',            country: 'India',        region: 'Asia',        tags: ['beach', 'party'],              image: u('1582550945154-66ea8fff25e1'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Konkani, English' },
  { city: 'Dubai',          country: 'UAE',          region: 'Middle East', tags: ['luxury', 'desert'],            image: u('1512453979798-5ea266f8880c'), bestMonths: 'Nov–Mar',          currency: 'AED', language: 'Arabic, English' },
  { city: 'Istanbul',       country: 'Turkey',       region: 'Europe',      tags: ['history', 'bazaar'],           image: u('1524231757912-21f4fe3a7200'), bestMonths: 'Apr–May, Sep–Oct', currency: 'TRY', language: 'Turkish' },
  { city: 'Cairo',          country: 'Egypt',        region: 'Africa',      tags: ['pyramids', 'history'],         image: u('1572252009286-268acec5ca0a'), bestMonths: 'Oct–Apr',          currency: 'EGP', language: 'Arabic' },
  { city: 'Cape Town',      country: 'South Africa', region: 'Africa',      tags: ['nature', 'wine'],              image: u('1580060839134-75a5edca2e99'), bestMonths: 'Nov–Mar',          currency: 'ZAR', language: 'English, Afrikaans' },
  { city: 'Marrakech',      country: 'Morocco',      region: 'Africa',      tags: ['souk', 'desert'],              image: u('1597212618440-806262de4f6b'), bestMonths: 'Mar–May, Sep–Nov', currency: 'MAD', language: 'Arabic, French' },
  { city: 'New York',       country: 'USA',          region: 'Americas',    tags: ['city', 'broadway'],            image: u('1496442226666-8d4d0e62e6e9'), bestMonths: 'Apr–Jun, Sep–Nov', currency: 'USD', language: 'English' },
  { city: 'San Francisco',  country: 'USA',          region: 'Americas',    tags: ['tech', 'bridge'],              image: u('1501594907352-04cda38ebc29'), bestMonths: 'Sep–Nov',          currency: 'USD', language: 'English' },
  { city: 'Los Angeles',    country: 'USA',          region: 'Americas',    tags: ['beach', 'movies'],             image: u('1444723121867-7a241cacace9'), bestMonths: 'Mar–May, Sep–Nov', currency: 'USD', language: 'English' },
  { city: 'Mexico City',    country: 'Mexico',       region: 'Americas',    tags: ['food', 'history'],             image: u('1518105779142-d975f22f1b0a'), bestMonths: 'Mar–May',          currency: 'MXN', language: 'Spanish' },
  { city: 'Rio de Janeiro', country: 'Brazil',       region: 'Americas',    tags: ['beach', 'carnival'],           image: u('1483729558449-99ef09a8c325'), bestMonths: 'Dec–Mar',          currency: 'BRL', language: 'Portuguese' },
  { city: 'Buenos Aires',   country: 'Argentina',    region: 'Americas',    tags: ['tango', 'food'],               image: u('1589909202802-8f4aadce1849'), bestMonths: 'Sep–Nov, Mar–May', currency: 'ARS', language: 'Spanish' },
  { city: 'Sydney',         country: 'Australia',    region: 'Oceania',     tags: ['harbour', 'beach'],            image: u('1506973035872-a4ec16b8e8d9'), bestMonths: 'Sep–Nov, Mar–May', currency: 'AUD', language: 'English' },
  { city: 'Queenstown',     country: 'New Zealand',  region: 'Oceania',     tags: ['adventure', 'nature'],         image: u('1530176418816-99daca2ca5c9'), bestMonths: 'Dec–Feb, Jun–Aug', currency: 'NZD', language: 'English' },
];

import type { Activity } from './types';

export const ACTIVITY_TEMPLATES: Omit<Activity, 'id'>[] = [
  { name: 'City walking tour', category: 'sightseeing', cost: 25, durationHours: 3 },
  { name: 'Local food tasting', category: 'food', cost: 45, durationHours: 2 },
  { name: 'Museum visit', category: 'culture', cost: 18, durationHours: 2 },
  { name: 'Sunset cruise', category: 'sightseeing', cost: 60, durationHours: 2 },
  { name: 'Hiking adventure', category: 'adventure', cost: 35, durationHours: 5 },
  { name: 'Beach day', category: 'nature', cost: 10, durationHours: 4 },
  { name: 'Live music night', category: 'nightlife', cost: 40, durationHours: 3 },
  { name: 'Cooking class', category: 'food', cost: 70, durationHours: 3 },
  { name: 'Local market shopping', category: 'shopping', cost: 50, durationHours: 2 },
  { name: 'Historic landmark visit', category: 'culture', cost: 22, durationHours: 2 },
  { name: 'Snorkeling tour', category: 'adventure', cost: 80, durationHours: 4 },
  { name: 'Spa & wellness', category: 'culture', cost: 90, durationHours: 2 },
  { name: 'Wildlife safari', category: 'nature', cost: 120, durationHours: 6 },
  { name: 'Bike tour', category: 'adventure', cost: 30, durationHours: 3 },
  { name: 'Rooftop dinner', category: 'food', cost: 75, durationHours: 2 },
  { name: 'Boat ride', category: 'nature', cost: 40, durationHours: 2 },
  { name: 'Photography walk', category: 'sightseeing', cost: 20, durationHours: 2 },
  { name: 'Nightlife pub crawl', category: 'nightlife', cost: 55, durationHours: 4 },
];

export const DEFAULT_PACKING: { label: string; category: 'clothing' | 'documents' | 'electronics' | 'toiletries' | 'misc' }[] = [
  { label: 'Passport', category: 'documents' },
  { label: 'Visa & travel insurance', category: 'documents' },
  { label: 'Tickets / boarding passes', category: 'documents' },
  { label: 'Phone & charger', category: 'electronics' },
  { label: 'Power adapter', category: 'electronics' },
  { label: 'Headphones', category: 'electronics' },
  { label: 'T-shirts', category: 'clothing' },
  { label: 'Jeans / pants', category: 'clothing' },
  { label: 'Jacket', category: 'clothing' },
  { label: 'Comfortable shoes', category: 'clothing' },
  { label: 'Toothbrush & toothpaste', category: 'toiletries' },
  { label: 'Sunscreen', category: 'toiletries' },
  { label: 'Medications', category: 'toiletries' },
  { label: 'Sunglasses', category: 'misc' },
  { label: 'Reusable water bottle', category: 'misc' },
];
