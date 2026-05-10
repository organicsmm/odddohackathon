import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Eyebrow, Heading, Muted } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Trash2, Shield, Search, Ban, CheckCircle, Eye, Crown, MapPin,
  Calendar, Wallet, Save,
} from 'lucide-react';
import { toast } from 'sonner';

type Profile = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  banned: boolean;
  plan: string;
  plan_expires_at: string | null;
  notes: string | null;
  created_at: string;
};

type CloudTrip = {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  data: { stops?: { city: string; country: string }[]; budget?: number; description?: string };
  updated_at: string;
};

const PLANS = [
  { value: 'free', label: 'Free', color: 'secondary' as const },
  { value: 'pro', label: 'Pro', color: 'default' as const },
  { value: 'premium', label: 'Premium', color: 'default' as const },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [trips, setTrips] = useState<CloudTrip[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Profile | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: rs }, { data: ts }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role').eq('role', 'admin'),
      supabase.from('trips').select('id, user_id, name, start_date, end_date, data, updated_at'),
    ]);
    setUsers((ps as Profile[]) || []);
    setAdminIds(new Set(((rs as { user_id: string }[]) || []).map(r => r.user_id)));
    setTrips((ts as CloudTrip[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const tripsByUser = useMemo(() => {
    const m: Record<string, CloudTrip[]> = {};
    trips.forEach(t => { (m[t.user_id] ||= []).push(t); });
    return m;
  }, [trips]);

  const filtered = users.filter(u =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) ||
    (u.display_name || '').toLowerCase().includes(q.toLowerCase())
  );

  const toggleBan = async (u: Profile) => {
    const { error } = await supabase.from('profiles').update({ banned: !u.banned }).eq('id', u.id);
    if (error) return toast.error(error.message);
    toast.success(u.banned ? 'Unbanned' : 'Banned');
    load();
  };

  const toggleAdmin = async (u: Profile) => {
    const isAdmin = adminIds.has(u.user_id);
    if (isAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', u.user_id).eq('role', 'admin');
      if (error) return toast.error(error.message);
      toast.success('Admin removed');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: u.user_id, role: 'admin' });
      if (error) return toast.error(error.message);
      toast.success('Promoted to admin');
    }
    load();
  };

  const removeUser = async (u: Profile) => {
    if (!confirm(`Delete profile and all trips for ${u.email}?`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', u.id);
    if (error) return toast.error(error.message);
    toast.success('Profile deleted');
    setSelected(null);
    load();
  };

  const updatePlan = async (u: Profile, plan: string) => {
    const expires = plan === 'free'
      ? null
      : new Date(Date.now() + 30 * 86400000).toISOString();
    const { error } = await supabase.from('profiles')
      .update({ plan, plan_expires_at: expires }).eq('id', u.id);
    if (error) return toast.error(error.message);
    toast.success(`Plan changed to ${plan}`);
    setSelected(s => s && s.id === u.id ? { ...s, plan, plan_expires_at: expires } : s);
    load();
  };

  const saveNotes = async (u: Profile, notes: string) => {
    const { error } = await supabase.from('profiles').update({ notes }).eq('id', u.id);
    if (error) return toast.error(error.message);
    toast.success('Notes saved');
    setSelected(s => s && s.id === u.id ? { ...s, notes } : s);
    load();
  };

  const planBadge = (plan: string) => {
    const p = PLANS.find(x => x.value === plan) || PLANS[0];
    return (
      <Badge variant={p.color} className="gap-1">
        {plan !== 'free' && <Crown className="h-3 w-3" />} {p.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Eyebrow>People</Eyebrow>
          <Heading level={1} weight="bold">Users</Heading>
          <Muted className="text-sm">{users.length} total · {trips.length} trips synced</Muted>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="Search email or name…" className="pl-9" />
        </div>
      </header>

      <Card variant="premium" className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center"><Muted>Loading…</Muted></div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center"><Muted>No users found.</Muted></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Trips</th>
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(u => {
                  const userTrips = tripsByUser[u.user_id] || [];
                  return (
                    <tr key={u.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero text-xs font-bold text-primary-foreground">
                            {(u.display_name || u.email).charAt(0).toUpperCase()}
                          </span>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{u.display_name || u.email.split('@')[0]}</div>
                            <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{planBadge(u.plan)}</td>
                      <td className="px-4 py-3 tabular-nums">{userTrips.length}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {adminIds.has(u.user_id) && <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" /> Admin</Badge>}
                          {u.banned && <Badge variant="destructive">Banned</Badge>}
                          {!adminIds.has(u.user_id) && !u.banned && <Badge variant="secondary">Active</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(u)} title="View details">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleAdmin(u)} title={adminIds.has(u.user_id) ? 'Demote' : 'Make admin'}>
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => toggleBan(u)} title={u.banned ? 'Unban' : 'Ban'}>
                            {u.banned ? <CheckCircle className="h-4 w-4 text-success" /> : <Ban className="h-4 w-4 text-warning" />}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => removeUser(u)} title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <UserDetailDialog
        user={selected}
        trips={selected ? (tripsByUser[selected.user_id] || []) : []}
        isAdmin={selected ? adminIds.has(selected.user_id) : false}
        onClose={() => setSelected(null)}
        onPlanChange={updatePlan}
        onSaveNotes={saveNotes}
        planBadge={planBadge}
      />
    </div>
  );
}

function UserDetailDialog({
  user, trips, isAdmin, onClose, onPlanChange, onSaveNotes, planBadge,
}: {
  user: Profile | null;
  trips: CloudTrip[];
  isAdmin: boolean;
  onClose: () => void;
  onPlanChange: (u: Profile, plan: string) => void;
  onSaveNotes: (u: Profile, notes: string) => void;
  planBadge: (plan: string) => React.ReactNode;
}) {
  const [notes, setNotes] = useState('');
  useEffect(() => { setNotes(user?.notes || ''); }, [user]);

  if (!user) return null;

  const totalBudget = trips.reduce((sum, t) => sum + (t.data?.budget || 0), 0);
  const totalStops = trips.reduce((sum, t) => sum + (t.data?.stops?.length || 0), 0);
  const allCities = Array.from(new Set(
    trips.flatMap(t => (t.data?.stops || []).map(s => `${s.city}, ${s.country}`))
  ));

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-hero text-sm font-bold text-primary-foreground">
              {(user.display_name || user.email).charAt(0).toUpperCase()}
            </span>
            <div>
              <div>{user.display_name || user.email.split('@')[0]}</div>
              <div className="text-xs font-normal text-muted-foreground">{user.email}</div>
            </div>
          </DialogTitle>
          <DialogDescription>Full profile, trip history, and subscription management.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Trips" value={trips.length.toString()} />
            <Stat label="Stops" value={totalStops.toString()} />
            <Stat label="Cities" value={allCities.length.toString()} />
            <Stat label="Total budget" value={`$${totalBudget.toLocaleString()}`} />
          </div>

          {/* Subscription */}
          <Card variant="premium" className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Subscription</div>
                <div className="flex items-center gap-2">
                  {planBadge(user.plan)}
                  {user.plan_expires_at && (
                    <Muted className="text-xs">
                      expires {new Date(user.plan_expires_at).toLocaleDateString()}
                    </Muted>
                  )}
                </div>
              </div>
              <Select value={user.plan} onValueChange={(v) => onPlanChange(user, v)}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PLANS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Account info */}
          <Card variant="premium" className="p-4 space-y-2 text-sm">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Account</div>
            <Row label="User ID" value={<code className="text-xs">{user.user_id}</code>} />
            <Row label="Joined" value={new Date(user.created_at).toLocaleString()} />
            <Row label="Status" value={
              <div className="flex gap-1">
                {isAdmin && <Badge variant="default" className="gap-1"><Shield className="h-3 w-3" />Admin</Badge>}
                {user.banned ? <Badge variant="destructive">Banned</Badge> : <Badge variant="secondary">Active</Badge>}
              </div>
            } />
          </Card>

          {/* Trips */}
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
              Trips ({trips.length})
            </div>
            {trips.length === 0 ? (
              <Card className="p-6 text-center"><Muted>No trips yet.</Muted></Card>
            ) : (
              <div className="space-y-2">
                {trips.map(t => {
                  const stops = t.data?.stops || [];
                  return (
                    <Card key={t.id} className="p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {t.start_date && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />{t.start_date} → {t.end_date}
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{stops.length} stops
                            </span>
                            {t.data?.budget != null && (
                              <span className="inline-flex items-center gap-1">
                                <Wallet className="h-3 w-3" />${t.data.budget}
                              </span>
                            )}
                          </div>
                          {stops.length > 0 && (
                            <div className="mt-1.5 text-xs text-foreground/80">
                              {stops.map(s => `${s.city}, ${s.country}`).join(' → ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin notes */}
          <Card variant="premium" className="p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Admin notes</div>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Internal notes about this user (only admins can see)…"
              rows={3}
            />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={() => onSaveNotes(user, notes)} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Save notes
              </Button>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
