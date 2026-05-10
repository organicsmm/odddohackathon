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
  { city: 'Mumbai',        country: 'India', region: 'West India',       tags: ['city', 'beach', 'food', 'bollywood'],     image: u('1567157577867-05ccb1388e66'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Hindi, Marathi, English' },
  { city: 'Delhi',         country: 'India', region: 'North India',      tags: ['heritage', 'food', 'bazaar'],             image: u('1587474260584-136574528ed5'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi, English' },
  { city: 'Jaipur',        country: 'India', region: 'North India',      tags: ['heritage', 'palace', 'pink-city'],        image: u('1599661046289-e31897846e41'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi, Rajasthani' },
  { city: 'Agra',          country: 'India', region: 'North India',      tags: ['taj-mahal', 'heritage', 'mughal'],        image: u('1564507592333-c60657eea523'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi' },
  { city: 'Udaipur',       country: 'India', region: 'North India',      tags: ['lakes', 'palace', 'romantic'],            image: u('1585484173186-fea4b3ad6f15'), bestMonths: 'Sep–Mar',          currency: 'INR', language: 'Hindi, Mewari' },
  { city: 'Jaisalmer',     country: 'India', region: 'North India',      tags: ['desert', 'fort', 'camel'],                image: u('1609920658906-8223bd289001'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi, Rajasthani' },
  { city: 'Varanasi',      country: 'India', region: 'North India',      tags: ['spiritual', 'ganges', 'ghats'],           image: u('1561361513-2d000a50f0dc'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Hindi, Bhojpuri' },
  { city: 'Rishikesh',     country: 'India', region: 'North India',      tags: ['yoga', 'rafting', 'spiritual'],           image: u('1591018653476-4ad8a52b48a4'), bestMonths: 'Sep–Apr',          currency: 'INR', language: 'Hindi, Garhwali' },
  { city: 'Manali',        country: 'India', region: 'North India',      tags: ['mountains', 'snow', 'adventure'],         image: u('1626621341517-bbf3d9990a23'), bestMonths: 'Mar–Jun, Oct–Feb', currency: 'INR', language: 'Hindi, Kullavi' },
  { city: 'Shimla',        country: 'India', region: 'North India',      tags: ['hills', 'colonial', 'snow'],              image: u('1597074866923-dc0589150358'), bestMonths: 'Mar–Jun, Dec–Feb', currency: 'INR', language: 'Hindi, Pahari' },
  { city: 'Leh',           country: 'India', region: 'North India',      tags: ['ladakh', 'mountains', 'monastery'],       image: u('1626621341517-bbf3d9990a23'), bestMonths: 'May–Sep',          currency: 'INR', language: 'Ladakhi, Hindi' },
  { city: 'Amritsar',      country: 'India', region: 'North India',      tags: ['golden-temple', 'food', 'sikh'],          image: u('1588096344356-9b7ff7959f10'), bestMonths: 'Nov–Mar',          currency: 'INR', language: 'Punjabi, Hindi' },
  { city: 'Goa',           country: 'India', region: 'West India',       tags: ['beach', 'party', 'portuguese'],           image: u('1582550945154-66ea8fff25e1'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Konkani, English' },
  { city: 'Pune',          country: 'India', region: 'West India',       tags: ['city', 'student', 'food'],                image: u('1572213426852-0e4ed8f41ff6'), bestMonths: 'Oct–Feb',          currency: 'INR', language: 'Marathi, Hindi' },
  { city: 'Ahmedabad',     country: 'India', region: 'West India',       tags: ['heritage', 'food', 'textile'],            image: u('1599930113854-d6d7fd522504'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Gujarati, Hindi' },
  { city: 'Bangalore',     country: 'India', region: 'South India',      tags: ['tech', 'pubs', 'gardens'],                image: u('1596176530529-78163a4f7af2'), bestMonths: 'Oct–Feb',          currency: 'INR', language: 'Kannada, English' },
  { city: 'Mysore',        country: 'India', region: 'South India',      tags: ['palace', 'silk', 'heritage'],             image: u('1600100395297-3a8e9a25fc52'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Kannada' },
  { city: 'Hampi',         country: 'India', region: 'South India',      tags: ['ruins', 'unesco', 'boulders'],            image: u('1605649461784-0c39e2e26c3e'), bestMonths: 'Oct–Feb',          currency: 'INR', language: 'Kannada' },
  { city: 'Hyderabad',     country: 'India', region: 'South India',      tags: ['biryani', 'tech', 'heritage'],            image: u('1572445271230-a78b5944a659'), bestMonths: 'Oct–Feb',          currency: 'INR', language: 'Telugu, Urdu' },
  { city: 'Chennai',       country: 'India', region: 'South India',      tags: ['beach', 'temple', 'food'],                image: u('1582510003544-4d00b7f74220'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Tamil, English' },
  { city: 'Pondicherry',   country: 'India', region: 'South India',      tags: ['french', 'beach', 'colonial'],            image: u('1582547155515-86d6e2afdcaf'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Tamil, French' },
  { city: 'Kochi',         country: 'India', region: 'South India',      tags: ['backwaters', 'fort', 'spice'],            image: u('1590080875515-8a3a8dc5735e'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Malayalam, English' },
  { city: 'Munnar',        country: 'India', region: 'South India',      tags: ['tea', 'hills', 'nature'],                 image: u('1609920658906-8223bd289001'), bestMonths: 'Sep–Mar',          currency: 'INR', language: 'Malayalam, Tamil' },
  { city: 'Alleppey',      country: 'India', region: 'South India',      tags: ['houseboat', 'backwaters'],                image: u('1590080875515-8a3a8dc5735e'), bestMonths: 'Nov–Feb',          currency: 'INR', language: 'Malayalam' },
  { city: 'Kolkata',       country: 'India', region: 'East India',       tags: ['heritage', 'food', 'art'],                image: u('1558431382-27e303142255'), bestMonths: 'Oct–Mar',          currency: 'INR', language: 'Bengali, Hindi' },
  { city: 'Darjeeling',    country: 'India', region: 'East India',       tags: ['tea', 'mountains', 'toy-train'],          image: u('1544461772-722f499fa14b'), bestMonths: 'Oct–Mar, Apr–Jun', currency: 'INR', language: 'Nepali, Bengali' },
  { city: 'Gangtok',       country: 'India', region: 'East India',       tags: ['mountains', 'monastery', 'sikkim'],       image: u('1597060085582-b3a7c5527147'), bestMonths: 'Mar–Jun, Sep–Nov', currency: 'INR', language: 'Nepali, English' },
  { city: 'Shillong',      country: 'India', region: 'East India',       tags: ['hills', 'waterfall', 'music'],            image: u('1605649461784-0c39e2e26c3e'), bestMonths: 'Oct–May',          currency: 'INR', language: 'Khasi, English' },
  { city: 'Andaman',       country: 'India', region: 'Islands',          tags: ['beach', 'scuba', 'island'],               image: u('1586500036706-41963de24d8b'), bestMonths: 'Oct–May',          currency: 'INR', language: 'Hindi, English' },
  { city: 'Lakshadweep',   country: 'India', region: 'Islands',          tags: ['island', 'lagoon', 'reef'],               image: u('1586500036706-41963de24d8b'), bestMonths: 'Oct–May',          currency: 'INR', language: 'Malayalam, English' },
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
