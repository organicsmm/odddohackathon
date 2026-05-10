import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Display, Eyebrow, Heading, Lead, Muted } from "@/components/ui/typography";
import { z } from 'zod';
import { Plane, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import heroImg from '@/assets/hero-travel.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { login, signup } from '@/lib/store';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email').max(255),
  password: z.string().min(6, 'Min 6 characters').max(72),
});
const signupSchema = loginSchema.extend({
  name: z.string().trim().min(2, 'Name too short').max(60),
});

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        signupSchema.parse({ email, password, name });
        signup(email, password, name);
        toast.success('Welcome aboard ✈️');
      } else {
        loginSchema.parse({ email, password });
        login(email, password);
        toast.success('Welcome back!');
      }
      refresh();
      const pending = sessionStorage.getItem('traveloop:pending-invite');
      if (pending) {
        sessionStorage.removeItem('traveloop:pending-invite');
        navigate(`/invite/${pending}`);
      } else {
        navigate('/app');
      }
    } catch (err: unknown) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Editorial side */}
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="Tropical travel destination" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/85 via-primary/55 to-accent/70" />
        <div aria-hidden className="absolute -top-40 -left-20 h-[400px] w-[400px] rounded-full bg-white/10 blur-[120px]" />
        <div aria-hidden className="absolute -bottom-40 -right-20 h-[400px] w-[400px] rounded-full bg-white/10 blur-[140px]" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold font-display">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-md ring-1 ring-white/20">
              <Plane className="h-5 w-5" />
            </span>
            Traveloop
          </Link>
          <div>
            <Eyebrow className="!text-primary-foreground/80">A new era of trip planning</Eyebrow>
            <Display gradient={false} className="mt-3 !text-primary-foreground drop-shadow-lg">
              Dream it.<br />Plan it.<br />Travel it.
            </Display>
            <Lead className="mt-5 max-w-md !text-primary-foreground/90">
              Personalized multi-city itineraries, smart budgets, and shareable plans — crafted with the polish of a luxury travel magazine.
            </Lead>

            <div className="mt-8 grid gap-3 max-w-md">
              {[
                { icon: Sparkles, label: 'AI-built day-by-day itineraries' },
                { icon: ShieldCheck, label: 'Free forever — no credit card' },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-3 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-md ring-1 ring-white/15">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15"><b.icon className="h-4 w-4" /></span>
                  <span className="text-sm font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <Muted className="!text-primary-foreground/70 text-xs">
            "Like having a private travel concierge in my pocket." — Aanya M.
          </Muted>
        </div>
      </div>

      {/* Form side */}
      <div className="relative flex items-center justify-center bg-gradient-aurora p-6 sm:p-10">
        <div aria-hidden className="absolute inset-0 bg-gradient-subtle opacity-60" />
        <div className="relative w-full max-w-md animate-scale-in">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-xl font-display font-bold text-gradient">Traveloop</span>
          </Link>

          <Card variant="premium" className="p-8">
            <Eyebrow>{mode === 'login' ? 'Welcome back' : 'Get started'}</Eyebrow>
            <Heading level={2} className="mt-2" weight="bold">
              {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
            </Heading>
            <Muted className="mt-2 text-sm">
              {mode === 'login' ? 'Pick up where you left off.' : 'Start planning your next adventure in seconds.'}
            </Muted>

            <form onSubmit={onSubmit} className="mt-7 space-y-4">
              {mode === 'signup' && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" required autoComplete="name" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@traveloop.com" required autoComplete="email" />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'login' && (
                    <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => toast.info('Reset via Profile after login (demo).')}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
              <Button type="submit" variant="premium" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>
            <Button variant="outline" size="lg" className="w-full" type="button" onClick={() => toast.info('Social sign-in coming soon')}>
              Continue with email link
            </Button>

            <Muted className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <>New to Traveloop? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></>
              ) : (
                <>Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></>
              )}
            </Muted>
          </Card>

          <Muted className="mt-6 text-center text-xs">
            By continuing you agree to our terms. We never share your data.
          </Muted>
        </div>
      </div>
    </div>
  );
}
