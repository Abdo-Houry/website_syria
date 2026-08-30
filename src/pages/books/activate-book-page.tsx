import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeCheck,
  Info,
  KeyRound,
  QrCode,
  RotateCcw,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { CameraScanner } from "@/components/scanner/lazy-camera-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { userBooksApi, type ActivatePayload } from "@/api/user-books.api";
import { queryClient, queryKeys } from "@/app/query-client";
import { useJourney } from "@/context/journey-context";
import { useT } from "@/i18n/locale-context";
import { toErrorMessage } from "@/lib/http";
import { parseQrPayload } from "@/lib/qr";

type ScanState =
  | { kind: "idle" }
  | { kind: "already-owned"; userBookId: number; label: string }
  | { kind: "invalid"; message: string };

/** ما قد يصل من صفحة الماسح العام بعد قراءة رمز كتيّب. */
interface ActivateLocationState {
  bookCopyId?: number;
  serial?: string;
  version?: string;
}

export function ActivateBookPage() {
  const t = useT();
  const navigate = useNavigate();
  const location = useLocation();
  const { findUserBookBySerial, setActiveUserBookId } = useJourney();
  const [scan, setScan] = useState<ScanState>({ kind: "idle" });

  const activation = useMutation({
    mutationFn: (payload: ActivatePayload) => userBooksApi.activate(payload),
    onSuccess: async (userBook) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.userBooks });
      setActiveUserBookId(userBook.id);
      toast.success(t("books.activated"));
      navigate("/journey", { replace: true });
    },
    onError: (error) => {
      setScan({ kind: "invalid", message: toErrorMessage(error) });
    },
  });

  const handleScan = useCallback(
    (text: string) => {
      const parsed = parseQrPayload(text);

      if (parsed.kind === "unsupported") {
        setScan({ kind: "invalid", message: t(parsed.reasonKey) });
        return;
      }

      if (parsed.kind === "book-copy") {
        activation.mutate({ bookCopyId: parsed.bookCopyId });
        return;
      }

      /* رمز محافظة/مكان: السيريال والإصدار كافيان لتفعيل النسخة. */
      const owned = findUserBookBySerial(parsed.serial, parsed.version);

      if (owned) {
        setScan({
          kind: "already-owned",
          userBookId: owned.id,
          label: owned.book_copy?.book?.name ?? "جوازك",
        });
        return;
      }

      activation.mutate({
        serial: parsed.serial,
        version: parsed.version,
      });
    },
    [activation, findUserBookBySerial, t],
  );

  /* رمز قُرئ في صفحة الماسح العام ثم أُحيل إلى هنا — نفعّله مباشرة. */
  const handledStateRef = useRef(false);
  useEffect(() => {
    if (handledStateRef.current) return;

    const state = location.state as ActivateLocationState | null;
    if (!state) return;

    handledStateRef.current = true;

    if (state.bookCopyId) {
      activation.mutate({ bookCopyId: state.bookCopyId });
    } else if (state.serial && state.version) {
      activation.mutate({ serial: state.serial, version: state.version });
    }
  }, [location.state, activation]);

  const reset = () => {
    setScan({ kind: "idle" });
    activation.reset();
  };

  const scannerPaused =
    scan.kind !== "idle" || activation.isPending || activation.isSuccess;

  return (
    <Page title={t("books.activateTitle")}>
      <PageSection>
        <SectionHeader
          icon={QrCode}
          title={t("books.activateTitle")}
          description={t("books.activateSubtitle")}
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              {t("common.back")}
              <ArrowLeft />
            </Button>
          }
        />

        {/*
          التفعيل بالمسح وحده — لا إدخال يدوي لرقم النسخة: الرقم مجرّد
          تسلسل يسهل تخمينه، بينما رمز الـ QR المطبوع دليل حيازة الكتيّب.
        */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <CameraScanner onResult={handleScan} paused={scannerPaused} />

          <div className="flex flex-col gap-4">
            {scan.kind === "idle" && !activation.isPending ? (
              <Card>
                <CardContent className="p-5 pt-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-basalt-900">
                    <Info className="size-4 text-gold-600" aria-hidden />
                    {t("books.howTo")}
                  </h3>
                  <ol className="mt-3 flex list-decimal flex-col gap-2 ps-5 text-sm leading-relaxed text-basalt-700 marker:font-bold marker:text-gold-600">
                    <li>{t("books.howToStep1")}</li>
                    <li>{t("books.howToStep2")}</li>
                    <li>{t("books.howToStep3")}</li>
                  </ol>
                </CardContent>
              </Card>
            ) : null}

            {activation.isPending ? (
              <StatusCard
                tone="neutral"
                icon={KeyRound}
                title={t("books.activating")}
                description={t("books.activatingBody")}
              />
            ) : null}

            {scan.kind === "already-owned" ? (
              <StatusCard
                tone="success"
                icon={BadgeCheck}
                title={t("books.alreadyOwned")}
                description={t("books.alreadyOwnedBody", { name: scan.label })}
                actions={
                  <>
                    <Button
                      onClick={() => {
                        setActiveUserBookId(scan.userBookId);
                        navigate("/journey");
                      }}
                    >
                      {t("books.openJourney")}
                      <ArrowLeft />
                    </Button>
                    <Button variant="ghost" onClick={reset}>
                      <RotateCcw />
                      {t("books.scanAnother")}
                    </Button>
                  </>
                }
              />
            ) : null}

            {scan.kind === "invalid" ? (
              <StatusCard
                tone="danger"
                icon={ShieldAlert}
                title={t("books.activateFailed")}
                description={scan.message}
                actions={
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw />
                    {t("books.rescan")}
                  </Button>
                }
              />
            ) : null}
          </div>
        </div>
      </PageSection>
    </Page>
  );
}

function StatusCard({
  tone,
  icon: Icon,
  title,
  description,
  actions,
}: {
  tone: "neutral" | "success" | "danger";
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  const styles = {
    neutral: "border-basalt-900/10 bg-white",
    success: "border-basalt-400/35 bg-basalt-400/8",
    danger: "border-clay-500/30 bg-clay-500/6",
  }[tone];

  const iconStyles = {
    neutral: "bg-sand-100 text-basalt-700",
    success: "bg-basalt-400/20 text-basalt-600",
    danger: "bg-clay-500/15 text-clay-500",
  }[tone];

  return (
    <Card className={styles}>
      <CardContent className="flex gap-3 p-5 pt-5">
        <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${iconStyles}`}>
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-basalt-900">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-basalt-700">{description}</p>
          {actions ? <div className="mt-4 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
