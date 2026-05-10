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
    <div className="space-y-12">
      {/* Welcome — premium aurora hero */}
      <section className="relative overflow-hidden rounded-3xl shadow-elegant">
        <div aria-hidden className="absolute inset-0 bg-gradient-hero" />
        <div aria-hidden className="absolute -top-32 -right-20 h-80 w-80 rounded-full bg-white/15 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative p-8 md:p-12 text-primary-foreground">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Eyebrow className="!text-primary-foreground/80">Welcome back</Eyebrow>
              <Display gradient={false} className="mt-2 !text-primary-foreground">
                {user?.name?.split(' ')[0] || 'Traveler'} <span className="inline-block animate-float">✈️</span>
              </Display>
              <Lead className="mt-3 !text-primary-foreground/90 max-w-lg">
                Where will the next chapter take you? Build a brand new itinerary or pick up an existing trip.
              </Lead>
            </div>
            <div className="flex flex-wrap gap-3">
              <AiTripGenerator
                trigger={
                  <Button size="lg" variant="glass" className="!bg-white !text-foreground hover:!bg-white/90">
                    <Sparkles className="h-4 w-4" /> Generate with AI
                  </Button>
                }
              />
              <Button asChild size="lg" variant="glass" className="!bg-white/15 !text-primary-foreground border-white/20 hover:!bg-white/25">
                <Link to="/app/new"><Plus className="h-4 w-4" /> Manual trip</Link>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Stat icon={MapPin} label="Trips planned" value={trips.length.toString()} />
            <Stat icon={Calendar} label="Upcoming" value={upcoming.length.toString()} />
            <Stat icon={Wallet} label="Total budget" value={`$${totalSpend.toLocaleString()}`} />
          </div>
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

      {/* Recommendations */}
      <section>
        <SectionHeader title="Recommended for you" eyebrow="Inspiration" icon={Compass} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.map((c, i) => (
            <Card
              key={c.city}
              variant="premium"
              className="group overflow-hidden p-0 transition-spring hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="relative aspect-[4/5] bg-gradient-ocean p-4 text-primary-foreground">
                <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_60%)]" />
                <div className="relative text-[10px] uppercase tracking-[0.16em] opacity-80">{c.region}</div>
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="font-display text-lg font-bold leading-tight drop-shadow">{c.city}</div>
                  <div className="text-[10px] opacity-90">{c.country}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Templates */}
      <section>
        <SectionHeader title="Start from a template" eyebrow="Quick start" icon={Wand2} />
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
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <Card variant="premium" className="group h-full p-5 transition-spring hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <span className="text-3xl drop-shadow-sm">{t.emoji}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-spring group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-2 font-display text-lg font-bold">{t.title}</h3>
                <Muted className="text-sm">{t.tagline}</Muted>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                  <span className="text-muted-foreground inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> {t.days} days</span>
                  <span className="font-semibold text-primary tabular-nums">~${t.estimate}</span>
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
    <div className="rounded-2xl bg-white/15 p-4 backdrop-blur-md ring-1 ring-white/15">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1.5 font-display text-3xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

function SectionHeader({ title, eyebrow, link, icon: Icon }: { title: string; eyebrow?: string; link?: string; icon?: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Heading level={2} className="mt-1 !text-2xl flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          {title}
        </Heading>
      </div>
      {link && <Button asChild variant="ghost" size="sm"><Link to={link}>View all <ArrowRight className="h-4 w-4" /></Link></Button>}
    </div>
  );
}

function EmptyState() {
  return (
    <Card variant="aurora" className="p-10 text-center">
      <span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-card shadow-ring">
        <Compass className="h-6 w-6 text-primary" />
      </span>
      <Heading level={3} className="!text-xl">No upcoming trips yet</Heading>
      <Muted className="mt-1">Create your first trip to start planning.</Muted>
      <Button asChild variant="premium" className="mt-5"><Link to="/app/new"><Plus className="h-4 w-4" /> Create your first trip</Link></Button>
    </Card>
  );
}
