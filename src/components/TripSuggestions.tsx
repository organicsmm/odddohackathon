import { useState, useRef, useEffect } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import type { Trip } from '@/lib/types';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const FN_URL = `https://${PROJECT_ID}.supabase.co/functions/v1/trip-suggestions`;

export default function TripSuggestions({ trip }: { trip: Trip }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const destination =
    trip.stops.length > 0
      ? trip.stops.map(s => `${s.city}${s.country ? ', ' + s.country : ''}`).join(' → ')
      : trip.name;

  const fetchSuggestions = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    setText('');

    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          destination,
          startDate: trip.startDate,
          endDate: trip.endDate,
          stops: trip.stops.map(s => `${s.city}, ${s.country}`),
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(j.error || 'Failed to fetch suggestions');
      }
      if (!res.body) throw new Error('No response stream');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let acc = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const payload = t.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const json = JSON.parse(payload);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              setText(acc);
            }
          } catch {
            /* ignore partial JSON */
          }
        }
      }
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      const msg = (e as Error).message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <Card variant="premium" className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-hero shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">Smart Trip Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered packing list, must-do experiences, food &amp; safety tips for{' '}
              <span className="font-medium text-foreground">{destination}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={fetchSuggestions}
          disabled={loading}
          variant={text ? 'outline' : 'hero'}
          size="sm"
          className="gap-1.5"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
          ) : text ? (
            <><RefreshCw className="h-4 w-4" /> Regenerate</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Get suggestions</>
          )}
        </Button>
      </div>

      {!text && !loading && !error && (
        <p className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          Click "Get suggestions" — AI will tell you exactly what to pack, what to do,
          what to eat and what to watch out for at your destination, in real time.
        </p>
      )}

      {error && (
        <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {(text || loading) && (
        <div className="prose prose-sm dark:prose-invert mt-6 max-w-none prose-headings:font-display prose-headings:font-bold prose-h3:mt-5 prose-h3:mb-2 prose-h3:text-base prose-ul:my-2 prose-li:my-0.5">
          <ReactMarkdown>{text || '_Thinking…_'}</ReactMarkdown>
          {loading && (
            <span className="inline-block h-3 w-2 animate-pulse bg-foreground align-baseline" />
          )}
        </div>
      )}
    </Card>
  );
}
