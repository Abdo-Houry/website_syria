import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Circle, Pencil, Plus, Swords, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  TranslationsEditor,
  pruneTranslations,
} from "@/components/admin/translations-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, FieldError, Label } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminChallengesApi, adminPlacesApi } from "@/api/admin/content.api";
import { useChallengeMeta } from "@/features/challenges/challenge-meta";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import { cn } from "@/lib/utils";
import type { Challenge } from "@/types/api";

/* النوع الوحيد المتاح — «اكتشاف»؛ باقي الأنواع لم تعد تُنشأ. */
const CHALLENGE_TYPE = "discovery";

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const schema = z.object({
  placeId: z.string().min(1),
  title: z.string().trim().min(2),
  description: z.string().trim().min(1),
});

type FormValues = z.infer<typeof schema>;

const emptyOptions = () => ["", ""];

export function AdminChallengesPage() {
  const t = useT();
  const challengeMeta = useChallengeMeta();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Challenge | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  /* خيارات الإجابة ودليل الصحيح منها — خارج react-hook-form لبساطة القائمة. */
  const [options, setOptions] = useState<string[]>(emptyOptions);
  const [correct, setCorrect] = useState(0);
  const [optionsError, setOptionsError] = useState(false);

  const challenges = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: adminChallengesApi.list,
  });

  const places = useQuery({
    queryKey: ["admin", "places"],
    queryFn: adminPlacesApi.list,
    /* أماكن الاستكشاف تعريفية بحتة — لا تقبل تحديات، فتُستبعد من الاختيار. */
    select: (rows) => rows.filter((place) => !place.is_exploration),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { placeId: "", title: "", description: "" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "challenges"] });

  const cleanOptions = () => options.map((option) => option.trim());

  const optionsValid = () => {
    const cleaned = cleanOptions();
    return cleaned.length >= MIN_OPTIONS && cleaned.every(Boolean);
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const shared = {
        title: values.title,
        description: values.description,
        type: CHALLENGE_TYPE,
        options: cleanOptions(),
        correct_option: correct,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminChallengesApi.update(editing.id, shared)
        : adminChallengesApi.create({
            ...shared,
            placeId: Number(values.placeId),
          });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(
        editing ? t("admin.challengeUpdated") : t("admin.challengeAdded"),
      );
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setTranslations({});
    setOptions(emptyOptions());
    setCorrect(0);
    setOptionsError(false);
    form.reset({ placeId: "", title: "", description: "" });
    setCreating(true);
  };

  const openEdit = (challenge: Challenge) => {
    setEditing(challenge);
    setServerError(null);
    setTranslations(challenge.translations ?? {});
    const existing = challenge.options?.length ? [...challenge.options] : emptyOptions();
    setOptions(existing);
    setCorrect(
      Math.min(Math.max(challenge.correct_option ?? 0, 0), existing.length - 1),
    );
    setOptionsError(false);
    form.reset({
      placeId: challenge.place ? String(challenge.place.id) : "",
      title: challenge.title,
      description: challenge.description ?? "",
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const updateOption = (index: number, value: string) =>
    setOptions((current) => current.map((item, i) => (i === index ? value : item)));

  const addOption = () =>
    setOptions((current) =>
      current.length < MAX_OPTIONS ? [...current, ""] : current,
    );

  const removeOption = (index: number) => {
    setOptions((current) => {
      if (current.length <= MIN_OPTIONS) return current;
      const next = current.filter((_, i) => i !== index);
      setCorrect((value) =>
        value === index ? 0 : value > index ? value - 1 : value,
      );
      return next;
    });
  };

  const columns: Column<Challenge>[] = [
    {
      key: "title",
      header: t("admin.challenges"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-basalt-900">{row.title}</p>
          {row.description ? (
            <p className="truncate text-xs text-basalt-600/70">
              {row.description}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      key: "options",
      header: t("admin.challengeOptions"),
      hideOnMobile: true,
      cell: (row) => (
        <ul className="flex flex-col gap-0.5 text-xs">
          {(row.options ?? []).map((option, index) => {
            const isCorrect = index === row.correct_option;
            return (
              <li
                key={index}
                className={cn(
                  "flex items-center gap-1.5",
                  isCorrect ? "font-bold text-basalt-900" : "text-basalt-600/75",
                )}
              >
                {isCorrect ? (
                  <CheckCircle2 className="size-3.5 text-gold-600" aria-hidden />
                ) : (
                  <Circle className="size-3.5 text-basalt-400" aria-hidden />
                )}
                <span className="truncate">{option}</span>
              </li>
            );
          })}
          {!row.options?.length ? (
            <li className="text-basalt-600/60">{t("common.none")}</li>
          ) : null}
        </ul>
      ),
    },
    {
      key: "place",
      header: t("admin.place"),
      cell: (row) => (
        <span className="text-sm text-basalt-700">
          {row.place?.name ?? t("common.none")}
        </span>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => <StatusBadge active={row.status} />,
    },
  ];

  return (
    <AdminPage
      icon={Swords}
      title={t("admin.challenges")}
      description={t("admin.challengesHint")}
      action={
        <Button onClick={openCreate} disabled={!places.data?.length}>
          <Plus />
          {t("admin.newChallenge")}
        </Button>
      }
    >
      <DataTable
        rows={challenges.data ?? []}
        columns={columns}
        isLoading={challenges.isPending}
        error={challenges.error}
        onRetry={() => void challenges.refetch()}
        emptyTitle={
          places.data?.length ? t("admin.noChallenges") : t("admin.addPlaceFirst")
        }
        emptyDescription={
          places.data?.length
            ? t("admin.noChallengesBody")
            : t("admin.addPlaceFirstBody")
        }
        actions={(row) => (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("common.edit")}
              onClick={() => openEdit(row)}
            >
              <Pencil />
            </Button>
            <ConfirmDeleteButton
              label={row.title}
              onDelete={() => adminChallengesApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? t("common.edit") : t("admin.newChallenge")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit(
          (values) => {
            setServerError(null);
            if (!optionsValid()) {
              setOptionsError(true);
              return;
            }
            setOptionsError(false);
            mutation.mutate(values);
          },
          () => setOptionsError(!optionsValid()),
        )}
      >
        <Field
          label={t("admin.place")}
          htmlFor="placeId"
          error={form.formState.errors.placeId ? t("admin.selectPlace") : undefined}
          hint={editing ? t("admin.placeLocked") : undefined}
        >
          <Select
            value={form.watch("placeId")}
            onValueChange={(value) => form.setValue("placeId", value)}
            disabled={!!editing}
          >
            <SelectTrigger id="placeId">
              <SelectValue placeholder={t("admin.selectPlace")} />
            </SelectTrigger>
            <SelectContent>
              {(places.data ?? []).map((place) => (
                <SelectItem key={place.id} value={String(place.id)}>
                  {place.name}
                  {place.province?.name ? ` — ${place.province.name}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        {/* النوع ثابت: اكتشاف */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-basalt-800">{t("admin.challengeType")}:</span>
          <Badge variant="gold">{challengeMeta(CHALLENGE_TYPE).label}</Badge>
        </div>

        <Field
          label={`${t("admin.challengeTitle")} — ${t("admin.baseLanguage")}`}
          htmlFor="title"
          error={
            form.formState.errors.title ? t("admin.challengeTitleRequired") : undefined
          }
        >
          <Input
            id="title"
            placeholder={t("ph.challengeTitle")}
            {...form.register("title")}
          />
        </Field>

        <Field
          label={t("admin.challengeDetails")}
          htmlFor="challenge-description"
          error={
            form.formState.errors.description
              ? t("admin.challengeDetailsRequired")
              : undefined
          }
        >
          <Textarea
            id="challenge-description"
            placeholder={t("ph.challengeDetails")}
            aria-invalid={!!form.formState.errors.description}
            {...form.register("description")}
          />
        </Field>

        {/* خيارات الإجابة */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="option-0">{t("admin.challengeOptions")}</Label>
          <p className="text-xs text-basalt-600/70">{t("admin.optionsHint")}</p>

          <ul className="flex flex-col gap-2">
            {options.map((option, index) => {
              const isCorrect = index === correct;
              return (
                <li key={index} className="flex items-center gap-2">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isCorrect}
                    aria-label={t("admin.correctOption")}
                    title={t("admin.correctOption")}
                    onClick={() => setCorrect(index)}
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-xl border transition-colors",
                      isCorrect
                        ? "border-gold-500 bg-gold-500/15 text-gold-700"
                        : "border-basalt-900/10 text-basalt-400 hover:border-gold-500/50",
                    )}
                  >
                    {isCorrect ? (
                      <CheckCircle2 className="size-5" aria-hidden />
                    ) : (
                      <Circle className="size-5" aria-hidden />
                    )}
                  </button>

                  <Input
                    id={`option-${index}`}
                    value={option}
                    placeholder={t("admin.option", { n: index + 1 })}
                    aria-invalid={optionsError && !option.trim()}
                    onChange={(event) => updateOption(index, event.target.value)}
                    className={cn(isCorrect && "border-gold-500/60")}
                  />

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={t("admin.removeOption")}
                    disabled={options.length <= MIN_OPTIONS}
                    onClick={() => removeOption(index)}
                  >
                    <Trash2 />
                  </Button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between gap-3">
            <FieldError message={optionsError ? t("admin.optionsMin") : undefined} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={options.length >= MAX_OPTIONS}
              onClick={addOption}
            >
              <Plus />
              {t("admin.addOption")}
            </Button>
          </div>
        </div>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "title", label: t("admin.challengeTitle") },
            {
              name: "description",
              label: t("admin.challengeDetails"),
              multiline: true,
            },
            {
              name: "options",
              label: `${t("admin.challengeOptions")} — ${t("admin.optionsTranslationHint")}`,
              multiline: true,
            },
          ]}
        />
      </FormDialog>
    </AdminPage>
  );
}
