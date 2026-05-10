import { useParams, Link } from 'react-router-dom';
import { Calendar, MapPin, Plane, Copy, Twitter, Facebook } from 'lucide-react';
import { getTripByShare, tripCost, tripDays, stopDays, newTrip, upsertTrip } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SharedTrip() {
  const { shareId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const trip = getTripByShare(shareId!);

  if (!trip) {
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div>
          <h1 className="text-3xl font-display font-bold">Trip not found</h1>
          <p className="mt-2 text-muted-foreground">This itinerary may be private or no longer exists.</p>
          <Button asChild variant="hero" className="mt-6"><Link to="/">Go home</Link></Button>
        </div>
      </div>
    );
  }

  const cost = tripCost(trip);

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

  const url = window.location.href;

  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow"><Plane className="h-5 w-5 text-primary-foreground" /></span>
          <span className="text-gradient">Traveloop</span>
        </Link>
        <Button asChild variant="ghost"><Link to={user ? '/app' : '/signup'}>{user ? 'My trips' : 'Get started'}</Link></Button>
      </header>

      <section className="container py-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-elegant md:p-12">
          <div className="text-xs uppercase tracking-wider opacity-90">Shared itinerary</div>
          <h1 className="mt-2 font-display text-4xl font-extrabold md:text-6xl">{trip.name}</h1>
          {trip.description && <p className="mt-3 max-w-2xl opacity-90">{trip.description}</p>}
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm opacity-90">
            <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}</span>
            <span>·</span>
            <span>{tripDays(trip)} days</span>
            <span>·</span>
            <span>{trip.stops.length} stops</span>
            <span>·</span>
            <span>Est. ${cost.total.toLocaleString()}</span>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyTrip}><Copy className="h-4 w-4" /> Copy this trip</Button>
            <Button variant="outline" className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10" onClick={() => { navigator.clipboard.writeText(url); toast.success('Link copied'); }}>Copy link</Button>
            <Button variant="outline" asChild className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10">
              <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(trip.name)}`} target="_blank" rel="noreferrer"><Twitter className="h-4 w-4" /></a>
            </Button>
            <Button variant="outline" asChild className="bg-transparent border-white/40 text-primary-foreground hover:bg-white/10">
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer"><Facebook className="h-4 w-4" /></a>
            </Button>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          {trip.stops.map((s, i) => {
            const days = stopDays(s);
            return (
              <div key={s.id} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Stop {i + 1} · {days} day{days > 1 ? 's' : ''}</div>
                    <h3 className="font-display text-2xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" />{s.city}, <span className="text-muted-foreground font-normal text-lg">{s.country}</span></h3>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()}</div>
                </div>
                {s.activities.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {s.activities.map(a => (
                      <li key={a.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
                        <div>
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-muted-foreground">{a.category} · {a.durationHours}h{a.time ? ` · ${a.time}` : ''}</div>
                        </div>
                        <div className="font-medium text-primary">${a.cost}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
