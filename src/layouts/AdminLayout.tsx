import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Shield, LayoutDashboard, Users, MapPinned, Settings, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export default function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/app" replace />;

  const links = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/trips', label: 'Trips', icon: MapPinned },
    { to: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm"><NavLink to="/app"><ArrowLeft className="h-4 w-4" /> App</NavLink></Button>
            <div className="flex items-center gap-2 font-display text-lg font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
                <Shield className="h-5 w-5 text-primary-foreground" />
              </span>
              <span className="text-gradient">Admin</span>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1 rounded-full border border-border/60 bg-card/60 p-1 shadow-ring backdrop-blur">
            {links.map(l => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-spring ${
                    isActive ? 'bg-gradient-hero text-primary-foreground shadow-soft'
                             : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`
                }
              >
                <l.icon className="h-4 w-4" />{l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block text-xs text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={async () => { await signOut(); navigate('/login'); }} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 pb-2">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-spring ${
                  isActive ? 'bg-gradient-hero text-primary-foreground shadow-soft'
                           : 'text-muted-foreground bg-muted/40'
                }`
              }
            >
              <l.icon className="h-4 w-4" />{l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="container py-8 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
