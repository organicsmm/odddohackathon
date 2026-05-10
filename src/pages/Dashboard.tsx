import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, MapPin, Wallet, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/use-trips';
import { tripCost, tripDays } from '@/lib/store';
import { CITIES } from '@/lib/catalog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMemo } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const allTrips = useTrips();
  const trips = useMemo(() => allTrips.filter(t => t.ownerEmail === user?.email), [allTrips, user]);
  const upcoming = trips
    .filter(t => new Date(t.endDate) >= new Date(new Date().toDateString()))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 3);
  const totalSpend = trips.reduce((acc, t) => acc + tripCost(t).total, 0);
  const recommended = useMemo(() => CITIES.slice().sort(() => Math.random() - 0.5).slice(0, 6), []);

  return (
    <div className="space-y-10">
      {/* Welcome */}
      <section className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-elegant md:p-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wider opacity-80">Welcome back</p>
            <h1 className="mt-1 text-3xl md:text-5xl font-display font-extrabold">{user?.name} ✈️</h1>
            <p className="mt-2 max-w-lg opacity-90">Where will the next chapter take you? Build a brand new itinerary or pick up an existing trip.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <AiTripGenerator trigger={<Button size="lg" variant="secondary"><Sparkles className="h-4 w-4" /> Generate with AI</Button>} />
            <Button asChild size="lg" variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10"><Link to="/app/new"><Plus className="h-4 w-4" /> Manual trip</Link></Button>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat icon={MapPin} label="Trips planned" value={trips.length.toString()} />
          <Stat icon={Calendar} label="Upcoming" value={upcoming.length.toString()} />
          <Stat icon={Wallet} label="Total budget" value={`$${totalSpend.toLocaleString()}`} />
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <SectionHeader title="Upcoming trips" link="/app/trips" />
        {upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map(t => {
              const cost = tripCost(t);
              return (
                <Link key={t.id} to={`/app/trips/${t.id}`} className="group rounded-2xl border border-border/60 bg-gradient-card p-5 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <Calendar className="h-3 w-3" /> {tripDays(t)} days
                  </div>
                  <h3 className="font-display text-xl font-bold">{t.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{t.description || 'No description yet'}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t.stops.length} stops</span>
                    <span className="font-semibold text-primary">${cost.total.toLocaleString()}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommendations */}
      <section>
        <SectionHeader title="Recommended for you" icon={Sparkles} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.map(c => (
            <Card key={c.city} className="overflow-hidden border-border/60 transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="aspect-[4/5] bg-gradient-ocean p-4 text-primary-foreground">
                <div className="text-xs opacity-80">{c.region}</div>
                <div className="mt-auto pt-12 font-display text-lg font-bold leading-tight">{c.city}</div>
                <div className="text-xs opacity-80">{c.country}</div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80"><Icon className="h-4 w-4" /> {label}</div>
      <div className="mt-1 text-2xl font-display font-bold">{value}</div>
    </div>
  );
}

function SectionHeader({ title, link, icon: Icon }: { title: string; link?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-2xl font-display font-bold flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-accent" />}
        {title}
      </h2>
      {link && <Button asChild variant="ghost" size="sm"><Link to={link}>View all <ArrowRight className="h-4 w-4" /></Link></Button>}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-10 text-center">
      <p className="text-muted-foreground">No upcoming trips yet.</p>
      <Button asChild variant="hero" className="mt-4"><Link to="/app/new"><Plus className="h-4 w-4" /> Create your first trip</Link></Button>
    </div>
  );
}
