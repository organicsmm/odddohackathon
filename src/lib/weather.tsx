import { useEffect, useState } from 'react';
import { Cloud, Sun, CloudRain, Snowflake, CloudSun, CloudFog, CloudLightning, Wind, Loader2 } from 'lucide-react';
import { getCoords } from '@/lib/coords';

// WMO weather code mapping → icon + label
// https://open-meteo.com/en/docs#weathervariables
const ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain, snow: Snowflake, mix: CloudSun, fog: CloudFog, storm: CloudLightning, wind: Wind };
type WeatherKey = keyof typeof ICONS;

function decodeWMO(code: number): { icon: WeatherKey; label: string } {
  if (code === 0) return { icon: 'sun', label: 'Clear' };
  if ([1, 2].includes(code)) return { icon: 'mix', label: 'Partly cloudy' };
  if (code === 3) return { icon: 'cloud', label: 'Overcast' };
  if ([45, 48].includes(code)) return { icon: 'fog', label: 'Fog' };
  if ([51, 53, 55, 56, 57].includes(code)) return { icon: 'rain', label: 'Drizzle' };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: 'rain', label: 'Rain' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: 'snow', label: 'Snow' };
  if ([95, 96, 99].includes(code)) return { icon: 'storm', label: 'Thunderstorm' };
  return { icon: 'cloud', label: 'Cloudy' };
}

export type ForecastSource = 'forecast' | 'climate';
export type DayForecast = {
  date: string;
  tempMax: number;
  tempMin: number;
  precipProb: number;
  icon: WeatherKey;
  label: string;
  source: ForecastSource;
};

// Geocoding cache so we only hit Open-Meteo's geocoding API once per unknown city per session
const geoCache = new Map<string, [number, number] | null>();

async function resolveCoords(city: string): Promise<[number, number] | null> {
  const local = getCoords(city);
  if (local) return local;
  const key = city.trim().toLowerCase();
  if (geoCache.has(key)) return geoCache.get(key)!;
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const r = data?.results?.[0];
    if (r && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      const tuple: [number, number] = [r.longitude, r.latitude];
      geoCache.set(key, tuple);
      return tuple;
    }
  } catch {
    // fall through
  }
  geoCache.set(key, null);
  return null;
}

// Open-Meteo forecast (up to ~16 days ahead). Falls back to climate normals for dates outside window.
export async function fetchForecast(city: string, startDate: string, endDate: string): Promise<DayForecast[] | null> {
  const c = await resolveCoords(city);
  if (!c) return null;
  const [lng, lat] = c;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  const maxFuture = new Date(today);
  maxFuture.setDate(today.getDate() + 16);

  // If trip is fully in the past or fully > 16 days out, use climate fallback
  if (end < today || start > maxFuture) {
    return climateFallback(city, startDate, endDate, lat);
  }

  const clampStart = start < today ? today : start;
  const clampEnd = end > maxFuture ? maxFuture : end;
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&start_date=${fmt(clampStart)}&end_date=${fmt(clampEnd)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('weather fetch failed');
    const data = await res.json();
    const days: string[] = data.daily?.time || [];
    return days.map((date, i) => {
      const code = data.daily.weather_code[i];
      const dec = decodeWMO(code);
      return {
        date,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precipProb: Math.round(data.daily.precipitation_probability_max[i] ?? 0),
        icon: dec.icon,
        label: dec.label,
        source: 'forecast',
      };
    });
  } catch {
    return climateFallback(city, startDate, endDate, lat);
  }
}

// Deterministic climate normal fallback for past or far-future dates.
function climateFallback(city: string, startDate: string, endDate: string, knownLat?: number): DayForecast[] {
  const out: DayForecast[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const month = d.getMonth() + 1;
    const c = getCoords(city);
    const lat = knownLat ?? (c ? c[1] : 30);
    const tropics = Math.abs(lat) < 23.5;
    const cold = lat > 55 || lat < -45;
    let base = 18;
    if (tropics) base = 28;
    if (cold) base = 2;
    const seasonal = Math.cos(((month - (lat >= 0 ? 7 : 1)) / 12) * Math.PI * 2) * 8;
    const tempMax = Math.round(base + seasonal + 4);
    const tempMin = Math.round(base + seasonal - 4);
    const seed = (city.charCodeAt(0) + month + d.getDate()) % 10;
    let icon: WeatherKey = 'sun';
    if (tempMax < 2) icon = 'snow';
    else if (seed < 2) icon = 'rain';
    else if (seed < 4) icon = 'cloud';
    else if (seed < 7) icon = 'mix';
    const label = { sun: 'Clear', cloud: 'Cloudy', rain: 'Rain', snow: 'Snow', mix: 'Partly cloudy', fog: 'Fog', storm: 'Storm', wind: 'Windy' }[icon];
    out.push({
      date: d.toISOString().slice(0, 10),
      tempMax, tempMin,
      precipProb: seed * 10,
      icon, label,
      source: 'climate',
    });
  }
  return out;
}

// Compact inline badge (used in StopCard header) — just shows first day summary
export function WeatherBadge({ city, date }: { city: string; date: string }) {
  const [w, setW] = useState<DayForecast | null>(null);
  useEffect(() => {
    let alive = true;
    fetchForecast(city, date, date).then(f => {
      if (alive && f && f[0]) setW(f[0]);
    });
    return () => { alive = false; };
  }, [city, date]);
  if (!w) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs backdrop-blur">
        <Loader2 className="h-3 w-3 animate-spin" /> weather
      </span>
    );
  }
  const Icon = ICONS[w.icon];
  const isLive = w.source === 'forecast';
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs backdrop-blur"
      title={isLive ? 'Live forecast from Open-Meteo' : 'Climate average — date is outside the 16-day forecast window'}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{w.tempMax}°C</span>
      <span className="opacity-80">{w.label}</span>
      <span
        className={`ml-0.5 inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider ${
          isLive ? 'bg-emerald-400/30 text-emerald-50' : 'bg-amber-400/30 text-amber-50'
        }`}
        aria-label={isLive ? 'Live forecast' : 'Climate average'}
      >
        <span className={`h-1 w-1 rounded-full ${isLive ? 'bg-emerald-300' : 'bg-amber-300'}`} />
        {isLive ? 'Live' : 'Avg'}
      </span>
    </span>
  );
}

// Full daily forecast strip for a stop
export function WeatherForecast({ city, startDate, endDate }: { city: string; startDate: string; endDate: string }) {
  const [forecast, setForecast] = useState<DayForecast[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    fetchForecast(city, startDate, endDate).then(f => {
      if (!alive) return;
      if (!f) setError(true);
      else setForecast(f);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [city, startDate, endDate]);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading forecast...
      </div>
    );
  }
  if (error || !forecast || forecast.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        Weather unavailable for this destination.
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const isFuture = startDate > today;
  const daysAhead = Math.round((new Date(startDate).getTime() - Date.now()) / 86400000);
  const isClimate = daysAhead > 16 || new Date(endDate) < new Date(today);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h5 className="text-sm font-display font-semibold flex items-center gap-1.5">
          <CloudSun className="h-4 w-4 text-primary" />
          Weather forecast
        </h5>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {isClimate ? 'Climate average' : isFuture ? `${daysAhead}d outlook` : 'Live'}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {forecast.map(d => {
          const Icon = ICONS[d.icon];
          const date = new Date(d.date);
          return (
            <div
              key={d.date}
              className="flex min-w-[78px] flex-col items-center gap-1 rounded-lg bg-muted/40 p-2 text-center"
              title={d.label}
            >
              <div className="text-[10px] font-medium uppercase text-muted-foreground">
                {date.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="text-xs font-semibold">{date.getDate()}</div>
              <Icon className="h-5 w-5 text-primary" />
              <div className="text-xs font-bold">{d.tempMax}°<span className="text-muted-foreground font-normal">/{d.tempMin}°</span></div>
              <div className="flex items-center gap-0.5 text-[10px] text-primary">
                <CloudRain className="h-2.5 w-2.5" /> {d.precipProb}%
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
