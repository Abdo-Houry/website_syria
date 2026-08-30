import { Suspense, lazy } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  Compass,
  Images,
  Info,
  MapPin,
  Navigation,
  QrCode,
  Stamp as StampIcon,
  Swords,
  Video,
} from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { Hero } from "@/components/common/hero";
import { LocationMapFallback } from "@/components/common/location-map";
import { ImageGallery, VideoGallery } from "@/components/common/media-gallery";
import { SectionHeader } from "@/components/common/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { ChallengeCard } from "@/features/challenges/challenge-card";
import { StampTile } from "@/features/stamps/stamp-tile";
import { placesApi } from "@/api/places.api";
import { queryKeys } from "@/app/query-client";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

/* leaflet حزمة ثقيلة — لا يدفع ثمنها إلا من فتح مكاناً له إحداثيات. */
const LocationMap = lazy(() =>
  import("@/components/common/location-map").then((m) => ({
    default: m.LocationMap,
  })),
);

export function PlaceDetailPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { id } = useParams<{ id: string }>();
  const placeId = Number(id);
  const navigate = useNavigate();

  const {
    places,
    isPlaceVisited,
    isChallengeCompleted,
    isStampCollected,
    myStamps,
    challenges: bookChallenges,
    stamps: bookStamps,
  } = useJourney();

  const query = useQuery({
    queryKey: queryKeys.place(placeId),
    queryFn: () => placesApi.byId(placeId),
    enabled: Number.isFinite(placeId) && placeId > 0,
  });

  const inCurrentBook = places.some((place) => place.id === placeId);

  if (query.isPending) {
    return (
      <Page title={t("admin.place")}>
        <Skeleton className="h-[46vh] w-full rounded-[var(--radius-xl2)]" />
        <PageSection className="px-4 sm:px-0">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="mt-3 h-24 w-full" />
        </PageSection>
      </Page>
    );
  }

  if (query.isError) {
    return (
      <Page title={t("admin.place")}>
        <PageSection>
          <ErrorState
            message={toErrorMessage(query.error)}
            isNetwork={
              query.error instanceof ApiRequestError && query.error.isNetworkError
            }
            onRetry={() => void query.refetch()}
          />
          <div className="mt-4 flex justify-center">
            <Button variant="ghost" asChild>
              <Link to="/places">
                <ArrowRight className="ltr:rotate-180" />
                {t("places.backToPlaces")}
              </Link>
            </Button>
          </div>
        </PageSection>
      </Page>
    );
  }

  const place = query.data;

  /*
    مكان استكشاف: تعريفي بحت — تفاصيل ووسائط وموقع فقط. لا رمز QR له،
    فلا بطاقة توثيق زيارة ولا تحديات ولا طوابع.
  */
  const isExploration = place.is_exploration === true;

  const visited = isPlaceVisited(place.id);
  const images = place.images ?? [];
  const videos = place.videos ?? [];

  const name = tField(place, "name", locale);
  const summary = tFieldOptional(place, "summary", locale);
  const description = tFieldOptional(place, "description", locale);
  const visitInfo = tFieldOptional(place, "visit_info", locale);

  /*
    GET /places/:id لا يعيد التحديات والطوابع، لذلك نأخذها من محتوى الكتيّب
    النشط ونُصفّيها على هذا المكان — دون اختراع أي نقطة نهاية جديدة.
  */
  const placeChallenges = isExploration
    ? []
    : bookChallenges.filter((challenge) => challenge.place?.id === place.id);

  const placeStamps = isExploration
    ? []
    : bookStamps.filter((stamp) => stamp.place?.id === place.id);

  const hasCoordinates =
    place.latitude !== null &&
    place.latitude !== undefined &&
    place.longitude !== null &&
    place.longitude !== undefined;

  return (
    <Page title={name} bleed>
      <Hero
        image={images[0]?.image_url}
        title={name}
        height="short"
        eyebrow={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(-1)}
              className="border-white/25 bg-white/10 text-sand-50 hover:bg-white/20"
            >
              <ArrowRight className="ltr:rotate-180" />
              {t("common.back")}
            </Button>
            {place.province ? (
              <Badge variant="dark" className="bg-white/15">
                <MapPin />
                {tField(place.province, "name", locale)}
              </Badge>
            ) : null}
          </>
        }
        subtitle={summary}
        badges={
          isExploration ? (
            <Badge variant="dark" className="bg-white/15">
              <Compass />
              {t("explore.badge")}
            </Badge>
          ) : visited ? (
            <Badge variant="dark" className="bg-gold-500 text-basalt-950">
              <BadgeCheck />
              {t("places.visited")}
            </Badge>
          ) : (
            <Badge variant="dark" className="bg-white/15">
              <QrCode />
              {t("places.notVisitedBadge")}
            </Badge>
          )
        }
      />

      <PageSection className="px-4 sm:px-0">
        {isExploration ? (
          <Card className="border-basalt-400/35 bg-basalt-400/8">
            <CardContent className="flex items-start gap-3 p-5 pt-5">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-basalt-400/20 text-basalt-600">
                <Compass className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-basalt-900">
                  {t("explore.badge")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-basalt-700">
                  {t("explore.note")}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card
            className={
              visited
                ? "border-basalt-400/35 bg-basalt-400/8"
                : "border-gold-500/35 bg-gold-500/6"
            }
          >
            <CardContent className="flex flex-col gap-4 p-5 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                    visited
                      ? "bg-basalt-400/20 text-basalt-600"
                      : "bg-gold-500/20 text-gold-700"
                  }`}
                >
                  {visited ? (
                    <BadgeCheck className="size-5" aria-hidden />
                  ) : (
                    <QrCode className="size-5" aria-hidden />
                  )}
                </span>
                <div>
                  <h2 className="text-sm font-bold text-basalt-900">
                    {visited
                      ? t("places.visitDocumented")
                      : t("places.visitPrompt")}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-basalt-700">
                    {visited
                      ? t("places.visitDocumentedBody")
                      : !inCurrentBook
                        ? t("places.notInBook")
                        : t("places.visitPromptBody")}
                  </p>
                </div>
              </div>

              {!visited ? (
                /*
                  ?place= يحصر المسح بهذا المكان: من فتح الماسح من هنا
                  يقصد توثيق زيارته هو، فمسح رمز مكان آخر يُنبَّه إليه.
                */
                <Button asChild className="shrink-0">
                  <Link to={`/scanner?place=${place.id}`}>
                    <QrCode />
                    {t("scanner.open")}
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </PageSection>

      {description ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={BookOpenText} title={t("places.about")} />
          <p className="whitespace-pre-line text-[15px] leading-loose text-basalt-700">
            {description}
          </p>
        </PageSection>
      ) : null}

      {visitInfo ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Info} title={t("places.visitInfo")} />
          <Card>
            <CardContent className="p-5 pt-5">
              <p className="whitespace-pre-line text-sm leading-loose text-basalt-700">
                {visitInfo}
              </p>
            </CardContent>
          </Card>
        </PageSection>
      ) : null}

      {hasCoordinates ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={Navigation}
            title={t("places.location")}
            description={t("map.routeHint")}
          />
          <Suspense fallback={<LocationMapFallback />}>
            <LocationMap
              latitude={Number(place.latitude)}
              longitude={Number(place.longitude)}
              title={name}
            />
          </Suspense>
        </PageSection>
      ) : null}

      {images.length > 1 ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Images} title={t("places.gallery")} />
          <ImageGallery images={images.slice(1)} alt={name} />
        </PageSection>
      ) : null}

      {videos.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Video} title={t("places.videos")} />
          <VideoGallery videos={videos} />
        </PageSection>
      ) : null}

      {placeChallenges.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={Swords}
            title={t("places.challengesHere")}
            description={t("places.challengesHereHint")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {placeChallenges.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                completed={isChallengeCompleted(challenge.id)}
                onOpen={() => navigate("/challenges")}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      {placeStamps.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={StampIcon} title={t("places.stampsHere")} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {placeStamps.map((stamp) => (
              <StampTile
                key={stamp.id}
                stamp={stamp}
                collected={isStampCollected(stamp.id)}
                collectedAt={
                  myStamps.find((item) => item.stamp?.id === stamp.id)?.collected_at
                }
                onClick={() => navigate("/stamps")}
              />
            ))}
          </div>
        </PageSection>
      ) : null}

      <div className="h-4" />
    </Page>
  );
}
