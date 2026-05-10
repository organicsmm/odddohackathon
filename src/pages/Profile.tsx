import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateUser, deleteAccount, logout, loadTrips } from '@/lib/store';
import { CITIES } from '@/lib/catalog';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Trash2, Heart, MapPin } from 'lucide-react';

export default function Profile() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || '');
  const [language, setLanguage] = useState<'en' | 'hi' | 'es'>(user?.language || 'en');
  const tripCount = loadTrips().filter(t => t.ownerEmail === user?.email).length;

  if (!user) return null;

  const save = () => {
    updateUser({ name, language });
    refresh();
    toast.success('Profile saved');
  };
  const toggleSaved = (city: string) => {
    const saved = user.saved.includes(city) ? user.saved.filter(c => c !== city) : [...user.saved, city];
    updateUser({ saved });
    refresh();
  };
  const onDeleteAccount = () => {
    if (!confirm('This deletes your account and all trips. Continue?')) return;
    deleteAccount();
    navigate('/');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card className="p-6">
        <h2 className="font-display text-2xl font-bold">Profile</h2>
        <div className="mt-4 grid gap-4">
          <div><Label>Email</Label><Input value={user.email} disabled /></div>
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <Label>Language</Label>
            <Select value={language} onValueChange={v => setLanguage(v as 'en' | 'hi' | 'es')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
                <SelectItem value="es">Español</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="hero" onClick={save} className="self-start">Save changes</Button>
        </div>

        <div className="mt-8">
          <h3 className="font-display text-lg font-bold flex items-center gap-2"><Heart className="h-4 w-4 text-accent" /> Saved destinations</h3>
          {user.saved.length === 0 && <p className="mt-2 text-sm text-muted-foreground">Save destinations to inspire your next trip.</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {user.saved.map(city => (
              <button key={city} onClick={() => toggleSaved(city)} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary hover:bg-primary/20">
                <MapPin className="h-3 w-3" /> {city} ×
              </button>
            ))}
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-muted-foreground">Browse cities</summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {CITIES.map(c => {
                const on = user.saved.includes(c.city);
                return (
                  <button key={c.city} onClick={() => toggleSaved(c.city)} className={`flex items-center justify-between rounded-lg border p-2 text-sm transition-smooth ${on ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/40'}`}>
                    <span>{c.city}, <span className="text-muted-foreground">{c.country}</span></span>
                    <Heart className={`h-4 w-4 ${on ? 'fill-current' : ''}`} />
                  </button>
                );
              })}
            </div>
          </details>
        </div>
      </Card>

      <div className="space-y-4">
        <Card className="bg-gradient-ocean text-primary-foreground p-6">
          <div className="text-xs uppercase opacity-80">Your travel stats</div>
          <div className="mt-2 font-display text-4xl font-extrabold">{tripCount}</div>
          <div className="text-sm opacity-90">trips planned</div>
          <div className="mt-3 text-3xl font-display font-bold">{user.saved.length}</div>
          <div className="text-sm opacity-90">saved destinations</div>
        </Card>
        <Card className="p-6">
          <h3 className="font-display font-bold">Account</h3>
          <Button variant="outline" className="mt-3 w-full" onClick={() => { logout(); navigate('/'); }}>Log out</Button>
          <Button variant="destructive" className="mt-2 w-full" onClick={onDeleteAccount}><Trash2 className="h-4 w-4" /> Delete account</Button>
        </Card>
      </div>
    </div>
  );
}
