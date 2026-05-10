import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Loader2, MapPin, Wallet, Calendar, Users, Plus, Trash2, ChevronLeft,
  AlertCircle, CheckCircle2, Clock,
  Mountain, Palmtree, Landmark, UtensilsCrossed, Heart, Baby, Backpack, Gem,
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
import type { Trip } from '@/lib/types';
import {
  coerceAiTrip, validateDraft, ACTIVITY_CATEGORIES,
  type TripDraft, type FieldErrors, type ActivityCategory,
  type DraftStop, type DraftActivity,
} from '@/lib/tripValidation';

const STYLES = [
  { id: 'adventure',  label: 'Adventure',   Icon: Mountain },
  { id: 'relaxation', label: 'Relaxation',  Icon: Palmtree },
  { id: 'culture',    label: 'Culture',     Icon: Landmark },
  { id: 'food',       label: 'Foodie',      Icon: UtensilsCrossed },
  { id: 'romantic',   label: 'Romantic',    Icon: Heart },
  { id: 'family',     label: 'Family',      Icon: Baby },
  { id: 'backpack',   label: 'Backpacking', Icon: Backpack },
  { id: 'luxury',     label: 'Luxury',      Icon: Gem },
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="border-b border-border/60 px-8 pt-7 pb-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {step === 'form' ? 'New itinerary' : 'Step 2 of 2'}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              AI assisted
            </div>
          </div>
          <DialogTitle className="mt-2 font-display text-3xl font-bold tracking-tight">
            {step === 'form' ? 'Plan your next trip' : 'Review & refine'}
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-muted-foreground">
            {step === 'form'
              ? 'Share where you want to go and your budget. We\'ll draft a complete multi-city itinerary in seconds.'
              : 'Adjust stops, activities and costs before saving to your trips.'}
          </DialogDescription>
        </DialogHeader>
        <div className="px-8 py-6">

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
        </div>
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
    <div className="space-y-6">
      <Field
        icon={<MapPin className="h-3.5 w-3.5" />}
        label="Destination"
        hint="City, country, or region"
      >
        <Input
          value={destination}
          onChange={e => setDestination(e.target.value)}
          placeholder="Italy · Tokyo + Kyoto · Southeast Asia"
          disabled={busy}
          maxLength={120}
          className="h-11"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_DEST.map(d => (
            <button
              key={d} type="button" disabled={busy} onClick={() => setDestination(d)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-smooth hover:border-primary/40 hover:text-foreground disabled:opacity-50"
            >
              {d}
            </button>
          ))}
        </div>
      </Field>

      <Field
        icon={<Wallet className="h-3.5 w-3.5" />}
        label="Total budget"
        hint="USD, all-in"
        right={<span className="font-display text-xl font-bold tabular-nums">${budget.toLocaleString()}</span>}
      >
        <Slider value={[budget]} onValueChange={v => setBudget(v[0])} min={500} max={15000} step={250} disabled={busy} />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>$500 · lean</span><span>$15,000 · luxury</span>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-5">
        <Field icon={<Calendar className="h-3.5 w-3.5" />} label="Days">
          <Input type="number" min={2} max={30} value={days}
            onChange={e => setDays(Math.max(2, Math.min(30, Number(e.target.value) || 7)))}
            disabled={busy} className="h-11 tabular-nums" />
        </Field>
        <Field icon={<Users className="h-3.5 w-3.5" />} label="Travelers">
          <Input type="number" min={1} max={20} value={travelers}
            onChange={e => setTravelers(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
            disabled={busy} className="h-11 tabular-nums" />
        </Field>
      </div>

      <Field label="Trip style">
        <div className="grid grid-cols-4 gap-2">
          {STYLES.map(s => {
            const active = style === s.id;
            const Icon = s.Icon;
            return (
              <button
                key={s.id} type="button" disabled={busy} onClick={() => setStyle(s.id)}
                className={`group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs transition-smooth disabled:opacity-50 ${
                  active
                    ? 'border-primary bg-primary/[0.06] text-foreground shadow-sm'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-primary' : ''}`} strokeWidth={1.75} />
                <span className={active ? 'font-semibold' : 'font-medium'}>{s.label}</span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field label="Notes" hint="Optional">
        <Textarea value={extra} onChange={e => setExtra(e.target.value.slice(0, 500))}
          placeholder="Vegetarian food, avoid flights, must include diving…"
          rows={2} disabled={busy} maxLength={500} className="resize-none" />
      </Field>

      <div className="flex flex-col-reverse gap-2 border-t border-border/60 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          You'll review and edit everything before it's saved.
        </p>
        <Button variant="hero" size="lg" onClick={generate} disabled={busy} className="sm:min-w-[200px]">
          {busy
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Drafting itinerary…</>
            : <><Sparkles className="h-4 w-4" /> Draft itinerary</>}
        </Button>
      </div>
    </div>
  );
}

function Field({
  icon, label, hint, right, children,
}: { icon?: React.ReactNode; label: string; hint?: string; right?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-2">
        <Label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
          {hint && <span className="ml-1 text-[10px] font-normal normal-case tracking-normal text-muted-foreground/70">· {hint}</span>}
        </Label>
        {right}
      </div>
      {children}
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

  const setStop = (idx: number, patch: Partial<DraftStop>) => {
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
  stop: DraftStop;
  errors: FieldErrors;
  onChange: (patch: Partial<DraftStop>) => void;
  onRemove: () => void;
}) {
  const base = `stops.${index}`;
  const setActivity = (aIdx: number, patch: Partial<DraftActivity>) => {
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
