import { Lock, MapPin } from "lucide-react";
import { SmartImage } from "@/components/common/smart-image";
import { useLocale } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { cn, formatDate } from "@/lib/utils";
import type { Stamp } from "@/types/api";

/**
 * خانة طابع داخل الألبوم.
 * المقفل يظهر بصيغة رمادية/مطموسة مع قفل — والمفتوح بألوانه وختمه.
 *
 * على الجوال كانت البطاقة مربّعة بمقاس ثابت للصورة، فيتزاحم الاسم
 * واسم المكان والتاريخ في مساحة لا تتّسع لها ويخرج النصّ عن الإطار.
 * الآن الارتفاع يتبع المحتوى (بحدّ أدنى يحفظ انتظام الشبكة)، والصورة
 * تكبر مع المقاس، والتاريخ يظهر على الشاشات الأوسع وحدها.
 */
export function StampTile({
  stamp,
  collected,
  collectedAt,
  onClick,
}: {
  stamp: Stamp;
  collected: boolean;
  collectedAt?: string;
  onClick?: () => void;
}) {
  const { locale } = useLocale();
  const name = tField(stamp, "name", locale);
  const placeName = stamp.place ? tField(stamp.place, "name", locale) : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex min-h-40 flex-col items-center justify-center gap-2 overflow-hidden rounded-[var(--radius-xl2)] border-2 border-dashed p-2.5 text-center outline-none transition-all focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 sm:min-h-48 sm:p-3",
        collected
          ? "border-gold-500/60 border-solid bg-white shadow-[var(--shadow-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
          : "border-basalt-900/15 bg-sand-100/60",
      )}
    >
      <div
        className={cn(
          "relative size-14 shrink-0 overflow-hidden rounded-full ring-2 transition-all sm:size-18 lg:size-20",
          collected
            ? "ring-gold-500/70"
            : "opacity-45 grayscale ring-basalt-900/10 blur-[1px]",
        )}
      >
        <SmartImage
          src={stamp.image_url}
          alt={name}
          wrapperClassName="size-full"
          className="size-full"
        />
      </div>

      <span
        className={cn(
          "line-clamp-2 w-full text-[11px] font-bold leading-snug sm:text-xs",
          collected ? "text-basalt-900" : "text-basalt-600/60",
        )}
      >
        {name}
      </span>

      {collected ? (
        <>
          {placeName ? (
            <span className="flex w-full items-center justify-center gap-1 text-[10px] leading-tight text-basalt-600/70">
              <MapPin className="size-3 shrink-0 text-gold-600" aria-hidden />
              <span className="truncate">{placeName}</span>
            </span>
          ) : null}
          {collectedAt ? (
            /* التاريخ تفصيل ثانوي — يُخفى حيث تضيق البطاقة. */
            <span className="hidden text-[10px] text-basalt-600/55 sm:block">
              {formatDate(collectedAt, locale)}
            </span>
          ) : null}
          <span
            className="pointer-events-none absolute inset-0 rounded-[var(--radius-xl2)] ring-1 ring-inset ring-gold-500/25"
            aria-hidden
          />
        </>
      ) : (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-9 place-items-center rounded-full bg-basalt-900/75 text-sand-100">
            <Lock className="size-4" aria-hidden />
          </span>
        </span>
      )}
    </button>
  );
}
