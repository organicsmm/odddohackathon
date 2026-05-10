import type { Stop } from '@/lib/types';
import { Plane, MapPin } from 'lucide-react';

// Visual horizontal route timeline showing stops with connecting dashed plane line.
export default function RouteTimeline({ stops }: { stops: Stop[] }) {
  if (stops.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" /> Route
        </h3>
        <span className="text-xs text-muted-foreground">{stops.length} stops</span>
      </div>
      <div className="relative">
        <div className="absolute left-0 right-0 top-5 h-0.5 border-t-2 border-dashed border-primary/40" />
        <div className="relative grid gap-4" style={{ gridTemplateColumns: `repeat(${stops.length}, minmax(0, 1fr))` }}>
          {stops.map((s, i) => (
            <div key={s.id} className="flex flex-col items-center text-center">
              <div className={`grid h-10 w-10 place-items-center rounded-full text-primary-foreground shadow-elegant ${i === 0 ? 'bg-gradient-sunset' : i === stops.length - 1 ? 'bg-gradient-hero' : 'bg-gradient-ocean'}`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div className="mt-2 text-xs font-display font-semibold truncate max-w-full">{s.city}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-full">{s.country}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
