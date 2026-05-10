import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Plane, LayoutDashboard, MapPinned, Plus, User as UserIcon, LogOut, Users, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import BuildStatusBadge from '@/components/dev/BuildStatusBadge';

const links = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/trips', label: 'My Trips', icon: MapPinned },
  { to: '/app/new', label: 'New Trip', icon: Plus },
  { to: '/app/friends', label: 'Friends', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
];

export default function AppLayout() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/app" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-gradient">Traveloop</span>
          </Link>

          {/* Pill nav */}
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 shadow-ring backdrop-blur">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-spring ${
                    isActive
                      ? 'bg-gradient-hero text-primary-foreground shadow-soft'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>

          {/* User chip */}
          <div className="flex items-center gap-2">
            {import.meta.env.DEV && <BuildStatusBadge />}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-2 py-1 shadow-ring backdrop-blur">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-hero text-xs font-bold text-primary-foreground">
                {initial}
              </span>
              <span className="pr-1 text-xs font-medium text-foreground">
                {user.name?.split(' ')[0] || user.email?.split('@')[0]}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container pb-28 pt-6 md:pb-10 md:pt-10 animate-fade-in">
        <Outlet />
      </main>

      {/* Floating mobile nav */}
      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-2xl border border-border/60 bg-background/80 p-1.5 shadow-elegant backdrop-blur-xl md:hidden">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `grid h-11 w-14 place-items-center rounded-xl text-xs transition-spring ${
                isActive ? 'bg-gradient-hero text-primary-foreground shadow-soft' : 'text-muted-foreground'
              }`
            }
            aria-label={l.label}
          >
            <l.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
