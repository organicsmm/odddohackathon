import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { CITIES } from '@/lib/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Picked = { city: string; country: string; startDate: string; endDate: string };

export default function CitySearchDialog({
  trigger,
  onAdd,
  defaultStart,
  defaultEnd,
}: {
  trigger: React.ReactNode;
  onAdd: (p: Picked) => void;
  defaultStart: string;
  defaultEnd: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [region, setRegion] = useState<string>('all');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);

  const regions = ['all', ...Array.from(new Set(CITIES.map(c => c.region)))];
  const filtered = CITIES.filter(c =>
    (region === 'all' || c.region === region) &&
    (!q || c.city.toLowerCase().includes(q.toLowerCase()) || c.country.toLowerCase().includes(q.toLowerCase()) || c.tags.some(t => t.includes(q.toLowerCase())))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="font-display">Add a stop</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search city, country or vibe (beach, food...)" className="pl-9" />
            </div>
            <Select value={region} onValueChange={setRegion}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {regions.map(r => <SelectItem key={r} value={r}>{r === 'all' ? 'All regions' : r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Arrive</label>
              <Input type="date" value={start} onChange={e => setStart(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Leave</label>
              <Input type="date" value={end} onChange={e => setEnd(e.target.value)} />
            </div>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            {filtered.length === 0 && <div className="p-6 text-center text-sm text-muted-foreground">No matches.</div>}
            {filtered.map(c => (
              <div key={c.city} className="flex items-center justify-between border-b border-border/60 p-3 last:border-0 hover:bg-muted/50">
                <div>
                  <div className="font-medium">{c.city}, <span className="text-muted-foreground font-normal">{c.country}</span></div>
                  <div className="text-xs text-muted-foreground">{c.region} · {c.tags.join(', ')}</div>
                </div>
                <Button size="sm" variant="hero" onClick={() => { onAdd({ city: c.city, country: c.country, startDate: start, endDate: end }); setOpen(false); }}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
