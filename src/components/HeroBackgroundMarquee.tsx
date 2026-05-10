import { cn } from "@/lib/utils";

const IMAGES = [
  "https://4kwallpapers.com/images/walls/thumbs_2t/3760.jpg",
  "https://4kwallpapers.com/images/walls/thumbs_2t/3521.jpg",
  "https://4kwallpapers.com/images/walls/thumbs_2t/25476.jpg",
  "https://4kwallpapers.com/images/walls/thumbs_2t/25451.jpg",
  "https://4kwallpapers.com/images/walls/thumbs_2t/10476.jpg",
];

interface RowProps {
  direction?: "left" | "right";
  speed?: string; // e.g. "120s"
  rotate?: number;
  offset?: number;
}

function BgRow({ direction = "left", speed = "120s", rotate = 0, offset = 0 }: RowProps) {
  const loop = [...IMAGES, ...IMAGES, ...IMAGES];
  return (
    <div className="relative overflow-hidden">
      <div
        className={cn(
          "flex w-max gap-8 will-change-transform",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right"
        )}
        style={{ animationDuration: speed, marginLeft: offset }}
      >
        {loop.map((src, i) => (
          <div
            key={i}
            style={{ transform: `rotate(${(i % 2 === 0 ? 1 : -1) * rotate}deg)` }}
            className="h-64 w-[28rem] shrink-0 overflow-hidden rounded-3xl md:h-80 md:w-[34rem]"
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
      style={{
        WebkitMaskImage:
          "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 85%)",
        maskImage:
          "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 85%)",
      }}
    >
      {/* Layered scrolling rows at different speeds for parallax depth */}
      <div className="absolute inset-0 flex flex-col justify-center gap-6 opacity-[0.22] blur-[3px]">
        <BgRow direction="left" speed="140s" rotate={1} />
        <BgRow direction="right" speed="180s" rotate={1.5} offset={-200} />
        <BgRow direction="left" speed="160s" rotate={1} offset={-100} />
      </div>

      {/* Soft dark + brand gradient overlay for readability */}
      <div className="absolute inset-0 bg-background/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/30 to-background" />
    </div>
  );
}
