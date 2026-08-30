import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, Info, QrCode, RotateCcw, ShieldAlert } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { CameraScanner } from "@/components/scanner/lazy-camera-scanner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { parseQrPayload, qrRoutePath } from "@/lib/qr";

/**
 * الماسح العام: يقرأ أي رمز ويوجّه إلى الوجهة الصحيحة.
 * التحقّق من ملكية الجواز وتسجيل الزيارة يتمّان في صفحة `/qr/...`.
 *
 * `?place=<id>` يحصر المسح بمكان بعينه: من فتح الماسح من صفحة مكان يقصد
 * توثيق زيارته هو، فمسح رمز مكان آخر خطأٌ نُخبره به بدل نقله بصمت إلى
 * صفحة لم يطلبها.
 */
export function ScannerPage() {
  const t = useT();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { places, isPlaceVisited } = useJourney();

  /** رسالة الحالة الحالية — تُوقف الكاميرا حتى يقرأها المستخدم. */
  const [notice, setNotice] = useState<{
    title: string;
    body: string;
  } | null>(null);

  const expectedPlaceId = Number(searchParams.get("place")) || null;

  const expectedPlace = useMemo(
    () =>
      expectedPlaceId
        ? (places.find((place) => place.id === expectedPlaceId) ?? null)
        : null,
    [places, expectedPlaceId],
  );

  const expectedName = expectedPlace
    ? tField(expectedPlace, "name", locale)
    : "";

  const handleResult = useCallback(
    (text: string) => {
      const parsed = parseQrPayload(text);

      switch (parsed.kind) {
        case "target": {
          /* الرمز لمكان آخر — الماسح مفتوح لتوثيق مكان بعينه. */
          if (
            expectedPlaceId &&
            (parsed.targetType !== "PLACE" ||
              parsed.targetId !== expectedPlaceId)
          ) {
            setNotice({
              title: t("scanner.wrongPlace"),
              body: t("scanner.wrongPlaceBody", { name: expectedName }),
            });
            return;
          }

          /*
            زيارة موثّقة سلفاً: نُخبره بدل إعادة تشغيل تدفّق التوثيق —
            الرمز نفسه لن يضيف شيئاً إلى تقدّمه.
          */
          if (
            parsed.targetType === "PLACE" &&
            isPlaceVisited(parsed.targetId)
          ) {
            const place = places.find((item) => item.id === parsed.targetId);
            setNotice({
              title: t("scanner.alreadyVisited"),
              body: t("scanner.alreadyVisitedBody", {
                name: place ? tField(place, "name", locale) : expectedName,
              }),
            });
            return;
          }

          navigate(qrRoutePath(parsed));
          return;
        }

        case "book-copy":
          navigate("/books/activate", { state: { bookCopyId: parsed.bookCopyId } });
          return;

        default:
          setNotice({
            title: t("scanner.unknown"),
            body: t(parsed.reasonKey),
          });
      }
    },
    [
      navigate,
      t,
      expectedPlaceId,
      expectedName,
      isPlaceVisited,
      places,
      locale,
    ],
  );

  return (
    <Page title={t("scanner.title")}>
      <PageSection>
        <SectionHeader
          icon={QrCode}
          title={t("scanner.title")}
          description={
            expectedPlace
              ? t("scanner.subtitleForPlace", { name: expectedName })
              : t("scanner.subtitle")
          }
        />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          {/* الكاميرا تتوقّف ما دامت هناك رسالة معروضة. */}
          <CameraScanner onResult={handleResult} paused={!!notice} />

          <div className="flex flex-col gap-4">
            {notice ? (
              <Card className="border-clay-500/30 bg-clay-500/6">
                <CardContent className="flex gap-3 p-5 pt-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-clay-500/15 text-clay-500">
                    <ShieldAlert className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-basalt-900">
                      {notice.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-basalt-700">
                      {notice.body}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setNotice(null)}
                    >
                      <RotateCcw />
                      {t("books.rescan")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-5 pt-5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-basalt-900">
                    <Info className="size-4 text-gold-600" aria-hidden />
                    {t("scanner.what")}
                  </h3>
                  <ul className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-basalt-700">
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span>
                        <span className="font-bold">{t("scanner.provinceQr")}</span> —{" "}
                        {t("scanner.provinceQrBody")}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span>
                        <span className="font-bold">{t("scanner.placeQr")}</span> —{" "}
                        {t("scanner.placeQrBody")}
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-gold-500" />
                      <span>
                        <span className="font-bold">{t("scanner.bookQr")}</span> —{" "}
                        {t("scanner.bookQrBody")}
                      </span>
                    </li>
                  </ul>

                  <Button
                    variant="subtle"
                    className="mt-5"
                    block
                    onClick={() => navigate("/books/activate")}
                  >
                    <BookOpen />
                    {t("books.activateNew")}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </PageSection>
    </Page>
  );
}
