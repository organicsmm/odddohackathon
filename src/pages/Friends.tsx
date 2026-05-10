import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Trash2, Users, MapPinned, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { addFriend, removeFriend, tripsSharedWithMe, loadTrips } from '@/lib/store';
import type { Friend, Trip } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Friends() {
  const { user, refresh } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const h = () => setTick(t => t + 1);
    window.addEventListener('traveloop:trips-changed', h);
    window.addEventListener('traveloop:auth-changed', h);
    return () => {
      window.removeEventListener('traveloop:trips-changed', h);
      window.removeEventListener('traveloop:auth-changed', h);
    };
  }, []);

  const friends: Friend[] = user?.friends || [];

  const sharedIn = useMemo<Trip[]>(() => (user ? tripsSharedWithMe(user.email) : []), [user, tick]);
  const sharedOut = useMemo<Trip[]>(() => {
    if (!user) return [];
    return loadTrips().filter(t => t.ownerEmail === user.email && (t.sharedWith?.length || 0) > 0);
  }, [user, tick]);

  if (!user) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!clean) return;
    try {
      addFriend(clean, name.trim());
      setEmail(''); setName('');
      refresh();
      toast.success('Friend added');
    } catch (err: any) {
      toast.error(err.message || 'Could not add friend');
    }
  };

  const handleRemove = (e: string) => {
    removeFriend(e);
    refresh();
    toast.success('Friend removed');
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold md:text-4xl">Friends</h1>
        <p className="mt-1 text-muted-foreground">Build your travel circle and share trips privately via invite links.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card variant="premium" className="h-fit p-6">
          <h2 className="font-display text-lg font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" /> Add a friend</h2>
          <form onSubmit={handleAdd} className="mt-4 space-y-3">
            <div>
              <Label htmlFor="f-email">Email</Label>
              <Input id="f-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="friend@example.com" />
            </div>
            <div>
              <Label htmlFor="f-name">Display name (optional)</Label>
              <Input id="f-name" value={name} onChange={e => setName(e.target.value)} placeholder="Alex" />
            </div>
            <Button type="submit" variant="premium" className="w-full"><UserPlus className="h-4 w-4" /> Add friend</Button>
          </form>
        </Card>

        <div className="space-y-6">
          <Card variant="glass" className="p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Your friends ({friends.length})</h2>
            {friends.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No friends yet. Add one to start sharing trips privately.</p>
            ) : (
              <ul className="mt-4 divide-y divide-border">
                {friends.map(f => (
                  <li key={f.email} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" />{f.email}</div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => handleRemove(f.email)} aria-label="Remove">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="glass" className="p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><MapPinned className="h-5 w-5 text-primary" /> Shared with you</h2>
            {sharedIn.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">Nothing yet. Open an invite link from a friend to see their trip here.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {sharedIn.map(t => (
                  <li key={t.id}>
                    <Link to={`/share/${t.shareId}`} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3 transition-smooth hover:bg-muted hover:border-primary/40">
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">From {t.ownerEmail} · {t.stops.length} stops</div>
                      </div>
                      <span className="text-xs font-medium text-primary">View →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card variant="glass" className="p-6">
            <h2 className="font-display text-lg font-bold flex items-center gap-2"><MapPinned className="h-5 w-5 text-primary" /> Trips you're sharing</h2>
            {sharedOut.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">You haven't privately shared any trips yet. Open a trip and use "Share privately".</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {sharedOut.map(t => (
                  <li key={t.id} className="rounded-lg border border-border bg-muted/30 p-3">
                    <div className="flex items-center justify-between">
                      <Link to={`/app/trips/${t.id}`} className="font-medium hover:underline">{t.name}</Link>
                      <Badge variant="secondary" className="text-xs">{(t.sharedWith || []).length} viewer(s)</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                      {(t.sharedWith || []).map(e => (
                        <Badge key={e} variant="outline" className="font-normal">{e}</Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
