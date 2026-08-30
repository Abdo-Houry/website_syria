import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Circle, Send, Trophy } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { challengesApi } from "@/api/challenges.api";
import { invalidateProgress } from "@/app/query-client";
import {
  challengeOptions,
  useChallengeMeta,
} from "@/features/challenges/challenge-meta";
import { useJourney } from "@/context/journey-context";
import { useLocale, useT } from "@/i18n/locale-context";
import { tField, tFieldOptional } from "@/i18n/translate-entity";
import { toErrorMessage } from "@/lib/http";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types/api";

/**
 * نافذة حلّ التحدي.
 *
 * التحدي متعدد الخيارات: يختار المستخدم إجابة واحدة، والخادم يقبل الصحيحة
 * فقط ويرفض الخاطئة برسالة واضحة فيعيد المحاولة. التحديات القديمة بلا خيارات
 * تبقى بإجابة حرّة.
 *
 * تُرسل `userBookId` للجواز النشط حتى يُحتسب الإنجاز في الرحلة الصحيحة.
 */
export function SolveChallengeDialog({
  challenge,
  completed,
  existingAnswer,
  open,
  onOpenChange,
}: {
  challenge: Challenge | null;
  completed: boolean;
  existingAnswer?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useT();
  const { locale } = useLocale();
  const challengeMeta = useChallengeMeta();
  const { activeUserBook } = useJourney();
  const [answer, setAnswer] = useState("");

  useEffect(() => {
    if (open) setAnswer(existingAnswer ?? "");
  }, [open, existingAnswer, challenge?.id]);

  const solve = useMutation({
    mutationFn: (value: string) =>
      challengesApi.solve(challenge!.id, value, activeUserBook?.id),
    onSuccess: async () => {
      await invalidateProgress(activeUserBook?.id);
      toast.success(t("challenges.solved"));
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(toErrorMessage(error));
    },
  });

  if (!challenge) return null;

  const meta = challengeMeta(challenge.type);
  const Icon = meta.icon;
  const description = tFieldOptional(challenge, "description", locale);
  const placeName = challenge.place
    ? tField(challenge.place, "name", locale)
    : undefined;
  const options = challengeOptions(challenge, locale);
  const hasOptions = options.length > 0;

  /* النص المعروض للإجابة المسجّلة — مترجَم إن كانت من الخيارات. */
  const savedLabel =
    options.find((option) => option.value === existingAnswer)?.label ??
    existingAnswer?.trim() ??
    "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <Badge variant={completed ? "success" : "gold"}>
              <Icon />
              {meta.label}
            </Badge>
            {completed ? (
              <Badge variant="gold">
                <Trophy />
                {t("challenges.done")}
              </Badge>
            ) : null}
          </div>
          <DialogTitle>{tField(challenge, "title", locale)}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>

        <DialogBody>
          {placeName ? (
            <p className="mb-4 text-xs font-semibold text-basalt-600/75">
              {t("challenges.place")}: {placeName}
            </p>
          ) : null}

          {completed ? (
            <div className="flex items-start gap-3 rounded-2xl border border-basalt-400/30 bg-basalt-400/8 p-4">
              <CheckCircle2
                className="mt-0.5 size-5 shrink-0 text-basalt-600"
                aria-hidden
              />
              <div>
                <p className="text-sm font-bold text-basalt-900">
                  {hasOptions ? t("challenges.correctAnswer") : t("challenges.savedAnswer")}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-basalt-700">
                  {savedLabel || t("common.none")}
                </p>
              </div>
            </div>
          ) : hasOptions ? (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-semibold text-basalt-800">
                {t("challenges.chooseAnswer")}
              </legend>
              {options.map((option, index) => {
                const selected = answer === option.value;
                return (
                  <label
                    key={index}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 text-sm font-semibold transition-colors",
                      selected
                        ? "border-gold-500 bg-gold-500/12 text-basalt-900"
                        : "border-basalt-900/10 bg-white text-basalt-800 hover:border-gold-500/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="challenge-answer"
                      value={option.value}
                      checked={selected}
                      onChange={() => setAnswer(option.value)}
                      className="sr-only"
                    />
                    {selected ? (
                      <CheckCircle2 className="size-5 shrink-0 text-gold-600" aria-hidden />
                    ) : (
                      <Circle className="size-5 shrink-0 text-basalt-400" aria-hidden />
                    )}
                    <span className="leading-snug">{option.label}</span>
                  </label>
                );
              })}
            </fieldset>
          ) : (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-basalt-800">
                {t("challenges.yourAnswer")}
              </span>
              <Textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder={t("challenges.answerPlaceholder")}
                autoFocus
              />
            </label>
          )}
        </DialogBody>

        <DialogFooter>
          {completed ? (
            <Button variant="outline" block onClick={() => onOpenChange(false)}>
              {t("common.close")}
            </Button>
          ) : (
            <>
              <Button
                loading={solve.isPending}
                disabled={!answer.trim()}
                onClick={() => solve.mutate(answer.trim())}
              >
                <Send />
                {t("challenges.send")}
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                {t("common.later")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
