import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Eyebrow, Heading, Lead, Muted, Text } from "@/components/ui/typography";
import { Plane, Check, X, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { findInvite, acceptInvite } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
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
          <Heading level={2} className="mt-3" weight="bold">Invite not found</Heading>
          <Muted className="mt-2 text-sm">This invite link is invalid or has been revoked.</Muted>
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
          <Heading level={2} className="mt-3" weight="bold">You're invited to "{trip.name}"</Heading>
          <Muted className="mt-2 text-sm">Sign in or create an account to view this private trip.</Muted>
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
          <Heading level={2} className="mt-3" weight="bold">Wrong account</Heading>
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
        <Heading level={2} className="mt-3" weight="bold">Private trip invitation</Heading>
        <Muted className="mt-1">{trip.ownerEmail} invited you to view</Muted>
        <Heading level={3} className="mt-1" weight="semibold">"{trip.name}"</Heading>
        <Muted className="mt-2 text-sm">{trip.stops.length} stops · {new Date(trip.startDate).toLocaleDateString()} → {new Date(trip.endDate).toLocaleDateString()}</Muted>
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
