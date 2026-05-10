import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { upsertTrip, newTrip } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plane } from 'lucide-react';
import { Heading, Lead, Eyebrow } from '@/components/ui/typography';

const schema = z.object({
  name: z.string().trim().min(2, 'Name too short').max(80),
  description: z.string().trim().max(500).optional(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().nonnegative().optional(),
  cover: z.string().url().optional().or(z.literal('')),
});

export default function CreateTrip() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const today = new Date().toISOString().slice(0, 10);
  const week = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(week);
  const [budget, setBudget] = useState<string>('');
  const [cover, setCover] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = schema.parse({
        name, description, startDate, endDate,
        budget: budget ? Number(budget) : undefined,
        cover,
      });
      if (new Date(data.endDate) < new Date(data.startDate)) throw new Error('End date must be after start date');
      const t = newTrip(user!.email, { ...data, cover: data.cover || undefined });
      upsertTrip(t);
      toast.success('Trip created — let\'s build the itinerary!');
      navigate(`/app/trips/${t.id}`);
    } catch (err: unknown) {
      const msg = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast.error(msg);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-hero shadow-glow">
          <Plane className="h-6 w-6 text-primary-foreground" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Create new trip</h1>
          <p className="text-muted-foreground">Start with the basics — you can always edit later.</p>
        </div>
      </div>

      <Card variant="premium" className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Trip name *</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Summer in Greek Islands" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="A 10-day island-hopping adventure with friends." rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start date *</Label>
              <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End date *</Label>
              <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input id="budget" type="number" min={0} value={budget} onChange={e => setBudget(e.target.value)} placeholder="2000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cover">Cover image URL</Label>
              <Input id="cover" value={cover} onChange={e => setCover(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" variant="premium" size="lg">Create trip</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
