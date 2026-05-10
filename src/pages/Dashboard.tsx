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

      {/* Recommendations — luxury */}
      <section>
        <SectionHeader title="Recommended for you" eyebrow="Inspiration" icon={Compass} />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {recommended.map((c, i) => {
            const palettes = [
              'from-[#0f2027] via-[#203a43] to-[#2c5364]',
              'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
              'from-[#3a1c71] via-[#d76d77] to-[#ffaf7b]',
              'from-[#0b486b] via-[#3b8686] to-[#79bd9a]',
              'from-[#232526] via-[#414345] to-[#5b6467]',
              'from-[#42275a] via-[#734b6d] to-[#bdb76b]',
            ];
            const grad = palettes[i % palettes.length];
            return (
              <Card
                key={c.city}
                variant="premium"
                className="group relative overflow-hidden p-0 border-white/10 transition-spring hover:-translate-y-1.5 hover:shadow-elegant animate-fade-up cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`relative aspect-[3/4] bg-gradient-to-br ${grad} p-4 text-white`}>
                  {/* shimmer */}
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.35),transparent_55%)]" />
                  <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.45),transparent_60%)]" />
                  <div aria-hidden className="absolute -inset-x-10 -top-1/2 h-full rotate-12 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000" />
                  {/* gold hairline frame */}
                  <div aria-hidden className="absolute inset-2 rounded-[14px] ring-1 ring-white/15" />
                  <div aria-hidden className="absolute inset-2 rounded-[14px] ring-1 ring-[hsl(45_85%_70%/0.35)] mix-blend-overlay" />

                  <div className="relative flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/85">
                    <span className="h-px w-4 bg-[hsl(45_85%_70%)]" />
                    {c.region}
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="font-display text-xl font-bold leading-tight drop-shadow-lg">{c.city}</div>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-white/80">
                      <MapPin className="h-2.5 w-2.5" /> {c.country}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Templates — luxury */}
      <section>
        <SectionHeader title="Start from a template" eyebrow="Curated journeys" icon={Wand2} />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
              <Card variant="premium" className="group relative h-full overflow-hidden p-6 border-white/10 transition-spring hover:-translate-y-1.5 hover:shadow-elegant">
                {/* luxe backdrop */}
                <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
                <div aria-hidden className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-150" />
                <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(45_85%_70%/0.6)] to-transparent" />

                <div className="relative">
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-white to-primary/10 text-3xl shadow-ring ring-1 ring-border/60">
                      {t.emoji}
                    </span>
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-card ring-1 ring-border/70 text-muted-foreground transition-spring group-hover:bg-primary group-hover:text-primary-foreground group-hover:ring-primary">
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>

                  <Eyebrow className="mt-5 !text-[10px]">Signature route</Eyebrow>
                  <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{t.title}</h3>
                  <Muted className="mt-1 text-sm line-clamp-2">{t.tagline}</Muted>

                  <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-4 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> {t.days} days
                    </span>
                    <span className="inline-flex items-center gap-1 font-display font-bold tabular-nums text-primary">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">from</span>
                      ${t.estimate.toLocaleString()}
                    </span>
                  </div>
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
