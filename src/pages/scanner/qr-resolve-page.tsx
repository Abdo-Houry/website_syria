import { useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Loader2,
  MapPinned,
  QrCode,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { qrApi } from "@/api/qr.api";
import { userBooksApi } from "@/api/user-books.api";
import { invalidateProgress, queryClient, queryKeys } from "@/app/query-client";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { useErrorMessage } from "@/lib/use-error-message";
import type { QrTargetType } from "@/types/api";

/**
 * وجهة الرمز الممسوح: `/qr/:type/:id?serial=&version=`
 *
 * هذا هو نفس المسار الذي يبنيه الباك اند داخل `qr_value`، لذلك يعمل أيضاً عند
 * فتح الرابط مباشرة من كاميرا الهاتف.
 *
 * الباك اند يسجّل الزيارة تلقائياً عند استيفاء شرطين: وجود توكن مستخدم،
 * وامتلاك المستخدم لنسخة كتيّب بنفس السيريال والإصدار.
 */
export function QrResolvePage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const { locale } = useLocale();
  const { type, id } = useParams<{ type: string; id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { findUserBookBySerial, activeUserBook, setActiveUserBookId } = useJourney();

  const serial = searchParams.get("serial")?.trim() ?? "";
  const version = searchParams.get("version")?.trim() ?? "";
  const targetId = Number(id);
  const targetType = (type ?? "").toUpperCase() as QrTargetType;

  const isValidRequest =
    (targetType === "PROVINCE" || targetType === "PLACE") &&
    Number.isFinite(targetId) &&
    targetId > 0 &&
    !!serial &&
    !!version;

  const owningUserBook = useMemo(
    () => (serial && version ? findUserBookBySerial(serial, version) : null),
    [findUserBookBySerial, serial, version],
  );

  /* تبديل السياق تلقائياً إلى الكتيّب الذي يخصّه الرمز. */
  const switchedRef = useRef(false);
  useEffect(() => {
    if (switchedRef.current) return;
    if (owningUserBook && owningUserBook.id !== activeUserBook?.id) {
      switchedRef.current = true;
      setActiveUserBookId(owningUserBook.id);
    }
  }, [owningUserBook, activeUserBook?.id, setActiveUserBookId]);

  /* الرمز صالح لكن النسخة غير مرتبطة بالحساب — يمكن تفعيلها من هنا مباشرة. */
  const activation = useMutation({
    mutationFn: () => userBooksApi.activate({ serial, version }),
    onSuccess: async (userBook) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userBooks });
      setActiveUserBookId(userBook.id);
      toast.success(t("scanner.activatedRescan"));
    },
    onError: (error) => toast.error(toErrorMessage(error)),
  });

  const query = useQuery({
    queryKey: ["qr", serial, version, targetType, targetId],
    queryFn: () =>
      qrApi.resolve({ serial, version, type: targetType, targetId }),
    enabled: isValidRequest,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });

  /* بعد نجاح المسح لمالك الكتيّب: الزيارة سُجِّلت — نُحدّث التقدّم. */
  const invalidatedRef = useRef(false);
  useEffect(() => {
    if (query.isSuccess && owningUserBook && !invalidatedRef.current) {
      invalidatedRef.current = true;
      void invalidateProgress(owningUserBook.id);
    }
  }, [query.isSuccess, owningUserBook]);

  /* ------------------------- حالات الخطأ ------------------------- */

  if (!isValidRequest) {
    return (
      <ResultShell>
        <StateCard
          tone="danger"
          icon={ShieldAlert}
          title={t("scanner.incomplete")}
          description={t("scanner.incompleteBody")}
          actions={
            <Button onClick={() => navigate("/scanner", { replace: true })}>
              <QrCode />
              {t("scanner.open")}
            </Button>
          }
        />
      </ResultShell>
    );
  }

  if (query.isPending) {
    return (
      <ResultShell>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 pt-10 text-center">
            <Loader2 className="size-8 animate-spin text-gold-500" aria-hidden />
            <h2 className="text-base font-bold text-basalt-900">
              {t("scanner.checking")}
            </h2>
            <p className="text-sm text-basalt-600/80">
              {t("scanner.checkingBody")}
            </p>
          </CardContent>
        </Card>
      </ResultShell>
    );
  }

  if (query.isError) {
    return (
      <ResultShell>
        <StateCard
          tone="danger"
          icon={ShieldAlert}
          title={t("scanner.invalid")}
          description={toErrorMessage(query.error)}
          actions={
            <>
              <Button onClick={() => navigate("/scanner", { replace: true })}>
                <QrCode />
                {t("books.scanAnother")}
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/journey">
                  {t("scanner.backToJourney")}
                  <ArrowLeft />
                </Link>
              </Button>
            </>
          }
        />
      </ResultShell>
    );
  }

  /* ------------------------- حالة النجاح ------------------------- */

  const result = query.data;
  const isProvince = result.type === "PROVINCE";
  /* الخادم يقرأ وجود الزيارة قبل إنشائها — فنعرف إن كان المسح تكراراً. */
  const alreadyVisited = result.alreadyVisited === true;
  const name = tField(result.data, "name", locale);
  const summary =
    tFieldOptional(result.data, "summary", locale) ??
    tFieldOptional(result.data, "description", locale) ??
    null;
  const cover = isProvince
    ? result.data.images?.[0]?.image_url
    : result.data.images?.[0]?.image_url;

  const destination = isProvince ? "/province" : `/places/${result.data.id}`;

  return (
    <ResultShell>
      <Card className="overflow-hidden">
        <div className="relative h-44">
          <SmartImage
            src={cover}
            alt={name}
            wrapperClassName="absolute inset-0"
            className="size-full"
            fallbackLabel={name}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-basalt-950 via-basalt-950/45 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-x-0 bottom-0 p-5">
            <Badge variant="dark" className="mb-2">
              {isProvince ? <BookOpen /> : <MapPinned />}
              {isProvince ? t("province.badge") : t("admin.place")}
            </Badge>
            <h1 className="font-display text-3xl leading-tight text-sand-50">{name}</h1>
          </div>
        </div>

        <CardContent className="p-6 pt-6">
          {owningUserBook ? (
            <div className="flex items-start gap-3 rounded-2xl border border-basalt-400/30 bg-basalt-400/8 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-basalt-400/20 text-basalt-600">
                <BadgeCheck className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-basalt-900">
                  {isProvince
                    ? t("scanner.welcomeJourney")
                    : alreadyVisited
                      ? t("scanner.alreadyVisited")
                      : t("scanner.visitRecorded")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-basalt-700">
                  {isProvince
                    ? t("scanner.belongsToYourBook", {
                        name: owningUserBook.book_copy?.book?.name ?? "",
                      })
                    : alreadyVisited
                      ? t("scanner.alreadyVisitedBody", { name })
                      : t("scanner.visitRecordedBody")}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-gold-500/35 bg-gold-500/8 p-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-gold-500/20 text-gold-700">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="text-sm font-bold text-basalt-900">
                  {t("scanner.otherBook")}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-basalt-700">
                  {t("scanner.otherBookBody", { serial: `${serial}/${version}` })}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  loading={activation.isPending}
                  onClick={() => activation.mutate()}
                >
                  <BookOpen />
                  {t("scanner.activateThis")}
                </Button>
              </div>
            </div>
          )}

          {summary ? (
            <p className="mt-5 line-clamp-4 text-sm leading-loose text-basalt-700">
              {summary}
            </p>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to={destination}>
                {isProvince ? t("scanner.openProvince") : t("scanner.openPlace")}
                <ArrowLeft />
              </Link>
            </Button>
            <Button variant="ghost" size="lg" asChild>
              <Link to="/scanner">
                <QrCode />
                {t("books.scanAnother")}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </ResultShell>
  );
}

function ResultShell({ children }: { children: React.ReactNode }) {
  const t = useT();

  return (
    <Page title={t("scanner.resultTitle")}>
      <PageSection>
        <div className="mx-auto max-w-xl">{children}</div>
      </PageSection>
    </Page>
  );
}

function StateCard({
  tone,
  icon: Icon,
  title,
  description,
  actions,
}: {
  tone: "danger" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <Card
      className={
        tone === "danger" ? "border-clay-500/30 bg-clay-500/6" : "border-basalt-900/10"
      }
    >
      <CardContent className="flex flex-col items-center gap-3 p-10 pt-10 text-center">
        <span
          className={`grid size-14 place-items-center rounded-full ${
            tone === "danger"
              ? "bg-clay-500/15 text-clay-500"
              : "bg-sand-100 text-basalt-700"
          }`}
        >
          <Icon className="size-6" />
        </span>
        <h2 className="text-base font-bold text-basalt-900">{title}</h2>
        <p className="max-w-sm text-sm leading-relaxed text-basalt-700">{description}</p>
        {actions ? (
          <div className="mt-3 flex flex-wrap justify-center gap-2">{actions}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
