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
import { useAuth } from '@/contexts/AuthContext';
import { getTrip, upsertTrip, uid, tripCost, stopDays, tripDays, resequenceStops, createInvite, revokeInvite, unshareWith } from '@/lib/store';
import type { Trip, Stop, Activity, Note, PackItem, Friend } from '@/lib/types';
import { Button } from '@/components/ui/button';
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

export default function TripDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | undefined>(getTrip(id!));

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

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => navigate('/app/trips')}><ChevronLeft className="h-4 w-4" /> Back to trips</Button>

      <header className="overflow-hidden rounded-3xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant md:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider opacity-90">
              <Calendar className="h-3 w-3" /> {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}
              <span>·</span> {tripDays(trip)} days <span>·</span> {trip.stops.length} stops
            </div>
            <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight md:text-5xl">{trip.name}</h1>
            {trip.description && <p className="mt-2 max-w-2xl opacity-90">{trip.description}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => {
              update({ isPublic: !trip.isPublic });
              toast.success(trip.isPublic ? 'Trip is now private' : 'Trip is now public');
            }}>
              {trip.isPublic ? <><Globe className="h-4 w-4" /> Public</> : <><Lock className="h-4 w-4" /> Private</>}
            </Button>
            <Button variant="secondary" onClick={() => {
              const url = `${window.location.origin}/share/${trip.shareId}`;
              navigator.clipboard.writeText(url);
              toast.success('Share link copied!');
            }}><Share2 className="h-4 w-4" /> Copy link</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary"><Download className="h-4 w-4" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => { exportTripPDF(trip); toast.success('PDF downloaded'); }}>
                  <FileText className="h-4 w-4 mr-2" /> Download PDF summary
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { exportTripCSV(trip); toast.success('CSV downloaded'); }}>
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

        {/* budget bar */}
        <div className="mt-6 rounded-2xl bg-white/15 p-4 backdrop-blur">
          <div className="flex items-center justify-between text-sm">
            <span className="opacity-90">Estimated cost</span>
            <span className="font-display text-2xl font-bold">${cost.total.toLocaleString()}</span>
          </div>
          {trip.budget ? (
            <>
              <Progress value={Math.min(100, (cost.total / trip.budget) * 100)} className="mt-2 h-2 bg-white/30" />
              <div className="mt-1 flex justify-between text-xs opacity-90">
                <span>Budget: ${trip.budget.toLocaleString()}</span>
                <span className={overBudget ? 'font-bold' : ''}>{overBudget ? `Over by $${(cost.total - trip.budget).toLocaleString()}` : `$${(trip.budget - cost.total).toLocaleString()} left`}</span>
              </div>
            </>
          ) : (
            <p className="mt-1 text-xs opacity-80">Set a budget in Settings to track spending.</p>
          )}
        </div>
      </header>

      {trip.stops.length > 0 && <RouteTimeline stops={trip.stops} />}
      {trip.stops.length > 0 && <RouteMap stops={trip.stops} />}

      <Tabs defaultValue="itinerary" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 sm:w-auto">
          <TabsTrigger value="itinerary"><MapIcon className="h-4 w-4 mr-1" />Itinerary</TabsTrigger>
          <TabsTrigger value="budget"><Wallet className="h-4 w-4 mr-1" />Budget</TabsTrigger>
          <TabsTrigger value="packing"><ListChecks className="h-4 w-4 mr-1" />Packing</TabsTrigger>
          <TabsTrigger value="notes"><StickyNote className="h-4 w-4 mr-1" />Notes</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="itinerary" className="mt-6"><Itinerary trip={trip} update={update} /></TabsContent>
        <TabsContent value="budget" className="mt-6"><BudgetView trip={trip} update={update} /></TabsContent>
        <TabsContent value="packing" className="mt-6"><Packing trip={trip} update={update} /></TabsContent>
        <TabsContent value="notes" className="mt-6"><Notes trip={trip} update={update} /></TabsContent>
        <TabsContent value="settings" className="mt-6"><Settings trip={trip} update={update} onDelete={() => navigate('/app/trips')} /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------- ITINERARY ------------------- */

function Itinerary({ trip, update }: { trip: Trip; update: (p: Partial<Trip> | ((t: Trip) => Trip)) => void }) {
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
          <button onClick={() => setView('calendar')} className={`rounded-md px-3 py-1 text-sm ${view === 'calendar' ? 'bg-card shadow-soft font-medium' : 'text-muted-foreground'}`}>Calendar</button>
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
          <h3 className="text-xl font-display font-semibold">No stops yet</h3>
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
                  <SortableStopCard
                    key={s.id} stop={s} index={i}
                    onRemove={removeStop} onUpdate={updateStop} onSetDuration={setDuration}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </>
      ) : (
        <CalendarView trip={trip} />
      )}
    </div>
  );
}

function SortableStopCard(props: {
  stop: Stop; index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, p: Partial<Stop>) => void;
  onSetDuration: (id: string, days: number) => void;
}) {
  const { stop } = props;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto' as const,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <StopCard {...props} dragHandle={{ ...attributes, ...listeners }} />
    </div>
  );
}

function StopCard({ stop, index, onRemove, onUpdate, onSetDuration, dragHandle }: {
  stop: Stop; index: number;
  onRemove: (id: string) => void;
  onUpdate: (id: string, p: Partial<Stop>) => void;
  onSetDuration: (id: string, days: number) => void;
  dragHandle?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const days = stopDays(stop);
  const stopTotal =
    (stop.costs.stay || 0) * Math.max(0, days - 1) +
    (stop.costs.meals || 0) * days +
    (stop.costs.transport || 0) +
    stop.activities.reduce((a, b) => a + b.cost, 0);

  const addActivity = (a: Activity) => onUpdate(stop.id, { activities: [...stop.activities, a] });
  const removeActivity = (aid: string) => onUpdate(stop.id, { activities: stop.activities.filter(a => a.id !== aid) });

  return (
    <Card className="overflow-hidden border-border/60 shadow-soft">
      <div className="bg-gradient-ocean p-5 text-primary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider opacity-80">Stop {index + 1}</div>
            <h3 className="font-display text-2xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5" /> {stop.city}, <span className="opacity-80 font-normal text-lg">{stop.country}</span></h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-90">
              <span>{new Date(stop.startDate).toLocaleDateString()} → {new Date(stop.endDate).toLocaleDateString()} · {days} day{days > 1 ? 's' : ''}</span>
              <WeatherBadge city={stop.city} date={stop.startDate} />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              {...dragHandle}
              type="button"
              aria-label="Drag to reorder"
              className="cursor-grab active:cursor-grabbing rounded-md p-2 text-primary-foreground hover:bg-white/20 touch-none"
            >
              <GripVertical className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 rounded-md bg-white/15 px-2 py-1 text-xs">
              <Clock className="h-3 w-3" />
              <input
                type="number"
                min={1}
                max={60}
                value={days}
                onChange={e => onSetDuration(stop.id, Number(e.target.value) || 1)}
                className="w-10 bg-transparent text-center font-semibold outline-none"
              />
              <span>day{days > 1 ? 's' : ''}</span>
            </div>
            <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-white/20" onClick={() => onRemove(stop.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>

        </div>
      </div>

      <div className="px-5 pt-5">
        <WeatherForecast city={stop.city} startDate={stop.startDate} endDate={stop.endDate} />
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[1fr_240px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h4 className="font-display font-semibold">Activities</h4>
            <ActivitySearchDialog onAdd={addActivity} trigger={<Button size="sm" variant="soft"><Plus className="h-4 w-4" /> Add activity</Button>} />
          </div>
          {stop.activities.length === 0 && <p className="text-sm text-muted-foreground">No activities yet — add some inspiration!</p>}
          <div className="space-y-2">
            {stop.activities.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft text-accent">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.category} · {a.durationHours}h · ${a.cost}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="time" value={a.time || ''} onChange={e => onUpdate(stop.id, { activities: stop.activities.map(x => x.id === a.id ? { ...x, time: e.target.value } : x) })} className="w-28" />
                  <Button size="icon" variant="ghost" onClick={() => removeActivity(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-xl bg-muted/40 p-4">
          <h4 className="font-display font-semibold text-sm">Stop costs (USD)</h4>
          <CostInput label="Transport" value={stop.costs.transport} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, transport: v } })} />
          <CostInput label="Stay / night" value={stop.costs.stay} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, stay: v } })} />
          <CostInput label="Meals / day" value={stop.costs.meals} onChange={v => onUpdate(stop.id, { costs: { ...stop.costs, meals: v } })} />
          <div className="border-t border-border pt-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Stop total</span><span className="font-display font-bold text-primary">${stopTotal.toLocaleString()}</span></div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function CostInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <Input type="number" min={0} value={value} onChange={e => onChange(Number(e.target.value) || 0)} className="h-9" />
    </div>
  );
}

function CalendarView({ trip }: { trip: Trip }) {
  // Build day map
  const days = useMemo(() => {
    const map: { date: string; stop?: Stop; activities: Activity[] }[] = [];
    const start = new Date(trip.startDate);
    const total = tripDays(trip);
    for (let i = 0; i < total; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const stop = trip.stops.find(s => iso >= s.startDate && iso <= s.endDate);
      // assign activities only to first day for simplicity
      const activities = stop && iso === stop.startDate ? stop.activities : [];
      map.push({ date: iso, stop, activities });
    }
    return map;
  }, [trip]);

  return (
    <div className="space-y-3">
      {days.map((d, i) => (
        <div key={d.date} className="flex gap-4 rounded-xl border border-border bg-card p-4">
          <div className="w-20 shrink-0 text-center">
            <div className="text-xs text-muted-foreground">Day {i + 1}</div>
            <div className="font-display text-2xl font-bold">{new Date(d.date).getDate()}</div>
            <div className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString(undefined, { month: 'short', weekday: 'short' })}</div>
          </div>
          <div className="flex-1 border-l border-border pl-4">
            {d.stop ? (
              <div className="font-display font-semibold flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{d.stop.city}, {d.stop.country}</div>
            ) : (
              <div className="text-muted-foreground italic text-sm">No stop assigned</div>
            )}
            {d.activities.length > 0 && (
              <ul className="mt-2 space-y-1">
                {d.activities.map(a => (
                  <li key={a.id} className="text-sm flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">{a.time || '--:--'}</span>
                    <span>{a.name}</span>
                    <span className="text-xs text-muted-foreground">· ${a.cost}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------- BUDGET ------------------- */

function BudgetView({ trip, update }: { trip: Trip; update: (p: Partial<Trip>) => void }) {
  const cost = tripCost(trip);
  const items = [
    { label: 'Transport', value: cost.transport, color: 'bg-primary' },
    { label: 'Stay', value: cost.stay, color: 'bg-accent' },
    { label: 'Meals', value: cost.meals, color: 'bg-success' },
    { label: 'Activities', value: cost.activities, color: 'bg-warning' },
  ];
  const total = cost.total || 1;
  const days = tripDays(trip);
  const avg = cost.total / days;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-6">
        <h3 className="font-display text-xl font-bold">Cost breakdown</h3>
        <div className="mt-4 flex items-center gap-6">
          {/* SVG donut */}
          <Donut items={items} total={total} />
          <ul className="flex-1 space-y-2">
            {items.map(i => (
              <li key={i.label} className="flex items-center gap-3 text-sm">
                <span className={`h-3 w-3 rounded-full ${i.color}`} />
                <span className="flex-1">{i.label}</span>
                <span className="font-medium">${i.value.toLocaleString()}</span>
                <span className="w-12 text-right text-muted-foreground">{Math.round((i.value / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border pt-4">
          <div><div className="text-xs text-muted-foreground">Total</div><div className="font-display text-2xl font-bold text-primary">${cost.total.toLocaleString()}</div></div>
          <div><div className="text-xs text-muted-foreground">Avg / day</div><div className="font-display text-2xl font-bold">${Math.round(avg).toLocaleString()}</div></div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-display text-xl font-bold">Budget tracker</h3>
        <div className="mt-4 space-y-2">
          <Label htmlFor="budget">Trip budget (USD)</Label>
          <Input id="budget" type="number" min={0} value={trip.budget ?? ''} onChange={e => update({ budget: e.target.value ? Number(e.target.value) : undefined })} placeholder="Set a budget" />
        </div>
        {trip.budget && (
          <div className="mt-4 space-y-2">
            <Progress value={Math.min(100, (cost.total / trip.budget) * 100)} />
            {cost.total > trip.budget ? (
              <p className="text-sm text-destructive font-medium">⚠ Over budget by ${(cost.total - trip.budget).toLocaleString()}</p>
            ) : (
              <p className="text-sm text-success font-medium">✓ ${(trip.budget - cost.total).toLocaleString()} remaining</p>
            )}
          </div>
        )}
        <div className="mt-6">
          <h4 className="font-display font-semibold mb-3">Per-stop spend</h4>
          <div className="space-y-2">
            {trip.stops.map(s => {
              const d = stopDays(s);
              const t = (s.costs.stay || 0) * Math.max(0, d - 1) + (s.costs.meals || 0) * d + (s.costs.transport || 0) + s.activities.reduce((a, b) => a + b.cost, 0);
              return (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary" />{s.city}</span>
                  <span className="font-medium">${t.toLocaleString()}</span>
                </div>
              );
            })}
            {trip.stops.length === 0 && <p className="text-sm text-muted-foreground">No stops yet.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Donut({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  const r = 60, c = 2 * Math.PI * r;
  let acc = 0;
  const colors: Record<string, string> = {
    'bg-primary': 'hsl(var(--primary))',
    'bg-accent': 'hsl(var(--accent))',
    'bg-success': 'hsl(var(--success))',
    'bg-warning': 'hsl(var(--warning))',
  };
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="shrink-0">
      <circle cx="80" cy="80" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="20" />
      {items.map((it, i) => {
        const frac = it.value / total;
        const dash = c * frac;
        const offset = c * (1 - acc);
        acc += frac;
        return (
          <circle key={i} cx="80" cy="80" r={r} fill="none" stroke={colors[it.color]}
            strokeWidth="20" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={offset}
            transform="rotate(-90 80 80)" />
        );
      })}
      <text x="80" y="78" textAnchor="middle" className="fill-foreground font-display font-bold" fontSize="16">${Math.round(total).toLocaleString()}</text>
      <text x="80" y="96" textAnchor="middle" className="fill-muted-foreground" fontSize="10">total</text>
    </svg>
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
          <h3 className="font-display text-xl font-bold">Packing checklist</h3>
          <span className="text-sm text-muted-foreground">{packed} / {total} packed</span>
        </div>
        <Progress value={total ? (packed / total) * 100 : 0} className="mt-3" />
        <div className="mt-6 space-y-6">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <h4 className="font-display font-semibold capitalize text-sm text-muted-foreground mb-2">{category}</h4>
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
        <h3 className="font-display text-lg font-bold">Add item</h3>
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
        <h3 className="font-display text-lg font-bold">New note</h3>
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
                <h4 className="font-display font-semibold">{n.title}</h4>
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
      <h3 className="font-display text-xl font-bold">Trip settings</h3>
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
