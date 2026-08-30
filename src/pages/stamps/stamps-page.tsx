import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Award, Lock, MapPin, Sparkles, Stamp as StampIcon } from "lucide-react";
import { toast } from "sonner";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StampTile } from "@/features/stamps/stamp-tile";
import { stampsApi } from "@/api/stamps.api";
import { invalidateProgress } from "@/app/query-client";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { formatDate, percent } from "@/lib/utils";
import type { Stamp } from "@/types/api";

export function StampsPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const {
    stamps,
    myStamps,
    isLoadingBook,
    bookError,
    isStampCollected,
    progress,
    activeUserBook,
    isPlaceVisited,
  } = useJourney();

  const [selected, setSelected] = useState<Stamp | null>(null);

  const collect = useMutation({
    mutationFn: (stampId: number) =>
      stampsApi.collect(stampId, activeUserBook?.id),
    onSuccess: async () => {
      await invalidateProgress(activeUserBook?.id);
      toast.success(t("stamps.collected"));
      setSelected(null);
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  const collectedAtById = useMemo(() => {
    const map = new Map<number, string>();
    myStamps.forEach((item) => {
      if (item.stamp) map.set(item.stamp.id, item.collected_at);
    });
    return map;
  }, [myStamps]);

  const selectedCollected = selected ? isStampCollected(selected.id) : false;
  /* الطابع يُفتح منطقياً بعد زيارة مكانه — نعرض ذلك كإرشاد للمستخدم. */
  const selectedPlaceVisited =
    selected?.place?.id !== undefined ? isPlaceVisited(selected.place.id) : true;

  return (
    <Page title={t("stamps.title")}>
      <PageSection>
        <SectionHeader
          icon={StampIcon}
          title={t("stamps.title")}
          description={t("stamps.subtitle")}
        />

        {progress.stampsTotal > 0 ? (
          <div className="mb-6 overflow-hidden rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-4 p-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
                <Award className="size-7" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-basalt-900">
                    {t("stamps.filling")}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-basalt-900">
                    {progress.stampsCollected} / {progress.stampsTotal}
                  </span>
                </div>
                <Progress
                  className="mt-2"
                  value={percent(progress.stampsCollected, progress.stampsTotal)}
                />
              </div>
            </div>
          </div>
        ) : null}

        {isLoadingBook ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-square rounded-[var(--radius-xl2)]"
              />
            ))}
          </div>
        ) : bookError ? (
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        ) : stamps.length === 0 ? (
          <EmptyState
            icon={StampIcon}
            title={t("stamps.empty")}
            description={t("stamps.emptyBody")}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {stamps.map((stamp) => (
              <StampTile
                key={stamp.id}
                stamp={stamp}
                collected={isStampCollected(stamp.id)}
                collectedAt={collectedAtById.get(stamp.id)}
                onClick={() => setSelected(stamp)}
              />
            ))}
          </div>
        )}
      </PageSection>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-sm">
          {selected ? (
            <>
              <DialogHeader className="items-center text-center">
                <div
                  className={`mx-auto mb-2 size-28 overflow-hidden rounded-full ring-4 ${
                    selectedCollected
                      ? "ring-gold-500/70"
                      : "opacity-45 grayscale ring-basalt-900/10"
                  }`}
                >
                  <SmartImage
                    src={selected.image_url}
                    alt={tField(selected, "name", locale)}
                    wrapperClassName="size-full"
                    className="size-full"
                  />
                </div>
                <DialogTitle className="text-center">
                  {tField(selected, "name", locale)}
                </DialogTitle>
                {tFieldOptional(selected, "description", locale) ? (
                  <DialogDescription className="text-center">
                    {tFieldOptional(selected, "description", locale)}
                  </DialogDescription>
                ) : null}
              </DialogHeader>

              <DialogBody className="flex flex-col items-center gap-3 pb-2">
                {selected.place ? (
                  <Badge variant="neutral">
                    <MapPin />
                    {tField(selected.place, "name", locale)}
                  </Badge>
                ) : null}

                {selectedCollected ? (
                  <p className="text-center text-sm text-basalt-600/80">
                    {t("stamps.collectedAt", {
                      date: formatDate(collectedAtById.get(selected.id), locale),
                    })}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 rounded-2xl bg-sand-100 px-4 py-3 text-center text-sm leading-relaxed text-basalt-700">
                    <Lock className="size-4 shrink-0 text-basalt-600/70" aria-hidden />
                    {selectedPlaceVisited
                      ? t("stamps.waiting")
                      : t("stamps.visitFirst")}
                  </p>
                )}
              </DialogBody>

              <DialogFooter>
                {selectedCollected ? (
                  <Button variant="outline" block onClick={() => setSelected(null)}>
                    {t("common.close")}
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="gold"
                      loading={collect.isPending}
                      onClick={() => collect.mutate(selected.id)}
                    >
                      <Sparkles />
                      {t("stamps.collect")}
                    </Button>
                    <Button variant="ghost" onClick={() => setSelected(null)}>
                      {t("common.later")}
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </Page>
  );
}
