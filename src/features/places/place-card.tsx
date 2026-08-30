import { Check, Compass, MapPin, QrCode } from "lucide-react";
import { Link } from "react-router-dom";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { cn } from "@/lib/utils";
import type { Place } from "@/types/api";

/**
 * بطاقة مكان بارتفاع موحّد.
 *
 * البطاقات تُعرض في شبكة واحدة سواء كان المكان تابعاً لمنطقة أو مستقلاً
 * أو مكان استكشاف، لذلك تُبنى كعمود مرن يملأ خليّته: الغلاف بنسبة ثابتة،
 * والنصّ محدود الأسطر، وسطر المحافظة مثبَّت في الأسفل — فلا يتفاوت
 * الارتفاع بتفاوت طول الوصف.
 */
export function PlaceCard({
  place,
  visited,
}: {
  place: Place;
  visited: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();

  /* مكان استكشاف: تعريفي بلا QR — لا حالة زيارة له أصلاً. */
  const isExploration = place.is_exploration === true;

  const name = tField(place, "name", locale);
  const summary = tFieldOptional(place, "summary", locale);
  const provinceName = place.province
    ? tField(place.province, "name", locale)
    : undefined;
  const areaName = place.area ? tField(place.area, "name", locale) : undefined;

  return (
    <Link
      to={`/places/${place.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white shadow-[var(--shadow-soft)] outline-none transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2"
    >
      <div className="relative aspect-16/10 shrink-0 overflow-hidden">
        <SmartImage
          src={place.images?.[0]?.image_url}
          alt={name}
          wrapperClassName="size-full"
          className="transition-transform duration-700 group-hover:scale-105"
          fallbackLabel={name}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-basalt-950/70 via-transparent to-transparent"
          aria-hidden
        />

        <span className="absolute end-3 top-3">
          {isExploration ? (
            <Badge variant="dark">
              <Compass />
              {t("explore.badge")}
            </Badge>
          ) : visited ? (
            <Badge variant="gold" className="bg-gold-500 text-basalt-950">
              <Check />
              {t("places.visited")}
            </Badge>
          ) : (
            <Badge variant="dark">
              <QrCode />
              {t("places.notVisited")}
            </Badge>
          )}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3
          className={cn(
            "line-clamp-1 text-base font-bold text-basalt-900",
            visited && !isExploration && "text-basalt-600",
          )}
        >
          {name}
        </h3>

        {/* سطران دائماً — الفراغ يحفظ الارتفاع عند غياب الوصف. */}
        <p className="mt-1.5 line-clamp-2 min-h-10 text-sm leading-relaxed text-basalt-600/80">
          {summary ?? ""}
        </p>

        {provinceName ? (
          <p className="mt-auto flex items-center gap-1.5 pt-3 text-xs font-semibold text-basalt-600/70">
            <MapPin className="size-3.5 shrink-0 text-gold-600" aria-hidden />
            <span className="truncate">
              {provinceName}
              {areaName ? (
                <span className="text-basalt-600/55"> · {areaName}</span>
              ) : null}
            </span>
          </p>
        ) : null}
      </div>
    </Link>
  );
}
