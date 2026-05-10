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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
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

  const goNext = () => {
    const pending = sessionStorage.getItem('traveloop:pending-invite');
    if (pending) {
      sessionStorage.removeItem('traveloop:pending-invite');
      navigate(`/invite/${pending}`);
    } else {
      navigate('/app');
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === 'signup') {
        signupSchema.parse({ email, password, name });
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/app`,
            data: { full_name: name },
          },
        });
        if (error) throw error;
        toast.success('Welcome aboard ✈️ Check your email to verify.');
      } else {
        loginSchema.parse({ email, password });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success('Welcome back!');
      }
      refresh();
      goNext();
    } catch (err: unknown) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const onGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/app` },
      });
      if (error) {
        toast.error(error.message || 'Google sign-in failed');
        setBusy(false);
      }
    } catch (err) {
      toast.error((err as Error).message || 'Google sign-in failed');
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
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
              Personalized multi-city itineraries, smart budgets, and shareable plans.
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

            <Button variant="outline" size="lg" className="w-full mt-6" type="button" disabled={busy} onClick={onGoogle}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="my-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={onSubmit} className="space-y-4">
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
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
              </div>
              <Button type="submit" variant="premium" size="lg" className="w-full" disabled={busy}>
                {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <Muted className="mt-6 text-center text-sm">
              {mode === 'login' ? (
                <>New to Traveloop? <Link to="/signup" className="font-semibold text-primary hover:underline">Sign up</Link></>
              ) : (
                <>Already have an account? <Link to="/login" className="font-semibold text-primary hover:underline">Log in</Link></>
              )}
            </Muted>
          </Card>

          <Muted className="mt-6 text-center text-xs">
            By continuing you agree to our terms.
          </Muted>
        </div>
      </div>
    </div>
  );
}
