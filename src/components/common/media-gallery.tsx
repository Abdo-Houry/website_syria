import { useState } from "react";
import { Expand, PlayCircle } from "lucide-react";
import { SmartImage } from "@/components/common/smart-image";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { assetUrl, cn } from "@/lib/utils";

export interface GalleryImage {
  id: number;
  image_url: string;
}

export interface GalleryVideo {
  id: number;
  video_url: string;
  title?: string | null;
}

/** معرض صور بشبكة فسيفسائية + عارض بملء الشاشة. */
export function ImageGallery({
  images,
  alt,
  className,
}: {
  images: GalleryImage[];
  alt: string;
  className?: string;
}) {
  const [active, setActive] = useState<GalleryImage | null>(null);

  if (!images.length) return null;

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
          className,
        )}
      >
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActive(image)}
            className={cn(
              "group relative aspect-4/3 overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
              index === 0 && images.length > 3 ? "col-span-2 row-span-2 aspect-square sm:aspect-4/3" : "",
            )}
          >
            <SmartImage
              src={image.image_url}
              alt={`${alt} — صورة ${index + 1}`}
              wrapperClassName="size-full"
              className="transition-transform duration-500 group-hover:scale-110"
            />
            <span className="absolute inset-0 bg-basalt-950/0 transition-colors group-hover:bg-basalt-950/25" />
            <span className="absolute bottom-2 end-2 grid size-8 place-items-center rounded-full bg-white/85 text-basalt-900 opacity-0 transition-opacity group-hover:opacity-100">
              <Expand className="size-4" aria-hidden />
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <DialogContent className="max-w-3xl bg-basalt-950 p-0">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          {active ? (
            <img
              src={assetUrl(active.image_url)}
              alt={alt}
              className="max-h-[80dvh] w-full object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

/** قائمة فيديوهات — الباك اند يخزّن ملفات مرفوعة تحت /uploads. */
export function VideoGallery({
  videos,
  className,
}: {
  videos: GalleryVideo[];
  className?: string;
}) {
  if (!videos.length) return null;

  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {videos.map((video) => (
        <figure
          key={video.id}
          className="overflow-hidden rounded-2xl border border-basalt-900/8 bg-basalt-950"
        >
          <video
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full bg-black"
            src={assetUrl(video.video_url)}
          />
          <figcaption className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-sand-100">
            <PlayCircle className="size-4 text-gold-400" aria-hidden />
            {video.title || "مقطع مرئي"}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
