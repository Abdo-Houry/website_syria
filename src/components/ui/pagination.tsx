import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/**
 * نافذة أرقام مضغوطة حول الصفحة الحالية: 1 … 4 [5] 6 … 20
 * تُبقي عرض الشريط ثابتاً مهما بلغ عدد الصفحات.
 */
export function pageWindow(
  page: number,
  pages: number,
  span = 1,
): (number | "gap")[] {
  if (pages <= 5 + span * 2) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const items = new Set<number>([1, pages]);
  for (let offset = -span; offset <= span; offset += 1) {
    const candidate = page + offset;
    if (candidate > 1 && candidate < pages) items.add(candidate);
  }

  const sorted = [...items].sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && value - previous > 1) result.push("gap");
    result.push(value);
  });

  return result;
}

/**
 * شريط تنقّل بين الصفحات.
 *
 * الأسهم منطقية لا بصرية: `ChevronRight` هو «السابق» في العربية، ويُقلَب
 * في اللغات اللاتينية عبر `ltr:rotate-180` — فيبقى الاتجاه صحيحاً في الحالتين.
 */
export function Pagination({
  page,
  pages,
  total,
  pageSize,
  onPageChange,
  className,
}: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const t = useT();

  if (pages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const go = (next: number) => onPageChange(Math.min(Math.max(next, 1), pages));

  return (
    <nav
      aria-label={t("common.actions")}
      className={cn(
        "mt-4 flex flex-wrap items-center justify-between gap-3",
        className,
      )}
    >
      <p className="text-xs text-basalt-600/75 tabular-nums">
        {t("pagination.summary", { from, to, total })}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("pagination.previous")}
          disabled={page <= 1}
          onClick={() => go(page - 1)}
        >
          <ChevronRight className="ltr:rotate-180" />
        </Button>

        {/* الأرقام على الشاشات المتوسطة فأعلى */}
        <div className="hidden items-center gap-1 sm:flex">
          {pageWindow(page, pages).map((item, index) =>
            item === "gap" ? (
              <span
                key={`gap-${index}`}
                aria-hidden
                className="px-1 text-xs text-basalt-600/50"
              >
                …
              </span>
            ) : (
              <Button
                key={item}
                type="button"
                variant={item === page ? "primary" : "ghost"}
                size="icon-sm"
                aria-label={t("pagination.page", { page: item, pages })}
                aria-current={item === page ? "page" : undefined}
                onClick={() => go(item)}
                className="text-xs tabular-nums"
              >
                {item}
              </Button>
            ),
          )}
        </div>

        {/* على الجوال يكفي موضع الصفحة نصّاً */}
        <span className="px-2 text-xs font-semibold tabular-nums text-basalt-700 sm:hidden">
          {t("pagination.page", { page, pages })}
        </span>

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={t("pagination.next")}
          disabled={page >= pages}
          onClick={() => go(page + 1)}
        >
          <ChevronLeft className="ltr:rotate-180" />
        </Button>
      </div>
    </nav>
  );
}
