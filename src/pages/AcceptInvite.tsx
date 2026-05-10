import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plane, Check, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { findInvite, acceptInvite } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Heading, Lead, Eyebrow, Text } from '@/components/ui/typography';

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const found = token ? findInvite(token) : undefined;

  useEffect(() => {
    if (!user && token) {
      sessionStorage.setItem('traveloop:pending-invite', token);
    }
  }, [user, token]);

  if (!found) {
    return (
      <Shell>
        <Card variant="premium" className="p-8 text-center">
          <X className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Invite not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">This invite link is invalid or has been revoked.</p>
          <Button asChild variant="premium" className="mt-6"><Link to="/">Go home</Link></Button>
        </Card>
      </Shell>
    );
  }

  const { trip, invite } = found;

  if (!user) {
    return (
      <Shell>
        <Card variant="aurora" className="p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">You're invited to "{trip.name}"</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in or create an account to view this private trip.</p>
          <div className="mt-6 flex justify-center gap-2">
            <Button asChild variant="premium"><Link to="/login">Log in</Link></Button>
            <Button asChild variant="glass"><Link to="/signup">Sign up</Link></Button>
          </div>
        </Card>
      </Shell>
    );
  }

  if (invite.invitedEmail && invite.invitedEmail !== user.email) {
    return (
      <Shell>
        <Card variant="premium" className="p-8 text-center">
          <X className="mx-auto h-10 w-10 text-destructive" />
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Wrong account</h1>
          <p className="mt-2 text-sm text-muted-foreground">This invite was sent to <strong>{invite.invitedEmail}</strong>. You're signed in as {user.email}.</p>
          <Button asChild variant="outline" className="mt-6"><Link to="/app">Back to app</Link></Button>
        </Card>
      </Shell>
    );
  }

  const accept = () => {
    setStatus('accepting');
    try {
      acceptInvite(invite.token, user.email);
      sessionStorage.removeItem('traveloop:pending-invite');
      toast.success('Trip added to your shared list');
      setStatus('done');
      navigate(`/share/${trip.shareId}`);
    } catch (e: any) {
      toast.error(e.message || 'Could not accept invite');
      setStatus('error');
    }
  };

  return (
    <Shell>
      <Card variant="aurora" className="p-8 text-center">
        <Lock className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">Private trip invitation</h1>
        <p className="mt-1 text-muted-foreground">{trip.ownerEmail} invited you to view</p>
        <p className="mt-1 font-display text-xl font-semibold">"{trip.name}"</p>
        <p className="mt-2 text-sm text-muted-foreground">{trip.stops.length} stops · {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}</p>
        <Button variant="premium" size="lg" className="mt-6" onClick={accept} disabled={status === 'accepting'}>
          <Check className="h-4 w-4" /> Accept and view
        </Button>
      </Card>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="container flex h-16 items-center">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow"><Plane className="h-5 w-5 text-primary-foreground" /></span>
          <span className="text-gradient">Traveloop</span>
        </Link>
      </header>
      <section className="container max-w-lg py-12">{children}</section>
    </div>
  );
}
