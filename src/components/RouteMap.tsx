import { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import { Plane, MapPin, ZoomIn, ZoomOut, Maximize2, Hash, Route, Flag } from 'lucide-react';
import type { Stop } from '@/lib/types';
import { getCoords, geocodeCity } from '@/lib/coords';
import { Button } from '@/components/ui/button';

// Public world topology (110m countries)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type PlottedStop = { stop: Stop; coords: [number, number]; index: number };

// Haversine great-circle distance in km
function distanceKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Pick a sensible mode + speed (km/h) and add overhead
function estimateLeg(km: number): { mode: 'walk' | 'car' | 'train' | 'flight'; hours: number; label: string } {
  if (km < 3) return { mode: 'walk', hours: km / 5, label: 'walk' };
  if (km < 60) return { mode: 'car', hours: km / 60 + 0.2, label: 'drive' };
  if (km < 400) return { mode: 'train', hours: km / 90 + 0.5, label: 'train/drive' };
  // Flight: account for airport overhead (~3.5h) + ~750 km/h cruise
  return { mode: 'flight', hours: km / 750 + 3.5, label: 'flight' };
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.max(5, Math.round(h * 60 / 5) * 5)} min`;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return mm === 0 ? `${hh}h` : `${hh}h ${mm}m`;
}

function fmtKm(km: number): string {
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString()} km`;
}


export default function RouteMap({ stops, onSelectStop, highlightedStopId }: { stops: Stop[]; onSelectStop?: (id: string) => void; highlightedStopId?: string | null }) {
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [resolved, setResolved] = useState<Record<string, [number, number]>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [showNumbers, setShowNumbers] = useState(true);
  const [dashedPaths, setDashedPaths] = useState(true);
  const [highlightEnds, setHighlightEnds] = useState(true);

  const lookup = (city: string): [number, number] | null =>
    getCoords(city) ?? resolved[city.trim().toLowerCase()] ?? null;

  // Async-resolve any cities not in the built-in list
  useEffect(() => {
    let cancelled = false;
    const missingCities = stops
      .map(s => s.city)
      .filter(c => !getCoords(c) && !(c.trim().toLowerCase() in resolved) && !(c.trim().toLowerCase() in failed));
    if (missingCities.length === 0) return;

    setPendingCount(missingCities.length);
    (async () => {
      const updates: Record<string, [number, number]> = {};
      const fails: Record<string, true> = {};
      for (const city of missingCities) {
        const c = await geocodeCity(city);
        const key = city.trim().toLowerCase();
        if (c) updates[key] = c;
        else fails[key] = true;
        if (!cancelled) setPendingCount(n => Math.max(0, n - 1));
      }
      if (cancelled) return;
      if (Object.keys(updates).length) setResolved(prev => ({ ...prev, ...updates }));
      if (Object.keys(fails).length) setFailed(prev => ({ ...prev, ...fails }));
    })();

    return () => { cancelled = true; };
  }, [stops, resolved, failed]);

  const plotted: PlottedStop[] = useMemo(() => {
    return stops
      .map((s, i) => {
        const c = lookup(s.city);
        return c ? { stop: s, coords: c, index: i } : null;
      })
      .filter((x): x is PlottedStop => x !== null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stops, resolved]);

  const missing = stops.length - plotted.length;
  const failedCities = useMemo(
    () => stops.map(s => s.city).filter(c => c.trim().toLowerCase() in failed),
    [stops, failed],
  );
  const isLocating = pendingCount > 0;
  const subtitle = isLocating
    ? `${plotted.length} plotted · locating ${pendingCount} more…`
    : missing > 0
      ? `${plotted.length} plotted · ${missing} couldn't be located`
      : `${plotted.length} stops plotted`;

  // Auto-fit center on plotted stops
  const fitView = () => {
    if (plotted.length === 0) return;
    const lngs = plotted.map(p => p.coords[0]);
    const lats = plotted.map(p => p.coords[1]);
    const cx = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    const cy = (Math.min(...lats) + Math.max(...lats)) / 2;
    const span = Math.max(Math.max(...lngs) - Math.min(...lngs), Math.max(...lats) - Math.min(...lats));
    const z = span < 20 ? 4 : span < 60 ? 2.5 : span < 120 ? 1.5 : 1;
    setCenter([cx, cy]);
    setZoom(z);
  };

  if (stops.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-gradient-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-ocean text-primary-foreground">
            <Plane className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold leading-tight">Route map</h3>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <div className="mr-1 flex gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              size="icon" variant={showNumbers ? 'secondary' : 'ghost'}
              className="h-7 w-7" onClick={() => setShowNumbers(v => !v)}
              aria-label="Toggle numbered pins" title="Numbered pins"
            ><Hash className="h-3.5 w-3.5" /></Button>
            <Button
              size="icon" variant={dashedPaths ? 'secondary' : 'ghost'}
              className="h-7 w-7" onClick={() => setDashedPaths(v => !v)}
              aria-label="Toggle dashed paths" title="Dashed route paths"
            ><Route className="h-3.5 w-3.5" /></Button>
            <Button
              size="icon" variant={highlightEnds ? 'secondary' : 'ghost'}
              className="h-7 w-7" onClick={() => setHighlightEnds(v => !v)}
              aria-label="Toggle start/end highlight" title="Highlight start & end"
            ><Flag className="h-3.5 w-3.5" /></Button>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(z * 1.5, 16))} aria-label="Zoom in"><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(z / 1.5, 1))} aria-label="Zoom out"><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="ghost" onClick={fitView} aria-label="Fit"><Maximize2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="relative aspect-[16/9] w-full bg-[hsl(var(--accent-soft))]">
        <ComposableMap
          projectionConfig={{ scale: 155 }}
          width={980}
          height={520}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup
            zoom={zoom}
            center={center}
            onMoveEnd={({ coordinates, zoom }) => {
              setCenter(coordinates as [number, number]);
              setZoom(zoom);
            }}
            minZoom={1}
            maxZoom={16}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map(geo => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: { fill: 'hsl(var(--muted))', stroke: 'hsl(var(--border))', strokeWidth: 0.4, outline: 'none' },
                      hover: { fill: 'hsl(var(--muted-foreground) / 0.25)', outline: 'none' },
                      pressed: { fill: 'hsl(var(--muted))', outline: 'none' },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Travel paths between consecutive stops */}
            {plotted.slice(0, -1).map((p, i) => {
              const next = plotted[i + 1];
              const km = distanceKm(p.coords, next.coords);
              const leg = estimateLeg(km);
              const mid: [number, number] = [
                (p.coords[0] + next.coords[0]) / 2,
                (p.coords[1] + next.coords[1]) / 2,
              ];
              return (
                <g key={`line-${p.stop.id}-${next.stop.id}`}>
                  <Line
                    from={p.coords}
                    to={next.coords}
                    stroke="hsl(var(--primary))"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    strokeDasharray={dashedPaths ? '4 4' : undefined}
                  />
                  <Marker coordinates={mid}>
                    <text
                      textAnchor="middle"
                      y={4}
                      style={{
                        fontFamily: 'inherit',
                        fontSize: 9,
                        fontWeight: 600,
                        fill: 'hsl(var(--foreground))',
                        paintOrder: 'stroke',
                        stroke: 'hsl(var(--background))',
                        strokeWidth: 3,
                        strokeLinejoin: 'round',
                      }}
                    >
                      {fmtKm(km)} · {fmtHours(leg.hours)}
                    </text>
                  </Marker>
                </g>
              );
            })}

            {/* Stop markers */}
            {plotted.map(p => {
              const isHover = hover === p.stop.id;
              const isSelected = highlightedStopId === p.stop.id;
              const isStart = p.index === 0;
              const isEnd = p.index === stops.length - 1;
              // Color priority: start/end highlight defines base color; selection adds a ring overlay.
              // This avoids the prior conflict where selected and end both used --accent.
              const baseFill = highlightEnds && isStart
                ? 'hsl(var(--success))'
                : highlightEnds && isEnd
                  ? 'hsl(var(--accent))'
                  : 'hsl(var(--primary))';
              const fill = baseFill;
              const ringColor = 'hsl(var(--ring))';
              const labelText = showNumbers
                ? `${p.index + 1}. ${p.stop.city}`
                : p.stop.city;
              return (
                <Marker
                  key={p.stop.id}
                  coordinates={p.coords}
                  onMouseEnter={() => setHover(p.stop.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => onSelectStop?.(p.stop.id)}
                  style={{ default: { cursor: 'pointer' }, hover: { cursor: 'pointer' }, pressed: { cursor: 'pointer' } }}
                >
                  {/* pulse ring */}
                  <circle r={isHover || isSelected ? 14 : 10} fill={fill} fillOpacity={isSelected ? 0.35 : 0.18}>
                    <animate attributeName="r" values="8;16;8" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="fill-opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  <circle r={isSelected ? 7.5 : 5.5} fill={fill} stroke="white" strokeWidth={isSelected ? 2.5 : 1.8} />
                  <text
                    textAnchor="middle"
                    y={-12}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: 11,
                      fontWeight: 700,
                      fill: 'hsl(var(--foreground))',
                      paintOrder: 'stroke',
                      stroke: 'hsl(var(--background))',
                      strokeWidth: 3,
                      strokeLinejoin: 'round',
                    }}
                  >
                    {labelText}
                  </text>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Hover tooltip */}
        {hover && (() => {
          const p = plotted.find(x => x.stop.id === hover);
          if (!p) return null;
          const idx = plotted.indexOf(p);
          const prev = idx > 0 ? plotted[idx - 1] : null;
          const next = idx < plotted.length - 1 ? plotted[idx + 1] : null;
          const inLeg = prev ? { km: distanceKm(prev.coords, p.coords) } : null;
          const outLeg = next ? { km: distanceKm(p.coords, next.coords) } : null;
          return (
            <div className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" /> Stop {p.index + 1} of {stops.length}
              </div>
              <div className="font-display text-base font-bold">{p.stop.city}</div>
              <div className="text-xs text-muted-foreground">{p.stop.country}</div>
              <div className="mt-1 text-xs">
                {new Date(p.stop.startDate).toLocaleDateString()} → {new Date(p.stop.endDate).toLocaleDateString()}
              </div>
              <div className="mt-1 text-xs text-primary font-medium">
                {p.stop.activities.length} activit{p.stop.activities.length === 1 ? 'y' : 'ies'}
              </div>
              {(inLeg || outLeg) && (
                <div className="mt-2 space-y-0.5 border-t border-border/60 pt-2 text-xs">
                  {inLeg && (() => {
                    const e = estimateLeg(inLeg.km);
                    return (
                      <div className="text-muted-foreground">
                        ← from <span className="font-medium text-foreground">{prev!.stop.city}</span>: {fmtKm(inLeg.km)} · ~{fmtHours(e.hours)} {e.label}
                      </div>
                    );
                  })()}
                  {outLeg && (() => {
                    const e = estimateLeg(outLeg.km);
                    return (
                      <div className="text-muted-foreground">
                        → to <span className="font-medium text-foreground">{next!.stop.city}</span>: {fmtKm(outLeg.km)} · ~{fmtHours(e.hours)} {e.label}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })()}

        {(isLocating || failedCities.length > 0) && (
          <div
            className="pointer-events-auto absolute bottom-3 right-3 max-w-[18rem] rounded-md bg-card/90 px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-soft backdrop-blur"
            title={failedCities.length > 0 ? failedCities.join(', ') : undefined}
          >
            {isLocating ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
                Locating {pendingCount} stop{pendingCount > 1 ? 's' : ''}…
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">
                  Couldn't locate {failedCities.length === 1
                    ? <strong className="font-semibold text-foreground/80">{failedCities[0]}</strong>
                    : <><strong className="font-semibold text-foreground/80">{failedCities[0]}</strong> +{failedCities.length - 1} more</>}
                  {' · try a nearby city'}
                </span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
