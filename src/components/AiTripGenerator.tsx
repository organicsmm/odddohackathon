import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Loader2, Wand2, MapPin, Wallet, Calendar, Users, Plus, Trash2, ChevronLeft,
  AlertCircle, CheckCircle2, Clock,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { newTrip, upsertTrip, uid, tripDays as computeTripDays, stopDays } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Trip, Stop, Activity } from '@/lib/types';
import {
  coerceAiTrip, validateDraft, ACTIVITY_CATEGORIES,
  type TripDraft, type FieldErrors, type ActivityCategory,
} from '@/lib/tripValidation';

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

type Step = 'form' | 'review';

export default function AiTripGenerator({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [destination, setDestination] = useState('');
  const [budget, setBudget] = useState<number>(2500);
  const [days, setDays] = useState<number>(7);
  const [travelers, setTravelers] = useState<number>(2);
  const [style, setStyle] = useState<string>('culture');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<TripDraft | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { user } = useAuth();
  const navigate = useNavigate();

  const reset = () => {
    setStep('form'); setDraft(null); setErrors({});
  };
  const close = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  const generate = async () => {
    if (!user) { toast.error('Please log in first'); return; }
    if (!destination.trim()) { toast.error('Pick a destination first'); return; }
    setBusy(true);
    try {
      const prompt = `Plan a ${days}-day ${style} trip to ${destination} for ${travelers} traveler(s) with a total budget of $${budget} USD. Build a multi-city itinerary that hits the best highlights, balances pacing, and stays within budget.${extra.trim() ? ` Extra notes: ${extra.trim()}` : ''}`;
      const { data, error } = await supabase.functions.invoke('generate-trip', { body: { prompt } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const safe = coerceAiTrip(data.trip || {}, uid, budget);
      setDraft(safe);
      const v = validateDraft(safe);
      setErrors(v.ok ? {} : v.errors);
      setStep('review');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to generate');
    } finally {
      setBusy(false);
    }
  };

  const save = () => {
    if (!user || !draft) return;
    const v = validateDraft(draft);
    if (!v.ok) {
      setErrors(v.errors);
      toast.error('Please fix the highlighted fields before saving');
      return;
    }
    const trip: Trip = newTrip(user.email, {
      name: draft.name,
      description: draft.description,
      startDate: draft.startDate,
      endDate: draft.endDate,
      budget: draft.budget,
    });
    trip.stops = draft.stops.map(s => ({
      ...s,
      activities: s.activities.map(a => ({ ...a, time: a.time || undefined })),
    }));
    upsertTrip(trip);
    toast.success('✨ Trip saved!');
    close(false);
    navigate(`/app/trips/${trip.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="hero" size="lg">
            <Sparkles className="h-4 w-4" /> Generate with AI
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Wand2 className="h-5 w-5 text-primary-foreground" />
            </span>
            {step === 'form' ? 'AI Trip Generator' : 'Review & edit your trip'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Tell us your destination and budget — Lovable AI crafts a complete multi-city itinerary in seconds.'
              : 'Tweak stops, activities and costs, then save when it looks right.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' ? (
          <FormStep
            {...{ destination, setDestination, budget, setBudget, days, setDays, travelers, setTravelers, style, setStyle, extra, setExtra, busy, generate }}
          />
        ) : draft ? (
          <ReviewStep
            draft={draft}
            errors={errors}
            onChange={(d) => { setDraft(d); const v = validateDraft(d); setErrors(v.ok ? {} : v.errors); }}
            onBack={() => setStep('form')}
            onSave={save}
            onRegenerate={() => { setStep('form'); }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- FORM STEP ------------------------------- */

function FormStep(props: {
  destination: string; setDestination: (v: string) => void;
  budget: number; setBudget: (v: number) => void;
  days: number; setDays: (v: number) => void;
  travelers: number; setTravelers: (v: number) => void;
  style: string; setStyle: (v: string) => void;
  extra: string; setExtra: (v: string) => void;
  busy: boolean; generate: () => void;
}) {
  const { destination, setDestination, budget, setBudget, days, setDays, travelers, setTravelers, style, setStyle, extra, setExtra, busy, generate } = props;
  return (
    <div className="space-y-5 pt-2">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-semibold"><MapPin className="h-4 w-4 text-primary" /> Destination</Label>
        <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="e.g. Italy, Tokyo + Kyoto..." disabled={busy} maxLength={120} />
        <div className="flex flex-wrap gap-1.5">
          {QUICK_DEST.map(d => (
            <button key={d} type="button" disabled={busy} onClick={() => setDestination(d)}
              className="rounded-full bg-muted px-3 py-1 text-xs hover:bg-primary/10 hover:text-primary transition-smooth disabled:opacity-50">
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 text-sm font-semibold"><Wallet className="h-4 w-4 text-primary" /> Total budget (USD)</Label>
          <span className="font-display text-lg font-bold text-primary">${budget.toLocaleString()}</span>
        </div>
        <Slider value={[budget]} onValueChange={v => setBudget(v[0])} min={500} max={15000} step={250} disabled={busy} />
        <div className="flex justify-between text-xs text-muted-foreground"><span>$500 budget</span><span>$15k luxury</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold"><Calendar className="h-4 w-4 text-primary" /> Days</Label>
          <Input type="number" min={2} max={30} value={days} onChange={e => setDays(Math.max(2, Math.min(30, Number(e.target.value) || 7)))} disabled={busy} />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Travelers</Label>
          <Input type="number" min={1} max={20} value={travelers} onChange={e => setTravelers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))} disabled={busy} />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Trip style</Label>
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map(s => (
            <button key={s.id} type="button" disabled={busy} onClick={() => setStyle(s.id)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-2 text-xs transition-smooth disabled:opacity-50 ${
                style === s.id ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border hover:border-primary/40 hover:bg-muted'
              }`}>
              <span className="text-xl">{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Anything else? <span className="text-muted-foreground font-normal">(optional)</span></Label>
        <Textarea value={extra} onChange={e => setExtra(e.target.value.slice(0, 500))} placeholder="e.g. vegetarian food, avoid flights..." rows={2} disabled={busy} maxLength={500} />
      </div>

      <Button variant="hero" size="lg" className="w-full" onClick={generate} disabled={busy}>
        {busy
          ? <><Loader2 className="h-4 w-4 animate-spin" /> Crafting your itinerary...</>
          : <><Sparkles className="h-4 w-4" /> Generate & review</>}
      </Button>
      <p className="text-center text-xs text-muted-foreground">You'll be able to review and edit everything before saving.</p>
    </div>
  );
}

/* ------------------------------ REVIEW STEP ------------------------------ */

function ReviewStep({
  draft, errors, onChange, onBack, onSave, onRegenerate,
}: {
  draft: TripDraft;
  errors: FieldErrors;
  onChange: (d: TripDraft) => void;
  onBack: () => void;
  onSave: () => void;
  onRegenerate: () => void;
}) {
  const errCount = Object.keys(errors).length;
  const totalCost = useMemo(() => {
    let total = 0;
    draft.stops.forEach(s => {
      const days = stopDays(s);
      total += (s.costs.stay || 0) * Math.max(0, days - 1);
      total += (s.costs.meals || 0) * days;
      total += s.costs.transport || 0;
      s.activities.forEach(a => total += a.cost);
    });
    return total;
  }, [draft]);

  const setStop = (idx: number, patch: Partial<Stop>) => {
    const stops = draft.stops.slice();
    stops[idx] = { ...stops[idx], ...patch };
    onChange({ ...draft, stops });
  };
  const removeStop = (idx: number) => {
    onChange({ ...draft, stops: draft.stops.filter((_, i) => i !== idx) });
  };
  const addStop = () => {
    const last = draft.stops[draft.stops.length - 1];
    const start = last ? last.endDate : draft.startDate;
    onChange({
      ...draft,
      stops: [...draft.stops, {
        id: uid(), city: '', country: '',
        startDate: start, endDate: start,
        activities: [], costs: { transport: 100, stay: 80, meals: 30 },
      }],
    });
  };

  return (
    <div className="space-y-5 pt-2">
      {/* Trip header */}
      <Card className="p-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Trip name" error={errors['name']}>
            <Input value={draft.name} maxLength={100} onChange={e => onChange({ ...draft, name: e.target.value })} />
          </Field>
          <Field label="Budget (USD)" error={errors['budget']}>
            <Input type="number" min={0} max={1_000_000} value={draft.budget ?? 0}
              onChange={e => onChange({ ...draft, budget: Math.max(0, Number(e.target.value) || 0) })} />
          </Field>
          <Field label="Start date" error={errors['startDate']}>
            <Input type="date" value={draft.startDate} onChange={e => onChange({ ...draft, startDate: e.target.value })} />
          </Field>
          <Field label="End date" error={errors['endDate']}>
            <Input type="date" value={draft.endDate} onChange={e => onChange({ ...draft, endDate: e.target.value })} />
          </Field>
        </div>
        <Field label="Description" error={errors['description']}>
          <Textarea rows={2} maxLength={500} value={draft.description || ''} onChange={e => onChange({ ...draft, description: e.target.value })} />
        </Field>
      </Card>

      {errors['stops'] && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 mt-0.5" /> {errors['stops']}
        </div>
      )}

      {/* Stops */}
      <div className="space-y-3">
        {draft.stops.map((s, i) => (
          <StopEditor
            key={s.id}
            index={i}
            stop={s}
            errors={errors}
            onChange={(patch) => setStop(i, patch)}
            onRemove={() => removeStop(i)}
          />
        ))}
        <Button variant="outline" className="w-full" onClick={addStop}><Plus className="h-4 w-4" /> Add stop</Button>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-border bg-background/95 px-6 py-4 backdrop-blur">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="flex items-center gap-2">
            {errCount === 0 ? (
              <><CheckCircle2 className="h-4 w-4 text-primary" /><span className="text-muted-foreground">Looks good — ready to save</span></>
            ) : (
              <><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-destructive">{errCount} issue{errCount > 1 ? 's' : ''} to fix</span></>
            )}
          </div>
          <div className="text-muted-foreground">
            {computeTripDays(draft as unknown as Trip)} days · {draft.stops.length} stops · Est. <span className="font-semibold text-foreground">${Math.round(totalCost).toLocaleString()}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onBack}><ChevronLeft className="h-4 w-4" /> Back</Button>
          <Button variant="outline" onClick={onRegenerate}><Sparkles className="h-4 w-4" /> Regenerate</Button>
          <Button variant="hero" className="ml-auto" onClick={onSave} disabled={errCount > 0}>
            <CheckCircle2 className="h-4 w-4" /> Save trip
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- STOP EDITOR ----------------------------- */

function StopEditor({
  index, stop, errors, onChange, onRemove,
}: {
  index: number;
  stop: Stop;
  errors: FieldErrors;
  onChange: (patch: Partial<Stop>) => void;
  onRemove: () => void;
}) {
  const base = `stops.${index}`;
  const setActivity = (aIdx: number, patch: Partial<Activity>) => {
    const activities = stop.activities.slice();
    activities[aIdx] = { ...activities[aIdx], ...patch };
    onChange({ activities });
  };
  const removeActivity = (aIdx: number) => onChange({ activities: stop.activities.filter((_, i) => i !== aIdx) });
  const addActivity = () => onChange({
    activities: [...stop.activities, { id: uid(), name: '', category: 'sightseeing', cost: 0, durationHours: 2 }],
  });

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Stop {index + 1}</div>
        <Button size="icon" variant="ghost" onClick={onRemove} aria-label="Remove stop"><Trash2 className="h-4 w-4 text-destructive" /></Button>
      </div>

      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <Field label="City" error={errors[`${base}.city`]}>
          <Input value={stop.city} maxLength={80} onChange={e => onChange({ city: e.target.value })} />
        </Field>
        <Field label="Country" error={errors[`${base}.country`]}>
          <Input value={stop.country} maxLength={80} onChange={e => onChange({ country: e.target.value })} />
        </Field>
        <Field label="Start date" error={errors[`${base}.startDate`]}>
          <Input type="date" value={stop.startDate} onChange={e => onChange({ startDate: e.target.value })} />
        </Field>
        <Field label="End date" error={errors[`${base}.endDate`]}>
          <Input type="date" value={stop.endDate} onChange={e => onChange({ endDate: e.target.value })} />
        </Field>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Transport ($)" error={errors[`${base}.costs.transport`]}>
          <Input type="number" min={0} value={stop.costs.transport}
            onChange={e => onChange({ costs: { ...stop.costs, transport: Math.max(0, Number(e.target.value) || 0) } })} />
        </Field>
        <Field label="Stay ($/night)" error={errors[`${base}.costs.stay`]}>
          <Input type="number" min={0} value={stop.costs.stay}
            onChange={e => onChange({ costs: { ...stop.costs, stay: Math.max(0, Number(e.target.value) || 0) } })} />
        </Field>
        <Field label="Meals ($/day)" error={errors[`${base}.costs.meals`]}>
          <Input type="number" min={0} value={stop.costs.meals}
            onChange={e => onChange({ costs: { ...stop.costs, meals: Math.max(0, Number(e.target.value) || 0) } })} />
        </Field>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Activities ({stop.activities.length})</Label>
          <Button size="sm" variant="ghost" onClick={addActivity}><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="mt-2 space-y-2">
          {stop.activities.map((a, ai) => {
            const ab = `${base}.activities.${ai}`;
            return (
              <div key={a.id} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_140px_auto]">
                  <Field label="Name" error={errors[`${ab}.name`]}>
                    <Input value={a.name} maxLength={120} onChange={e => setActivity(ai, { name: e.target.value })} />
                  </Field>
                  <Field label="Category" error={errors[`${ab}.category`]}>
                    <Select value={a.category} onValueChange={(v) => setActivity(ai, { category: v as ActivityCategory })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex items-end">
                    <Button size="icon" variant="ghost" onClick={() => removeActivity(ai)} aria-label="Remove activity">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Field label="Cost ($)" error={errors[`${ab}.cost`]}>
                    <Input type="number" min={0} value={a.cost}
                      onChange={e => setActivity(ai, { cost: Math.max(0, Number(e.target.value) || 0) })} />
                  </Field>
                  <Field label="Duration (h)" error={errors[`${ab}.durationHours`]}>
                    <Input type="number" min={0.25} step={0.25} value={a.durationHours}
                      onChange={e => setActivity(ai, { durationHours: Math.max(0.25, Number(e.target.value) || 0.25) })} />
                  </Field>
                  <Field label="Time" error={errors[`${ab}.time`]} icon={<Clock className="h-3 w-3" />}>
                    <Input type="time" value={a.time || ''} onChange={e => setActivity(ai, { time: e.target.value })} />
                  </Field>
                </div>
              </div>
            );
          })}
          {stop.activities.length === 0 && (
            <p className="text-xs text-muted-foreground">No activities yet — add one or save as-is.</p>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------ FIELD ------------------------------ */

function Field({ label, error, children, icon }: { label: string; error?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1 text-xs font-medium text-muted-foreground">{icon}{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</p>}
    </div>
  );
}
