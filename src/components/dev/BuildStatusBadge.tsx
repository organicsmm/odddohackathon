import { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export interface BuildError {
  file: string;
  line: number;
  col: number;
  code: string;
  message: string;
}
export interface BuildStatusPayload {
  status: 'ok' | 'error';
  ranAt: string;
  errorCount: number;
  fileCount: number;
  files: { file: string; count: number }[];
  errors: BuildError[];
}

type State =
  | { kind: 'loading' }
  | { kind: 'missing' }
  | { kind: 'ready'; data: BuildStatusPayload };

const POLL_MS = 5000;

async function fetchStatus(): Promise<State> {
  try {
    const res = await fetch(`/build-status.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return { kind: 'missing' };
    const data = (await res.json()) as BuildStatusPayload;
    return { kind: 'ready', data };
  } catch {
    return { kind: 'missing' };
  }
}

export default function BuildStatusBadge() {
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      const next = await fetchStatus();
      if (alive) setState(next);
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const refresh = async () => {
    setState({ kind: 'loading' });
    setState(await fetchStatus());
  };

  let dotClass = 'bg-muted-foreground';
  let label = 'Build…';
  let Icon = Loader2;
  let iconClass = 'animate-spin';
  if (state.kind === 'missing') {
    dotClass = 'bg-muted-foreground/60';
    label = 'No tsc data';
    Icon = RefreshCw; iconClass = '';
  } else if (state.kind === 'ready') {
    if (state.data.status === 'ok') {
      dotClass = 'bg-success';
      label = 'Build OK';
      Icon = CheckCircle2; iconClass = '';
    } else {
      dotClass = 'bg-destructive';
      label = `${state.data.errorCount} TS error${state.data.errorCount === 1 ? '' : 's'}`;
      Icon = AlertTriangle; iconClass = '';
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`TypeScript status: ${label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className={`inline-block h-1.5 w-1.5 rounded-full ${dotClass}`} />
          <Icon className={`h-3 w-3 ${iconClass}`} />
          <span className="tabular-nums">{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[420px] p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">tsc --noEmit</div>
            <div className="mt-0.5 text-sm font-semibold">{label}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={refresh} aria-label="Refresh build status">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>

        {state.kind === 'missing' && (
          <div className="px-4 py-4 text-xs text-muted-foreground space-y-2">
            <p>No build status file found.</p>
            <p className="font-mono rounded bg-muted/50 px-2 py-1">node scripts/typecheck-status.mjs --watch</p>
            <p>That writes <code>public/build-status.json</code> which this badge polls every 5s.</p>
          </div>
        )}

        {state.kind === 'ready' && (
          <div>
            <div className="px-4 py-2 text-[11px] text-muted-foreground tabular-nums">
              Last run {new Date(state.data.ranAt).toLocaleTimeString()} · {state.data.fileCount} file
              {state.data.fileCount === 1 ? '' : 's'} affected
            </div>
            {state.data.status === 'ok' ? (
              <div className="px-4 pb-4 pt-1 text-sm text-success flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> No TypeScript errors.
              </div>
            ) : (
              <ScrollArea className="max-h-[320px]">
                <ul className="divide-y divide-border/60">
                  {state.data.files.map(f => {
                    const errs = state.data.errors.filter(e => e.file === f.file);
                    return (
                      <li key={f.file} className="px-4 py-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-mono text-xs text-foreground">{f.file}</span>
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive tabular-nums">
                            {f.count}
                          </span>
                        </div>
                        <ul className="mt-1 space-y-0.5">
                          {errs.slice(0, 4).map((e, i) => (
                            <li key={i} className="text-[11px] text-muted-foreground">
                              <span className="font-mono tabular-nums">{e.line}:{e.col}</span>
                              <span className="mx-1.5 text-border">·</span>
                              <span className="font-mono text-destructive/80">{e.code}</span>
                              <span className="mx-1.5 text-border">·</span>
                              <span>{e.message}</span>
                            </li>
                          ))}
                          {errs.length > 4 && (
                            <li className="text-[10px] text-muted-foreground/70">+{errs.length - 4} more…</li>
                          )}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
