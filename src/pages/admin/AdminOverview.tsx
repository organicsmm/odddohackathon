import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Eyebrow, Heading, Muted } from '@/components/ui/typography';
import { Users, MapPinned, Globe, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Stats = {
  users: number;
  trips: number;
  topDestinations: { name: string; count: number }[];
  signupsByDay: { day: string; count: number }[];
};

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ count: userCount }, { count: tripCount }, { data: tripsData }, { data: profilesData }] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('*', { count: 'exact', head: true }),
        supabase.from('trips').select('data'),
        supabase.from('profiles').select('created_at'),
      ]);

      // Top destinations from trips JSON
      const cityCounts: Record<string, number> = {};
      (tripsData || []).forEach((t: { data: { stops?: { city: string }[] } }) => {
        (t.data?.stops || []).forEach(s => {
          if (s.city) cityCounts[s.city] = (cityCounts[s.city] || 0) + 1;
        });
      });
      const topDestinations = Object.entries(cityCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      // Signups by day (last 14)
      const days: Record<string, number> = {};
      const now = Date.now();
      for (let i = 13; i >= 0; i--) {
        const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
        days[d] = 0;
      }
      (profilesData || []).forEach((p: { created_at: string }) => {
        const d = p.created_at.slice(0, 10);
        if (d in days) days[d]++;
      });
      const signupsByDay = Object.entries(days).map(([day, count]) => ({ day: day.slice(5), count }));

      setStats({
        users: userCount || 0,
        trips: tripCount || 0,
        topDestinations,
        signupsByDay,
      });
      setLoading(false);
    })();
  }, []);

  if (loading || !stats) return <Muted>Loading stats…</Muted>;

  const cards = [
    { icon: Users, label: 'Total users', value: stats.users },
    { icon: MapPinned, label: 'Trips planned', value: stats.trips },
    { icon: Globe, label: 'Unique destinations', value: stats.topDestinations.length },
    { icon: TrendingUp, label: 'Signups (14d)', value: stats.signupsByDay.reduce((a, b) => a + b.count, 0) },
  ];

  return (
    <div className="space-y-8">
      <header>
        <Eyebrow>Dashboard</Eyebrow>
        <Heading level={1} weight="bold">Overview</Heading>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(c => (
          <Card key={c.label} variant="premium" className="p-5">
            <div className="flex items-center justify-between">
              <Muted className="text-xs uppercase tracking-[0.16em]">{c.label}</Muted>
              <c.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 font-display text-3xl font-extrabold tabular-nums">{c.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card variant="premium" className="p-6">
          <Heading level={3} weight="bold">Signups (last 14 days)</Heading>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.signupsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card variant="premium" className="p-6">
          <Heading level={3} weight="bold">Popular destinations</Heading>
          {stats.topDestinations.length === 0 ? (
            <Muted className="mt-3 text-sm">No trips yet.</Muted>
          ) : (
            <ul className="mt-4 space-y-2">
              {stats.topDestinations.map((d, i) => (
                <li key={d.name} className="flex items-center gap-3">
                  <span className="font-mono text-xs w-6 text-muted-foreground">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-medium">{d.name}</span>
                  <span className="font-display font-bold tabular-nums">{d.count}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
