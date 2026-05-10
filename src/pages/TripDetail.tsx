import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar, MapPin, Plus, Trash2, Share2, Globe, Lock, GripVertical,
  Wallet, ListChecks, StickyNote, MapIcon, ChevronLeft, Clock, Download,
  FileText, FileSpreadsheet, Printer, Users, Copy, X, Mail,
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';

import { exportTripPDF, exportTripCSV } from '@/lib/export';
import { CURRENCIES, refreshRates, formatMoney, type CurrencyCode } from '@/lib/currency';
import { useAuth } from '@/contexts/AuthContext';
import { getTrip, upsertTrip, uid, tripCost, stopDays, tripDays, resequenceStops, createInvite, revokeInvite, unshareWith } from '@/lib/store';
import type { Trip, Stop, Activity, Note, PackItem, Friend } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Display, Heading, Lead, Eyebrow } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CitySearchDialog from '@/components/CitySearchDialog';
import ActivitySearchDialog from '@/components/ActivitySearchDialog';
import RouteTimeline from '@/components/RouteTimeline';
import RouteMap from '@/components/RouteMap';
import { WeatherBadge, WeatherForecast } from '@/lib/weather';
import { toast } from 'sonner';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | undefined>(getTrip(id!));
  const [activeTab, setActiveTab] = useState('itinerary');
  const [highlightedStopId, setHighlightedStopId] = useState<string | null>(null);
  const [displayCurrency, setDisplayCurrency] = useState<CurrencyCode>('USD');
  const exportCurrency = displayCurrency;
  const setExportCurrency = setDisplayCurrency;

  useEffect(() => { refreshRates(); }, []);

  const focusStop = (stopId: string) => {
    setActiveTab('itinerary');
    setHighlightedStopId(stopId);
    // wait for tab/list render then scroll
    setTimeout(() => {
      const el = document.getElementById(`stop-${stopId}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    setTimeout(() => setHighlightedStopId(null), 2200);
  };

  useEffect(() => {
    if (!trip) navigate('/app/trips', { replace: true });
  }, [trip, navigate]);

  if (!trip || !user) return null;

  const update = (patch: Partial<Trip> | ((t: Trip) => Trip)) => {
    const next = typeof patch === 'function' ? patch(trip) : { ...trip, ...patch };
    setTrip(next);
    upsertTrip(next);
  };

  const cost = tripCost(trip);
  const overBudget = trip.budget && cost.total > trip.budget;

  const budgetPct = trip.budget ? Math.min(100, (cost.total / trip.budget) * 100) : 0;
  const fmtMoney = (n: number) => formatMoney(n, displayCurrency);

  return (
    <div className="space-y-10 pb-12">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/trips')} className="-ml-2 text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to trips
      </Button>

      {/* ───────── EDITORIAL HERO ───────── */}
      <header className="relative animate-fade-up">
        {/* eyebrow */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {trip.isPublic ? 'Public itinerary' : 'Private itinerary'}
          </span>
          <span className="text-border">·</span>
          <span className="tabular-nums">{new Date(trip.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="text-border">→</span>
          <span className="tabular-nums">{new Date(trip.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>

        <Display as="h1" className="mt-3" weight="bold">
          {trip.name}
        </Display>

        {trip.description && (
          <Lead className="mt-4 max-w-2xl" muted>{trip.description}</Lead>
        )}

        {/* meta strip + actions */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-6">
          <dl className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <HeroStat label="Duration" value={`${tripDays(trip)} days`} />
            <HeroStat label="Stops" value={trip.stops.length.toString()} />
            <HeroStat label="Estimated" value={fmtMoney(cost.total)} accent />
            {trip.budget && (
              <HeroStat
                label={overBudget ? 'Over budget' : 'Remaining'}
                value={fmtMoney(Math.abs(trip.budget - cost.total))}
                tone={overBudget ? 'destructive' : 'success'}
              />
            )}
          </dl>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as CurrencyCode)}>
              <SelectTrigger className="h-8 w-[140px] gap-1.5 text-xs" aria-label="Display currency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {CURRENCIES.map(c => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">{c.symbol} {c.code} — {c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
              update({ isPublic: !trip.isPublic });
              toast.success(trip.isPublic ? 'Trip is now private' : 'Trip is now public');
            }}>
              {trip.isPublic ? <><Globe className="h-3.5 w-3.5" /> Public</> : <><Lock className="h-3.5 w-3.5" /> Private</>}
            </Button>
            <ShareDialog trip={trip} update={update} />
            {trip.isPublic && (
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => {
                const url = `${window.location.origin}/share/${trip.shareId}`;
                navigator.clipboard.writeText(url);
                toast.success('Public link copied!');
              }}><Share2 className="h-3.5 w-3.5" /> Copy link</Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1.5"><Download className="h-3.5 w-3.5" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Currency</label>
                  <Select value={exportCurrency} onValueChange={(v) => setExportCurrency(v as CurrencyCode)}>
                    <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {CURRENCIES.map(c => (
                        <SelectItem key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { exportTripPDF(trip, exportCurrency); toast.success(`PDF downloaded (${exportCurrency})`); }}>
                  <FileText className="h-4 w-4 mr-2" /> Download PDF summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportTripCSV(trip, exportCurrency); toast.success(`CSV downloaded (${exportCurrency})`); }}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" /> Cost breakdown CSV
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-2" /> Print page
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* refined budget meter */}
        {trip.budget && (
          <div className="mt-6 animate-fade-up" style={{ animationDelay: '120ms' }}>
            <div className="flex items-end justify-between text-xs text-muted-foreground">
              <span className="font-medium">{Math.round(budgetPct)}% of budget</span>
              <span className="tabular-nums">{fmtMoney(cost.total)} <span className="text-border">/</span> {fmtMoney(trip.budget)}</span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${overBudget ? 'bg-destructive' : 'bg-foreground'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        )}
      </header>

      {trip.stops.length > 0 && (
        <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
          <SectionLabel>The route</SectionLabel>
          <div className="mt-4 space-y-6">
            <RouteTimeline stops={trip.stops} />
            <RouteMap stops={trip.stops} onSelectStop={focusStop} highlightedStopId={highlightedStopId} />
          </div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full animate-fade-up" style={{ animationDelay: '200ms' } as React.CSSProperties}>
        <div className="border-b border-border/60">
          <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0 sm:w-auto">
            <EditorialTab value="itinerary" icon={<MapIcon className="h-3.5 w-3.5" />}>Itinerary</EditorialTab>
            <EditorialTab value="budget" icon={<Wallet className="h-3.5 w-3.5" />}>Budget</EditorialTab>
            <EditorialTab value="packing" icon={<ListChecks className="h-3.5 w-3.5" />}>Packing</EditorialTab>
            <EditorialTab value="notes" icon={<StickyNote className="h-3.5 w-3.5" />}>Notes</EditorialTab>
            <EditorialTab value="settings">Settings</EditorialTab>
          </TabsList>
        </div>

        <TabsContent value="itinerary" className="mt-8 animate-fade-in"><Itinerary trip={trip} update={update} highlightedStopId={highlightedStopId} currency={displayCurrency} /></TabsContent>
        <TabsContent value="budget" className="mt-8 animate-fade-in"><BudgetView trip={trip} update={update} currency={displayCurrency} /></TabsContent>
        <TabsContent value="packing" className="mt-8 animate-fade-in"><Packing trip={trip} update={update} /></TabsContent>
        <TabsContent value="notes" className="mt-8 animate-fade-in"><Notes trip={trip} update={update} /></TabsContent>
        <TabsContent value="settings" className="mt-8 animate-fade-in"><Settings trip={trip} update={update} onDelete={() => navigate('/app/trips')} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ───────── editorial helpers ───────── */

function HeroStat({ label, value, accent, tone }: { label: string; value: string; accent?: boolean; tone?: 'success' | 'destructive' }) {
  const valueClass =
    tone === 'destructive' ? 'text-destructive'
    : tone === 'success' ? 'text-success'
    : accent ? 'text-foreground'
    : 'text-foreground';
  return (
    <div className="flex flex-col">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
      <dd className={`mt-1 font-display text-2xl font-bold tabular-nums leading-none ${valueClass}`}>{value}</dd>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-none w-8 bg-border" />
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{children}</span>
    </div>
  );
}

function EditorialTab({ value, icon, children }: { value: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="relative h-10 rounded-none border-0 bg-transparent px-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:absolute after:inset-x-2 after:-bottom-px after:h-[2px] after:rounded-full after:bg-foreground after:scale-x-0 after:transition-transform after:duration-300 data-[state=active]:after:scale-x-100"
    >
      {icon}{icon && <span className="ml-1.5" />}{children}
    </TabsTrigger>
  );
}

/* ------------------- ITINERARY ------------------- */

function Itinerary({ trip, update, highlightedStopId, currency }: { trip: Trip; update: (p: Partial<Trip> | ((t: Trip) => Trip)) => void; highlightedStopId?: string | null; currency: CurrencyCode }) {
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const addStop = (p: { city: string; country: string; startDate: string; endDate: string }) => {
    const stop: Stop = {
      id: uid(),
      city: p.city,
      country: p.country,
      startDate: p.startDate,
      endDate: p.endDate,
      activities: [],
      costs: { transport: 100, stay: 80, meals: 30 },
    };
    update(t => ({ ...t, stops: [...t.stops, stop] }));
    toast.success(`${p.city} added`);
  };

  const removeStop = (id: string) =>
    update(t => resequenceStops(t, t.stops.filter(s => s.id !== id)));

  const updateStop = (id: string, patch: Partial<Stop>) =>
    update(t => ({ ...t, stops: t.stops.map(s => s.id === id ? { ...s, ...patch } : s) }));

  const setDuration = (id: string, days: number) =>
    update(t => {
      const d = Math.max(1, Math.min(60, days));
      const stops = t.stops.map(s => {
        if (s.id !== id) return s;
        const start = new Date(s.startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + d - 1);
        return { ...s, endDate: end.toISOString().slice(0, 10) };
      });
      return resequenceStops(t, stops);
    });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    update(t => {
      const oldIdx = t.stops.findIndex(s => s.id === active.id);
      const newIdx = t.stops.findIndex(s => s.id === over.id);
      if (oldIdx < 0 || newIdx < 0) return t;
      const reordered = arrayMove(t.stops, oldIdx, newIdx);
      toast.success('Itinerary reordered — dates updated');
      return resequenceStops(t, reordered);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button onClick={() => setView('list')} className={`rounded-md px-3 py-1 text-sm ${view === 'list' ? 'bg-card shadow-soft font-medium' : 'text-muted-foreground'}`}>List</button>
          <button onClick={() => setView('calendar')} className={`rounded-md px-3 py-1 text-sm ${view === 'calendar' ? 'bg-card shadow-soft font-medium' : 'text-muted-foreground'}`}>Day-by-day</button>
        </div>
        <CitySearchDialog
          defaultStart={trip.startDate}
          defaultEnd={trip.endDate}
          onAdd={addStop}
          trigger={<Button variant="hero"><Plus className="h-4 w-4" /> Add stop</Button>}
        />
      </div>

      {trip.stops.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <Heading level={3} className="!text-xl">No stops yet</Heading>
          <p className="mt-1 text-muted-foreground">Add cities to start building your route.</p>
        </div>
      )}

      {view === 'list' ? (
        <>
          {trip.stops.length > 1 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <GripVertical className="h-3 w-3" /> Drag stops to reorder · change duration to auto-shift dates
            </p>
          )}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={trip.stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {trip.stops.map((s, i) => (
                  <div key={s.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
                    <SortableStopCard
                      stop={s} index={i}
                      onRemove={removeStop} onUpdate={updateStop} onSetDuration={setDuration}
                      highlighted={highlightedStopId === s.id}
                      currency={currency}
                    />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <CalendarView trip={trip} currency={currency} />
      )}
    </div>
  );
}

function SortableStopCard(props: {
  stop: Stop; index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, p: Partial<Stop>) => void;
  onSetDuration: (id: string, days: number) => void;
  highlighted?: boolean;
  currency: CurrencyCode;
}) {
  const { stop, highlighted } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };
  return (
    <div
      ref={setNodeRef}
      id={`stop-${stop.id}`}
      style={style}
      className={`scroll-mt-24 rounded-3xl transition-all duration-500 ${highlighted ? 'ring-2 ring-foreground/80 ring-offset-4 ring-offset-background' : ''}`}
    >
      <StopCard {...props} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

function StopCard({ stop, index, onRemove, onUpdate, onSetDuration, dragHandle, currency }: {
  stop: Stop; index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, p: Partial<Stop>) => void;
  onSetDuration: (id: string, days: number) => void;
  dragHandle?: React.HTMLAttributes<HTMLButtonElement>;
  currency: CurrencyCode;
}) {
  const days = stopDays(stop);
  const stopTotal =
    (stop.costs.stay || 0) * Math.max(0, days - 1) +
    (stop.costs.meals || 0) * days +
    (stop.costs.transport || 0) +
    stop.activities.reduce((a, b) => a + b.cost, 0);

  const addActivity = (a: Activity) => onUpdate(stop.id, { activities: [...stop.activities, a] });
  const removeActivity = (aid: string) => onUpdate(stop.id, { activities: stop.activities.filter(a => a.id !== aid) });

  const startFmt = new Date(stop.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const endFmt = new Date(stop.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

  return (
    <Card className="group overflow-hidden border border-border/60 bg-card shadow-[0_1px_0_0_hsl(var(--border)/0.6)] transition-all duration-500 hover:shadow-soft">
      {/* editorial header */}
      <div className="relative grid grid-cols-[auto_1fr_auto] gap-5 border-b border-border/60 px-6 py-6 md:px-8">
        {/* huge index numeral */}
        <div className="flex flex-col items-start">
          <span className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Stop</span>
          <span className="font-display text-5xl font-extrabold leading-none tabular-nums text-foreground/90 transition-colors group-hover:text-foreground md:text-6xl">
            {String(index + 1).padStart(2, '0')}
          </span>
        </div>

        {/* title block */}
        <div className="min-w-0 self-end">
          <Heading level={3} className="!text-3xl leading-tight tracking-tight md:!text-4xl">
            {stop.city}
            <span className="ml-2 text-base font-normal text-muted-foreground">{stop.country}</span>
          </Heading>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <Calendar className="h-3 w-3" /> {startFmt} <span className="text-border">→</span> {endFmt}
            </span>
            <span className="text-border">·</span>
            <span className="tabular-nums">{days} day{days > 1 ? 's' : ''}</span>
            <span className="text-border">·</span>
            <span className="font-semibold tabular-nums text-foreground">{formatMoney(stopTotal, currency)}</span>
            <WeatherBadge city={stop.city} date={stop.startDate} />
          </div>
        </div>

        {/* controls */}
        <div className="flex items-start gap-1.5 self-start">
          <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 px-2 py-1 text-xs">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <input
              type="number" min={1} max={60} value={days}
              onChange={e => onSetDuration(stop.id, Number(e.target.value) || 1)}
              className="w-9 bg-transparent text-center font-semibold tabular-nums outline-none"
            />
            <span className="text-muted-foreground">d</span>
          </div>
          <button
            {...dragHandle}
            type="button"
            aria-label="Drag to reorder"
            className="cursor-grab rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-destructive" onClick={() => onRemove(stop.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* weather strip */}
      <div className="px-6 pt-6 md:px-8">
        <WeatherForecast city={stop.city} startDate={stop.startDate} endDate={stop.endDate} />
      </div>

      {/* body */}
      <div className="grid gap-8 px-6 py-6 md:grid-cols-[1fr_260px] md:px-8 md:py-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-3">
            <Eyebrow className="block">Activities</Eyebrow>
            <ActivitySearchDialog onAdd={addActivity} trigger={
              <Button size="sm" variant="ghost" className="-mr-2 h-7 gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Add</Button>
            } />
          </div>
          {stop.activities.length === 0 ? (
            <p className="py-2 text-sm text-muted-foreground">Nothing planned yet — a free day in {stop.city}.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {stop.activities.map((a, ai) => (
                <li
                  key={a.id}
                  className="group/row flex items-center justify-between gap-3 py-3 animate-fade-in"
                  style={{ animationDelay: `${ai * 40}ms` }}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-lg border border-border bg-muted/40 text-foreground/70">
                      <Clock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate font-medium leading-tight">{a.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        <span className="capitalize">{a.category}</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="tabular-nums">{a.durationHours}h</span>
                        <span className="mx-1.5 text-border">·</span>
                        <span className="tabular-nums">{formatMoney(a.cost, currency)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      value={a.time || ''}
                      onChange={e => onUpdate(stop.id, { activities: stop.activities.map(x => x.id === a.id ? { ...x, time: e.target.value } : x) })}
                      className="h-8 w-24 border-border/60 text-xs tabular-nums"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 opacity-0 transition-opacity group-hover/row:opacity-100" onClick={() => removeActivity(a.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* cost panel */}
        <aside className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-5">
          <Eyebrow className="block">Costs · entered in USD</Eyebrow>
          <CostInput label="Transport" value={stop.costs.transport} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, transport: v } })} />
          <CostInput label="Stay / night" value={stop.costs.stay} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, stay: v } })} />
          <CostInput label="Meals / day" value={stop.costs.meals} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, meals: v } })} />
          <div className="mt-3 flex items-end justify-between border-t border-border/60 pt-3">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total · {currency}</span>
            <span className="font-display text-2xl font-bold tabular-nums leading-none">{formatMoney(stopTotal, currency)}</span>
          </div>
        </aside>
      </div>
    </Card>
  );
}

function CostInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <label className="text-xs text-muted-foreground">{label}</label>
      <div className="relative">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <Input
          type="number" min={0} value={value}
          onChange={e => onChange(Number(e.target.value) || 0)}
          className="h-8 w-24 border-border/60 bg-background/60 pl-5 text-right text-sm tabular-nums"
        />
      </div>
    </div>
  );
}

function CalendarView({ trip, currency }: { trip: Trip; currency: CurrencyCode }) {
  type DayEntry = {
    date: string;
    stop?: Stop;
    dayOfStop?: number;
    stopLength?: number;
    activities: Activity[];
    dailyCost: number;
  };

  const days = useMemo<DayEntry[]>(() => {
    const map: DayEntry[] = [];
    const start = new Date(trip.startDate);
    const total = tripDays(trip);

    // Pre-bucket activities round-robin across each stop's days
    const stopBuckets = new Map<string, Activity[][]>();
    for (const s of trip.stops) {
      const len = Math.max(1, stopDays(s));
      const buckets: Activity[][] = Array.from({ length: len }, () => []);
      s.activities.forEach((a, idx) => buckets[idx % len].push(a));
      // sort each day by time
      buckets.forEach(b => b.sort((x, y) => (x.time || '99:99').localeCompare(y.time || '99:99')));
      stopBuckets.set(s.id, buckets);
    }

    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const stop = trip.stops.find(s => iso >= s.startDate && iso <= s.endDate);
      let activities: Activity[] = [];
      let dayOfStop: number | undefined;
      let stopLength: number | undefined;
      let dailyCost = 0;
      if (stop) {
        const sStart = new Date(stop.startDate);
        dayOfStop = Math.round((d.getTime() - sStart.getTime()) / 86400000) + 1;
        stopLength = stopDays(stop);
        activities = stopBuckets.get(stop.id)?.[dayOfStop - 1] ?? [];
        dailyCost = (stop.costs.stay || 0) + (stop.costs.meals || 0)
          + activities.reduce((sum, a) => sum + (a.cost || 0), 0)
          + (dayOfStop === 1 ? (stop.costs.transport || 0) : 0);
      }
      map.push({ date: iso, stop, dayOfStop, stopLength, activities, dailyCost });
    }
    return map;
  }, [trip]);

  if (days.length === 0) {
    return <p className="text-sm text-muted-foreground">Set a start and end date to see the day-by-day plan.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        A day-by-day plan across your {trip.stops.length} {trip.stops.length === 1 ? 'stop' : 'stops'}.
        Activities are distributed evenly across each city's stay — drag and edit them in the List view.
      </div>

      {days.map((d, i) => {
        const dt = new Date(d.date);
        const isFirstDayOfStop = d.dayOfStop === 1;
        return (
          <div key={d.date} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
            <div className="w-20 shrink-0 text-center">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Day {i + 1}</div>
              <div className="font-display text-3xl font-bold leading-none mt-1">{dt.getDate()}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {dt.toLocaleDateString(undefined, { weekday: 'short' })}
              </div>
              <div className="text-xs text-muted-foreground">
                {dt.toLocaleDateString(undefined, { month: 'short' })}
              </div>
            </div>
            <div className="flex-1 border-l border-border pl-4 min-w-0">
              {d.stop ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-display font-semibold flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      {d.stop.city}, {d.stop.country}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Day {d.dayOfStop} of {d.stopLength}
                      {isFirstDayOfStop && d.stopLength! > 1 && ' · arrival'}
                      {d.dayOfStop === d.stopLength && d.stopLength! > 1 && ' · departure'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <WeatherBadge city={d.stop.city} date={d.date} />
                    <span className="text-xs font-medium text-muted-foreground">
                      ~{formatMoney(d.dailyCost, currency)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground italic text-sm">No stop assigned</div>
              )}

              {d.stop && d.activities.length === 0 && (
                <p className="mt-3 text-xs text-muted-foreground italic">
                  No activities planned — a free day to explore {d.stop.city}.
                </p>
              )}

              {d.activities.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {d.activities.map(a => (
                    <li key={a.id} className="flex items-start gap-3 text-sm">
                      <span className="text-xs font-mono text-muted-foreground w-12 shrink-0 pt-0.5">
                        {a.time || '--:--'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{a.name}</span>
                          <span className="text-xs text-muted-foreground capitalize shrink-0">· {a.category}</span>
                        </div>
                        {a.description && (
                          <p className="text-xs text-muted-foreground truncate">{a.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />{a.durationHours}h · {formatMoney(a.cost, currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------- BUDGET ------------------- */

function BudgetView({ trip, update, currency }: { trip: Trip; update: (p: Partial<Trip>) => void; currency: CurrencyCode }) {
  const cost = tripCost(trip);
  const days = tripDays(trip);
  const avg = days > 0 ? cost.total / days : 0;

  const COLORS = {
    Transport: 'hsl(var(--primary))',
    Stay: 'hsl(var(--accent))',
    Meals: 'hsl(var(--success))',
    Activities: 'hsl(var(--warning))',
  } as const;

  const pieData = [
    { name: 'Transport', value: cost.transport },
    { name: 'Stay', value: cost.stay },
    { name: 'Meals', value: cost.meals },
    { name: 'Activities', value: cost.activities },
  ].filter(d => d.value > 0);

  const barData = trip.stops.map(s => {
    const d = stopDays(s);
    const stay = (s.costs.stay || 0) * Math.max(0, d - 1);
    const meals = (s.costs.meals || 0) * d;
    const transport = s.costs.transport || 0;
    const activities = s.activities.reduce((a, b) => a + b.cost, 0);
    return {
      city: s.city || 'Stop',
      Transport: transport,
      Stay: stay,
      Meals: meals,
      Activities: activities,
      total: transport + stay + meals + activities,
    };
  });

  const total = cost.total || 1;

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: formatMoney(cost.total, currency), accent: true },
          { label: 'Avg / day', value: formatMoney(avg, currency) },
          { label: 'Stops', value: trip.stops.length.toString() },
          { label: 'Trip length', value: `${days} day${days > 1 ? 's' : ''}` },
        ].map((k, i) => (
          <div key={k.label} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
            <KpiCard label={k.label} value={k.value} accent={k.accent} />
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pie / category breakdown — editorial card */}
        <Card variant="premium" className="overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-aurora px-6 py-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Composition</div>
              <Heading level={3} className="!text-lg leading-tight">Cost by category</Heading>
            </div>
            <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-semibold tabular-nums shadow-ring">
              {formatMoney(cost.total, currency)}
            </span>
          </header>
          <div className="p-6">
          {pieData.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-muted/60 text-muted-foreground">
                <Wallet className="h-5 w-5" />
              </span>
              <p className="text-sm font-medium">No costs yet</p>
              <p className="max-w-[34ch] text-xs text-muted-foreground">Add stops and activities to see your breakdown come to life.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-[200px_1fr] items-center">
              <div className="relative h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="hsl(var(--background))" strokeWidth={2}>
                      {pieData.map(entry => (
                        <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
                      ))}
                    </Pie>
                    <RTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-elegant)' }}
                      formatter={(v: number) => formatMoney(v, currency)}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Total</div>
                  <div className="font-display text-base font-bold tabular-nums leading-none">{formatMoney(cost.total, currency)}</div>
                </div>
              </div>
              <ul className="space-y-2.5">
                {pieData.map(i => {
                  const pct = (i.value / total) * 100;
                  return (
                    <li key={i.name} className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="h-2.5 w-2.5 rounded-full ring-2 ring-background" style={{ background: COLORS[i.name as keyof typeof COLORS] }} />
                        <span className="flex-1 font-medium">{i.name}</span>
                        <span className="tabular-nums">{formatMoney(i.value, currency)}</span>
                        <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">{Math.round(pct)}%</span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-700 ease-out"
                          style={{ width: `${pct}%`, background: COLORS[i.name as keyof typeof COLORS] }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          </div>
        </Card>

        {/* Budget tracker — editorial card */}
        <Card variant="premium" className="overflow-hidden">
          <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-aurora px-6 py-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Targets</div>
              <Heading level={3} className="!text-lg leading-tight">Budget tracker</Heading>
            </div>
            {trip.budget ? (
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums shadow-ring ${
                  cost.total > trip.budget ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success'
                }`}
              >
                {cost.total > trip.budget ? 'Over' : 'On track'}
              </span>
            ) : null}
          </header>

          <div className="p-6">
          <div className="space-y-2">
            <Label htmlFor="budget" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Trip budget (USD)</Label>
            <Input id="budget" type="number" min={0} value={trip.budget ?? ''} onChange={e => update({ budget: e.target.value ? Number(e.target.value) : undefined })} placeholder="Set a budget" />
            {trip.budget ? (
              <p className="text-[11px] text-muted-foreground tabular-nums">≈ {formatMoney(trip.budget, currency)} in {currency}</p>
            ) : null}
          </div>
          {trip.budget ? (
            <div className="mt-4 space-y-2">
              <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${
                    cost.total > trip.budget ? 'bg-destructive' : 'bg-gradient-ocean'
                  }`}
                  style={{ width: `${Math.min(100, (cost.total / trip.budget) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="tabular-nums text-muted-foreground">{Math.round(Math.min(100, (cost.total / trip.budget) * 100))}% used</span>
                {cost.total > trip.budget ? (
                  <span className="font-semibold text-destructive tabular-nums">Over by {formatMoney(cost.total - trip.budget, currency)}</span>
                ) : (
                  <span className="font-semibold text-success tabular-nums">{formatMoney(trip.budget - cost.total, currency)} remaining</span>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">Set a target to track your spending.</p>
          )}

          <div className="mt-6 space-y-1">
            <Eyebrow className="block">Category goals</Eyebrow>
            <p className="text-xs text-muted-foreground">Set a target per category to track each one independently.</p>
          </div>
          <div className="mt-3 space-y-3">
            {([
              { key: 'transport', label: 'Transport', spent: cost.transport, color: COLORS.Transport },
              { key: 'stay',      label: 'Stay',      spent: cost.stay,      color: COLORS.Stay },
              { key: 'meals',     label: 'Meals',     spent: cost.meals,     color: COLORS.Meals },
              { key: 'activities',label: 'Activities',spent: cost.activities,color: COLORS.Activities },
            ] as const).map(c => (
              <CategoryGoal
                key={c.key}
                label={c.label}
                color={c.color}
                spent={c.spent}
                goal={trip.categoryBudgets?.[c.key]}
                currency={currency}
                onChange={(v) => update({ categoryBudgets: { ...(trip.categoryBudgets || {}), [c.key]: v } })}
              />
            ))}
          </div>
          </div>
        </Card>
      </div>

      {/* Per-stop stacked bar — editorial card */}
      <Card variant="premium" className="overflow-hidden">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-aurora px-6 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Per stop</div>
            <Heading level={3} className="!text-lg leading-tight">Spend per stop</Heading>
          </div>
          <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted-foreground">
            {(['Transport','Stay','Meals','Activities'] as const).map(k => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: COLORS[k] }} />{k}
              </span>
            ))}
          </div>
        </header>
        <div className="p-6">
        {barData.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-muted/60 text-muted-foreground">
              <MapPin className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium">No stops yet</p>
            <p className="max-w-[34ch] text-xs text-muted-foreground">Add stops to compare per-city spending side by side.</p>
          </div>
        ) : (
          <>
            <div className="mt-2 h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 8, right: 8, bottom: 4, left: -12 }}>
                  <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="city" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatMoney(v, currency)} />
                  <RTooltip
                    cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12, boxShadow: 'var(--shadow-elegant)' }}
                    formatter={(v: number) => formatMoney(Number(v), currency)}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Transport" stackId="a" fill={COLORS.Transport} radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Stay" stackId="a" fill={COLORS.Stay} />
                  <Bar dataKey="Meals" stackId="a" fill={COLORS.Meals} />
                  <Bar dataKey="Activities" stackId="a" fill={COLORS.Activities} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="px-3 py-2.5 text-left font-semibold">Stop</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Transport</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Stay</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Meals</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Activities</th>
                    <th className="px-3 py-2.5 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {barData.map(r => (
                    <tr key={r.city} className="transition-colors hover:bg-muted/30">
                      <td className="px-3 py-2.5 font-medium">
                        <span className="inline-flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" />{r.city}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.Transport, currency)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.Stay, currency)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.Meals, currency)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(r.Activities, currency)}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(r.total, currency)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border bg-muted/30">
                    <td className="px-3 py-2.5 font-semibold">Total</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(cost.transport, currency)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(cost.stay, currency)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(cost.meals, currency)}</td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{formatMoney(cost.activities, currency)}</td>
                    <td className="px-3 py-2.5 text-right font-bold text-primary tabular-nums">{formatMoney(cost.total, currency)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
        </div>
      </Card>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`group relative overflow-hidden border-border/60 p-5 transition-all duration-500 hover:-translate-y-0.5 hover:shadow-soft ${accent ? 'bg-foreground text-background' : ''}`}>
      <div className={`text-[10px] font-semibold uppercase tracking-[0.18em] ${accent ? 'opacity-70' : 'text-muted-foreground'}`}>{label}</div>
      <div className="mt-2 font-display text-3xl font-extrabold tabular-nums leading-none">{value}</div>
      {accent && <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-background/10 blur-2xl" />}
    </Card>
  );
}

function CategoryGoal({ label, color, spent, goal, currency, onChange }: {
  label: string; color: string; spent: number;
  goal?: number;
  currency: CurrencyCode;
  onChange: (v: number | undefined) => void;
}) {
  const hasGoal = typeof goal === 'number' && goal > 0;
  const pct = hasGoal ? Math.min(100, (spent / goal!) * 100) : 0;
  const over = hasGoal && spent > goal!;
  const remaining = hasGoal ? Math.abs(goal! - spent) : 0;
  const sym = CURRENCIES.find(c => c.code === currency)?.symbol ?? '$';

  return (
    <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} />
          {label}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="tabular-nums font-medium text-foreground">{formatMoney(spent, currency)}</span>
          <span className="text-border">/</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
            <Input
              type="number" min={0}
              value={goal ?? ''}
              placeholder="USD"
              onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
              className="h-7 w-24 border-border/60 bg-background/60 pl-5 text-right text-xs tabular-nums"
              title="Goal entered in USD"
            />
          </div>
        </div>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${hasGoal ? pct : 0}%`,
            background: over ? 'hsl(var(--destructive))' : color,
          }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[11px]">
        {hasGoal ? (
          <>
            <span className="tabular-nums text-muted-foreground">{Math.round(pct)}% used</span>
            <span className={`tabular-nums font-medium ${over ? 'text-destructive' : 'text-success'}`}>
              {over ? `Over by ${formatMoney(remaining, currency)}` : `${formatMoney(remaining, currency)} left`}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground">No goal set</span>
        )}
      </div>
    </div>
  );
}

/* ------------------- PACKING ------------------- */

function Packing({ trip, update }: { trip: Trip; update: (p: Partial<Trip> | ((t: Trip) => Trip)) => void }) {
  const [label, setLabel] = useState('');
  const [cat, setCat] = useState<PackItem['category']>('misc');

  const grouped = useMemo(() => {
    const g: Record<string, PackItem[]> = {};
    trip.packing.forEach(p => { (g[p.category] ||= []).push(p); });
    return g;
  }, [trip.packing]);

  const packed = trip.packing.filter(p => p.packed).length;
  const total = trip.packing.length;

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    update(t => ({ ...t, packing: [...t.packing, { id: uid(), label: label.trim(), category: cat, packed: false }] }));
    setLabel('');
  };
  const toggle = (id: string) => update(t => ({ ...t, packing: t.packing.map(p => p.id === id ? { ...p, packed: !p.packed } : p) }));
  const remove = (id: string) => update(t => ({ ...t, packing: t.packing.filter(p => p.id !== id) }));
  const reset = () => update(t => ({ ...t, packing: t.packing.map(p => ({ ...p, packed: false })) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <Heading level={3} className="!text-xl">Packing checklist</Heading>
          <span className="text-sm text-muted-foreground">{packed} / {total} packed</span>
        </div>
        <Progress value={total ? (packed / total) * 100 : 0} className="mt-3" />
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <Heading level={4} className="!text-sm capitalize !text-muted-foreground mb-2">{category}</Heading>
              <ul className="space-y-1">
                {items.map(p => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-1 hover:bg-muted/50">
                    <Checkbox checked={p.packed} onCheckedChange={() => toggle(p.id)} id={p.id} />
                    <label htmlFor={p.id} className={`flex-1 cursor-pointer text-sm ${p.packed ? 'line-through text-muted-foreground' : ''}`}>{p.label}</label>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
      <Card className="h-fit p-6">
        <Heading level={3} className="!text-lg">Add item</Heading>
        <form onSubmit={add} className="mt-3 space-y-3">
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Hiking boots" />
          <Select value={cat} onValueChange={v => setCat(v as PackItem['category'])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {(['clothing', 'documents', 'electronics', 'toiletries', 'misc'] as const).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button type="submit" variant="hero" className="w-full"><Plus className="h-4 w-4" /> Add</Button>
        </form>
        <Button variant="outline" className="mt-3 w-full" onClick={reset}>Reset checklist</Button>
      </Card>
    </div>
  );
}

/* ------------------- NOTES ------------------- */

function Notes({ trip, update }: { trip: Trip; update: (p: Partial<Trip> | ((t: Trip) => Trip)) => void }) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    const note: Note = { id: uid(), title: title.trim() || 'Untitled', body: body.trim(), createdAt: new Date().toISOString() };
    update(t => ({ ...t, notes: [note, ...t.notes] }));
    setTitle(''); setBody('');
  };
  const remove = (id: string) => update(t => ({ ...t, notes: t.notes.filter(n => n.id !== id) }));

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-6">
        <Heading level={3} className="!text-lg">New note</Heading>
        <form onSubmit={add} className="mt-3 space-y-3">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Anything to remember..." rows={5} />
          <Button type="submit" variant="hero" className="w-full"><Plus className="h-4 w-4" /> Add note</Button>
        </form>
      </Card>
      <div className="space-y-3">
        {trip.notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
        {trip.notes.map(n => (
          <Card key={n.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Heading level={4} className="!text-base">{n.title}</Heading>
                <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-2 text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ------------------- SETTINGS ------------------- */

function Settings({ trip, update, onDelete }: { trip: Trip; update: (p: Partial<Trip>) => void; onDelete: () => void }) {
  return (
    <Card className="max-w-xl p-6">
      <Heading level={3} className="!text-xl">Trip settings</Heading>
      <div className="mt-4 space-y-4">
        <div>
          <Label>Trip name</Label>
          <Input value={trip.name} onChange={e => update({ name: e.target.value })} />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={trip.description || ''} onChange={e => update({ description: e.target.value })} rows={3} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Start date</Label>
            <Input type="date" value={trip.startDate} onChange={e => update({ startDate: e.target.value })} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={trip.endDate} onChange={e => update({ endDate: e.target.value })} />
          </div>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <div className="font-medium">Public itinerary</div>
            <p className="text-sm text-muted-foreground">Anyone with the link can view (read-only).</p>
          </div>
          <Switch checked={trip.isPublic} onCheckedChange={v => update({ isPublic: v })} />
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="font-medium text-destructive">Danger zone</div>
          <p className="text-sm text-muted-foreground">Permanently delete this trip.</p>
          <Button variant="destructive" className="mt-3" onClick={() => {
            if (confirm('Delete this trip permanently?')) {
              import('@/lib/store').then(({ deleteTrip }) => { deleteTrip(trip.id); onDelete(); toast.success('Trip deleted'); });
            }
          }}><Trash2 className="h-4 w-4" /> Delete trip</Button>
        </div>
      </div>
    </Card>
  );
}

/* ------------------- SHARE DIALOG ------------------- */

function ShareDialog({ trip, update }: { trip: Trip; update: (p: Partial<Trip> | ((t: Trip) => Trip)) => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [invitedEmail, setInvitedEmail] = useState('');
  const [tick, setTick] = useState(0);
  const friends: Friend[] = (user?.friends || []) as Friend[];
  const invites = trip.invites || [];
  const sharedWith = trip.sharedWith || [];

  const refresh = () => {
    const fresh = getTrip(trip.id);
    if (fresh) update(() => fresh);
    setTick(t => t + 1);
  };

  const generate = (email?: string) => {
    const inv = createInvite(trip.id, email);
    refresh();
    const url = `${window.location.origin}/invite/${inv.token}`;
    navigator.clipboard.writeText(url).catch(() => {});
    toast.success(email ? `Invite for ${email} copied to clipboard` : 'Invite link copied to clipboard');
    return inv;
  };

  const inviteUrl = (token: string) => `${window.location.origin}/invite/${token}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary"><Share2 className="h-4 w-4" /> Share</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Share "{trip.name}"</DialogTitle>
          <DialogDescription>Invite friends privately or make the trip publicly viewable.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Public toggle */}
          <div className="flex items-center justify-between rounded-xl border border-border p-3">
            <div>
              <div className="font-medium flex items-center gap-2">
                {trip.isPublic ? <Globe className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4" />}
                {trip.isPublic ? 'Public' : 'Private'}
              </div>
              <p className="text-xs text-muted-foreground">
                {trip.isPublic ? 'Anyone with the link can view this trip.' : 'Only people you invite can view this trip.'}
              </p>
            </div>
            <Switch
              checked={trip.isPublic}
              onCheckedChange={v => { update({ isPublic: v }); toast.success(v ? 'Trip is now public' : 'Trip is now private'); }}
            />
          </div>

          {/* Invite from friends */}
          <div className="rounded-xl border border-border p-3">
            <div className="font-medium flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Invite a friend</div>
            {friends.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                No friends yet. <a href="/app/friends" className="text-primary hover:underline">Add some</a> to invite them in one click.
              </p>
            ) : (
              <ul className="mt-2 max-h-40 overflow-auto divide-y divide-border">
                {friends.map(f => {
                  const already = sharedWith.includes(f.email);
                  return (
                    <li key={f.email} className="flex items-center justify-between py-2">
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{f.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{f.email}</div>
                      </div>
                      <Button size="sm" variant={already ? 'outline' : 'hero'} onClick={() => generate(f.email)} disabled={already}>
                        {already ? 'Has access' : 'Invite'}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="mt-3 flex gap-2">
              <Input
                type="email"
                placeholder="Or enter an email"
                value={invitedEmail}
                onChange={e => setInvitedEmail(e.target.value)}
              />
              <Button variant="outline" onClick={() => {
                const e = invitedEmail.trim().toLowerCase();
                if (!e) { generate(); return; }
                generate(e);
                setInvitedEmail('');
              }}><Mail className="h-4 w-4" /> Invite</Button>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={() => generate()}>
              <Copy className="h-4 w-4" /> Generate open invite link
            </Button>
          </div>

          {/* Active invites */}
          {invites.length > 0 && (
            <div className="rounded-xl border border-border p-3">
              <div className="font-medium text-sm">Active invite links ({invites.length})</div>
              <ul className="mt-2 space-y-2">
                {invites.map(i => (
                  <li key={i.token} className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2">
                    <div className="min-w-0 text-xs">
                      <div className="truncate font-medium">{i.invitedEmail || 'Open invite'}</div>
                      <div className="text-muted-foreground truncate">{inviteUrl(i.token)}</div>
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => { navigator.clipboard.writeText(inviteUrl(i.token)); toast.success('Copied'); }} aria-label="Copy">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => { revokeInvite(trip.id, i.token); refresh(); toast.success('Invite revoked'); }} aria-label="Revoke">
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Has access */}
          {sharedWith.length > 0 && (
            <div className="rounded-xl border border-border p-3">
              <div className="font-medium text-sm">People with access ({sharedWith.length})</div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {sharedWith.map(e => (
                  <li key={e} className="flex items-center gap-1 rounded-full border border-border bg-muted/40 px-2 py-1 text-xs">
                    <span>{e}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => { unshareWith(trip.id, e); refresh(); toast.success('Access removed'); }}
                      aria-label="Remove access"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
