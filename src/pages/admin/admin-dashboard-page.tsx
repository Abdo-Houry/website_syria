import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  BookCopy,
  BookOpen,
  LayoutDashboard,
  MapPin,
  MapPinned,
  ShoppingBag,
  Stamp as StampIcon,
  Swords,
  Users,
  Footprints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/states";
import { statisticsApi } from "@/api/admin/statistics.api";
import { useLocale, useT } from "@/i18n/locale-context";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { percent } from "@/lib/utils";

export function AdminDashboardPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const query = useQuery({
    queryKey: ["admin", "statistics"],
    queryFn: statisticsApi.get,
  });

  const stats = query.data;

  return (
    <AdminPage
      icon={LayoutDashboard}
      title={t("admin.dashboard")}
      description={t("admin.dashboardHint")}
    >
      {query.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-[var(--radius-xl2)]" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={toErrorMessage(query.error)}
          isNetwork={
            query.error instanceof ApiRequestError && query.error.isNetworkError
          }
          onRetry={() => void query.refetch()}
        />
      ) : stats ? (
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="mb-3 text-sm font-bold text-basalt-600/80">{t("admin.content")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={MapPin}
                label={t("admin.provinces")}
                value={stats.provinces}
                to="/admin/provinces"
              />
              <StatCard
                icon={MapPinned}
                label={t("admin.places")}
                value={stats.places}
                to="/admin/places"
              />
              <StatCard
                icon={BookOpen}
                label={t("admin.booksLabel")}
                value={stats.books}
                to="/admin/books"
              />
              <StatCard
                icon={BookCopy}
                label={t("admin.printedCopies")}
                value={stats.bookCopies}
                to="/admin/copies"
              />
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-sm font-bold text-basalt-600/80">{t("admin.usersActivity")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                icon={Users}
                label={t("admin.users")}
                value={stats.users}
                to="/admin/users"
              />
              <StatCard
                icon={Footprints}
                label={t("admin.visits")}
                value={stats.visits}
              />
              <StatCard
                icon={Swords}
                label={t("admin.challengesDone")}
                value={stats.completedChallenges}
              />
              <StatCard
                icon={StampIcon}
                label={t("admin.stampsCollected")}
                value={stats.collectedStamps}
              />
            </div>
          </section>

          <Card>
            <CardContent className="p-5 pt-5">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
                  <ShoppingBag className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-basalt-900">
                      {t("admin.activatedCopies")}
                    </h3>
                    {/* النسخ الموجودة / النسخ المفعّلة */}
                    <span
                      dir="ltr"
                      className="text-sm font-bold tabular-nums text-basalt-900"
                    >
                      {stats.bookCopies} / {stats.soldBooks}
                    </span>
                  </div>
                  <Progress
                    className="mt-2"
                    value={percent(stats.soldBooks, stats.bookCopies)}
                  />
                  <p className="mt-2 text-xs text-basalt-600/70">
                    {t("admin.existingVsActivated")} — {t("admin.activatedCopiesHint")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AdminPage>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  to,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  to?: string;
}) {
  const { locale } = useLocale();

  const body = (
    <div className="flex items-center gap-4 rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-5 shadow-[var(--shadow-soft)] transition-all">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sand-100 text-basalt-700">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold tabular-nums leading-none text-basalt-900">
          {value.toLocaleString(locale)}
        </p>
        <p className="mt-1.5 truncate text-xs font-semibold text-basalt-600/75">
          {label}
        </p>
      </div>
    </div>
  );

  if (!to) return body;

  return (
    <Link
      to={to}
      className="block outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 [&>div]:hover:shadow-[var(--shadow-lift)]"
    >
      {body}
    </Link>
  );
}
