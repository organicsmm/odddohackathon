import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface HeroSlide {
  image: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

interface HeroSliderProps {
  slides: HeroSlide[];
  intervalMs?: number;
  children?: (slide: HeroSlide, index: number) => React.ReactNode;
  className?: string;
}

export function HeroSlider({ slides, intervalMs = 5000, children, className }: HeroSliderProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), intervalMs);
    return () => clearInterval(id);
  }, [slides.length, intervalMs]);

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      {/* slides */}
      {slides.map((s, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-all duration-[1200ms] ease-out",
            i === index ? "opacity-100 scale-100" : "opacity-0 scale-105"
          )}
          aria-hidden={i !== index}
        >
          <img
            src={s.image}
            alt={s.title}
            className="h-full w-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* per-slide overlay content */}
      {children && (
        <div className="relative z-10 h-full">
          {children(slides[index], index)}
        </div>
      )}

      {/* pagination indicator */}
      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3 text-xs font-medium tracking-widest text-foreground/80">
        <span className="tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                "h-[2px] transition-all duration-500",
                i === index ? "w-10 bg-foreground" : "w-6 bg-foreground/30 hover:bg-foreground/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
