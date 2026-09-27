import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { HelpCircle, Pencil, Plus } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { adminFaqsApi } from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Faq } from "@/types/api";

const schema = z.object({
  question: z.string().trim().min(3),
  answer: z.string().trim().min(3),
});

type FormValues = z.infer<typeof schema>;

export function AdminFaqsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Faq | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const faqs = useQuery({
    queryKey: ["admin", "faqs"],
    queryFn: adminFaqsApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { question: "", answer: "" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminFaqsApi.update(editing.id, payload)
        : adminFaqsApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.faqUpdated") : t("admin.faqAdded"));
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setTranslations({});
    form.reset({ question: "", answer: "" });
    setCreating(true);
  };

  const openEdit = (faq: Faq) => {
    setEditing(faq);
    setServerError(null);
    setTranslations(faq.translations ?? {});
    form.reset({ question: faq.question, answer: faq.answer });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const columns: Column<Faq>[] = [
    {
      key: "question",
      header: t("admin.question"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-basalt-900">{row.question}</p>
          <p className="line-clamp-2 text-xs text-basalt-600/70">{row.answer}</p>
        </div>
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
      icon={HelpCircle}
      title={t("admin.faqs")}
      description={t("admin.faqsHint")}
      action={
        <Button onClick={openCreate}>
          <Plus />
          {t("admin.newFaq")}
        </Button>
      }
    >
      <DataTable
        rows={faqs.data ?? []}
        columns={columns}
        isLoading={faqs.isPending}
        error={faqs.error}
        onRetry={() => void faqs.refetch()}
        emptyTitle={t("admin.noFaqs")}
        emptyDescription={t("admin.noFaqsBody")}
        emptyAction={
          <Button onClick={openCreate}>
            <Plus />
            {t("admin.newFaq")}
          </Button>
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
              label={row.question}
              onDelete={() => adminFaqsApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? t("common.edit") : t("admin.newFaq")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={`${t("admin.question")} — ${t("admin.baseLanguage")}`}
          htmlFor="question"
          error={
            form.formState.errors.question ? t("admin.questionRequired") : undefined
          }
        >
          <Input
            id="question"
            placeholder={t("ph.question")}
            {...form.register("question")}
          />
        </Field>

        <Field
          label={t("admin.answer")}
          htmlFor="answer"
          error={form.formState.errors.answer ? t("admin.answerRequired") : undefined}
        >
          <Textarea
            id="answer"
            className="min-h-36"
            placeholder={t("ph.answer")}
            {...form.register("answer")}
          />
        </Field>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "question", label: t("admin.question") },
            { name: "answer", label: t("admin.answer"), multiline: true },
          ]}
        />
      </FormDialog>
    </AdminPage>
  );
}
