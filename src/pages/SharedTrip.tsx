import { useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar, MapPin, Plane, Copy, Twitter, Facebook, Link as LinkIcon, Globe, Lock,
  Wallet, Users, Compass, Share2, ExternalLink, ArrowRight, Sparkles,
} from 'lucide-react';
import { getTripByShareForViewer, tripCost, tripDays, stopDays, newTrip, upsertTrip } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Display, Heading, Lead, Eyebrow, Muted } from '@/components/ui/typography';
import { toast } from 'sonner';
import RouteMap from '@/components/RouteMap';
import { WeatherForecast } from '@/lib/weather';
import { formatMoney } from '@/lib/currency';

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

export default function SharedTrip() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trip = getTripByShareForViewer(shareId!, user?.email || null);

  // ------- SEO meta tags -------
  useEffect(() => {
    if (!trip) {
      document.title = 'Trip not found · Traveloop';
      return;
    }
    const days = tripDays(trip);
    const cost = tripCost(trip);
    const cities = trip.stops.map(s => s.city).filter(Boolean).slice(0, 4).join(' · ');
    const title = `${trip.name} · ${days} day${days > 1 ? 's' : ''} itinerary`;
    const desc = trip.description?.trim()
      || `${days}-day trip across ${trip.stops.length} stop${trip.stops.length === 1 ? '' : 's'}${cities ? ` — ${cities}` : ''}. Estimated $${Math.round(cost.total).toLocaleString()}.`;
    document.title = `${title} · Traveloop`;
    setMeta('description', desc);
    setMeta('og:title', title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', 'article', 'property');
    setMeta('og:url', window.location.href, 'property');
    if (trip.cover) setMeta('og:image', trip.cover, 'property');
    setMeta('twitter:card', trip.cover ? 'summary_large_image' : 'summary');
    setMeta('twitter:title', title);
    setMeta('twitter:description', desc);
    if (trip.cover) setMeta('twitter:image', trip.cover);
    setCanonical(window.location.href);
  }, [trip]);

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-aurora">
        <div className="grid min-h-screen place-items-center p-6 text-center">
          <Card variant="premium" className="max-w-md p-10">
            <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </span>
            <Heading level={1} className="!text-3xl">Trip not found</Heading>
            <Muted className="mt-2">This itinerary may be private, link-only, or no longer exists.</Muted>
            <div className="mt-6 flex justify-center gap-2">
              <Button asChild variant="premium"><Link to="/">Go home</Link></Button>
              <Button asChild variant="outline"><Link to="/login">Sign in</Link></Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const cost = tripCost(trip);
  const days = tripDays(trip);
  const currency = 'USD' as const;
  const url = typeof window !== 'undefined' ? window.location.href : '';

  // JSON-LD structured data for the share preview
  const jsonLd = useMemo(() => ({
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: trip.name,
    description: trip.description ?? undefined,
    image: trip.cover ?? undefined,
    touristType: trip.stops.length > 1 ? 'Multi-city itinerary' : 'City break',
    itinerary: trip.stops.map((s, i) => ({
      '@type': 'Place',
      name: `${s.city}${s.country ? `, ${s.country}` : ''}`,
      position: i + 1,
    })),
  }), [trip]);

  const copyTrip = () => {
    if (!user) { toast.info('Log in to copy trips'); navigate('/login'); return; }
    const copy = newTrip(user.email, {
      name: `${trip.name} (copy)`,
      description: trip.description,
      startDate: trip.startDate,
      endDate: trip.endDate,
      cover: trip.cover,
    });
    copy.stops = JSON.parse(JSON.stringify(trip.stops));
    upsertTrip(copy);
    toast.success('Trip copied to your account');
    navigate(`/app/trips/${copy.id}`);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && (navigator as Navigator & { share?: (data: ShareData) => Promise<void> }).share) {
      try {
        await (navigator as Navigator & { share: (data: ShareData) => Promise<void> }).share({
          title: trip.name,
          text: trip.description ?? `Check out my ${days}-day itinerary`,
          url,
        });
      } catch {/* user cancelled */}
    } else {
      copyLink();
    }
  };

  const tweet = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${trip.name} — ${days}d itinerary`)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="min-h-screen bg-background">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-gradient">Traveloop</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={nativeShare}>
              <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Share</span>
            </Button>
            <Button asChild size="sm" variant={user ? 'soft' : 'premium'}>
              <Link to={user ? '/app' : '/signup'}>
                {user ? 'My trips' : 'Plan your own'} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {trip.cover && (
          <div
            aria-hidden
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${trip.cover})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-hero opacity-90" />
        <div className="relative container py-14 md:py-20 text-primary-foreground">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <Badge variant="glass" className="!bg-white/15 !text-primary-foreground border-white/20">
              <Globe className="h-3 w-3" /> Shared itinerary
            </Badge>
            <Badge variant="glass" className="!bg-white/15 !text-primary-foreground border-white/20">
              <Sparkles className="h-3 w-3" /> Public link
            </Badge>
          </div>
          <Display gradient={false} className="mt-3 !text-primary-foreground text-balance">
            {trip.name}
          </Display>
          {trip.description && (
            <Lead className="mt-3 max-w-2xl !text-primary-foreground/90">{trip.description}</Lead>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4 text-sm/6 text-primary-foreground/90">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {new Date(trip.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              {' → '}
              {new Date(trip.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="opacity-50">·</span>
            <span>{days} day{days > 1 ? 's' : ''}</span>
            <span className="opacity-50">·</span>
            <span>{trip.stops.length} stop{trip.stops.length === 1 ? '' : 's'}</span>
            <span className="opacity-50">·</span>
            <span className="tabular-nums">Est. {formatMoney(cost.total, currency)}</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button variant="glass" onClick={copyTrip} className="!bg-white !text-foreground hover:!bg-white/90">
              <Copy className="h-4 w-4" /> Copy this trip
            </Button>
            <Button variant="glass" onClick={copyLink} className="!bg-white/15 !text-primary-foreground border-white/20 hover:!bg-white/25">
              <LinkIcon className="h-4 w-4" /> Copy link
            </Button>
            <Button variant="glass" asChild className="!bg-white/15 !text-primary-foreground border-white/20 hover:!bg-white/25">
              <a href={tweet} target="_blank" rel="noreferrer" aria-label="Share on Twitter">
                <Twitter className="h-4 w-4" />
              </a>
            </Button>
            <Button variant="glass" asChild className="!bg-white/15 !text-primary-foreground border-white/20 hover:!bg-white/25">
              <a href={fb} target="_blank" rel="noreferrer" aria-label="Share on Facebook">
                <Facebook className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="container -mt-10 relative z-10">
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            { icon: Calendar, label: 'Length', value: `${days} day${days > 1 ? 's' : ''}` },
            { icon: MapPin, label: 'Stops', value: trip.stops.length.toString() },
            { icon: Compass, label: 'Activities', value: trip.stops.reduce((a, s) => a + s.activities.length, 0).toString() },
            { icon: Wallet, label: 'Estimated', value: formatMoney(cost.total, currency), accent: true },
          ].map((k, i) => (
            <Card
              key={k.label}
              variant={k.accent ? 'premium' : 'default'}
              className={`p-4 animate-fade-up ${k.accent ? 'bg-foreground !text-background border-transparent' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className={`flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${k.accent ? 'opacity-70' : 'text-muted-foreground'}`}>
                <k.icon className="h-3 w-3" /> {k.label}
              </div>
              <div className="mt-1.5 font-display text-2xl font-extrabold tabular-nums leading-none">{k.value}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* MAP */}
      {trip.stops.length > 0 && (
        <section className="container mt-10">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <Eyebrow>Route</Eyebrow>
              <Heading level={2} className="!text-2xl">The journey</Heading>
            </div>
            <Muted className="text-xs hidden sm:block">{trip.stops.length} plotted stop{trip.stops.length === 1 ? '' : 's'}</Muted>
          </div>
          <Card variant="premium" className="overflow-hidden p-0">
            <RouteMap stops={trip.stops} />
          </Card>
        </section>
      )}

      {/* STOPS */}
      <section className="container mt-12 pb-16">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <Eyebrow>Itinerary</Eyebrow>
            <Heading level={2} className="!text-2xl">Stop by stop</Heading>
          </div>
        </div>

        <ol className="relative space-y-8 before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-primary/40 before:via-border before:to-transparent">
          {trip.stops.map((s, i) => {
            const sd = stopDays(s);
            const stopTotal =
              (s.costs.transport || 0) +
              (s.costs.stay || 0) * Math.max(0, sd - 1) +
              (s.costs.meals || 0) * sd +
              s.activities.reduce((a, b) => a + b.cost, 0);
            return (
              <li key={s.id} className="relative pl-12 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <span className="absolute left-0 top-1 grid h-8 w-8 place-items-center rounded-full bg-gradient-hero font-display text-sm font-bold text-primary-foreground shadow-elegant ring-4 ring-background">
                  {i + 1}
                </span>
                <Card variant="premium" className="overflow-hidden">
                  <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 bg-gradient-aurora px-6 py-4">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Stop {i + 1} · {sd} day{sd > 1 ? 's' : ''}
                      </div>
                      <Heading level={3} className="!text-xl flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {s.city}{s.country ? <span className="font-normal text-muted-foreground text-base">, {s.country}</span> : null}
                      </Heading>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-xs">
                      <span className="text-muted-foreground tabular-nums">
                        {new Date(s.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' → '}
                        {new Date(s.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      {stopTotal > 0 && (
                        <Badge variant="soft" size="sm" className="tabular-nums">
                          <Wallet className="h-3 w-3" /> {formatMoney(stopTotal, currency)}
                        </Badge>
                      )}
                    </div>
                  </header>

                  <div className="p-6 space-y-4">
                    {s.notes && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/40 pl-3">{s.notes}</p>
                    )}

                    {/* Weather */}
                    {s.city && <WeatherForecast city={s.city} startDate={s.startDate} endDate={s.endDate} />}

                    {/* Activities */}
                    {s.activities.length > 0 && (
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Eyebrow>Activities</Eyebrow>
                          <Muted className="text-xs">{s.activities.length} planned</Muted>
                        </div>
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {s.activities.map(a => (
                            <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 transition-smooth hover:shadow-soft">
                              <div className="min-w-0">
                                <div className="font-medium truncate">{a.name}</div>
                                <div className="text-xs text-muted-foreground capitalize">
                                  {a.category} · {a.durationHours}h{a.time ? ` · ${a.time}` : ''}
                                </div>
                              </div>
                              <div className="font-semibold text-primary tabular-nums whitespace-nowrap">
                                {formatMoney(a.cost, currency)}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>

        {/* CTA footer */}
        <Card variant="aurora" className="mt-12 overflow-hidden p-8 text-center">
          <Eyebrow>Inspired?</Eyebrow>
          <Heading level={2} className="mt-1 !text-2xl">Plan a trip just like this one</Heading>
          <Muted className="mt-2 mx-auto max-w-md">
            Copy this itinerary into your own account to customize, or start fresh with the AI trip planner.
          </Muted>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="premium" onClick={copyTrip}>
              <Copy className="h-4 w-4" /> Copy this trip
            </Button>
            <Button variant="outline" asChild>
              <Link to={user ? '/app' : '/signup'}>
                <ExternalLink className="h-4 w-4" /> {user ? 'Go to my trips' : 'Plan from scratch'}
              </Link>
            </Button>
          </div>
          <Muted className="mt-6 inline-flex items-center gap-1.5 text-xs">
            <Users className="h-3 w-3" /> Shared via Traveloop
          </Muted>
        </Card>
      </section>
    </div>
  );
}
