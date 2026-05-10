// Lat/Lng for catalog cities + common destinations. [lng, lat] (GeoJSON order).
export const CITY_COORDS: Record<string, [number, number]> = {
  Paris: [2.3522, 48.8566],
  Rome: [12.4964, 41.9028],
  Barcelona: [2.1734, 41.3851],
  Amsterdam: [4.9041, 52.3676],
  Lisbon: [-9.1393, 38.7223],
  London: [-0.1276, 51.5074],
  Santorini: [25.4615, 36.3932],
  Reykjavik: [-21.9426, 64.1466],
  Tokyo: [139.6917, 35.6895],
  Kyoto: [135.7681, 35.0116],
  Bali: [115.1889, -8.4095],
  Bangkok: [100.5018, 13.7563],
  Singapore: [103.8198, 1.3521],
  Seoul: [126.978, 37.5665],
  Mumbai: [72.8777, 19.076],
  Jaipur: [75.7873, 26.9124],
  Goa: [73.8567, 15.2993],
  Dubai: [55.2708, 25.2048],
  Istanbul: [28.9784, 41.0082],
  Cairo: [31.2357, 30.0444],
  'Cape Town': [18.4241, -33.9249],
  Marrakech: [-7.9811, 31.6295],
  'New York': [-74.006, 40.7128],
  'San Francisco': [-122.4194, 37.7749],
  'Los Angeles': [-118.2437, 34.0522],
  'Mexico City': [-99.1332, 19.4326],
  'Rio de Janeiro': [-43.1729, -22.9068],
  'Buenos Aires': [-58.3816, -34.6037],
  Sydney: [151.2093, -33.8688],
  Queenstown: [168.6626, -45.0312],
  // Popular extras the AI generator might output
  Berlin: [13.405, 52.52],
  Madrid: [-3.7038, 40.4168],
  Vienna: [16.3738, 48.2082],
  Prague: [14.4378, 50.0755],
  Athens: [23.7275, 37.9838],
  Dublin: [-6.2603, 53.3498],
  Oslo: [10.7522, 59.9139],
  Stockholm: [18.0686, 59.3293],
  Copenhagen: [12.5683, 55.6761],
  Florence: [11.2558, 43.7696],
  Venice: [12.3155, 45.4408],
  Milan: [9.19, 45.4642],
  Naples: [14.2681, 40.8518],
  Porto: [-8.6291, 41.1579],
  Seville: [-5.9845, 37.3891],
  Marseille: [5.3698, 43.2965],
  Nice: [7.262, 43.7102],
  Edinburgh: [-3.1883, 55.9533],
  Zurich: [8.5417, 47.3769],
  Budapest: [19.0402, 47.4979],
  Krakow: [19.945, 50.0647],
  Hanoi: [105.8342, 21.0285],
  'Ho Chi Minh City': [106.6297, 10.8231],
  'Siem Reap': [103.8597, 13.3633],
  'Phnom Penh': [104.9282, 11.5564],
  Phuket: [98.3923, 7.8804],
  'Chiang Mai': [98.9817, 18.7883],
  'Hong Kong': [114.1694, 22.3193],
  Beijing: [116.4074, 39.9042],
  Shanghai: [121.4737, 31.2304],
  Delhi: [77.209, 28.6139],
  Agra: [78.0081, 27.1767],
  Varanasi: [82.9739, 25.3176],
  Colombo: [79.8612, 6.9271],
  Kathmandu: [85.324, 27.7172],
  Manila: [120.9842, 14.5995],
  'Kuala Lumpur': [101.6869, 3.139],
  'Tel Aviv': [34.7818, 32.0853],
  Petra: [35.4444, 30.3285],
  Amman: [35.9106, 31.9454],
  Doha: [51.531, 25.2854],
  Nairobi: [36.8219, -1.2921],
  'Addis Ababa': [38.7469, 9.145],
  Casablanca: [-7.5898, 33.5731],
  Fez: [-5.0078, 34.0181],
  Chicago: [-87.6298, 41.8781],
  Miami: [-80.1918, 25.7617],
  Boston: [-71.0589, 42.3601],
  'Las Vegas': [-115.1398, 36.1699],
  Seattle: [-122.3321, 47.6062],
  Toronto: [-79.3832, 43.6532],
  Vancouver: [-123.1207, 49.2827],
  Montreal: [-73.5673, 45.5017],
  Havana: [-82.3666, 23.1136],
  Lima: [-77.0428, -12.0464],
  Cusco: [-71.9675, -13.5319],
  'Machu Picchu': [-72.545, -13.1631],
  Bogota: [-74.0721, 4.711],
  Cartagena: [-75.4794, 10.3997],
  Quito: [-78.4678, -0.1807],
  Santiago: [-70.6483, -33.4569],
  Auckland: [174.7633, -36.8485],
  Melbourne: [144.9631, -37.8136],
  Brisbane: [153.0251, -27.4698],
  Tasmania: [146.5, -42],
};

export type GeoConfidence = 'exact' | 'approximate' | 'failed';
export interface GeoResult {
  coords: [number, number];
  confidence: GeoConfidence;
  source: 'builtin' | 'geocoder';
  /** Resolved/canonical name returned by the source, when available. */
  matchedName?: string;
  country?: string;
  admin1?: string;
}

export function getCoords(city: string): [number, number] | null {
  if (CITY_COORDS[city]) return CITY_COORDS[city];
  // case-insensitive lookup
  const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === city.toLowerCase());
  return key ? CITY_COORDS[key] : null;
}

function getBuiltinName(city: string): string | null {
  if (CITY_COORDS[city]) return city;
  return Object.keys(CITY_COORDS).find(k => k.toLowerCase() === city.toLowerCase()) ?? null;
}

/* ---------- Async geocoding fallback (Open-Meteo, no API key) ---------- */

const LS_KEY = 'traveloop:geocode-cache:v1';
const META_LS_KEY = 'traveloop:geocode-meta:v1';

function loadCache(): Record<string, [number, number] | null> {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}
function saveCache(c: Record<string, [number, number] | null>) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch { /* ignore quota */ }
}
function loadMeta(): Record<string, GeoResult> {
  try { return JSON.parse(localStorage.getItem(META_LS_KEY) || '{}'); } catch { return {}; }
}
function saveMeta(m: Record<string, GeoResult>) {
  try { localStorage.setItem(META_LS_KEY, JSON.stringify(m)); } catch { /* ignore quota */ }
}

const memCache: Record<string, [number, number] | null> = loadCache();
const metaCache: Record<string, GeoResult> = loadMeta();
const inflight = new Map<string, Promise<GeoResult | null>>();

function classify(city: string, hit: { name?: string; population?: number; country?: string }): GeoConfidence {
  const wantedTokens = city.trim().toLowerCase().split(/[\s,]+/).filter(Boolean);
  const name = (hit.name || '').toLowerCase();
  const nameMatch = wantedTokens.length > 0 && wantedTokens.every(t => name.includes(t));
  const popOk = (hit.population ?? 0) >= 50_000;
  if (nameMatch && hit.country) return 'exact';
  if (nameMatch || popOk) return 'approximate';
  return 'approximate';
}

export async function geocodeCityMeta(city: string): Promise<GeoResult | null> {
  const builtinName = getBuiltinName(city);
  if (builtinName) {
    return { coords: CITY_COORDS[builtinName], confidence: 'exact', source: 'builtin', matchedName: builtinName };
  }

  const key = city.trim().toLowerCase();
  if (metaCache[key]) return metaCache[key];
  if (key in memCache && memCache[key] === null) return null;
  if (inflight.has(key)) return inflight.get(key)!;

  const p = (async (): Promise<GeoResult | null> => {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`geocode ${res.status}`);
      const data = await res.json();
      const hit = data?.results?.[0];
      if (!hit) {
        memCache[key] = null; saveCache(memCache);
        return null;
      }
      const result: GeoResult = {
        coords: [hit.longitude, hit.latitude],
        confidence: classify(city, hit),
        source: 'geocoder',
        matchedName: hit.name,
        country: hit.country,
        admin1: hit.admin1,
      };
      memCache[key] = result.coords; saveCache(memCache);
      metaCache[key] = result; saveMeta(metaCache);
      return result;
    } catch {
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, p);
  return p;
}

/** Coords-only convenience wrapper (back-compat). */
export async function geocodeCity(city: string): Promise<[number, number] | null> {
  const r = await geocodeCityMeta(city);
  return r ? r.coords : null;
}


