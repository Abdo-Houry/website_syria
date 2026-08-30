import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Check,
  MapPin,
  PartyPopper,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField } from "@/i18n/translate-entity";
import { cn, formatDate } from "@/lib/utils";
import type { UserBook } from "@/types/api";

/** النسخة تُعدّ محذوفة إن حُذفت هي أو الجواز الذي تتبعه (حذف ناعم). */
export function isUserBookDeleted(userBook: UserBook): boolean {
  return !!userBook.book_copy?.deleted_at || !!userBook.book_copy?.book?.deleted_at;
}

/**
 * بطاقة جواز — تعرض المحافظة والسيريال والتقدّم.
 * التقدّم يُمرَّر من الأعلى لأن حسابه يتطلّب محتوى الجواز الكامل، وهو متاح
 * للجواز النشط فقط دون إغراق الخادم بطلبات لكل جواز.
 *
 * النسخة المحذوفة تُعرض بلون رمادي دون أزرار — تبقى في السجل لكن رحلتها
 * لم تعد متاحة.
 */
export function BookletCard({
  userBook,
  isActive,
  progress,
  onSelect,
}: {
  userBook: UserBook;
  isActive: boolean;
  progress?: number;
  onSelect: (id: number) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const navigate = useNavigate();

  const book = userBook.book_copy?.book;
  const copy = userBook.book_copy;
  const deleted = isUserBookDeleted(userBook);
  const bookName = book ? tField(book, "name", locale) : `#${userBook.id}`;

  /*
    الرحلة مكتملة عند بلوغ 100%. النسبة لا تُحسب إلا للجواز النشط —
    حسابها لكل جواز يتطلّب جلب محتواه وتقدّمه كاملين — لذلك تظهر رسالة
    الإكمال على الجواز النشط، ويُدعى غيره إلى متابعة رحلته.
  */
  const completed = progress !== undefined && progress >= 100;
  const provinceName = book?.province
    ? tField(book.province, "name", locale)
    : t("common.none");

  return (
    <article
      aria-disabled={deleted || undefined}
      className={cn(
        "group relative overflow-hidden rounded-[var(--radius-xl2)] border transition-shadow",
        deleted
          ? "border-basalt-400/30 bg-basalt-400/10 text-basalt-600 grayscale"
          : "border-basalt-900/8 bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]",
      )}
    >
      <div
        className={cn(
          "h-1.5 w-full",
          deleted
            ? "bg-basalt-400/50"
            : "bg-gradient-to-l from-gold-500 via-gold-300 to-basalt-400",
        )}
      />

      <div className="p-5">
        <div className="flex items-start gap-3">
          <span
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-2xl",
              deleted ? "bg-basalt-400/30 text-basalt-600" : "bg-basalt-900 text-gold-300",
            )}
          >
            {deleted ? (
              <Trash2 className="size-5.5" aria-hidden />
            ) : (
              <BookOpen className="size-5.5" aria-hidden />
            )}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={cn(
                  "truncate text-base font-bold",
                  deleted ? "text-basalt-600 line-through" : "text-basalt-900",
                )}
              >
                {bookName}
              </h3>
              {deleted ? (
                <Badge variant="neutral">
                  <Trash2 />
                  {t("books.deleted")}
                </Badge>
              ) : isActive ? (
                <Badge variant="gold">
                  <Check />
                  {t("books.active")}
                </Badge>
              ) : null}
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-sm text-basalt-600/80">
              <MapPin
                className={cn("size-3.5", deleted ? "text-basalt-500" : "text-gold-600")}
                aria-hidden
              />
              {provinceName}
            </p>
          </div>
        </div>

        <dl
          className={cn(
            "mt-4 grid grid-cols-2 gap-3 rounded-2xl p-3 text-xs",
            deleted ? "bg-basalt-400/10" : "bg-sand-50",
          )}
        >
          <div>
            <dt className="text-basalt-600/65">{t("books.serial")}</dt>
            <dd className="mt-0.5 font-bold text-basalt-900" dir="ltr">
              {copy?.serial_number ?? t("common.none")}
            </dd>
          </div>
          <div>
            <dt className="text-basalt-600/65">{t("books.version")}</dt>
            <dd className="mt-0.5 font-bold text-basalt-900" dir="ltr">
              {copy?.version ?? t("common.none")}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="text-basalt-600/65">{t("books.activatedAt")}</dt>
            <dd className="mt-0.5 font-semibold text-basalt-800">
              {formatDate(userBook.purchased_at, locale)}
            </dd>
          </div>
        </dl>

        {deleted ? (
          <p className="mt-4 text-sm leading-relaxed text-basalt-600/80">
            {t("books.deletedBody")}
          </p>
        ) : (
          <>
            {isActive && progress !== undefined ? (
              <div className="mt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-semibold">
                  <span className="text-basalt-600/75">{t("books.progress")}</span>
                  <span className="text-basalt-900">{progress}%</span>
                </div>
                <Progress value={progress} />

                <p
                  className={cn(
                    "mt-3 flex items-start gap-2 rounded-2xl px-3 py-2.5 text-sm font-semibold leading-relaxed",
                    completed
                      ? "bg-gold-500/12 text-basalt-900"
                      : "bg-sand-50 text-basalt-700",
                  )}
                >
                  {completed ? (
                    <PartyPopper
                      className="mt-0.5 size-4 shrink-0 text-gold-600"
                      aria-hidden
                    />
                  ) : (
                    <ArrowLeft
                      className="mt-0.5 size-4 shrink-0 text-gold-600 rtl:rotate-0 ltr:rotate-180"
                      aria-hidden
                    />
                  )}
                  {completed
                    ? t("books.journeyCompleted")
                    : t("books.journeyIncomplete")}
                </p>
              </div>
            ) : null}

            <div className="mt-5 flex gap-2">
              {isActive ? (
                <Button block onClick={() => navigate("/journey")}>
                  {completed ? t("books.reviewJourney") : t("books.continue")}
                  <ArrowLeft className="rtl:rotate-0 ltr:rotate-180" />
                </Button>
              ) : (
                <Button
                  variant="outline"
                  block
                  onClick={() => {
                    onSelect(userBook.id);
                    navigate("/journey");
                  }}
                >
                  {t("books.startThis")}
                  <ArrowLeft className="rtl:rotate-0 ltr:rotate-180" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}
