import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Eyebrow, Heading, Muted } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Search, Calendar, MapPin } from 'lucide-react';
import { toast } from 'sonner';

type CloudTrip = {
  id: string;
  user_id: string;
  client_trip_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  data: { stops?: { city: string; country: string }[]; budget?: number };
  created_at: string;
  updated_at: string;
};

type ProfileLite = { user_id: string; email: string; display_name: string | null };

export default function AdminTrips() {
  const [trips, setTrips] = useState<CloudTrip[]>([]);
  const [profilesById, setProfilesById] = useState<Record<string, ProfileLite>>({});
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data: tData } = await supabase.from('trips').select('*').order('updated_at', { ascending: false });
    setTrips((tData as CloudTrip[]) || []);
    const ids = Array.from(new Set(((tData as CloudTrip[]) || []).map(t => t.user_id)));
    if (ids.length) {
      const { data: pData } = await supabase.from('profiles').select('user_id, email, display_name').in('user_id', ids);
      const map: Record<string, ProfileLite> = {};
      ((pData as ProfileLite[]) || []).forEach(p => { map[p.user_id] = p; });
      setProfilesById(map);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = trips.filter(t => {
    if (!q) return true;
    const owner = profilesById[t.user_id];
    const haystack = [t.name, owner?.email, owner?.display_name, ...(t.data?.stops || []).map(s => `${s.city} ${s.country}`)].join(' ').toLowerCase();
    return haystack.includes(q.toLowerCase());
  });

  const removeTrip = async (t: CloudTrip) => {
    if (!confirm(`Delete trip "${t.name}"?`)) return;
    const { error } = await supabase.from('trips').delete().eq('id', t.id);
    if (error) return toast.error(error.message);
    toast.success('Trip deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Eyebrow>Trips</Eyebrow>
          <Heading level={1} weight="bold">All trips</Heading>
          <Muted className="text-sm">{trips.length} synced from users</Muted>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search trip, owner, city…" className="pl-9" />
        </div>
      </header>

      {loading ? (
        <Muted>Loading…</Muted>
      ) : filtered.length === 0 ? (
        <Card variant="premium" className="p-8 text-center">
          <Muted>No trips yet. Trips are synced when users save them while logged in.</Muted>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(t => {
            const owner = profilesById[t.user_id];
            const stops = t.data?.stops || [];
            return (
              <Card key={t.id} variant="premium" className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Heading level={3} className="!text-lg truncate">{t.name}</Heading>
                    <Muted className="text-xs truncate">{owner?.email || 'Unknown owner'}</Muted>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => removeTrip(t)} aria-label="Delete">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {t.start_date && (
                    <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" /> {t.start_date} → {t.end_date}</Badge>
                  )}
                  <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> {stops.length} stops</Badge>
                  {t.data?.budget && <Badge variant="secondary">${t.data.budget}</Badge>}
                </div>
                {stops.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    {stops.slice(0, 4).map(s => `${s.city}`).join(' · ')}{stops.length > 4 && ' +…'}
                  </div>
                )}
                <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">
                  Updated {new Date(t.updated_at).toLocaleString()}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
