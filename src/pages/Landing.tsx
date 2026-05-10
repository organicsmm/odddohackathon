import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, MapPin, Wallet, Share2, ListChecks, Users, Plane, Sparkles,
  Star, Globe, Compass, Wand2, ShieldCheck, ChevronRight,
} from 'lucide-react';
import heroImg from '@/assets/hero-travel.jpg';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Display, Heading, Lead, Eyebrow, Muted } from '@/components/ui/typography';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: MapPin, title: 'Multi-city itineraries', desc: 'Add stops, dates and reorder cities effortlessly with smart routing.' },
  { icon: Calendar, title: 'Day-wise plans', desc: 'Visualize each day with activities, weather and times in one elegant view.' },
  { icon: Wallet, title: 'Smart budgets', desc: 'Auto cost breakdown with refined charts, alerts and per-category goals.' },
  { icon: ListChecks, title: 'Packing checklist', desc: 'Curated by trip type — never forget the essentials again.' },
  { icon: Share2, title: 'Cinematic sharing', desc: 'Read-only public links unfurl into a beautiful preview page.' },
  { icon: Wand2, title: 'AI trip generator', desc: 'Describe the vibe, get a fully-built itinerary in seconds.' },
];

const cities = ['Tokyo', 'Lisbon', 'Bali', 'Reykjavík', 'Cape Town', 'Kyoto', 'Marrakech', 'Mexico City', 'Queenstown', 'Santorini'];

const steps = [
  { n: '01', title: 'Dream', desc: 'Tell us where, when and the vibe.' },
  { n: '02', title: 'Build', desc: 'AI drafts a beautiful day-by-day itinerary.' },
  { n: '03', title: 'Tune', desc: 'Drag, drop and refine with weather + budget.' },
  { n: '04', title: 'Share', desc: 'Send a polished public link to friends.' },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/app' : '/signup';
  return (
    <div className="min-h-screen bg-background">
      {/* Sticky luxury nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-gradient">Traveloop</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 shadow-ring backdrop-blur">
            <a href="#features" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth">Features</a>
            <a href="#how" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth">How it works</a>
            <a href="#destinations" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth">Destinations</a>
            <a href="#pricing" className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-smooth">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild variant="premium" size="sm">
                <Link to="/app">Open app <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/login">Log in</Link></Button>
                <Button asChild variant="premium" size="sm"><Link to="/signup">Get started</Link></Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* aurora backdrop */}
        <div aria-hidden className="absolute inset-0 bg-gradient-aurora" />
        <div aria-hidden className="absolute -top-40 -left-20 h-[480px] w-[480px] rounded-full bg-primary/20 blur-[140px]" />
        <div aria-hidden className="absolute -bottom-40 -right-20 h-[520px] w-[520px] rounded-full bg-accent/20 blur-[160px]" />

        <div className="relative container grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-in">
            <Badge variant="glass" className="border-border/60">
              <Sparkles className="h-3 w-3 text-accent" /> New · AI Trip Generator
            </Badge>
            <Display gradient={false} className="mt-5 text-balance">
              Plan trips you'll <span className="text-gradient">actually take</span>.
            </Display>
            <Lead className="mt-5 max-w-xl">
              Traveloop turns chaotic Google docs and group chats into beautiful, shareable itineraries — with smart budgets, day-wise plans and packing checklists, baked in.
            </Lead>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="xl" variant="premium">
                <Link to={cta}>Start planning <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link to={cta}>See a demo trip</Link>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning" />)}
                <span className="ml-1 font-semibold text-foreground">4.9</span>
                <span className="text-muted-foreground">/5 from 1.2k travelers</span>
              </div>
              <span className="hidden sm:inline opacity-30">·</span>
              <div className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> No card required</div>
            </div>
          </div>

          {/* Hero image card */}
          <div className="relative animate-scale-in">
            <div aria-hidden className="absolute -inset-8 rounded-[2.5rem] bg-gradient-hero opacity-30 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] surface-premium">
              <img
                src={heroImg}
                alt="Aerial coastal landscape with turquoise water"
                width={1600}
                height={900}
                className="aspect-[5/4] w-full object-cover"
                loading="eager"
              />
              {/* Floating glass cards */}
              <div className="absolute left-4 top-4 glass rounded-xl px-3 py-2 text-xs font-medium shadow-soft animate-float">
                <div className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5 text-primary" /> 7-day Greek Isles</div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden md:block animate-float" style={{ animationDelay: '0.6s' }}>
                <Card variant="glass" className="p-3 min-w-[200px]">
                  <Eyebrow>Next stop</Eyebrow>
                  <div className="mt-1 font-display font-bold leading-tight">Santorini → Athens</div>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs text-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" /> Budget on track · $1,420
                  </div>
                </Card>
              </div>
              <div className="absolute -top-4 -right-4 hidden md:block animate-float" style={{ animationDelay: '1.2s' }}>
                <Card variant="glass" className="p-3 min-w-[180px]">
                  <Eyebrow>Weather</Eyebrow>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-display text-2xl font-bold tabular-nums">26°</span>
                    <div className="text-xs text-muted-foreground">Sunny<br />8% rain</div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Marquee of destinations */}
        <div className="relative border-y border-border/60 bg-card/40 py-4 backdrop-blur-sm">
          <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
            <span className="font-semibold uppercase tracking-[0.18em] text-[10px] text-foreground">Loved in</span>
            {cities.map(c => (
              <span key={c} className="inline-flex items-center gap-1 font-medium">
                <MapPin className="h-3 w-3 text-primary/70" />{c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container py-16">
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { v: '50k+', l: 'Trips planned' },
            { v: '180+', l: 'Cities covered' },
            { v: '4.9★', l: 'Avg rating' },
            { v: '∞', l: 'Free forever' },
          ].map((s, i) => (
            <Card key={s.l} variant="premium" className="p-6 text-center animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="font-display text-4xl font-extrabold tabular-nums text-gradient">{s.v}</div>
              <Muted className="mt-1 text-xs uppercase tracking-[0.16em]">{s.l}</Muted>
            </Card>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Everything you need</Eyebrow>
          <Heading level={2} className="mt-2 !text-4xl">Crafted for the perfect trip</Heading>
          <Lead className="mt-3">From the first daydream to the last boarding pass — designed like a luxury travel magazine.</Lead>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Card
              key={f.title}
              variant="premium"
              className="group p-6 transition-spring hover:-translate-y-1 hover:shadow-elegant animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-gradient-hero group-hover:text-primary-foreground group-hover:shadow-glow transition-spring">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{f.title}</h3>
              <Muted className="mt-1 text-sm">{f.desc}</Muted>
              <div className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-smooth">
                Learn more <ChevronRight className="h-3 w-3" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative overflow-hidden py-16 md:py-24">
        <div aria-hidden className="absolute inset-0 bg-gradient-aurora opacity-60" />
        <div className="relative container">
          <div className="mx-auto max-w-2xl text-center">
            <Eyebrow>How it works</Eyebrow>
            <Heading level={2} className="mt-2 !text-4xl">From idea to itinerary in minutes</Heading>
          </div>
          <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <Card key={s.n} variant="glass" className="p-6 animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="font-display text-5xl font-extrabold text-gradient leading-none">{s.n}</div>
                <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
                <Muted className="mt-1 text-sm">{s.desc}</Muted>
              </Card>
            ))}
          </ol>
        </div>
      </section>

      {/* DESTINATIONS PREVIEW */}
      <section id="destinations" className="container py-16 md:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <Eyebrow>Inspiration</Eyebrow>
            <Heading level={2} className="mt-2 !text-4xl">Trending destinations</Heading>
          </div>
          <Button asChild variant="ghost"><Link to={cta}>Explore all <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { city: 'Kyoto', country: 'Japan', tag: 'Cultural', tone: 'from-rose-400 to-orange-400' },
            { city: 'Lisbon', country: 'Portugal', tag: 'City break', tone: 'from-amber-300 to-pink-400' },
            { city: 'Reykjavík', country: 'Iceland', tag: 'Adventure', tone: 'from-sky-400 to-indigo-500' },
            { city: 'Bali', country: 'Indonesia', tag: 'Relax', tone: 'from-emerald-400 to-teal-500' },
            { city: 'Cape Town', country: 'South Africa', tag: 'Wild', tone: 'from-orange-400 to-red-500' },
            { city: 'Queenstown', country: 'New Zealand', tag: 'Mountain', tone: 'from-cyan-400 to-blue-600' },
          ].map((d, i) => (
            <Card key={d.city} variant="premium" className="group overflow-hidden p-0 transition-spring hover:-translate-y-1 hover:shadow-elegant animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`relative aspect-[16/10] bg-gradient-to-br ${d.tone}`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.3),transparent_60%)]" />
                <div className="absolute left-4 top-4">
                  <Badge variant="glass" className="!bg-white/25 !text-white border-white/30">{d.tag}</Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="font-display text-2xl font-extrabold drop-shadow">{d.city}</div>
                  <div className="text-xs opacity-90">{d.country}</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4">
                <Muted className="text-xs">7-day itinerary from $1,200</Muted>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-spring group-hover:translate-x-1 group-hover:text-primary" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="container py-16">
        <Card variant="aurora" className="overflow-hidden p-10 md:p-14 text-center">
          <div className="mx-auto max-w-3xl">
            <Compass className="mx-auto h-8 w-8 text-primary" />
            <p className="mt-4 font-display text-2xl md:text-3xl font-bold leading-snug text-balance">
              "It's like a private travel concierge with the polish of a luxury magazine. We planned three trips in a weekend."
            </p>
            <div className="mt-6 inline-flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-hero text-primary-foreground font-bold">A</span>
              <div className="text-left">
                <div className="font-semibold">Aanya M.</div>
                <Muted className="text-xs">Wedding planner · 5 trips</Muted>
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* PRICING TEASER */}
      <section id="pricing" className="container py-16">
        <div className="mx-auto max-w-2xl text-center">
          <Eyebrow>Pricing</Eyebrow>
          <Heading level={2} className="mt-2 !text-4xl">Free, forever</Heading>
          <Lead className="mt-3">No credit card. No paywalls. Premium-grade planning for everyone.</Lead>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <Card variant="premium" className="p-8">
            <Eyebrow>Traveler</Eyebrow>
            <div className="mt-2 font-display text-5xl font-extrabold">$0</div>
            <Muted className="mt-1">Everything you need to plan unlimited trips.</Muted>
            <ul className="mt-6 space-y-2 text-sm">
              {['Unlimited trips & stops', 'AI trip generator', 'Smart budgets & charts', 'Public share preview', 'Friends & invites'].map(x => (
                <li key={x} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-success/15 text-success">✓</span>{x}</li>
              ))}
            </ul>
            <Button asChild variant="premium" size="lg" className="mt-7 w-full"><Link to={cta}>Start planning</Link></Button>
          </Card>
          <Card variant="aurora" className="relative overflow-hidden p-8">
            <Badge variant="gradient" className="absolute right-4 top-4">Coming soon</Badge>
            <Eyebrow>Concierge</Eyebrow>
            <div className="mt-2 font-display text-5xl font-extrabold text-gradient">Atelier</div>
            <Muted className="mt-1">White-glove planning for unforgettable journeys.</Muted>
            <ul className="mt-6 space-y-2 text-sm">
              {['Hand-curated itineraries', 'Private guides & reservations', 'Real-time travel concierge', 'Luxury hotel partnerships', 'Priority support 24/7'].map(x => (
                <li key={x} className="flex items-center gap-2"><span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-primary">★</span>{x}</li>
              ))}
            </ul>
            <Button variant="glass" size="lg" className="mt-7 w-full" disabled>Join waitlist</Button>
          </Card>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-hero p-10 text-primary-foreground shadow-elegant md:p-16">
          <div aria-hidden className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div aria-hidden className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="relative text-center">
            <Eyebrow className="!text-primary-foreground/80">Ready when you are</Eyebrow>
            <Display gradient={false} className="mt-3 !text-primary-foreground">Your next adventure starts here</Display>
            <Lead className="mx-auto mt-3 max-w-xl !text-primary-foreground/90">Create unlimited itineraries, share with friends, and travel smarter.</Lead>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl" variant="glass" className="!bg-white !text-foreground hover:!bg-white/90">
                <Link to={cta}>Plan my trip <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="xl" variant="glass" className="!bg-white/15 !text-primary-foreground border-white/20 hover:!bg-white/25">
                <Link to={cta}>See it in action</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="container flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 font-display font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-hero">
              <Plane className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="text-gradient">Traveloop</span>
          </div>
          <Muted className="text-sm">© {new Date().getFullYear()} Traveloop · Made with ❤️ for travelers</Muted>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Users className="h-4 w-4" /> Loved by 50k+ travelers worldwide
          </div>
        </div>
      </footer>
    </div>
  );
}
