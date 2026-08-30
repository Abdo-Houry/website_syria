import { useState } from "react";
import { ImageOff } from "lucide-react";
import { assetUrl, cn } from "@/lib/utils";

/**
 * صورة تتعامل مع مسارات الباك اند النسبية (/uploads/...) ومع حالات الفشل
 * والتحميل — بدل ظهور أيقونة صورة مكسورة داخل تجربة "فاخرة".
 */
export function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  fallbackLabel,
}: {
  src?: string | null;
  alt: string;
  className?: string;
  wrapperClassName?: string;
  fallbackLabel?: string;
}) {
  const resolved = assetUrl(src);
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (!resolved || failed) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-basalt-900 via-basalt-800 to-basalt-600 text-sand-200/60",
          wrapperClassName,
          className,
        )}
        role="img"
        aria-label={alt}
      >
        <ImageOff className="size-6" aria-hidden />
        {fallbackLabel ? (
          <span className="px-3 text-center text-xs font-medium">{fallbackLabel}</span>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-sand-100", wrapperClassName)}>
      {!loaded ? <div className="absolute inset-0 animate-pulse bg-sand-200/70" /> : null}
      <img
        src={resolved}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={cn(
          "size-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className,
        )}
      />
    </div>
  );
}
