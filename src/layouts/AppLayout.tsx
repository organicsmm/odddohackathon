import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Plane, LayoutDashboard, MapPinned, Plus, User as UserIcon, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logout } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const links = [
  { to: '/app', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/app/trips', label: 'My Trips', icon: MapPinned },
  { to: '/app/new', label: 'New Trip', icon: Plus },
  { to: '/app/friends', label: 'Friends', icon: Users },
  { to: '/app/profile', label: 'Profile', icon: UserIcon },
];

export default function AppLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/login', { replace: true });
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link to="/app" className="flex items-center gap-2 font-display text-xl font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
              <Plane className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="text-gradient">Traveloop</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-smooth ${
                    isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <l.icon className="h-4 w-4" />
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden text-sm text-muted-foreground sm:inline">Hi, {user.name.split(' ')[0]}</span>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login'); }} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container py-6 md:py-10 animate-fade-in">
        <Outlet />
      </main>
      <nav className="fixed bottom-3 left-1/2 z-40 flex -translate-x-1/2 gap-1 rounded-2xl border border-border/60 bg-background/90 p-1.5 shadow-elegant backdrop-blur md:hidden">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `grid h-11 w-14 place-items-center rounded-xl text-xs ${isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`
            }
          >
            <l.icon className="h-5 w-5" />
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
