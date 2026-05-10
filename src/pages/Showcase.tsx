import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles, Plane, Star, Heart, Plus, ArrowRight, Trash2, Code2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Display, Heading, Lead, Eyebrow, Text, Muted,
} from '@/components/ui/typography';

/* -------------------------------------------------------------------------- */
/*  Local helpers                                                             */
/* -------------------------------------------------------------------------- */

function Section({
  eyebrow, title, description, children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-border/60 pt-10">
      <div className="max-w-2xl">
        <Eyebrow tone="primary">{eyebrow}</Eyebrow>
        <Heading level={2} className="mt-1.5" weight="bold">{title}</Heading>
        <Lead muted className="mt-1">{description}</Lead>
      </div>
      {children}
    </section>
  );
}

function PropsTable({ rows }: { rows: Array<{ name: string; type: string; default?: string; desc: string }> }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40">
      <table className="w-full text-left text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Prop</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Default</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map(r => (
            <tr key={r.name} className="align-top">
              <td className="px-3 py-2 font-mono text-xs font-semibold text-foreground">{r.name}</td>
              <td className="px-3 py-2 font-mono text-xs text-primary">{r.type}</td>
              <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.default ?? '—'}</td>
              <td className="px-3 py-2 text-muted-foreground">{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Snippet({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-3 text-xs leading-relaxed">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Swatch({ token, label }: { token: string; label?: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3">
      <div
        className="h-12 w-full rounded-lg shadow-soft"
        style={{ background: `hsl(var(--${token}))` }}
      />
      <div className="mt-2 font-medium">{label ?? token}</div>
      <Muted variant="small" className="font-mono">--{token}</Muted>
    </div>
  );
}

function Showcase() {
  const [openDefault, setOpenDefault] = useState(false);
  const [openPremium, setOpenPremium] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 -z-10 bg-gradient-aurora opacity-70" />
        <div className="absolute -left-32 top-10 -z-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute right-0 top-20 -z-10 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
        <div className="container py-14">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 font-display font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-hero shadow-glow">
                <Plane className="h-5 w-5 text-primary-foreground" />
              </span>
              Traveloop
            </Link>
            <Badge variant="glass" className="gap-1.5">
              <Code2 className="h-3 w-3" /> Design system v1
            </Badge>
          </div>
          <Eyebrow tone="primary" className="mt-10">Design system</Eyebrow>
          <Display gradient className="mt-2 max-w-3xl">Premium components, one source of truth.</Display>
          <Lead muted className="mt-4 max-w-2xl">
            A live reference for every primitive used across the app — buttons, cards,
            badges, modals, and typography — with the props you can pass and copy-ready
            usage snippets.
          </Lead>
        </div>
      </header>

      <main className="container space-y-14 py-14">
        {/* Typography */}
        <Section
          eyebrow="01 · Typography"
          title="A single, harmonious scale"
          description="All headings and body text route through the typography primitives so spacing, line-height, and gradients stay consistent."
        >
          <Card variant="premium" className="space-y-3 p-6">
            <Display>Display — magazine hero</Display>
            <Heading level={1}>Heading level 1</Heading>
            <Heading level={2}>Heading level 2</Heading>
            <Heading level={3}>Heading level 3</Heading>
            <Heading level={4}>Heading level 4</Heading>
            <Lead muted>Lead — slightly larger paragraph used for subheads.</Lead>
            <Text>Body — default paragraph copy used everywhere.</Text>
            <Muted variant="small">Muted small — helper / metadata text.</Muted>
            <Eyebrow tone="primary">Eyebrow · section label</Eyebrow>
          </Card>

          <Snippet>{`<Display gradient>Welcome</Display>
<Heading level={2} weight="bold">Section title</Heading>
<Eyebrow tone="primary">Step 01</Eyebrow>
<Lead muted>Short description copy.</Lead>
<Text variant="small" muted>Helper line.</Text>`}</Snippet>

          <PropsTable rows={[
            { name: 'variant', type: '"display" | "h1"–"h4" | "lead" | "body" | "small" | "eyebrow"', desc: 'Maps to the t-* scale defined in index.css.' },
            { name: 'tone', type: '"default" | "muted" | "primary" | "accent" | "destructive" | "success" | "warning" | "gradient"', default: '"default"', desc: 'Color treatment. `gradient` applies the text-gradient utility.' },
            { name: 'weight', type: '"normal" | "medium" | "semibold" | "bold"', desc: 'Optional weight override.' },
            { name: 'align', type: '"left" | "center" | "right"', desc: 'Optional text alignment.' },
            { name: 'level', type: '1 | 2 | 3 | 4', default: '2', desc: '`<Heading>` only — chooses the tag and scale.' },
            { name: 'asChild', type: 'boolean', desc: 'Render as the child element (Radix Slot).' },
          ]} />
        </Section>

        {/* Buttons */}
        <Section
          eyebrow="02 · Buttons"
          title="Premium, hero, glass and the essentials"
          description="Pick a variant by intent. `premium` for the single most important CTA on the screen, `hero` for marketing, `glass` for layered surfaces."
        >
          <Card variant="premium" className="flex flex-wrap items-center gap-3 p-6">
            <Button variant="premium"><Sparkles className="h-4 w-4" /> Premium</Button>
            <Button variant="hero">Hero</Button>
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="glass">Glass</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive"><Trash2 className="h-4 w-4" /> Destructive</Button>
          </Card>

          <Card variant="glass" className="flex flex-wrap items-center gap-3 p-6">
            <Button variant="premium" size="sm">Small</Button>
            <Button variant="premium">Default</Button>
            <Button variant="premium" size="lg">Large <ArrowRight className="h-4 w-4" /></Button>
            <Button variant="premium" size="icon" aria-label="Star"><Star className="h-4 w-4" /></Button>
            <Button variant="premium" disabled>Disabled</Button>
          </Card>

          <Snippet>{`<Button variant="premium" size="lg">
  <Sparkles className="h-4 w-4" /> Generate with AI
</Button>`}</Snippet>

          <PropsTable rows={[
            { name: 'variant', type: '"default" | "premium" | "hero" | "glass" | "secondary" | "outline" | "ghost" | "link" | "destructive"', default: '"default"', desc: 'Visual style.' },
            { name: 'size', type: '"sm" | "default" | "lg" | "icon"', default: '"default"', desc: 'Padding and font size.' },
            { name: 'asChild', type: 'boolean', default: 'false', desc: 'Render as the child (e.g. wrap a `<Link>`).' },
          ]} />
        </Section>

        {/* Cards */}
        <Section
          eyebrow="03 · Cards"
          title="Surfaces with personality"
          description="Use `premium` for editorial feature cards, `aurora` for branded highlights, `glass` for floating panels, and `default` for neutral content."
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card variant="default" className="p-5">
              <Eyebrow>Default</Eyebrow>
              <Heading level={4} className="mt-1">Neutral surface</Heading>
              <Muted variant="small" className="mt-2">Standard card with the base border + background.</Muted>
            </Card>
            <Card variant="premium" className="p-5">
              <Eyebrow tone="primary">Premium</Eyebrow>
              <Heading level={4} className="mt-1">Editorial feature</Heading>
              <Muted variant="small" className="mt-2">Soft inner glow + premium shadow.</Muted>
            </Card>
            <Card variant="glass" className="p-5">
              <Eyebrow tone="primary">Glass</Eyebrow>
              <Heading level={4} className="mt-1">Floating panel</Heading>
              <Muted variant="small" className="mt-2">Backdrop blur for layered surfaces.</Muted>
            </Card>
            <Card variant="aurora" className="p-5">
              <Eyebrow tone="primary">Aurora</Eyebrow>
              <Heading level={4} className="mt-1">Brand highlight</Heading>
              <Muted variant="small" className="mt-2">Aurora gradient surface for hero moments.</Muted>
            </Card>
          </div>

          <Snippet>{`<Card variant="premium" className="p-6">
  <Eyebrow tone="primary">Featured</Eyebrow>
  <Heading level={3}>Plan smarter</Heading>
  <Lead muted>One source of truth for the trip.</Lead>
</Card>`}</Snippet>

          <PropsTable rows={[
            { name: 'variant', type: '"default" | "premium" | "glass" | "aurora"', default: '"default"', desc: 'Background + shadow treatment.' },
            { name: 'className', type: 'string', desc: 'Pass spacing, layout, or extra utility classes.' },
          ]} />
        </Section>

        {/* Badges */}
        <Section
          eyebrow="04 · Badges"
          title="Tiny chips, big signal"
          description="Use sparingly to label state, role, or category. `gradient` and `glass` are the premium variants; the others mirror shadcn defaults."
        >
          <Card variant="premium" className="flex flex-wrap items-center gap-2 p-6">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="gradient"><Sparkles className="mr-1 h-3 w-3" /> Gradient</Badge>
            <Badge variant="glass"><Heart className="mr-1 h-3 w-3" /> Glass</Badge>
          </Card>

          <Snippet>{`<Badge variant="gradient">
  <Sparkles className="mr-1 h-3 w-3" /> AI-generated
</Badge>`}</Snippet>

          <PropsTable rows={[
            { name: 'variant', type: '"default" | "secondary" | "outline" | "destructive" | "gradient" | "glass"', default: '"default"', desc: 'Color treatment.' },
          ]} />
        </Section>

        {/* Modals */}
        <Section
          eyebrow="05 · Modals"
          title="Dialogs that match the surfaces"
          description="The default `DialogContent` already feels premium. For richer flows, layer in `bg-gradient-card backdrop-blur-xl` and an Eyebrow + Display title."
        >
          <Card variant="premium" className="flex flex-wrap items-center gap-3 p-6">
            <Dialog open={openDefault} onOpenChange={setOpenDefault}>
              <DialogTrigger asChild>
                <Button variant="outline">Open default dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Default dialog</DialogTitle>
                  <DialogDescription>
                    The base modal — already on the premium surface tokens.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenDefault(false)}>Cancel</Button>
                  <Button variant="premium" onClick={() => setOpenDefault(false)}>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={openPremium} onOpenChange={setOpenPremium}>
              <DialogTrigger asChild>
                <Button variant="premium"><Sparkles className="h-4 w-4" /> Open premium dialog</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg border-border/60 bg-gradient-card backdrop-blur-xl">
                <DialogHeader>
                  <Eyebrow tone="primary">Premium</Eyebrow>
                  <DialogTitle className="font-display text-2xl font-bold tracking-tight">
                    Editorial dialog
                  </DialogTitle>
                  <DialogDescription>
                    Same primitive — with a gradient card surface, blur, and an
                    eyebrow + display title for marketing-grade flows.
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                  <Text variant="small">
                    Drop any content in here — forms, lists, or rich previews — and it
                    inherits the design tokens automatically.
                  </Text>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setOpenPremium(false)}>Close</Button>
                  <Button variant="premium" onClick={() => setOpenPremium(false)}>
                    <Plus className="h-4 w-4" /> Add to trip
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Card>

          <Snippet>{`<Dialog>
  <DialogTrigger asChild>
    <Button variant="premium">Open</Button>
  </DialogTrigger>
  <DialogContent className="max-w-lg border-border/60 bg-gradient-card backdrop-blur-xl">
    <DialogHeader>
      <Eyebrow tone="primary">Premium</Eyebrow>
      <DialogTitle className="font-display text-2xl font-bold tracking-tight">
        Editorial dialog
      </DialogTitle>
      <DialogDescription>Subhead copy.</DialogDescription>
    </DialogHeader>
    {/* …content… */}
  </DialogContent>
</Dialog>`}</Snippet>

          <PropsTable rows={[
            { name: 'open / onOpenChange', type: 'boolean / (open) => void', desc: 'Controlled state from Radix Dialog.' },
            { name: 'DialogContent.className', type: 'string', desc: 'Add `bg-gradient-card backdrop-blur-xl` for the premium look.' },
          ]} />
        </Section>

        {/* Color tokens */}
        <Section
          eyebrow="06 · Tokens"
          title="Semantic color tokens"
          description="Always reference these via Tailwind classes (e.g. `bg-primary`, `text-muted-foreground`) — never hardcode hex values."
        >
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Swatch token="primary" />
            <Swatch token="accent" />
            <Swatch token="secondary" />
            <Swatch token="muted" />
            <Swatch token="success" />
            <Swatch token="warning" />
            <Swatch token="destructive" />
            <Swatch token="ring" />
          </div>
        </Section>

        <footer className="border-t border-border/60 pt-8">
          <Muted variant="small">
            Want to extend this system? Edit primitives in <code className="rounded bg-muted px-1 py-0.5">src/components/ui</code> and tokens in <code className="rounded bg-muted px-1 py-0.5">src/index.css</code>.
          </Muted>
        </footer>
      </main>
    </div>
  );
}

export default Showcase;
