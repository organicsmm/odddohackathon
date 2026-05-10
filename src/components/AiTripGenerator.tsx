import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Wand2, MapPin, Wallet, Calendar, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { newTrip, upsertTrip, uid } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Trip } from '@/lib/types';

const STYLES = [
  { id: 'adventure', label: 'Adventure', emoji: '🏔️' },
  { id: 'relaxation', label: 'Relaxation', emoji: '🏖️' },
  { id: 'culture', label: 'Culture', emoji: '🏛️' },
  { id: 'food', label: 'Foodie', emoji: '🍜' },
  { id: 'romantic', label: 'Romantic', emoji: '💕' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'backpack', label: 'Backpacking', emoji: '🎒' },
  { id: 'luxury', label: 'Luxury', emoji: '✨' },
];

const QUICK_DEST = ['Italy', 'Japan', 'Thailand', 'Morocco', 'Iceland', 'Peru', 'Greece', 'Vietnam'];

export default function AiTripGenerator({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState<number>(2500);
  const [days, setDays] = useState<number>(7);
  const [travelers, setTravelers] = useState<number>(2);
  const [style, setStyle] = useState<string>('culture');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generate = async () => {
    if (!user) { toast.error('Please log in first'); return; }
    if (!destination.trim()) { toast.error('Pick a destination first'); return; }
    setBusy(true);
    try {
      const prompt = `Plan a ${days}-day ${style} trip to ${destination} for ${travelers} traveler(s) with a total budget of $${budget} USD. Build a multi-city itinerary that hits the best highlights, balances pacing, and stays within budget.${extra.trim() ? ` Extra notes: ${extra.trim()}` : ''}`;
      const { data, error } = await supabase.functions.invoke('generate-trip', { body: { prompt } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const ai = data.trip;
      const trip: Trip = newTrip(user.email, {
        name: ai.name,
        description: ai.description,
        startDate: ai.startDate,
        endDate: ai.endDate,
        budget: ai.budget ?? budget,
      });
      trip.stops = (ai.stops || []).map((s: { city: string; country: string; startDate: string; endDate: string; costs?: { transport?: number; stay?: number; meals?: number }; activities?: { name: string; category: string; cost: number; durationHours: number; time?: string }[] }) => ({
        id: uid(),
        city: s.city,
        country: s.country,
        startDate: s.startDate,
        endDate: s.endDate,
        costs: { transport: s.costs?.transport ?? 100, stay: s.costs?.stay ?? 80, meals: s.costs?.meals ?? 30 },
        activities: (s.activities || []).map((a) => ({
          id: uid(),
          name: a.name,
          category: (a.category as 'sightseeing' | 'food' | 'adventure' | 'culture' | 'nightlife' | 'shopping' | 'nature') || 'sightseeing',
          cost: Number(a.cost) || 0,
          durationHours: Number(a.durationHours) || 2,
          time: a.time,
        })),
      }));
      upsertTrip(trip);
      toast.success('✨ Your AI trip is ready!');
      setOpen(false);
      navigate(`/app/trips/${trip.id}`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to generate');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" size="lg">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Wand2 className="h-5 w-5 text-primary-foreground" />
            </span>
            AI Trip Generator
          </DialogTitle>
          <DialogDescription>
            Tell us your destination and budget — Lovable AI crafts a complete multi-city itinerary in seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Destination */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary" /> Destination
            </Label>
            <Input
              value={destination}
              onChange={e => setDestination(e.target.value)}
              placeholder="e.g. Italy, Tokyo + Kyoto, Southeast Asia..."
              disabled={busy}
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_DEST.map(d => (
                <button
                  key={d}
                  type="button"
                  disabled={busy}
                  onClick={() => setDestination(d)}
                  className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary/10 hover:text-primary transition-smooth disabled:opacity-50"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Wallet className="h-4 w-4 text-primary" /> Total budget (USD)
              </Label>
              <span className="font-display text-lg font-bold text-primary">${budget.toLocaleString()}</span>
            </div>
            <Slider
              value={[budget]}
              onValueChange={v => setBudget(v[0])}
              min={500}
              max={15000}
              step={250}
              disabled={busy}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>$500 budget</span>
              <span>$15k luxury</span>
            </div>
          </div>

          {/* Days + Travelers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Calendar className="h-4 w-4 text-primary" /> Days
              </Label>
              <Input
                type="number"
                min={2}
                max={30}
                value={days}
                onChange={e => setDays(Math.max(2, Math.min(30, Number(e.target.value) || 7)))}
                disabled={busy}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4 text-primary" /> Travelers
              </Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={travelers}
                onChange={e => setTravelers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                disabled={busy}
              />
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Trip style</Label>
            <div className="grid grid-cols-4 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setStyle(s.id)}
                  className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs transition-smooth disabled:opacity-50 ${
                    style === s.id
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border hover:border-primary/40 hover:bg-muted'
                  }`}
                >
                  <span className="text-xl">{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Extra notes */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Anything else? <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Textarea
              value={extra}
              onChange={e => setExtra(e.target.value)}
              placeholder="e.g. vegetarian food, avoid flights, must include diving..."
              rows={2}
              disabled={busy}
            />
          </div>

          <Button variant="hero" size="lg" className="w-full" onClick={generate} disabled={busy}>
            {busy ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Crafting your itinerary...</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate my trip</>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Powered by Lovable AI · Multi-city itineraries in seconds</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
