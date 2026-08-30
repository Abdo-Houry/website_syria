import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Stamp as StampIcon } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminPlacesApi, adminStampsApi } from "@/api/admin/content.api";
import { uploadsApi } from "@/api/uploads.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Stamp } from "@/types/api";

const schema = z.object({
  placeId: z.string().min(1),
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AdminStampsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Stamp | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imageError, setImageError] = useState<string | null>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const stamps = useQuery({
    queryKey: ["admin", "stamps"],
    queryFn: adminStampsApi.list,
  });

  const places = useQuery({
    queryKey: ["admin", "places"],
    queryFn: adminPlacesApi.list,
    /* أماكن الاستكشاف تعريفية بحتة — لا تقبل طوابع، فتُستبعد من الاختيار. */
    select: (rows) => rows.filter((place) => !place.is_exploration),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { placeId: "", name: "", description: "" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "stamps"] });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const shared = {
        name: values.name,
        description: values.description || undefined,
        image_url: imageUrl,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminStampsApi.update(editing.id, shared)
        : adminStampsApi.create({ ...shared, placeId: Number(values.placeId) });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.stampUpdated") : t("admin.stampAdded"));
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
    form.reset({ placeId: "", name: "", description: "" });
    setCreating(true);
  };

  const openEdit = (stamp: Stamp) => {
    setEditing(stamp);
    setServerError(null);
    setImageUrl(stamp.image_url);
    setImageError(null);
    setTranslations(stamp.translations ?? {});
    form.reset({
      placeId: stamp.place ? String(stamp.place.id) : "",
      name: stamp.name,
      description: stamp.description ?? "",
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const columns: Column<Stamp>[] = [
    {
      key: "stamp",
      header: t("admin.stamp"),
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <SmartImage
            src={row.image_url}
            alt=""
            wrapperClassName="size-10 shrink-0 overflow-hidden rounded-full ring-1 ring-gold-500/40"
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
      icon={StampIcon}
      title={t("admin.stamps")}
      description={t("admin.stampsHint")}
      action={
        <Button onClick={openCreate} disabled={!places.data?.length}>
          <Plus />
          {t("admin.newStamp")}
        </Button>
      }
    >
      <DataTable
        rows={stamps.data ?? []}
        columns={columns}
        isLoading={stamps.isPending}
        error={stamps.error}
        onRetry={() => void stamps.refetch()}
        emptyTitle={
          places.data?.length ? t("admin.noStamps") : t("admin.addPlaceFirst")
        }
        emptyDescription={
          places.data?.length
            ? t("admin.noStampsBody")
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
              label={row.name}
              onDelete={() => adminStampsApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newStamp")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          if (!imageUrl) {
            setImageError(t("admin.stampImageRequired"));
            return;
          }
          setImageError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={t("admin.place")}
          htmlFor="stamp-place"
          error={form.formState.errors.placeId ? t("admin.selectPlace") : undefined}
          hint={editing ? t("admin.placeLocked") : undefined}
        >
          <Select
            value={form.watch("placeId")}
            onValueChange={(value) => form.setValue("placeId", value)}
            disabled={!!editing}
          >
            <SelectTrigger id="stamp-place">
              <SelectValue placeholder={t("admin.selectPlace")} />
            </SelectTrigger>
            <SelectContent>
              {(places.data ?? []).map((place) => (
                <SelectItem key={place.id} value={String(place.id)}>
                  {place.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label={`${t("admin.name")} — ${t("admin.baseLanguage")}`}
          htmlFor="stamp-name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input id="stamp-name" {...form.register("name")} />
        </Field>

        <ImageUploadField
          label={t("admin.stampImage")}
          shape="circle"
          value={imageUrl}
          error={imageError ?? undefined}
          onChange={(url) => {
            setImageUrl(url);
            if (url) setImageError(null);
          }}
          onUpload={(file) => uploadsApi.adminImage("stamps", file)}
        />

        <Field label={t("admin.description")} htmlFor="stamp-description">
          <Textarea id="stamp-description" {...form.register("description")} />
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
