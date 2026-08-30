import { MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useChallengeMeta } from "@/features/challenges/challenge-meta";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types/api";

export function ChallengeCard({
  challenge,
  completed,
  onOpen,
}: {
  challenge: Challenge;
  completed: boolean;
  onOpen: (challenge: Challenge) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const challengeMeta = useChallengeMeta();

  const meta = challengeMeta(challenge.type);
  const Icon = meta.icon;

  const title = tField(challenge, "title", locale);
  const description = tFieldOptional(challenge, "description", locale);
  const placeName = challenge.place
    ? tField(challenge.place, "name", locale)
    : undefined;

  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-xl2)] border p-5 transition-all",
        completed
          ? "border-basalt-400/35 bg-basalt-400/8"
          : "border-basalt-900/8 bg-white shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]",
      )}
    >
      {completed ? (
        <span
          className="absolute -end-6 -top-6 size-20 rotate-12 rounded-full bg-basalt-400/15"
          aria-hidden
        />
      ) : null}

      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-2xl",
            completed
              ? "bg-basalt-400/20 text-basalt-600"
              : "bg-gold-500/15 text-gold-700",
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={completed ? "success" : "neutral"}>{meta.label}</Badge>
            {completed ? (
              <Badge variant="gold">
                <Trophy />
                {t("challenges.done")}
              </Badge>
            ) : null}
          </div>

          <h3 className="mt-2 text-base font-bold leading-snug text-basalt-900">
            {title}
          </h3>

          {description ? (
            <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-basalt-600/85">
              {description}
            </p>
          ) : null}

          {placeName ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-basalt-600/70">
              <MapPin className="size-3.5 text-gold-600" aria-hidden />
              {placeName}
            </p>
          ) : null}

          <Button
            variant={completed ? "ghost" : "primary"}
            size="sm"
            className="mt-4"
            onClick={() => onOpen(challenge)}
          >
            {completed ? t("challenges.viewAnswer") : t("challenges.take")}
          </Button>
        </div>
      </div>
    </article>
  );
}
