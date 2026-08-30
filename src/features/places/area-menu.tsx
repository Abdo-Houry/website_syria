import { Layers, MapPinned } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { PlaceCard } from "@/features/places/place-card";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import type { Area, Place } from "@/types/api";

export interface AreaGroup {
  area: Area;
  places: Place[];
}

export interface GroupedPlaces {
  /** مجموعات مناطق عادية — كل منطقة تُعرض كقائمة تضم عدة أماكن. */
  groups: AreaGroup[];
  /** أماكن لا تتبع أي منطقة — تُعرض كبطاقات مباشرة. */
  loose: Place[];
}

/**
 * يجمّع الأماكن حسب المنطقة. أماكن الاستكشاف تُعامَل كبقية الأماكن هنا —
 * الفرق الوحيد أنها تُعرض ببطاقة استكشاف بدل حالة الزيارة.
 */
export function groupPlacesByArea(places: Place[]): GroupedPlaces {
  const groups: AreaGroup[] = [];
  const byAreaId = new Map<number, AreaGroup>();
  const loose: Place[] = [];

  for (const place of places) {
    const area = place.area;

    if (!area) {
      loose.push(place);
      continue;
    }

    let group = byAreaId.get(area.id);
    if (!group) {
      group = { area, places: [] };
      byAreaId.set(area.id, group);
      groups.push(group);
    }
    group.places.push(place);
  }

  return { groups, loose };
}

/**
 * قائمة (MENU) لمنطقة تضم عدة أماكن — تُطوى وتُفتح لتوحي بأن ضمن هذه المنطقة
 * عدة أماكن. عند البحث تُفتح كل المجموعات تلقائياً.
 */
export function AreaPlacesMenu({
  groups,
  isPlaceVisited,
  expandAll = false,
}: {
  groups: AreaGroup[];
  isPlaceVisited: (placeId: number) => boolean;
  /** فتح كل المجموعات تلقائياً (مثلاً أثناء البحث). */
  expandAll?: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();

  if (groups.length === 0) return null;

  return (
    <Accordion
      type="multiple"
      /* إعادة التركيب عند تبديل وضع البحث تُعيد تطبيق الحالة الافتراضية للفتح. */
      key={expandAll ? "expanded" : "collapsed"}
      defaultValue={expandAll ? groups.map((group) => String(group.area.id)) : []}
      className="flex flex-col gap-3"
    >
      {groups.map((group) => {
        const areaName = tField(group.area, "name", locale);

        return (
          <AccordionItem key={group.area.id} value={String(group.area.id)}>
            <AccordionTrigger>
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
                  <Layers className="size-4" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[15px] font-bold text-basalt-900">
                      {areaName}
                    </span>
                    <Badge variant="neutral" className="shrink-0">
                      <MapPinned />
                      {t("province.countPlaces", { count: group.places.length })}
                    </Badge>
                  </span>
                  <span className="mt-0.5 block truncate text-xs font-medium text-basalt-600/70">
                    {t("places.areaMenuHint")}
                  </span>
                </span>
              </span>
            </AccordionTrigger>

            <AccordionContent className="bg-sand-50/40">
              {/* نفس شبكة الأماكن المستقلّة — البطاقة واحدة أينما ظهرت. */}
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.places.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    visited={isPlaceVisited(place.id)}
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
