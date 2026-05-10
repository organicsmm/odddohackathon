import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Plus, Calendar, MapPin, Trash2, Eye, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/use-trips';
import { deleteTrip, tripCost, tripDays } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import AiTripGenerator from '@/components/AiTripGenerator';

export default function MyTrips() {
  const { user } = useAuth();
  const all = useTrips();
  const [q, setQ] = useState('');
  const trips = useMemo(() => {
    return all
      .filter(t => t.ownerEmail === user?.email)
      .filter(t => !q || t.name.toLowerCase().includes(q.toLowerCase()) || t.stops.some(s => s.city.toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [all, user, q]);

  const onDelete = (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    deleteTrip(id);
    toast.success('Trip deleted');
  };

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">My trips</h1>
          <p className="text-muted-foreground">All your adventures in one place.</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search trips or cities" className="pl-9 w-64" />
          </div>
          <AiTripGenerator />
          <Button asChild variant="outline"><Link to="/app/new"><Plus className="h-4 w-4" /> New trip</Link></Button>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <h3 className="text-xl font-display font-semibold">No trips yet</h3>
          <p className="mt-1 text-muted-foreground">Create your first trip to start planning.</p>
          <Button asChild variant="hero" className="mt-4"><Link to="/app/new"><Plus className="h-4 w-4" /> Plan new trip</Link></Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map(t => {
            const cost = tripCost(t);
            return (
              <div key={t.id} className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-gradient-card shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                <Link to={`/app/trips/${t.id}`} className="block aspect-[16/9] bg-gradient-hero p-5 text-primary-foreground">
                  <div className="text-xs uppercase tracking-wider opacity-80">{tripDays(t)} days · {t.stops.length} stops</div>
                  <div className="mt-2 font-display text-2xl font-bold leading-tight">{t.name}</div>
                  <div className="mt-2 text-xs opacity-90">{new Date(t.startDate).toLocaleDateString()} → {new Date(t.endDate).toLocaleDateString()}</div>
                </Link>
                <div className="flex flex-col gap-3 p-5">
                  <p className="line-clamp-2 text-sm text-muted-foreground">{t.description || 'No description.'}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.stops.slice(0, 3).map(s => (
                      <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        <MapPin className="h-3 w-3" />{s.city}
                      </span>
                    ))}
                    {t.stops.length > 3 && <span className="text-xs text-muted-foreground">+{t.stops.length - 3} more</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <div>
                      <div className="text-xs text-muted-foreground">Budget</div>
                      <div className="font-display font-bold text-primary">${cost.total.toLocaleString()}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button asChild size="icon" variant="ghost"><Link to={`/app/trips/${t.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button size="icon" variant="ghost" onClick={() => onDelete(t.id, t.name)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
