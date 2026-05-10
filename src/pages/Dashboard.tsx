import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, MapPin, Wallet, Sparkles, Wand2, Compass, ChevronRight } from 'lucide-react';
import AiTripGenerator from '@/components/AiTripGenerator';
import { TEMPLATES } from '@/lib/templates';
import { newTrip, upsertTrip, tripCost, tripDays } from '@/lib/store';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useTrips } from '@/hooks/use-trips';
import { CITIES } from '@/lib/catalog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Display, Heading, Eyebrow, Muted, Lead } from '@/components/ui/typography';
import { useMemo } from 'react';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
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
      {/* Welcome — clean header */}
      <section className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-soft">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Eyebrow>Welcome back</Eyebrow>
            <Heading level={1} className="mt-2">
              {user?.name?.split(' ')[0] || 'Traveler'}
            </Heading>
            <Lead className="mt-2 max-w-lg">
              Where will the next chapter take you? Build a new itinerary or pick up an existing trip.
            </Lead>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiTripGenerator
              trigger={
                <Button size="default">
                  <Sparkles className="h-4 w-4" /> Generate with AI
                </Button>
              }
            />
            <Button asChild size="default" variant="outline">
              <Link to="/app/new"><Plus className="h-4 w-4" /> New trip</Link>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
          <Stat icon={MapPin} label="Trips planned" value={trips.length.toString()} />
          <Stat icon={Calendar} label="Upcoming" value={upcoming.length.toString()} />
          <Stat icon={Wallet} label="Total budget" value={`$${totalSpend.toLocaleString()}`} />
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <SectionHeader title="Upcoming trips" eyebrow="Your journeys" link="/app/trips" />
        {upcoming.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((t, i) => {
              const cost = tripCost(t);
              return (
                <Link
                  key={t.id}
                  to={`/app/trips/${t.id}`}
                  className="group block animate-fade-up"
                  style={{ animationDelay: `${i * 70}ms` }}
                >
                  <Card variant="premium" className="h-full overflow-hidden transition-spring hover:-translate-y-1 hover:shadow-elegant">
                    {/* Cover */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      {t.cover ? (
                        <img src={t.cover} alt={t.name} className="absolute inset-0 h-full w-full object-cover transition-spring group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-hero" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute left-3 top-3">
                        <Badge variant="glass" className="!bg-white/25 !text-white border-white/30">
                          <Calendar className="h-3 w-3" /> {tripDays(t)} days
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <div className="font-display text-xl font-bold leading-tight drop-shadow line-clamp-1">{t.name}</div>
                        <div className="mt-0.5 text-xs opacity-90">
                          {new Date(t.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} → {new Date(t.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <Muted className="line-clamp-2 text-sm">{t.description || 'No description yet.'}</Muted>
                      <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                        <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {t.stops.length} stop{t.stops.length === 1 ? '' : 's'}
                        </div>
                        <div className="font-display font-bold tabular-nums text-primary">${cost.total.toLocaleString()}</div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recommendations — clean tiles */}
      <section>
        <SectionHeader title="Recommended for you" eyebrow="Inspiration" icon={Compass} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.map((c, i) => (
            <Card
              key={c.city}
              className="group relative overflow-hidden p-0 transition-smooth hover:border-foreground/20 hover:shadow-soft cursor-pointer animate-fade-up"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-secondary">
                <img
                  src={c.image}
                  alt={`${c.city}, ${c.country}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-spring group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/10" />
                <div className="absolute left-3 top-3">
                  <Badge variant="glass" className="!bg-white/25 !text-white border-white/30 text-[9px] uppercase tracking-[0.12em]">
                    {c.region}
                  </Badge>
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-base font-semibold tracking-tight drop-shadow">{c.city}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[11px] opacity-90">
                    <MapPin className="h-3 w-3" /> {c.country}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.1em] opacity-75">
                    Best · {c.bestMonths}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Templates — clean cards */}
      <section>
        <SectionHeader title="Start from a template" eyebrow="Curated journeys" icon={Wand2} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              onClick={() => {
                if (!user) return;
                const data = t.build();
                const trip = newTrip(user.email, data);
                trip.stops = data.stops;
                upsertTrip(trip);
                toast.success(`${t.title} added to your trips!`);
                navigate(`/app/trips/${trip.id}`);
              }}
              className="text-left animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <Card className="group relative h-full p-5 transition-smooth hover:border-foreground/20 hover:shadow-soft">
                <div className="flex items-start justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-2xl">
                    {t.emoji}
                  </span>
                  <span className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-smooth group-hover:bg-secondary group-hover:text-foreground">
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </div>

                <Heading level={3} className="mt-4 !text-base">{t.title}</Heading>
                <Muted className="mt-1 text-sm line-clamp-2">{t.tagline}</Muted>

                <div className="mt-5 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" /> {t.days} days
                  </span>
                  <span className="font-medium tabular-nums text-foreground">
                    <span className="mr-1 text-muted-foreground">from</span>
                    ${t.estimate.toLocaleString()}
                  </span>
                </div>
              </Card>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="bg-card p-5">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</div>
    </div>
  );
}

function SectionHeader({ title, eyebrow, link, icon: Icon }: { title: string; eyebrow?: string; link?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading level={2} className="mt-1 !text-xl flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-muted-foreground" />}
          {title}
        </Heading>
      </div>
      {link && <Button asChild variant="ghost" size="sm"><Link to={link}>View all <ArrowRight className="h-4 w-4" /></Link></Button>}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="p-10 text-center">
      <span className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-lg bg-secondary">
        <Compass className="h-5 w-5 text-muted-foreground" />
      </span>
      <Heading level={3} className="!text-lg">No upcoming trips yet</Heading>
      <Muted className="mt-1">Create your first trip to start planning.</Muted>
      <Button asChild className="mt-5"><Link to="/app/new"><Plus className="h-4 w-4" /> Create your first trip</Link></Button>
    </Card>
  );
}
