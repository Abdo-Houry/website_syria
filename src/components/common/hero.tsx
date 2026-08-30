import { SmartImage } from "@/components/common/smart-image";
import { cn } from "@/lib/utils";

/**
 * غلاف بصري كبير يُستخدم في صفحات المحافظة والمكان — صورة ممتدة مع تدرّج
 * يضمن قراءة النص فوقها.
 */
export function Hero({
  image,
  title,
  eyebrow,
  subtitle,
  badges,
  actions,
  height = "tall",
}: {
  image?: string | null;
  title: string;
  eyebrow?: React.ReactNode;
  subtitle?: string | null;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  height?: "tall" | "short";
}) {
  return (
    <section
      className={cn(
        "relative isolate flex items-end overflow-hidden rounded-b-[2rem] sm:rounded-[var(--radius-xl2)]",
        height === "tall" ? "min-h-[58vh] sm:min-h-[52vh]" : "min-h-[38vh]",
      )}
    >
      <SmartImage
        src={image}
        alt={title}
        wrapperClassName="absolute inset-0 -z-10"
        className="size-full"
        fallbackLabel={title}
      />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-t from-basalt-950 via-basalt-950/65 to-basalt-950/10"
        aria-hidden
      />

      <div className="w-full p-6 pb-8 sm:p-9">
        {eyebrow ? (
          <div className="mb-3 flex flex-wrap items-center gap-2">{eyebrow}</div>
        ) : null}

        <h1 className="font-display text-4xl leading-tight text-sand-50 drop-shadow-sm sm:text-5xl">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-3 max-w-2xl text-sm leading-loose text-sand-100/85 sm:text-base">
            {subtitle}
          </p>
        ) : null}

        {badges ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">{badges}</div>
        ) : null}

        {actions ? (
          <div className="mt-6 flex flex-wrap items-center gap-3">{actions}</div>
        ) : null}
      </div>
    </section>
  );
}
