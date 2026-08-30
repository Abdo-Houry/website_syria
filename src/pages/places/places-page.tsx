import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPinned, QrCode, Search } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SkeletonCardGrid } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceCard } from "@/features/places/place-card";
import { AreaPlacesMenu, groupPlacesByArea } from "@/features/places/area-menu";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

type Filter = "all" | "visited" | "remaining";

export function PlacesPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { places, isLoadingBook, bookError, isPlaceVisited, province, progress } =
    useJourney();
  const [filter, setFilter] = useState<Filter>("all");
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return places.filter((place) => {
      /*
        مكان الاستكشاف بلا زيارة تُوثَّق، فلا معنى لظهوره ضمن «المزارة»
        أو «المتبقية» — يظهر في «الكل» فقط.
      */
      if (place.is_exploration) {
        if (filter !== "all") return false;
      } else {
        const visited = isPlaceVisited(place.id);
        if (filter === "visited" && !visited) return false;
        if (filter === "remaining" && visited) return false;
      }
      if (!needle) return true;
      const name = tField(place, "name", locale).toLowerCase();
      const summary = tField(place, "summary", locale).toLowerCase();
      return name.includes(needle) || summary.includes(needle);
    });
  }, [places, filter, term, isPlaceVisited, locale]);

  /* الأماكن التابعة لمنطقة تُعرض كقائمة (MENU)، وبقيتها كبطاقات مباشرة. */
  const grouped = useMemo(() => groupPlacesByArea(filtered), [filtered]);
  const isSearching = term.trim().length > 0;

  return (
    <Page title={t("places.title")}>
      <PageSection>
        <SectionHeader
          icon={MapPinned}
          title={t("places.title")}
          description={
            province
              ? t("places.subtitle", {
                  done: progress.placesVisited,
                  total: progress.placesTotal,
                  province: tField(province, "name", locale),
                })
              : undefined
          }
          action={
            <Button variant="gold" size="sm" asChild>
              <Link to="/scanner">
                <QrCode />
                {t("nav.scanner")}
              </Link>
            </Button>
          }
        />

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
              aria-hidden
            />
            <Input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("places.searchPlaceholder")}
              className="ps-11"
              aria-label={t("common.search")}
            />
          </div>

          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as Filter)}
            className="sm:w-auto"
          >
            <TabsList className="sm:w-auto">
              <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
              <TabsTrigger value="remaining">
                {t("places.filterRemaining")}
              </TabsTrigger>
              <TabsTrigger value="visited">{t("places.filterVisited")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {isLoadingBook ? (
          <SkeletonCardGrid />
        ) : bookError ? (
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        ) : places.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title={t("places.empty")}
            description={t("places.emptyBody")}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title={t("places.noMatch")}
            description={t("places.noMatchBody")}
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setTerm("");
                  setFilter("all");
                }}
              >
                {t("common.reset")}
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col gap-5">
            {grouped.groups.length > 0 ? (
              <AreaPlacesMenu
                groups={grouped.groups}
                isPlaceVisited={isPlaceVisited}
                expandAll={isSearching}
              />
            ) : null}

            {grouped.loose.length > 0 ? (
              /* auto-rows-fr: كل بطاقات الصف بارتفاع واحد. */
              <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {grouped.loose.map((place) => (
                  <PlaceCard
                    key={place.id}
                    place={place}
                    visited={isPlaceVisited(place.id)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </PageSection>
    </Page>
  );
}
