import { useMemo, useState } from "react";
import { Swords, Trophy } from "lucide-react";
import { Page, PageSection } from "@/components/common/page";
import { SectionHeader } from "@/components/common/section-header";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChallengeCard } from "@/features/challenges/challenge-card";
import { SolveChallengeDialog } from "@/features/challenges/solve-challenge-dialog";
import { useJourney } from "@/context/journey-context";
import { useT } from "@/i18n/locale-context";
import { ApiRequestError } from "@/lib/http";
import { useErrorMessage } from "@/lib/use-error-message";
import { percent } from "@/lib/utils";
import type { Challenge } from "@/types/api";

type Filter = "all" | "open" | "done";

export function ChallengesPage() {
  const t = useT();
  const toErrorMessage = useErrorMessage();
  const {
    challenges,
    myChallenges,
    isLoadingBook,
    bookError,
    isChallengeCompleted,
    progress,
  } = useJourney();

  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Challenge | null>(null);

  const filtered = useMemo(
    () =>
      challenges.filter((challenge) => {
        const done = isChallengeCompleted(challenge.id);
        if (filter === "done") return done;
        if (filter === "open") return !done;
        return true;
      }),
    [challenges, filter, isChallengeCompleted],
  );

  const selectedRecord = selected
    ? myChallenges.find((item) => item.challenge?.id === selected.id)
    : undefined;

  return (
    <Page title={t("challenges.title")}>
      <PageSection>
        <SectionHeader
          icon={Swords}
          title={t("challenges.title")}
          description={t("challenges.subtitle")}
        />

        {progress.challengesTotal > 0 ? (
          <div className="mb-6 rounded-[var(--radius-xl2)] border border-basalt-900/8 bg-white p-5 shadow-[var(--shadow-soft)]">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-basalt-900">
                <Trophy className="size-4 text-gold-600" aria-hidden />
                {t("challenges.yourProgress")}
              </span>
              <span className="text-sm font-bold tabular-nums text-basalt-900">
                {progress.challengesDone} / {progress.challengesTotal}
              </span>
            </div>
            <Progress
              value={percent(progress.challengesDone, progress.challengesTotal)}
            />
          </div>
        ) : null}

        <Tabs
          value={filter}
          onValueChange={(value) => setFilter(value as Filter)}
          className="mb-5"
        >
          <TabsList>
            <TabsTrigger value="all">{t("common.all")}</TabsTrigger>
            <TabsTrigger value="open">{t("challenges.filterOpen")}</TabsTrigger>
            <TabsTrigger value="done">{t("challenges.filterDone")}</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoadingBook ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-44 rounded-[var(--radius-xl2)]" />
            ))}
          </div>
        ) : bookError ? (
          <ErrorState
            message={toErrorMessage(bookError)}
            isNetwork={
              bookError instanceof ApiRequestError && bookError.isNetworkError
            }
          />
        ) : challenges.length === 0 ? (
          <EmptyState
            icon={Swords}
            title={t("challenges.empty")}
            description={t("challenges.emptyBody")}
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={
              filter === "done" ? t("challenges.noneDone") : t("challenges.allDone")
            }
            description={
              filter === "done"
                ? t("challenges.noneDoneBody")
                : t("challenges.allDoneBody")
            }
            action={
              <Button variant="outline" onClick={() => setFilter("all")}>
                {t("challenges.showAll")}
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {filtered.map((challenge) => (
              <ChallengeCard
                key={challenge.id}
                challenge={challenge}
                completed={isChallengeCompleted(challenge.id)}
                onOpen={setSelected}
              />
            ))}
          </div>
        )}
      </PageSection>

      <SolveChallengeDialog
        challenge={selected}
        completed={selected ? isChallengeCompleted(selected.id) : false}
        existingAnswer={selectedRecord?.answer}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </Page>
  );
}
