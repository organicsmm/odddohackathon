import { Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Tablet, Smartphone } from 'lucide-react';
import { Display, Heading, Lead, Text, Muted, Eyebrow } from '@/components/ui/typography';
import { Card } from '@/components/ui/card';

/**
 * Visual QA page for the typography scale.
 *
 * Shows every primitive (Display, Heading 1–4, Lead, Text, Muted, Eyebrow) inside
 * three fixed-width frames that simulate mobile (375px), tablet (768px) and
 * desktop (1280px) so you can eyeball the responsive `clamp()` scale without
 * resizing the browser.
 *
 * The frames render a real iframe pointing back at this page in `?frame=1` mode
 * so the actual breakpoint media queries kick in.
 */

const SAMPLE_LONG = "The quick brown fox jumps over the lazy dog while planning a multi-city itinerary across three continents.";
const SAMPLE_SHORT = "A single source of truth for the entire trip.";

function Stack() {
  return (
    <div className="space-y-6 p-6">
      <div>
        <Eyebrow tone="primary">Display</Eyebrow>
        <Display className="mt-1.5">Premium travel, planned beautifully.</Display>
      </div>

      <div>
        <Eyebrow tone="primary">Display · gradient</Eyebrow>
        <Display gradient className="mt-1.5">Plan smarter, travel further.</Display>
      </div>

      <div className="space-y-3">
        <Eyebrow tone="primary">Headings</Eyebrow>
        <Heading level={1}>Heading level 1 — page title</Heading>
        <Heading level={2}>Heading level 2 — section title</Heading>
        <Heading level={3}>Heading level 3 — subsection</Heading>
        <Heading level={4}>Heading level 4 — card title</Heading>
      </div>

      <div>
        <Eyebrow tone="primary">Lead</Eyebrow>
        <Lead className="mt-1.5">{SAMPLE_LONG}</Lead>
      </div>

      <div>
        <Eyebrow tone="primary">Lead · muted</Eyebrow>
        <Lead muted className="mt-1.5">{SAMPLE_SHORT}</Lead>
      </div>

      <div>
        <Eyebrow tone="primary">Text · body</Eyebrow>
        <Text className="mt-1.5">{SAMPLE_LONG}</Text>
      </div>

      <div>
        <Eyebrow tone="primary">Text · small</Eyebrow>
        <Text variant="small" className="mt-1.5">{SAMPLE_SHORT}</Text>
      </div>

      <div>
        <Eyebrow tone="primary">Muted</Eyebrow>
        <Muted className="mt-1.5">{SAMPLE_SHORT}</Muted>
      </div>

      <div>
        <Eyebrow tone="primary">Muted · small</Eyebrow>
        <Muted variant="small" className="mt-1.5">Helper / metadata text</Muted>
      </div>

      <div>
        <Eyebrow tone="primary">Eyebrow</Eyebrow>
        <Eyebrow className="mt-1.5">Section · 01 · Step</Eyebrow>
      </div>
    </div>
  );
}

function Frame({
  width, label, icon: Icon,
}: { width: number; label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <Text variant="small" className="font-mono">{label} · {width}px</Text>
      </div>
      <div
        className="overflow-hidden rounded-xl border border-border/60 bg-card shadow-soft"
        style={{ width, maxWidth: '100%' }}
      >
        <iframe
          title={`${label} preview`}
          src="/typography?frame=1"
          width={width}
          height={1100}
          style={{ width: '100%', border: 0, display: 'block' }}
        />
      </div>
    </div>
  );
}

export default function TypographyPreview() {
  const isFrame = typeof window !== 'undefined'
    && new URLSearchParams(window.location.search).get('frame') === '1';

  if (isFrame) {
    return (
      <div className="min-h-screen bg-background">
        <Stack />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="container flex items-center justify-between py-5">
          <Link to="/showcase" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to design system
          </Link>
          <Eyebrow tone="primary">Typography QA</Eyebrow>
        </div>
      </header>

      <main className="container space-y-8 py-10">
        <div className="max-w-2xl space-y-2">
          <Display>Typography across breakpoints</Display>
          <Lead muted>
            Each frame renders this page at a fixed width so the responsive
            <code className="mx-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">clamp()</code>
            scale, line-heights, and weights can be eyeballed side-by-side. Resize your browser to also test fluid behaviour.
          </Lead>
        </div>

        <div className="grid items-start gap-8 xl:grid-cols-[375px_768px_1fr]">
          <Frame width={375} label="Mobile" icon={Smartphone} />
          <Frame width={768} label="Tablet" icon={Tablet} />
          <Frame width={1280} label="Desktop" icon={Monitor} />
        </div>

        <Card variant="premium" className="p-6">
          <Heading level={3}>Inline reference</Heading>
          <Lead muted className="mt-1">Same primitives, rendered directly in the page (uses your current viewport width).</Lead>
          <div className="mt-4 border-t border-border/60">
            <Stack />
          </div>
        </Card>
      </main>
    </div>
  );
}
