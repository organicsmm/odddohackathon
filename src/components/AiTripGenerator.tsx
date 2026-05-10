import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { newTrip, upsertTrip, uid } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Trip } from '@/lib/types';

const PRESETS = [
  '7 day romantic getaway in Italy under $2500',
  '10 day backpacking trip across Southeast Asia',
  'Family-friendly 2 week adventure in Japan with kids',
  'Solo foodie tour of Spain in spring',
];

export default function AiTripGenerator({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const generate = async (text: string) => {
    if (!user) { toast.error('Please log in first'); return; }
    if (!text.trim()) { toast.error('Describe your dream trip'); return; }
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-trip', { body: { prompt: text } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const ai = data.trip;
      const trip: Trip = newTrip(user.email, {
        name: ai.name,
        description: ai.description,
        startDate: ai.startDate,
        endDate: ai.endDate,
        budget: ai.budget,
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow"><Wand2 className="h-5 w-5 text-primary-foreground" /></span>
            AI Trip Generator
          </DialogTitle>
          <DialogDescription>Describe your dream trip in plain English and Lovable AI will craft a complete itinerary.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder="e.g. 8 day cultural trip across Morocco for 2 people, mid budget"
            rows={4}
            disabled={busy}
          />
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <button key={p} disabled={busy} onClick={() => setPrompt(p)} className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary/10 hover:text-primary transition-smooth disabled:opacity-50">
                {p}
              </button>
            ))}
          </div>
          <Button variant="hero" size="lg" className="w-full" onClick={() => generate(prompt)} disabled={busy}>
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Crafting your itinerary...</> : <><Sparkles className="h-4 w-4" /> Generate trip</>}
          </Button>
          <p className="text-center text-xs text-muted-foreground">Powered by Lovable AI · Free during preview</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
