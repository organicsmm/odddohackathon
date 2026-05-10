import { cn } from "@/lib/utils";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1719368472026-dc26f70a9b76?q=80&h=800&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1649265825072-f7dd6942baed?q=80&h=800&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&h=800&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1729086046027-09979ade13fd?q=80&h=800&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1601568494843-772eb04aca5d?q=80&h=800&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1585687501004-615dfdfde7f1?q=80&h=800&w=800&auto=format&fit=crop",
];

interface ImageGalleryProps {
  images?: string[];
  title?: string;
  description?: string;
  showHeader?: boolean;
  className?: string;
}

export default function ImageGallery({
  images = DEFAULT_IMAGES,
  title = "Our Latest Creations",
  description = "A visual collection of our most recent works – each piece crafted with intention, emotion, and style.",
  showHeader = true,
  className,
}: ImageGalleryProps) {
  return (
    <section className={cn("w-full", className)}>
      {showHeader && (
        <div className="mb-8 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            {title}
          </h2>
          <p className="mt-3 mx-auto max-w-2xl text-muted-foreground">
            {description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {images.map((src, idx) => (
          <div
            key={idx}
            className={cn(
              "group relative overflow-hidden rounded-2xl bg-muted shadow-soft",
              "aspect-square"
            )}
          >
            <img
              src={src}
              alt={`Gallery image ${idx + 1}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </section>
  );
}
