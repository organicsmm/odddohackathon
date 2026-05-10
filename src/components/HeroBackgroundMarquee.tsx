import { cn } from "@/lib/utils";

const IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?q=80&w=1600&auto=format&fit=crop",
];

interface RowProps {
  direction?: "left" | "right";
  speed?: string;
  rotate?: number;
  offset?: number;
}

function BgRow({ direction = "left", speed = "120s", rotate = 0, offset = 0 }: RowProps) {
  const loop = [...IMAGES, ...IMAGES];
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
            className="h-56 w-[24rem] shrink-0 overflow-hidden rounded-[28px] shadow-elegant ring-1 ring-white/10 md:h-72 md:w-[32rem]"
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
      {/* Layered scrolling rows — visible but cinematic */}
      <div
        className="absolute inset-0 flex flex-col justify-center gap-5 opacity-[0.55]"
        style={{
          WebkitMaskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
      >
        <BgRow direction="left" speed="120s" rotate={1.2} />
        <BgRow direction="right" speed="160s" rotate={1.5} offset={-180} />
        <BgRow direction="left" speed="140s" rotate={1} offset={-90} />
      </div>

      {/* Aesthetic gradient wash — warm sunset → cool dusk for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_45%,hsl(var(--background)/0.55),hsl(var(--background)/0.88))]" />
      <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(221_83%_53%/0.10),transparent_40%,hsl(280_60%_55%/0.08))]" />

      {/* Subtle film grain for premium texture */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />
    </div>
  );
}
