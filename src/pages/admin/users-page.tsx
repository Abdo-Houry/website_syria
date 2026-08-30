import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BadgeCheck,
  BookOpen,
  Eye,
  MapPinned,
  Search,
  Stamp as StampIcon,
  Swords,
  Users,
} from "lucide-react";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type Column } from "@/components/admin/data-table";
import { SmartImage } from "@/components/common/smart-image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { adminUsersApi } from "@/api/admin/users.api";
import { useLocale, useT } from "@/i18n/locale-context";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { assetUrl, formatDate, initials } from "@/lib/utils";
import type { AdminUserBook, AdminUserRow } from "@/types/api";

/**
 * المستخدمون — من هم، وماذا يملكون من نسخ كتيّبات، وماذا أنجزوا في كل نسخة.
 *
 * التفاصيل داخل حوار بدل صفحة مستقلّة: المشرف يتنقّل بين المستخدمين بحثاً عن
 * حالة بعينها، والحوار يبقيه على القائمة بدل رحلة ذهاب وإياب.
 */
export function AdminUsersPage() {
  const t = useT();
  const [term, setTerm] = useState("");
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminUsersApi.list,
  });

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const all = query.data ?? [];
    if (!needle) return all;
    return all.filter(
      (user) =>
        user.name.toLowerCase().includes(needle) ||
        user.phone.toLowerCase().includes(needle) ||
        (user.email ?? "").toLowerCase().includes(needle),
    );
  }, [query.data, term]);

  const columns: Column<AdminUserRow>[] = [
    {
      key: "user",
      header: t("admin.user"),
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-9 shrink-0 ring-1 ring-gold-500/35">
            <AvatarImage src={assetUrl(row.image)} alt={row.name} />
            <AvatarFallback className="text-[11px]">
              {initials(row.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-bold text-basalt-900">{row.name}</p>
            <p dir="ltr" className="truncate text-xs text-basalt-600/70">
              {row.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      header: t("auth.email"),
      hideOnMobile: true,
      cell: (row) => (
        <span dir="ltr" className="text-xs text-basalt-600/80">
          {row.email || t("common.none")}
        </span>
      ),
    },
    {
      key: "books",
      header: t("admin.copies"),
      cell: (row) => (
        <Badge variant={row.books ? "gold" : "neutral"}>
          <BookOpen />
          {row.books}
        </Badge>
      ),
    },
    {
      key: "achievement",
      header: t("admin.achievement"),
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-basalt-700">
          <span className="inline-flex items-center gap-1">
            <MapPinned className="size-3.5 text-gold-600" aria-hidden />
            {row.placesVisited}
          </span>
          <span className="inline-flex items-center gap-1">
            <Swords className="size-3.5 text-gold-600" aria-hidden />
            {row.challengesCompleted}
          </span>
          <span className="inline-flex items-center gap-1">
            <StampIcon className="size-3.5 text-gold-600" aria-hidden />
            {row.stampsCollected}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) =>
        row.status === "BLOCKED" ? (
          <Badge variant="danger">{t("profile.blockedAccount")}</Badge>
        ) : (
          <Badge variant="success">
            <BadgeCheck />
            {t("profile.activeAccount")}
          </Badge>
        ),
    },
    {
      key: "joined",
      header: t("admin.createdAt"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-basalt-600/75">
          {formatDate(row.created_at)}
        </span>
      ),
    },
  ];

  return (
    <AdminPage
      icon={Users}
      title={t("admin.users")}
      description={t("admin.usersHint")}
    >
      <div className="relative mb-4 max-w-sm">
        <Search
          className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
          aria-hidden
        />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t("admin.userSearch")}
          className="h-11 ps-11"
          aria-label={t("common.search")}
        />
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        resetKey={term}
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle={
          query.data?.length ? t("admin.noUsersMatch") : t("admin.noUsers")
        }
        emptyDescription={
          query.data?.length
            ? t("admin.noUsersMatchBody")
            : t("admin.noUsersBody")
        }
        actions={(row) => (
          <Button variant="outline" size="sm" onClick={() => setSelected(row)}>
            <Eye />
            {t("admin.userDetails")}
          </Button>
        )}
      />

      <UserDetailsDialog
        user={selected}
        onClose={() => setSelected(null)}
      />
    </AdminPage>
  );
}

/* ------------------------------------------------------------------ */
/* تفاصيل مستخدم واحد                                                  */
/* ------------------------------------------------------------------ */

function UserDetailsDialog({
  user,
  onClose,
}: {
  user: AdminUserRow | null;
  onClose: () => void;
}) {
  const t = useT();
  const toErrorMessage = useErrorMessage();

  const query = useQuery({
    queryKey: ["admin", "user", user?.id],
    queryFn: () => adminUsersApi.byId(user!.id),
    enabled: !!user,
  });

  const details = query.data;

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{user?.name ?? ""}</DialogTitle>
          <DialogDescription>{t("admin.userDetailsHint")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-5 py-4">
          {query.isPending ? (
            <>
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </>
          ) : query.isError ? (
            <ErrorState
              message={toErrorMessage(query.error)}
              isNetwork={
                query.error instanceof ApiRequestError &&
                query.error.isNetworkError
              }
              onRetry={() => void query.refetch()}
            />
          ) : details ? (
            <>
              {/* بطاقة الهوية */}
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-basalt-900/8 bg-sand-50/70 p-4">
                <Avatar className="size-14 ring-1 ring-gold-500/40">
                  <AvatarImage
                    src={assetUrl(details.user.image)}
                    alt={details.user.name}
                  />
                  <AvatarFallback>{initials(details.user.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-basalt-900">
                    {details.user.name}
                  </p>
                  <p dir="ltr" className="text-sm text-basalt-600/80">
                    {details.user.phone}
                  </p>
                  {details.user.email ? (
                    <p dir="ltr" className="text-xs text-basalt-600/70">
                      {details.user.email}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-basalt-600/70">
                    {t("profile.memberSince", {
                      date: formatDate(details.user.created_at),
                    })}
                  </p>
                </div>

                {details.user.status === "BLOCKED" ? (
                  <Badge variant="danger">{t("profile.blockedAccount")}</Badge>
                ) : (
                  <Badge variant="success">
                    <BadgeCheck />
                    {t("profile.activeAccount")}
                  </Badge>
                )}
              </div>

              {/* الإجماليات عبر كل الكتيّبات */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <TotalTile
                  icon={BookOpen}
                  label={t("admin.copies")}
                  value={details.totals.books}
                />
                <TotalTile
                  icon={MapPinned}
                  label={t("admin.visits")}
                  value={details.totals.placesVisited}
                />
                <TotalTile
                  icon={Swords}
                  label={t("admin.challengesDone")}
                  value={details.totals.challengesCompleted}
                />
                <TotalTile
                  icon={StampIcon}
                  label={t("admin.stampsCollected")}
                  value={details.totals.stampsCollected}
                />
              </div>

              {/* نسخة بنسخة */}
              {details.books.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={t("admin.userNoBooks")}
                  description={t("admin.userNoBooksBody")}
                />
              ) : (
                <div className="flex flex-col gap-4">
                  {details.books.map((item) => (
                    <UserBookCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function TotalTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-basalt-900/8 bg-white p-3 text-center shadow-[var(--shadow-soft)]">
      <Icon className="mx-auto size-4 text-gold-600" />
      <p className="mt-1.5 text-xl font-bold leading-none text-basalt-900">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-basalt-600/70">{label}</p>
    </div>
  );
}

/** نسخة كتيّب واحدة يملكها المستخدم، وما أنجزه ضمنها. */
function UserBookCard({ item }: { item: AdminUserBook }) {
  const t = useT();
  const { locale } = useLocale();

  const collectedStamps = item.stamps.filter((entry) => entry.stamp);
  const visitedPlaces = item.visits.filter((visit) => visit.place);
  const doneChallenges = item.challenges.filter((entry) => entry.completed);

  return (
    <article className="rounded-2xl border border-basalt-900/8 bg-white p-4 shadow-[var(--shadow-soft)]">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate font-bold text-basalt-900">
            {item.book?.name ?? t("common.none")}
          </h3>
          {item.copy ? (
            <p dir="ltr" className="text-xs tabular-nums text-basalt-600/70">
              {item.copy.serial_number} / {item.copy.version}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {item.active ? (
            <Badge variant="gold">{t("books.active")}</Badge>
          ) : null}
          <span className="text-xs text-basalt-600/70">
            {formatDate(item.purchased_at, locale)}
          </span>
        </div>
      </header>

      <div className="mt-3 flex items-center gap-3">
        <Progress value={item.progress.overall} className="flex-1" />
        <span className="w-10 shrink-0 text-end text-sm font-bold tabular-nums text-basalt-900">
          {item.progress.overall}%
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
        <ProgressCell
          label={t("journey.places")}
          done={item.progress.placesVisited}
          total={item.progress.placesTotal}
        />
        <ProgressCell
          label={t("journey.challenges")}
          done={item.progress.challengesDone}
          total={item.progress.challengesTotal}
        />
        <ProgressCell
          label={t("journey.stamps")}
          done={item.progress.stampsCollected}
          total={item.progress.stampsTotal}
        />
      </dl>

      {visitedPlaces.length ? (
        <DetailList
          title={t("admin.visitedPlaces")}
          items={visitedPlaces.map((visit) => ({
            id: visit.id,
            label: visit.place!.name,
            meta: formatDate(visit.visited_at, locale),
          }))}
        />
      ) : null}

      {doneChallenges.length ? (
        <DetailList
          title={t("admin.completedChallenges")}
          items={doneChallenges.map((entry) => ({
            id: entry.id,
            label: entry.challenge?.title ?? t("common.none"),
            meta: formatDate(entry.completed_at, locale),
          }))}
        />
      ) : null}

      {collectedStamps.length ? (
        <section className="mt-4">
          <h4 className="mb-2 text-xs font-bold text-basalt-600/80">
            {t("admin.collectedStamps")}
          </h4>
          <ul className="flex flex-wrap gap-2">
            {collectedStamps.map((entry) => (
              <li key={entry.id} title={entry.stamp!.name}>
                <SmartImage
                  src={entry.stamp!.image_url}
                  alt={entry.stamp!.name}
                  wrapperClassName="size-12 rounded-xl border border-basalt-900/8"
                  fallbackLabel={entry.stamp!.name}
                />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}

function ProgressCell({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  return (
    <div className="rounded-xl bg-sand-50 px-2 py-2">
      <dt className="text-[11px] text-basalt-600/70">{label}</dt>
      <dd
        dir="ltr"
        className="mt-0.5 text-sm font-bold tabular-nums text-basalt-900"
      >
        {done} / {total}
      </dd>
    </div>
  );
}

function DetailList({
  title,
  items,
}: {
  title: string;
  items: { id: number; label: string; meta: string }[];
}) {
  return (
    <section className="mt-4">
      <h4 className="mb-2 text-xs font-bold text-basalt-600/80">{title}</h4>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-3 rounded-xl bg-sand-50 px-3 py-2"
          >
            <span className="min-w-0 truncate text-sm text-basalt-800">
              {item.label}
            </span>
            <span className="shrink-0 text-[11px] text-basalt-600/70">
              {item.meta}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
