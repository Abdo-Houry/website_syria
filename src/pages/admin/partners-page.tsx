import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Handshake, Pencil, Percent, Plus } from "lucide-react";
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
import { ImageUploadField } from "@/components/common/image-upload-field";
import { SmartImage } from "@/components/common/smart-image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { adminPartnersApi } from "@/api/admin/content.api";
import { uploadsApi } from "@/api/uploads.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Partner } from "@/types/api";

const schema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  discount_percentage: z.string().trim().refine((value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
  }),
});

type FormValues = z.infer<typeof schema>;

export function AdminPartnersPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const partners = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: adminPartnersApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", discount_percentage: "0" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        image_url: imageUrl,
        discount_percentage: Number(values.discount_percentage),
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminPartnersApi.update(editing.id, payload)
        : adminPartnersApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.partnerUpdated") : t("admin.partnerAdded"));
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setImageUrl("");
    setImageError(null);
    setTranslations({});
    form.reset({ name: "", description: "", discount_percentage: "0" });
    setCreating(true);
  };

  const openEdit = (partner: Partner) => {
    setEditing(partner);
    setServerError(null);
    setImageUrl(partner.image_url);
    setImageError(null);
    setTranslations(partner.translations ?? {});
    form.reset({
      name: partner.name,
      description: partner.description ?? "",
      discount_percentage: String(Number(partner.discount_percentage) || 0),
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const columns: Column<Partner>[] = [
    {
      key: "partner",
      header: t("admin.partner"),
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <SmartImage
            src={row.image_url}
            alt=""
            wrapperClassName="size-10 shrink-0 overflow-hidden rounded-xl"
            className="size-full"
          />
          <div className="min-w-0">
            <p className="truncate font-bold text-basalt-900">{row.name}</p>
            {row.description ? (
              <p className="truncate text-xs text-basalt-600/70">
                {row.description}
              </p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: "discount",
      header: t("admin.discount"),
      cell: (row) => (
        <Badge variant="gold">
          <Percent />
          {Number(row.discount_percentage) || 0}%
        </Badge>
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
      icon={Handshake}
      title={t("admin.partners")}
      description={t("admin.partnersHint")}
      action={
        <Button onClick={openCreate}>
          <Plus />
          {t("admin.newPartner")}
        </Button>
      }
    >
      <DataTable
        rows={partners.data ?? []}
        columns={columns}
        isLoading={partners.isPending}
        error={partners.error}
        onRetry={() => void partners.refetch()}
        emptyTitle={t("admin.noPartners")}
        emptyDescription={t("admin.noPartnersBody")}
        emptyAction={
          <Button onClick={openCreate}>
            <Plus />
            {t("admin.newPartner")}
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
              label={row.name}
              onDelete={() => adminPartnersApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newPartner")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          if (!imageUrl) {
            setImageError(t("admin.partnerImageRequired"));
            return;
          }
          setImageError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={`${t("admin.name")} — ${t("admin.baseLanguage")}`}
          htmlFor="partner-name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input
            id="partner-name"
            placeholder={t("ph.partnerName")}
            {...form.register("name")}
          />
        </Field>

        <ImageUploadField
          label={t("admin.partnerImage")}
          value={imageUrl}
          error={imageError ?? undefined}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUpload={(file) => uploadsApi.adminImage("partners", file)}
        />

        <Field
          label={t("admin.discountPercent")}
          htmlFor="discount"
          hint={t("admin.discountHint")}
          error={
            form.formState.errors.discount_percentage
              ? t("admin.discountRange")
              : undefined
          }
        >
          <Input
            id="discount"
            dir="ltr"
            inputMode="decimal"
            placeholder="XX"
            {...form.register("discount_percentage")}
          />
        </Field>

        <Field label={t("admin.description")} htmlFor="partner-description">
          <Textarea
            id="partner-description"
            placeholder={t("ph.description")}
            {...form.register("description")}
          />
        </Field>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "name", label: t("admin.name") },
            { name: "description", label: t("admin.description"), multiline: true },
          ]}
        />
      </FormDialog>
    </AdminPage>
  );
}
