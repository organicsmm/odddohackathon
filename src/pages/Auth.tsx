import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { z } from 'zod';
import { Plane } from 'lucide-react';
import heroImg from '@/assets/hero-travel.jpg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
      navigate('/app');
    } catch (err: unknown) {
      const message = err instanceof z.ZodError ? err.errors[0].message : (err as Error).message;
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block">
        <img src={heroImg} alt="Tropical travel destination" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/30 to-accent/60" />
        <div className="relative z-10 flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold font-display">
            <Plane className="h-7 w-7" /> Traveloop
          </Link>
          <div>
            <h1 className="text-5xl font-display font-extrabold leading-tight drop-shadow">
              Dream it.<br />Plan it.<br />Travel it.
            </h1>
            <p className="mt-4 max-w-md text-lg opacity-90">
              Personalized multi-city itineraries, smart budgets and shareable plans — all in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-scale-in">
          <Link to="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-xl font-display font-bold text-gradient">Traveloop</span>
          </Link>
          <h2 className="text-3xl font-display font-bold">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
          <p className="mt-2 text-muted-foreground">
            {mode === 'login' ? 'Pick up where you left off.' : 'Start planning your next adventure.'}
          </p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === 'signup' && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ada Lovelace" required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@traveloop.com" required />
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === 'login' && (
                  <button type="button" className="text-xs text-primary hover:underline" onClick={() => toast.info('Reset via Profile after login (demo).')}>
                    Forgot password?
                  </button>
                )}
              </div>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
              {mode === 'login' ? 'Log in' : 'Create account'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === 'login' ? (
              <>New to Traveloop? <Link to="/signup" className="font-medium text-primary hover:underline">Sign up</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="font-medium text-primary hover:underline">Log in</Link></>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
