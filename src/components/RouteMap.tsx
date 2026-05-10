import React, { useEffect, useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, Line, ZoomableGroup } from 'react-simple-maps';
import { Plane, MapPin, ZoomIn, ZoomOut, Maximize2, Hash, Route, Flag } from 'lucide-react';
import type { Stop } from '@/lib/types';
import { getCoords, geocodeCityMeta, type GeoConfidence, type GeoResult } from '@/lib/coords';
import { Button } from '@/components/ui/button';

// Public world topology (110m countries)
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type PlottedStop = {
  stop: Stop;
  coords: [number, number];
  index: number;
  confidence: GeoConfidence;
  source: 'builtin' | 'geocoder';
  matchedName?: string;
  country?: string;
};

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

// Estimated accuracy radius (km) for a plotted stop. Heuristic based on data source & match quality.
function accuracyRadiusKm(p: { confidence: GeoConfidence; source: 'builtin' | 'geocoder'; matchedName?: string; stop: Stop }): number {
  if (p.confidence === 'exact') {
    return p.source === 'builtin' ? 5 : 10;
  }
  const matched = (p.matchedName ?? '').toLowerCase();
  const city = p.stop.city.toLowerCase();
  if (matched && matched !== city && matched.includes((city.split(/[\s,]/)[0] ?? ''))) return 50;
  if (matched) return 100;
  return 250;
}

function fmtRadius(km: number): string {
  if (km < 10) return `±${km} km`;
  if (km < 100) return `±${Math.round(km / 5) * 5} km`;
  return `±${Math.round(km / 10) * 10} km`;
}


export default function RouteMap({ stops, onSelectStop, highlightedStopId }: { stops: Stop[]; onSelectStop?: (id: string) => void; highlightedStopId?: string | null }) {
  const [hover, setHover] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  const [resolved, setResolved] = useState<Record<string, GeoResult>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});
  const [pendingCount, setPendingCount] = useState(0);
  const [showNumbers, setShowNumbers] = useState(true);
  const [dashedPaths, setDashedPaths] = useState(true);
  const [highlightEnds, setHighlightEnds] = useState(true);

  const lookupMeta = (city: string): GeoResult | null => {
    const builtin = getCoords(city);
    if (builtin) return { coords: builtin, confidence: 'exact', source: 'builtin', matchedName: city };
    return resolved[city.trim().toLowerCase()] ?? null;
  };

  // Async-resolve any cities not in the built-in list
  useEffect(() => {
    let cancelled = false;
    const missingCities = stops
      .map(s => s.city)
      .filter(c => !getCoords(c) && !(c.trim().toLowerCase() in resolved) && !(c.trim().toLowerCase() in failed));
    if (missingCities.length === 0) return;

    setPendingCount(missingCities.length);
    (async () => {
      const updates: Record<string, GeoResult> = {};
      const fails: Record<string, true> = {};
      for (const city of missingCities) {
        const r = await geocodeCityMeta(city);
        const key = city.trim().toLowerCase();
        if (r) updates[key] = r;
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
    const out: PlottedStop[] = [];
    stops.forEach((s, i) => {
      const m = lookupMeta(s.city);
      if (!m) return;
      out.push({
        stop: s, index: i,
        coords: m.coords, confidence: m.confidence, source: m.source,
        matchedName: m.matchedName, country: m.country,
      });
    });
    return out;
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

      <div
        className="group relative aspect-[16/9] w-full bg-[hsl(var(--accent-soft))] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        tabIndex={0}
        role="application"
        aria-label="Route map. Use arrow keys to move between stops, Enter to select, Home and End to jump to first or last stop."
        onKeyDown={(e) => {
          if (plotted.length === 0) return;
          const currentIdx = Math.max(
            0,
            plotted.findIndex(p => p.stop.id === highlightedStopId),
          );
          let nextIdx: number | null = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = (currentIdx + 1) % plotted.length;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') nextIdx = (currentIdx - 1 + plotted.length) % plotted.length;
          else if (e.key === 'Home') nextIdx = 0;
          else if (e.key === 'End') nextIdx = plotted.length - 1;
          else if (e.key === 'Enter' || e.key === ' ') {
            if (highlightedStopId) {
              e.preventDefault();
              onSelectStop?.(highlightedStopId);
            }
            return;
          } else return;
          e.preventDefault();
          const target = plotted[nextIdx];
          onSelectStop?.(target.stop.id);
          // Pan toward the focused stop so it stays in view
          setCenter(target.coords);
        }}
      >
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
              const confidenceLabel =
                p.confidence === 'exact'
                  ? `Exact location from ${p.source === 'builtin' ? 'built-in city database' : 'geocoder'}.`
                  : `Approximate location — best-effort match${p.matchedName ? ` to ${p.matchedName}` : ''}. Verify the marker.`;
              const stopAriaLabel =
                `Stop ${p.index + 1} of ${stops.length}: ${p.stop.city}${p.stop.country ? ', ' + p.stop.country : ''}. ` +
                `${isStart ? 'Start of trip. ' : ''}${isEnd ? 'End of trip. ' : ''}` +
                `${isSelected ? 'Currently selected. ' : ''}` +
                confidenceLabel +
                ' Press Enter to select.';
              return (
                <Marker
                  key={p.stop.id}
                  coordinates={p.coords}
                  onMouseEnter={() => setHover(p.stop.id)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(p.stop.id)}
                  onBlur={() => setHover(prev => (prev === p.stop.id ? null : prev))}
                  onClick={() => onSelectStop?.(p.stop.id)}
                  onKeyDown={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onSelectStop?.(p.stop.id);
                    }
                  }}
                  tabIndex={0}
                  role="button"
                  aria-label={stopAriaLabel}
                  aria-pressed={isSelected}
                  style={{ default: { cursor: 'pointer', outline: 'none' }, hover: { cursor: 'pointer' }, pressed: { cursor: 'pointer' } }}
                >
                  {/* pulse ring */}
                  <circle
                    r={isHover || isSelected ? 14 : 10}
                    fill={fill}
                    fillOpacity={isSelected ? 0.35 : 0.18}
                    style={{ transition: 'fill 300ms ease, fill-opacity 300ms ease, r 300ms ease' }}
                  >
                    <animate attributeName="r" values="8;16;8" dur="2.4s" repeatCount="indefinite" />
                    <animate attributeName="fill-opacity" values="0.25;0;0.25" dur="2.4s" repeatCount="indefinite" />
                  </circle>
                  {/* dashed outer = approximate location, solid = exact */}
                  <circle
                    r={isSelected ? 7.5 : 5.5}
                    fill={fill}
                    stroke="white"
                    strokeWidth={1.8}
                    strokeDasharray={p.confidence === 'approximate' ? '2 1.5' : undefined}
                    style={{ transition: 'fill 300ms ease, r 300ms ease, stroke 300ms ease' }}
                  />
                  {/* selection ring: always rendered so it can fade in/out smoothly */}
                  <circle
                    r={11}
                    fill="none"
                    stroke={ringColor}
                    strokeWidth={2}
                    strokeDasharray="3 2"
                    style={{
                      opacity: isSelected ? 1 : 0,
                      transform: isSelected ? 'scale(1)' : 'scale(0.7)',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                      transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <animate attributeName="stroke-dashoffset" from="0" to="10" dur="1.2s" repeatCount="indefinite" />
                  </circle>
                  {/* tiny "?" badge for approximate */}
                  {p.confidence === 'approximate' && (
                    <g transform="translate(6,-6)">
                      <circle r={4} fill="hsl(var(--warning))" stroke="white" strokeWidth={1} />
                      <text
                        textAnchor="middle"
                        y={1.5}
                        style={{ fontSize: 6, fontWeight: 700, fill: 'white', fontFamily: 'inherit' }}
                      >?</text>
                    </g>
                  )}
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
            <div
              role="tooltip"
              aria-live="polite"
              id={`route-stop-tooltip-${p.stop.id}`}
              className="pointer-events-none absolute left-4 top-4 max-w-xs rounded-xl border border-border bg-card/95 p-3 shadow-elegant backdrop-blur"
            >
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
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                <span
                  role="status"
                  aria-label={
                    p.confidence === 'exact'
                      ? `Confidence: exact. ${p.source === 'builtin' ? 'Pinpointed from built-in city database.' : `Geocoder match: ${p.matchedName ?? p.stop.city}${p.country ? ', ' + p.country : ''}.`}`
                      : `Confidence: approximate. Best-effort match: ${p.matchedName ?? 'unknown'}${p.country ? ', ' + p.country : ''}. Verify the marker.`
                  }
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold uppercase tracking-wider ${
                    p.confidence === 'exact'
                      ? 'bg-success/10 text-success'
                      : 'bg-warning/15 text-warning-foreground'
                  }`}
                  title={
                    p.source === 'builtin'
                      ? 'Pinpointed from built-in city database'
                      : p.confidence === 'exact'
                        ? `Geocoder match: ${p.matchedName ?? p.stop.city}${p.country ? ', ' + p.country : ''}`
                        : `Best-effort match: ${p.matchedName ?? '—'}${p.country ? ', ' + p.country : ''}. Verify the marker.`
                  }
                >
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${p.confidence === 'exact' ? 'bg-success' : 'bg-warning'}`} />
                  {p.confidence === 'exact' ? 'Exact' : 'Approx.'}
                </span>
                <span
                  className="inline-flex items-center rounded-full bg-muted/60 px-1.5 py-0.5 font-mono font-semibold tabular-nums text-foreground/80"
                  aria-label={`Estimated accuracy radius ${fmtRadius(accuracyRadiusKm(p))}`}
                  title="Estimated accuracy radius — true location likely within this distance"
                >
                  {fmtRadius(accuracyRadiusKm(p))}
                </span>
                <span className="text-muted-foreground">
                  {p.source === 'builtin' ? 'built-in' : 'geocoded'}
                  {p.matchedName && p.matchedName.toLowerCase() !== p.stop.city.toLowerCase() && (
                    <> · matched “{p.matchedName}”</>
                  )}
                </span>
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

        {/* Legend */}
        <div
          role="region"
          aria-label="Map legend"
          className="pointer-events-none absolute bottom-3 left-3 rounded-lg border border-border/60 bg-card/90 px-2.5 py-1.5 text-[10px] shadow-soft backdrop-blur"
        >
          <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">Legend</div>
          <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" role="list">
            {highlightEnds && (
              <li className="inline-flex items-center gap-1.5">
                <span role="img" aria-label="Green dot" className="h-2.5 w-2.5 rounded-full border border-white/80" style={{ background: 'hsl(var(--success))' }} />
                <span className="text-foreground/80">Start</span>
              </li>
            )}
            {highlightEnds && (
              <li className="inline-flex items-center gap-1.5">
                <span role="img" aria-label="Accent dot" className="h-2.5 w-2.5 rounded-full border border-white/80" style={{ background: 'hsl(var(--accent))' }} />
                <span className="text-foreground/80">End</span>
              </li>
            )}
            <li className="inline-flex items-center gap-1.5">
              <span role="img" aria-label="Primary dot" className="h-2.5 w-2.5 rounded-full border border-white/80" style={{ background: 'hsl(var(--primary))' }} />
              <span className="text-foreground/80">Stop</span>
            </li>
            <li className="inline-flex items-center gap-1.5">
              <span
                role="img"
                aria-label="Dashed ring"
                className="h-3 w-3 rounded-full"
                style={{ border: '1.5px dashed hsl(var(--ring))' }}
              />
              <span className="text-foreground/80">Selected</span>
            </li>
          </ul>
          <div className="mt-1.5 border-t border-border/60 pt-1.5">
            <div className="mb-1 font-semibold uppercase tracking-wider text-muted-foreground">Confidence</div>
            <ul className="flex flex-wrap items-center gap-x-3 gap-y-1" role="list">
              <li
                className="inline-flex items-center gap-1.5"
                title="Pinpointed from the built-in city database or an exact geocoder match."
              >
                <span
                  role="img"
                  aria-label="Solid white-ringed dot"
                  className="h-2.5 w-2.5 rounded-full border-2 border-white"
                  style={{ background: 'hsl(var(--primary))' }}
                />
                <span className="text-foreground/80">Exact — pinpointed location</span>
              </li>
              <li
                className="inline-flex items-center gap-1.5"
                title="Best-effort match — the marker may be off. Verify the location."
              >
                <span role="img" aria-label="Dashed warning ring with question mark badge" className="relative inline-flex h-3 w-3 items-center justify-center">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: 'hsl(var(--primary))',
                      border: '1.5px dashed hsl(var(--warning))',
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 grid h-2.5 w-2.5 place-items-center rounded-full text-[6px] font-bold text-white"
                    style={{ background: 'hsl(var(--warning))' }}
                  >
                    ?
                  </span>
                </span>
                <span className="text-foreground/80">Approx. — best-effort match</span>
              </li>
            </ul>
          </div>
        </div>

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
