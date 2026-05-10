import { cn } from "@/lib/utils";

// Cohesive, cinematic travel photography — hill stations, mountains,
// snow, forests, lakes, premium resorts. Curated Unsplash IDs.
const ROW_A = [
  { src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1200&auto=format&fit=crop", caption: "Swiss Alps" },
  { src: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop", caption: "Dolomites" },
  { src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1200&auto=format&fit=crop", caption: "Mountain Lake" },
  { src: "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1200&auto=format&fit=crop", caption: "Banff" },
  { src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1200&auto=format&fit=crop", caption: "Patagonia" },
  { src: "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=1200&auto=format&fit=crop", caption: "Pine Forest" },
  { src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop", caption: "Golden Valley" },
];

const ROW_B = [
  { src: "https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1200&auto=format&fit=crop", caption: "Alpine Resort" },
  { src: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1200&auto=format&fit=crop", caption: "Snowy Peaks" },
  { src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?q=80&w=1200&auto=format&fit=crop", caption: "Forest Trail" },
  { src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1200&auto=format&fit=crop", caption: "Norway Fjord" },
  { src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop", caption: "Starlit Range" },
  { src: "https://images.unsplash.com/photo-1452421822248-d4c2b47f0c81?q=80&w=1200&auto=format&fit=crop", caption: "Hill Station" },
  { src: "https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1200&auto=format&fit=crop", caption: "Misty Pines" },
];

interface RowProps {
  items: { src: string; caption: string }[];
  direction?: "left" | "right";
  rotate?: number;
}

function MarqueeRow({ items, direction = "left", rotate = 0 }: RowProps) {
  // Duplicate the list for a seamless loop
  const loop = [...items, ...items];
  return (
    <div className="group relative overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-5 will-change-transform",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right",
          "group-hover:[animation-play-state:paused]"
        )}
      >
        {loop.map((item, i) => (
          <figure
            key={i}
            style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * rotate}deg)` }}
            className="relative h-56 w-80 shrink-0 overflow-hidden rounded-2xl bg-muted shadow-soft transition-transform duration-500 hover:scale-[1.03] md:h-64 md:w-96"
          >
            <img
              src={item.src}
              alt={item.caption}
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4">
              <figcaption className="font-serif italic text-white/95 text-sm tracking-wide">
                {item.caption}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </div>
  );
}

interface TravelMarqueeProps {
  className?: string;
}

export function TravelMarquee({ className }: TravelMarqueeProps) {
  return (
    <div className={cn("relative", className)}>
      {/* edge fades for premium feel */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent md:w-40" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent md:w-40" />

      <div className="space-y-5">
        <MarqueeRow items={ROW_A} direction="left" rotate={1} />
        <MarqueeRow items={ROW_B} direction="right" rotate={1.5} />
      </div>
    </div>
  );
}
