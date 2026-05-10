import { Link } from 'react-router-dom';
import {
  ArrowRight, Calendar, MapPin, Wallet, Share2, ListChecks, Users, Plane, Sparkles,
  Star, Globe, Compass, Wand2, ShieldCheck, ChevronRight,
} from 'lucide-react';
import ImageGallery from '@/components/ui/image-gallery';
import { HeroSlider } from '@/components/HeroSlider';
import { TravelMarquee } from '@/components/TravelMarquee';
import { Display, Eyebrow, Heading, Lead, Muted } from "@/components/ui/typography";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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

      {/* HERO — centered intro + cinematic travel marquee */}
      <section className="relative overflow-hidden">
        {/* aurora backdrop */}
        <div aria-hidden className="absolute inset-0 bg-gradient-aurora opacity-70" />
        <div aria-hidden className="absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/15 blur-[160px]" />

        <div className="relative z-10 container flex flex-col items-center justify-center text-center pt-20 pb-10 md:pt-28 md:pb-14">
          <div className="mx-auto max-w-4xl animate-fade-in">
            <Badge variant="glass" className="border-border/60 mx-auto">
              <Sparkles className="h-3 w-3 text-accent" /> New · AI Trip Generator
            </Badge>
            <h1 className="mt-6 font-display font-black tracking-tight text-balance text-5xl leading-[1.02] md:text-7xl lg:text-[5.5rem]">
              <span className="block">Plan trips you'll</span>
              <span className="block font-serif italic font-medium text-gradient">
                actually take
              </span>
            </h1>
            <Lead className="mt-6 mx-auto max-w-2xl text-lg md:text-xl">
              Cinematic itineraries, smart budgets and day-wise plans for hill stations, mountains and luxury escapes — built in seconds.
            </Lead>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl" variant="premium">
                <Link to={cta}>Start planning <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button asChild size="xl" variant="glass">
                <Link to={cta}>See a demo trip</Link>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1 text-warning">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-warning" />)}
                <span className="ml-1 font-semibold text-foreground">4.9</span>
                <span className="text-muted-foreground">/5 from 1.2k travelers</span>
              </div>
              <span className="hidden sm:inline opacity-30">·</span>
              <div className="inline-flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-success" /> No card required</div>
            </div>
          </div>
        </div>

        {/* Cinematic travel marquee — lower hero */}
        <div className="relative pb-16 md:pb-20">
          <TravelMarquee />
        </div>
      </section>

      {/* Marquee of destinations */}
      <section className="relative border-y border-border/60 bg-card/40 py-4 backdrop-blur-sm">
        <div className="container flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-muted-foreground">
          <span className="font-semibold uppercase tracking-[0.18em] text-[10px] text-foreground">Loved in</span>
          {cities.map(c => (
            <span key={c} className="inline-flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3 text-primary/70" />{c}
            </span>
          ))}
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
              <Heading level={3} className="!text-lg">{f.title}</Heading>
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
                <Heading level={3} className="mt-3 !text-lg">{s.title}</Heading>
                <Muted className="mt-1 text-sm">{s.desc}</Muted>
              </Card>
            ))}
          </ol>
        </div>
      </section>

      {/* DESTINATIONS PREVIEW — editorial / human */}
      <section id="destinations" className="container py-16 md:py-24">
        <div className="flex items-end justify-between flex-wrap gap-4 border-b border-border/60 pb-6">
          <div>
            <Eyebrow>Field notes · Vol. 01</Eyebrow>
            <Heading level={2} className="mt-2 !text-4xl md:!text-5xl tracking-tight">Places worth the long flight.</Heading>
            <Muted className="mt-2 max-w-xl">Hand-picked by travelers who actually went. Real photos, real prices, no stock-image gloss.</Muted>
          </div>
          <Button asChild variant="ghost"><Link to={cta}>The full index <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>

        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { city: 'Kyoto', country: 'Japan', tag: 'Cultural', kicker: 'Temples, tea & quiet alleys', days: 7, price: 1850, img: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?auto=format&fit=crop&w=1200&q=70' },
            { city: 'Lisbon', country: 'Portugal', tag: 'City break', kicker: 'Tiles, trams, pastéis de nata', days: 5, price: 1100, img: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=70' },
            { city: 'Reykjavík', country: 'Iceland', tag: 'Adventure', kicker: 'Aurora chases & black sand', days: 6, price: 2400, img: 'https://images.unsplash.com/photo-1504829857797-ddff29c27927?auto=format&fit=crop&w=1200&q=70' },
            { city: 'Bali', country: 'Indonesia', tag: 'Relax', kicker: 'Rice terraces, slow mornings', days: 8, price: 1500, img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=70' },
            { city: 'Cape Town', country: 'South Africa', tag: 'Wild', kicker: 'Table Mountain to wine country', days: 9, price: 2100, img: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=70' },
            { city: 'Queenstown', country: 'New Zealand', tag: 'Mountain', kicker: 'Lakeside lodges & alpine air', days: 7, price: 2600, img: 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?auto=format&fit=crop&w=1200&q=70' },
          ].map((d, i) => (
            <article
              key={d.city}
              className="group animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {/* Polaroid-ish photo */}
              <Link to={cta} className="block overflow-hidden rounded-sm bg-muted ring-1 ring-border/60 shadow-soft transition-spring group-hover:shadow-elegant group-hover:-translate-y-0.5">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={d.img}
                    alt={`${d.city}, ${d.country}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover transition-spring duration-700 group-hover:scale-[1.04]"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/0 to-black/10" />
                  {/* film grain hint */}
                  <div aria-hidden className="absolute inset-0 mix-blend-overlay opacity-20 [background-image:radial-gradient(rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:3px_3px]" />
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur">
                    <span className="h-1 w-1 rounded-full bg-primary" /> {d.tag}
                  </div>
                  <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] tabular-nums text-white backdrop-blur">
                    No. {String(i + 1).padStart(2, '0')} / 06
                  </div>
                </div>
              </Link>

              {/* Editorial caption */}
              <div className="mt-4 px-1">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{d.country}</span>
                  <span className="h-px flex-1 bg-border" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">{d.days} days</span>
                </div>
                <Heading level={3} className="mt-2 !text-2xl tracking-tight">
                  <Link to={cta} className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-no-repeat bg-left-bottom transition-[background-size] duration-500 hover:bg-[length:100%_1px]">
                    {d.city}
                  </Link>
                </Heading>
                <Muted className="mt-1 text-sm italic">"{d.kicker}."</Muted>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">From <span className="font-display text-base font-bold tabular-nums text-foreground">${d.price.toLocaleString()}</span> <span className="text-muted-foreground/80">/ person</span></span>
                  <Link to={cta} className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-smooth">
                    Read the route <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="container py-16">
        <Card variant="aurora" className="overflow-hidden p-10 md:p-14 text-center">
          <div className="mx-auto max-w-3xl">
            <Compass className="mx-auto h-8 w-8 text-primary" />
            <Lead as="p" className="mt-4 !text-2xl md:!text-3xl !font-bold leading-snug text-balance">
              "It's like a private travel concierge with the polish of a luxury magazine. We planned three trips in a weekend."
            </Lead>
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
