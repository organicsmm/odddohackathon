import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Eyebrow, Heading, Muted } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Shield, Search, Ban, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

type Profile = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  banned: boolean;
  created_at: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: ps }, { data: rs }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('user_id, role').eq('role', 'admin'),
    ]);
    setUsers((ps as Profile[]) || []);
    setAdminIds(new Set(((rs as { user_id: string }[]) || []).map(r => r.user_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    !q || u.email.toLowerCase().includes(q.toLowerCase()) || (u.display_name || '').toLowerCase().includes(q.toLowerCase())
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
    if (!confirm(`Delete profile and all trips for ${u.email}? (Auth user remains.)`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', u.id);
    if (error) return toast.error(error.message);
    toast.success('Profile deleted');
    load();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <Eyebrow>People</Eyebrow>
          <Heading level={1} weight="bold">Users</Heading>
          <Muted className="text-sm">{users.length} total</Muted>
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
                  <th className="px-4 py-3 text-left">Joined</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(u => (
                  <tr key={u.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-hero text-xs font-bold text-primary-foreground">
                          {(u.display_name || u.email).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <div className="font-medium">{u.display_name || u.email.split('@')[0]}</div>
                          <div className="text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
