import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { Plus, Calendar, MapPin, Trash2, Eye, Search, Compass } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/use-trips';
import { deleteTrip, tripCost, tripDays } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Display, Heading, Eyebrow, Muted, Lead } from '@/components/ui/typography';
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
          <Eyebrow>Your library</Eyebrow>
          <Display gradient as="h1" className="mt-1 !text-4xl md:!text-5xl">My trips</Display>
          <Lead className="mt-2">All your adventures, in one beautifully curated place.</Lead>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search trips or cities" className="pl-9 w-64" />
          </div>
          <AiTripGenerator />
          <Button asChild variant="premium"><Link to="/app/new"><Plus className="h-4 w-4" /> New trip</Link></Button>
        </div>
      </div>

      {trips.length === 0 ? (
        <Card variant="aurora" className="p-12 text-center">
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-card shadow-ring">
            <Compass className="h-6 w-6 text-primary" />
          </span>
          <Heading level={3} className="!text-xl">No trips yet</Heading>
          <Muted className="mt-1">Create your first trip to start planning.</Muted>
          <Button asChild variant="premium" className="mt-5"><Link to="/app/new"><Plus className="h-4 w-4" /> Plan new trip</Link></Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t, i) => {
            const cost = tripCost(t);
            return (
              <Card
                key={t.id}
                variant="premium"
                className="group flex flex-col overflow-hidden transition-spring hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link to={`/app/trips/${t.id}`} className="relative block aspect-[16/9] overflow-hidden">
                  {t.cover ? (
                    <img src={t.cover} alt={t.name} className="absolute inset-0 h-full w-full object-cover transition-spring group-hover:scale-105" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-hero" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <Badge variant="glass" className="!bg-white/25 !text-white border-white/30">
                      {tripDays(t)} days
                    </Badge>
                    <Badge variant="glass" className="!bg-white/25 !text-white border-white/30">
                      {t.stops.length} stop{t.stops.length === 1 ? '' : 's'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 text-white">
                    <div className="font-display text-2xl font-extrabold leading-tight drop-shadow line-clamp-1">{t.name}</div>
                    <div className="mt-1 text-xs opacity-90">
                      {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      {' → '}
                      {new Date(t.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </Link>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <Muted className="line-clamp-2 text-sm">{t.description || 'No description.'}</Muted>
                  <div className="flex flex-wrap gap-1.5">
                    {t.stops.slice(0, 3).map(s => (
                      <Badge key={s.id} variant="info" size="sm">
                        <MapPin className="h-3 w-3" />{s.city}
                      </Badge>
                    ))}
                    {t.stops.length > 3 && <span className="text-xs text-muted-foreground self-center">+{t.stops.length - 3} more</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
                    <div>
                      <Eyebrow>Budget</Eyebrow>
                      <div className="font-display font-extrabold text-primary tabular-nums">${cost.total.toLocaleString()}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button asChild size="icon-sm" variant="ghost"><Link to={`/app/trips/${t.id}`} aria-label="View"><Eye className="h-4 w-4" /></Link></Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => onDelete(t.id, t.name)} aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
