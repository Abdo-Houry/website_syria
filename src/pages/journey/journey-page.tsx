import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Handshake,
  HelpCircle,
  History,
  MapPinned,
  QrCode,
  Stamp as StampIcon,
  Swords,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress, ProgressRing } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { journeyApi } from "@/api/journey.api";
import { queryKeys } from "@/app/query-client";
import { useAuth } from "@/context/auth-context";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { cn, formatDate, percent } from "@/lib/utils";

export function JourneyPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { user } = useAuth();
  const {
    activeUserBook,
    book,
    province,
    isLoadingBook,
    bookError,
    progress,
    visits,
  } = useJourney();

  /* الخط الزمني للنشاط — نقطة نهاية معزولة على نسخة الكتيّب. */
  const timeline = useQuery({
    queryKey: activeUserBook
      ? queryKeys.journey(activeUserBook.id)
      : ["journey", "none"],
    queryFn: () => journeyApi.byUserBook(activeUserBook!.id),
    enabled: !!activeUserBook,
  });

  if (!activeUserBook) {
    return (
      <Page title={t("journey.title")}>
        <PageSection>
          <EmptyState
            icon={BookOpen}
            title={t("journey.noActive")}
            description={t("journey.noActiveBody")}
            action={
              <Button asChild size="lg">
                <Link to="/books">
                  <BookOpen />
                  {t("journey.toMyBooks")}
                </Link>
              </Button>
            }
          />
        </PageSection>
      </Page>
    );
  }

  const provinceName = province ? tField(province, "name", locale) : "";
  const bookName = book ? tField(book, "name", locale) : t("admin.book");
  const cover = province?.images?.[0]?.image_url;

  return (
    <Page title={t("journey.title")}>
      <PageSection className="pt-4">
        <div className="relative overflow-hidden rounded-[var(--radius-xl2)] bg-basalt-900 text-sand-50 shadow-[var(--shadow-lift)]">
          <SmartImage
            src={cover}
            alt={provinceName}
            wrapperClassName="absolute inset-0"
            className="size-full opacity-30"
            fallbackLabel=""
          />
          <div
            className="absolute inset-0 bg-gradient-to-l from-basalt-950/95 via-basalt-900/85 to-basalt-900/70"
            aria-hidden
          />

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="min-w-0">
              <p className="text-sm font-medium text-sand-100/70">
                {t("journey.greeting", {
                  name: user?.name?.split(" ")[0] ?? "",
                })}
              </p>
              <h1 className="mt-1 font-display text-3xl leading-tight sm:text-4xl">
                {t("journey.title")}
                {provinceName ? ` — ${provinceName}` : ""}
              </h1>
              <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-sand-100/75">
                <Badge variant="dark" className="bg-white/12">
                  <BookOpen />
                  {bookName}
                </Badge>
                <span dir="ltr" className="text-xs text-sand-100/55">
                  {activeUserBook.book_copy?.serial_number} /{" "}
                  {activeUserBook.book_copy?.version}
                </span>
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="gold" asChild>
                  <Link to="/scanner">
                    <QrCode />
                    {t("journey.scanCta")}
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                  className="border-white/25 bg-white/8 text-sand-50 hover:bg-white/15"
                >
                  <Link to="/province">
                    {t("journey.exploreProvince")}
                    <ArrowLeft className="ltr:rotate-180" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-center rounded-3xl bg-white/8 p-5 backdrop-blur-sm">
              {isLoadingBook ? (
                <Skeleton className="size-28 rounded-full bg-white/15" />
              ) : (
                <div className="text-center [&_span]:!text-sand-50">
                  <ProgressRing
                    done={
                      progress.placesVisited +
                      progress.challengesDone +
                      progress.stampsCollected
                    }
                    total={
                      progress.placesTotal +
                      progress.challengesTotal +
                      progress.stampsTotal
                    }
                    label={t("journey.ofJourney")}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </PageSection>

      <PageSection className="pt-0">
        {bookError ? (
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        ) : isLoadingBook ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-32 rounded-[var(--radius-xl2)]" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <MilestoneCard
              icon={MapPinned}
              title={t("journey.places")}
              done={progress.placesVisited}
              total={progress.placesTotal}
              to="/places"
              hint={t("journey.placesHint")}
            />
            <MilestoneCard
              icon={Swords}
              title={t("journey.challenges")}
              done={progress.challengesDone}
              total={progress.challengesTotal}
              to="/challenges"
              hint={t("journey.challengesHint")}
            />
            <MilestoneCard
              icon={StampIcon}
              title={t("journey.stamps")}
              done={progress.stampsCollected}
              total={progress.stampsTotal}
              to="/stamps"
              hint={t("journey.stampsHint")}
            />
          </div>
        )}
      </PageSection>

      <PageSection className="pt-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <QuickLink
            to="/partners"
            icon={Handshake}
            title={t("journey.partnersCard")}
            description={t("journey.partnersCardHint")}
          />
          <QuickLink
            to="/faq"
            icon={HelpCircle}
            title={t("journey.faqCard")}
            description={t("journey.faqCardHint")}
          />
        </div>
      </PageSection>

      <PageSection className="pt-0">
        <SectionHeader
          icon={History}
          title={t("journey.recent")}
          description={t("journey.recentHint")}
        />

        {timeline.isPending ? (
          <div className="flex flex-col gap-3">
            {[0, 1, 2].map((index) => (
              <Skeleton key={index} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : timeline.isError ? (
          <ErrorState
            message={toErrorMessage(timeline.error)}
            isNetwork={
              timeline.error instanceof ApiRequestError &&
              timeline.error.isNetworkError
            }
            onRetry={() => void timeline.refetch()}
          />
        ) : (timeline.data?.recentVisits?.length ?? 0) === 0 && visits.length === 0 ? (
          <EmptyState
            icon={Compass}
            title={t("journey.notStarted")}
            description={t("journey.notStartedBody")}
            action={
              <Button asChild>
                <Link to="/scanner">
                  <QrCode />
                  {t("journey.startScanning")}
                </Link>
              </Button>
            }
          />
        ) : (
          <ol className="relative flex flex-col gap-3 border-s-2 border-dashed border-sand-300 ps-5">
            {(timeline.data?.recentVisits ?? []).map((visit) => (
              <li key={visit.id} className="relative">
                <span
                  className="absolute -start-[1.6rem] top-4 size-3 rounded-full bg-gold-500 ring-4 ring-sand-50"
                  aria-hidden
                />
                <Card>
                  <CardContent className="flex items-center gap-3 p-4 pt-4">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold-500/15 text-gold-700">
                      {visit.place ? (
                        <MapPinned className="size-4.5" aria-hidden />
                      ) : (
                        <Compass className="size-4.5" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-basalt-900">
                        {visit.place
                          ? tField(visit.place, "name", locale)
                          : visit.province
                            ? tField(visit.province, "name", locale)
                            : t("journey.visitRecorded")}
                      </p>
                      <p className="text-xs text-basalt-600/70">
                        {formatDate(visit.visited_at, locale)}
                      </p>
                    </div>
                    {visit.place ? (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/places/${visit.place.id}`}>
                          {t("journey.view")}
                        </Link>
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        )}
      </PageSection>
    </Page>
  );
}

function MilestoneCard({
  icon: Icon,
  title,
  done,
  total,
  to,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  done: number;
  total: number;
  to: string;
  hint: string;
}) {
  const value = percent(done, total);
  const complete = total > 0 && done === total;

  return (
    <Link
      to={to}
      className={cn(
        "group block rounded-[var(--radius-xl2)] border bg-white p-5 shadow-[var(--shadow-soft)] outline-none transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2",
        complete ? "border-gold-500/50" : "border-basalt-900/8",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
          <Icon className="size-5" aria-hidden />
        </span>
        <span className="text-sm font-bold tabular-nums text-basalt-900">
          <span className="text-2xl">{done}</span>
          <span className="text-basalt-600/55"> / {total}</span>
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-basalt-900">{title}</h3>
      <p className="mt-0.5 text-xs leading-relaxed text-basalt-600/70">{hint}</p>
      <Progress value={value} className="mt-3" />
    </Link>
  );
}

function QuickLink({
  to,
  icon: Icon,
  title,
  description,
}: {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-4 shadow-[var(--shadow-soft)] transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-basalt-900 text-gold-300">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-basalt-900">{title}</span>
        <span className="block truncate text-xs text-basalt-600/75">
          {description}
        </span>
      </span>
      <ArrowLeft
        className="size-4 shrink-0 text-basalt-600/45 ltr:rotate-180"
        aria-hidden
      />
    </Link>
  );
}
