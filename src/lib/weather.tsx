import { Cloud, Sun, CloudRain, Snowflake, CloudSun } from 'lucide-react';

// Mock weather based on month + region keywords. Deterministic so same stop = same weather.
const ICONS = { sun: Sun, cloud: Cloud, rain: CloudRain, snow: Snowflake, mix: CloudSun };
type WeatherKey = keyof typeof ICONS;

function pseudoTemp(city: string, month: number) {
  const tropics = /bali|bangkok|mumbai|goa|singapore|dubai|cairo|rio|sydney/i.test(city);
  const cold = /iceland|reykjavik|moscow/i.test(city);
  let base = 18;
  if (tropics) base = 28;
  if (cold) base = 2;
  // northern hemisphere seasonal shift
  const shift = Math.cos(((month - 7) / 12) * Math.PI * 2) * 8;
  return Math.round(base + shift);
}

export function getWeather(city: string, isoDate: string): { icon: WeatherKey; tempC: number; label: string } {
  const month = new Date(isoDate).getMonth() + 1;
  const tempC = pseudoTemp(city, month);
  const seed = (city.charCodeAt(0) + month) % 10;
  let icon: WeatherKey = 'sun';
  if (tempC < 5) icon = 'snow';
  else if (seed < 2) icon = 'rain';
  else if (seed < 5) icon = 'cloud';
  else if (seed < 7) icon = 'mix';
  const label = { sun: 'Sunny', cloud: 'Cloudy', rain: 'Rainy', snow: 'Snowy', mix: 'Partly cloudy' }[icon];
  return { icon, tempC, label };
}

export function WeatherBadge({ city, date }: { city: string; date: string }) {
  const w = getWeather(city, date);
  const Icon = ICONS[w.icon];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-xs backdrop-blur">
      <Icon className="h-3.5 w-3.5" />
      <span className="font-medium">{w.tempC}°C</span>
      <span className="opacity-80">{w.label}</span>
    </span>
  );
}
