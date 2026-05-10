import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Eyebrow, Heading, Muted } from '@/components/ui/typography';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Save, Plus, X } from 'lucide-react';

type Hero = { title: string; subtitle: string; cta: string };
type Marquee = { enabled: boolean };

export default function AdminSettings() {
  const [hero, setHero] = useState<Hero>({ title: '', subtitle: '', cta: '' });
  const [marquee, setMarquee] = useState<Marquee>({ enabled: true });
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('site_settings').select('key, value');
      const map: Record<string, unknown> = {};
      (data || []).forEach((r: { key: string; value: unknown }) => { map[r.key] = r.value; });
      setHero((map.hero as Hero) || { title: '', subtitle: '', cta: '' });
      setMarquee((map.marquee as Marquee) || { enabled: true });
      setAdminEmails((map.admin_emails as string[]) || []);
      setLoading(false);
    })();
  }, []);

  const upsert = async (key: string, value: unknown) => {
    const { error } = await supabase.from('site_settings').upsert({ key, value: value as never, updated_at: new Date().toISOString() });
    if (error) throw error;
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsert('hero', hero),
        upsert('marquee', marquee),
        upsert('admin_emails', adminEmails),
      ]);
      toast.success('Settings saved');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const addAdmin = () => {
    const e = newAdmin.trim().toLowerCase();
    if (!e || !e.includes('@')) return toast.error('Enter a valid email');
    if (adminEmails.includes(e)) return toast.error('Already in list');
    setAdminEmails([...adminEmails, e]);
    setNewAdmin('');
  };

  if (loading) return <Muted>Loading settings…</Muted>;

  return (
    <div className="space-y-6 max-w-3xl">
      <header className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Customize</Eyebrow>
          <Heading level={1} weight="bold">Site Settings</Heading>
        </div>
        <Button variant="premium" onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </header>

      <Card variant="premium" className="p-6 space-y-4">
        <Heading level={3} weight="bold">Landing hero</Heading>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={hero.title} onChange={e => setHero({ ...hero, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Subtitle</Label>
          <Textarea value={hero.subtitle} onChange={e => setHero({ ...hero, subtitle: e.target.value })} rows={2} />
        </div>
        <div className="space-y-1.5">
          <Label>CTA button label</Label>
          <Input value={hero.cta} onChange={e => setHero({ ...hero, cta: e.target.value })} />
        </div>
      </Card>

      <Card variant="premium" className="p-6 space-y-4">
        <Heading level={3} weight="bold">Visual</Heading>
        <div className="flex items-center justify-between">
          <div>
            <Label>Show animated travel marquee</Label>
            <Muted className="text-xs">Toggle the cinematic image marquee on the landing page</Muted>
          </div>
          <Switch checked={marquee.enabled} onCheckedChange={v => setMarquee({ enabled: v })} />
        </div>
      </Card>

      <Card variant="premium" className="p-6 space-y-4">
        <div>
          <Heading level={3} weight="bold">Admin emails</Heading>
          <Muted className="text-xs">Users with these emails are auto-promoted to admin on signup</Muted>
        </div>
        <div className="flex gap-2">
          <Input value={newAdmin} onChange={e => setNewAdmin(e.target.value)} placeholder="admin@example.com" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addAdmin())} />
          <Button onClick={addAdmin} variant="outline"><Plus className="h-4 w-4" /> Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {adminEmails.length === 0 && <Muted className="text-sm">No admin emails configured.</Muted>}
          {adminEmails.map(e => (
            <Badge key={e} variant="secondary" className="gap-1.5 px-3 py-1">
              {e}
              <button onClick={() => setAdminEmails(adminEmails.filter(x => x !== e))} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
