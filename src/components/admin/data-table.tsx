import { useEffect, useState, type ReactNode } from "react";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { useT } from "@/i18n/locale-context";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  /** عرض الخلية — نص أو عنصر. */
  cell: (row: T) => ReactNode;
  className?: string;
  /** يُخفى على الشاشات الصغيرة. */
  hideOnMobile?: boolean;
}

/** عدد الصفوف الافتراضي في الصفحة الواحدة. */
export const DEFAULT_PAGE_SIZE = 10;

/**
 * جدول بيانات للوحة الإدارة.
 * على الجوال يتحوّل إلى بطاقات بدل تمرير أفقي مزعج.
 *
 * الترقيم داخلي على الصفوف الواردة: الباك اند يعيد القوائم كاملة، والتصفية
 * والبحث يجريان في الصفحة نفسها — فلو رقّمنا على الخادم لضاعت نتائج البحث
 * خارج الصفحة الأولى.
 */
export function DataTable<T extends { id: number }>({
  rows,
  columns,
  isLoading,
  error,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  actions,
  pageSize = DEFAULT_PAGE_SIZE,
  resetKey,
}: {
  rows: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  emptyTitle: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  actions?: (row: T) => ReactNode;
  /** عدد الصفوف في الصفحة. */
  pageSize?: number;
  /** أي تغيّر فيه يعيد المستخدم إلى الصفحة الأولى (نصّ بحث أو مرشّح). */
  resetKey?: string | number;
}) {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const [page, setPage] = useState(1);

  /* تبديل البحث أو المرشّح يبدأ من الصفحة الأولى — لا من موضع قديم. */
  useEffect(() => {
    setPage(1);
  }, [resetKey]);

  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  /* تقليص النتائج قد يترك المستخدم خلف آخر صفحة، فنُعيده إلى آخر صفحة قائمة. */
  const current = Math.min(page, pages);

  useEffect(() => {
    if (current !== page) setPage(current);
  }, [current, page]);

  const start = (current - 1) * pageSize;
  const visible = rows.slice(start, start + pageSize);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-14 rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={toErrorMessage(error)}
        isNetwork={error instanceof ApiRequestError && error.isNetworkError}
        onRetry={onRetry}
      />
    );
  }

  if (!total) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
      />
    );
  }

  return (
    <>
      {/* جدول — من md وأعلى */}
      <div className="hidden overflow-hidden rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white shadow-[var(--shadow-soft)] md:block">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-b border-sand-200 bg-sand-50/70">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-start text-xs font-bold text-basalt-600/80",
                    column.className,
                  )}
                >
                  {column.header}
                </th>
              ))}
              {actions ? (
                <th scope="col" className="w-px px-4 py-3">
                  <span className="sr-only">{t("common.actions")}</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr
                key={row.id}
                className="border-b border-sand-200/60 last:border-0 transition-colors hover:bg-sand-50/60"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn("px-4 py-3 align-middle", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
                {actions ? (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {actions(row)}
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* بطاقات — على الجوال */}
      <div className="flex flex-col gap-3 md:hidden">
        {visible.map((row) => (
          <div
            key={row.id}
            className="rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-4 shadow-[var(--shadow-soft)]"
          >
            <dl className="flex flex-col gap-2">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <div key={column.key} className="flex items-start gap-3">
                    <dt className="w-24 shrink-0 text-xs font-bold text-basalt-600/70">
                      {column.header}
                    </dt>
                    <dd className="min-w-0 flex-1 text-sm text-basalt-900">
                      {column.cell(row)}
                    </dd>
                  </div>
                ))}
            </dl>
            {actions ? (
              <div className="mt-3 flex items-center justify-end gap-1 border-t border-sand-200/70 pt-3">
                {actions(row)}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <Pagination
        page={current}
        pages={pages}
        total={total}
        pageSize={pageSize}
        onPageChange={setPage}
      />
    </>
  );
}
