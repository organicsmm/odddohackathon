import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, MapPin, Wallet, Share2, ListChecks, Users, Plane } from 'lucide-react';
import heroImg from '@/assets/hero-travel.jpg';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const features = [
  { icon: MapPin, title: 'Multi-city itineraries', desc: 'Add stops, dates and reorder cities effortlessly.' },
  { icon: Calendar, title: 'Day-wise plans', desc: 'Visualize each day with activities and times.' },
  { icon: Wallet, title: 'Smart budgets', desc: 'Auto cost breakdown with charts and alerts.' },
  { icon: ListChecks, title: 'Packing checklist', desc: 'Never forget the essentials again.' },
  { icon: Share2, title: 'Public sharing', desc: 'Share read-only itineraries with friends.' },
  { icon: Users, title: 'Inspiration', desc: 'Discover trending cities and curated activities.' },
];

export default function Landing() {
  const { user } = useAuth();
  const cta = user ? '/app' : '/signup';
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
            <Plane className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="text-gradient">Traveloop</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <Button asChild variant="hero"><Link to="/app">Open app <ArrowRight className="h-4 w-4" /></Link></Button>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/login">Log in</Link></Button>
              <Button asChild variant="hero"><Link to="/signup">Get started</Link></Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container grid items-center gap-10 py-12 md:py-20 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" /> Now with AI Trip Generator
            </span>
            <h1 className="mt-4 font-display text-5xl font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
              Plan trips you'll <span className="text-gradient">actually take</span>.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Traveloop turns chaotic Google docs and group chats into beautiful, shareable itineraries — with smart budgets, day-wise plans and packing checklists baked in.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" variant="hero"><Link to={cta}>Start planning <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link to={cta}>See a demo trip</Link></Button>
            </div>
            <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
              <div><b className="text-foreground">30+</b> curated cities</div>
              <div><b className="text-foreground">18+</b> activity types</div>
              <div><b className="text-foreground">∞</b> trips, free</div>
            </div>
          </div>
          <div className="relative animate-scale-in">
            <div className="absolute -inset-6 rounded-[2rem] bg-gradient-hero opacity-30 blur-3xl" />
            <img
              src={heroImg}
              alt="Aerial coastal landscape with turquoise water"
              width={1600}
              height={900}
              className="relative w-full rounded-[2rem] object-cover shadow-elegant"
            />
            <div className="absolute -bottom-6 -left-6 hidden rounded-2xl bg-card p-4 shadow-elegant md:block animate-float">
              <div className="text-xs text-muted-foreground">Next stop</div>
              <div className="font-display font-bold">Santorini → Athens</div>
              <div className="mt-1 text-xs text-success">Budget: $1,420 ✓</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-display font-bold">Everything for the perfect trip</h2>
          <p className="mt-3 text-muted-foreground">From the first daydream to the last boarding pass.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(f => (
            <div key={f.title} className="group rounded-2xl border border-border/60 bg-gradient-card p-6 shadow-soft transition-smooth hover:-translate-y-1 hover:shadow-elegant">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-hero group-hover:text-primary-foreground transition-smooth">
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-24">
        <div className="rounded-3xl bg-gradient-hero p-10 text-center text-primary-foreground shadow-elegant md:p-16">
          <h2 className="text-4xl font-display font-bold">Your next adventure starts here</h2>
          <p className="mx-auto mt-3 max-w-xl opacity-90">Create unlimited itineraries, share with friends, and travel smarter.</p>
          <Button asChild size="lg" variant="secondary" className="mt-6"><Link to={cta}>Plan my trip <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Traveloop · Made with ❤️ for travelers
      </footer>
    </div>
  );
}
