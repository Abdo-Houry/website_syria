import { Suspense, lazy } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  Compass,
  Handshake,
  HelpCircle,
  Images,
  MapPin,
  MapPinned,
  Navigation,
  Stamp as StampIcon,
  Swords,
  Video,
} from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { Hero } from "@/components/common/hero";
import { LocationMapFallback } from "@/components/common/map-fallbacks";
import { ImageGallery, VideoGallery } from "@/components/common/media-gallery";
import { SectionHeader } from "@/components/common/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton, SkeletonCardGrid } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { PlaceCard } from "@/features/places/place-card";
import { PartnerCard } from "@/features/partners/partner-card";
import { StampTile } from "@/features/stamps/stamp-tile";
import { ChallengeCard } from "@/features/challenges/challenge-card";
import { faqsApi } from "@/api/faqs.api";
import { provincesApi } from "@/api/provinces.api";
import { queryKeys } from "@/app/query-client";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";

/* leaflet حزمة ثقيلة — تُحمَّل فقط عند وجود إحداثيات للمحافظة. */
const LocationMap = lazy(() =>
  import("@/components/common/location-map").then((m) => ({
    default: m.LocationMap,
  })),
);

/** إحداثيات المحافظة — بوستجرس يعيد الأعمدة العشرية كنصوص. */
function toCoordinates(value?: number | string | null) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * صفحة المحافظة — قلب تجربة الكتيّب.
 * المحتوى مقيّد بمحافظة الكتيّب النشط فقط، ولا يوجد تصفّح عام للمحافظات.
 */
export function ProvincePage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const {
    province,
    places,
    challenges,
    stamps,
    partners,
    isLoadingBook,
    bookError,
    isPlaceVisited,
    isProvinceVisited,
    isChallengeCompleted,
    isStampCollected,
    myStamps,
  } = useJourney();

  const provinceId = province?.id;

  const detail = useQuery({
    queryKey: provinceId ? queryKeys.province(provinceId) : ["province", "none"],
    queryFn: () => provincesApi.byId(provinceId!),
    enabled: !!provinceId,
    staleTime: 10 * 60_000,
  });

  const faqs = useQuery({
    queryKey: queryKeys.faqs,
    queryFn: faqsApi.list,
    staleTime: 10 * 60_000,
  });

  if (isLoadingBook) {
    return (
      <Page title={t("province.badge")}>
        <Skeleton className="h-[46vh] w-full rounded-[var(--radius-xl2)]" />
        <PageSection>
          <SkeletonCardGrid count={3} />
        </PageSection>
      </Page>
    );
  }

  if (bookError) {
    return (
      <Page title={t("province.badge")}>
        <PageSection>
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        </PageSection>
      </Page>
    );
  }

  if (!province) {
    return (
      <Page title={t("province.badge")}>
        <PageSection>
          <EmptyState
            icon={Compass}
            title={t("province.none")}
            description={t("province.noneBody")}
            action={
              <Button asChild>
                <Link to="/books">{t("journey.toMyBooks")}</Link>
              </Button>
            }
          />
        </PageSection>
      </Page>
    );
  }

  const full = detail.data ?? province;
  const images = full.images ?? [];
  const videos = full.videos ?? [];
  const visited = isProvinceVisited(province.id);
  const activeFaqs = (faqs.data ?? []).filter((faq) => faq.status);

  const name = tField(full, "name", locale);
  const summary = tFieldOptional(full, "summary", locale);
  const description = tFieldOptional(full, "description", locale);

  const latitude = toCoordinates(full.latitude);
  const longitude = toCoordinates(full.longitude);

  return (
    <Page title={name} bleed>
      <Hero
        image={images[0]?.image_url}
        title={name}
        eyebrow={
          <>
            <Badge variant="dark" className="bg-white/15">
              <MapPin />
              {t("province.badge")}
            </Badge>
            {visited ? (
              <Badge variant="dark" className="bg-gold-500 text-basalt-950">
                <BadgeCheck />
                {t("province.journeyStarted")}
              </Badge>
            ) : null}
          </>
        }
        subtitle={summary}
        badges={
          <>
            <Badge variant="dark" className="bg-white/12">
              <MapPinned />
              {t("province.countPlaces", { count: places.length })}
            </Badge>
            <Badge variant="dark" className="bg-white/12">
              <Swords />
              {t("province.countChallenges", { count: challenges.length })}
            </Badge>
            <Badge variant="dark" className="bg-white/12">
              <StampIcon />
              {t("province.countStamps", { count: stamps.length })}
            </Badge>
          </>
        }
        actions={
          <>
            <Button variant="gold" size="lg" asChild>
              <Link to="/places">
                <MapPinned />
                {t("province.browsePlaces")}
              </Link>
            </Button>
          </>
        }
      />

      {description ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Compass} title={t("province.about")} />
          <p className="whitespace-pre-line text-[15px] leading-loose text-basalt-700">
            {description}
          </p>
        </PageSection>
      ) : null}

      {latitude !== null && longitude !== null ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={Navigation}
            title={t("province.location")}
            description={t("map.routeHint")}
          />
          <Suspense fallback={<LocationMapFallback />}>
            <LocationMap
              latitude={latitude}
              longitude={longitude}
              title={name}
            />
          </Suspense>
        </PageSection>
      ) : null}

      <PageSection className="px-4 sm:px-0">
        <SectionHeader
          icon={MapPinned}
          title={t("province.bookPlaces")}
          description={t("province.bookPlacesHint")}
          action={
            places.length > 3 ? (
              <Button variant="ghost" size="sm" asChild>
                <Link to="/places">{t("common.all")}</Link>
              </Button>
            ) : null
          }
        />

        {places.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title={t("places.empty")}
            description={t("places.emptyBody")}
          />
        ) : (
          <div className="grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {places.slice(0, 6).map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                visited={isPlaceVisited(place.id)}
              />
            ))}
          </div>
        )}
      </PageSection>

      {images.length > 1 ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Images} title={t("province.gallery")} />
          <ImageGallery images={images.slice(1)} alt={name} />
        </PageSection>
      ) : null}

      {videos.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={Video} title={t("province.videos")} />
          <VideoGallery videos={videos} />
        </PageSection>
      ) : null}

      {challenges.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={Swords}
            title={t("province.challenges")}
            description={t("province.challengesHint")}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/challenges">{t("common.all")}</Link>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.slice(0, 4).map((challenge) => (
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

      {stamps.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={StampIcon}
            title={t("province.stamps")}
            description={t("province.stampsHint")}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/stamps">{t("province.album")}</Link>
              </Button>
            }
          />
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {stamps.slice(0, 6).map((stamp) => (
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

      {partners.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader
            icon={Handshake}
            title={t("province.partners")}
            description={t("province.partnersHint")}
            action={
              <Button variant="ghost" size="sm" asChild>
                <Link to="/partners">{t("common.all")}</Link>
              </Button>
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {partners.slice(0, 4).map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        </PageSection>
      ) : null}

      {activeFaqs.length ? (
        <PageSection className="px-4 sm:px-0">
          <SectionHeader icon={HelpCircle} title={t("province.faq")} />
          <Accordion type="single" collapsible className="flex flex-col gap-3">
            {activeFaqs.slice(0, 5).map((faq) => (
              <AccordionItem key={faq.id} value={String(faq.id)}>
                <AccordionTrigger>{tField(faq, "question", locale)}</AccordionTrigger>
                <AccordionContent>{tField(faq, "answer", locale)}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {activeFaqs.length > 5 ? (
            <Button variant="ghost" className="mt-4" asChild>
              <Link to="/faq">{t("province.viewAllFaq")}</Link>
            </Button>
          ) : null}
        </PageSection>
      ) : null}

      <div className="h-4" />
    </Page>
  );
}
