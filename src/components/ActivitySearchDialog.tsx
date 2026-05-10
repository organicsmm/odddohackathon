import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import { ACTIVITY_TEMPLATES } from '@/lib/catalog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Activity } from '@/lib/types';
import { uid } from '@/lib/store';

export default function ActivitySearchDialog({
  trigger,
  onAdd,
}: {
  trigger: React.ReactNode;
  onAdd: (a: Activity) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>('all');
  const cats = ['all', ...Array.from(new Set(ACTIVITY_TEMPLATES.map(a => a.category)))];
  const list = ACTIVITY_TEMPLATES.filter(a =>
    (cat === 'all' || a.category === cat) &&
    (!q || a.name.toLowerCase().includes(q.toLowerCase()) || a.category.includes(q.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="font-display">Add activity</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search activities" className="pl-9" />
            </div>
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                {cats.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All types' : c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="max-h-72 overflow-y-auto rounded-xl border border-border">
            {list.map((a, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border/60 p-3 last:border-0 hover:bg-muted/50">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-muted-foreground">{a.category} · {a.durationHours}h · ${a.cost}</div>
                </div>
                <Button size="sm" variant="hero" onClick={() => { onAdd({ ...a, id: uid() }); setOpen(false); }}>
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
