import { cn } from "@/lib/utils";

const IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517824806704-9040b037703b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=1600&auto=format&fit=crop",
];

interface RowProps {
  direction?: "left" | "right";
  speed?: string;
  rotate?: number;
  offset?: number;
}

function BgRow({ direction = "left", speed = "120s", rotate = 0, offset = 0 }: RowProps) {
  const loop = [...IMAGES, ...IMAGES, ...IMAGES];
  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-6 will-change-transform",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        )}
        style={{ animationDuration: speed, marginLeft: offset }}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * rotate}deg)` }}
            className="h-56 w-[22rem] shrink-0 overflow-hidden rounded-3xl md:h-72 md:w-[28rem]"
          >
            <img
              src={src}
              alt=""
              aria-hidden
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  className?: string;
}

export function HeroBackgroundMarquee({ className }: Props) {
  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {/* Full-cover layered scrolling rows */}
      <div className="absolute inset-0 flex flex-col justify-between gap-4 py-2 opacity-[0.55]">
        <BgRow direction="left" speed="140s" rotate={1} />
        <BgRow direction="right" speed="180s" rotate={1.5} offset={-200} />
        <BgRow direction="left" speed="160s" rotate={1} offset={-100} />
        <BgRow direction="right" speed="200s" rotate={1.5} offset={-150} />
      </div>

      {/* Soft dark + brand gradient overlay for readability */}
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,hsl(var(--background)/0.65),transparent_70%)]" />
    </div>
  );
}
