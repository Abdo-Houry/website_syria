import { Suspense, lazy, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Images, MapPin, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { MediaManager } from "@/components/admin/media-manager";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  TranslationsEditor,
  pruneTranslations,
} from "@/components/admin/translations-editor";
import { MapPickerFallback } from "@/components/common/map-fallbacks";
import type { LatLng } from "@/components/common/map-picker";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import { adminProvincesApi } from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Province } from "@/types/api";

const MapPicker = lazy(() =>
  import("@/components/common/map-picker").then((m) => ({ default: m.MapPicker })),
);

const schema = z.object({
  name: z.string().trim().min(2),
  summary: z.string().trim().optional(),
  description: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

function toLatLng(province: Province | null): LatLng | null {
  if (!province || province.latitude == null || province.longitude == null) {
    return null;
  }
  const lat = Number(province.latitude);
  const lng = Number(province.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function AdminProvincesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Province | null>(null);
  const [creating, setCreating] = useState(false);
  const [mediaFor, setMediaFor] = useState<Province | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const query = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: adminProvincesApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", summary: "", description: "" },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "provinces"] });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name,
        summary: values.summary || undefined,
        description: values.description || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminProvincesApi.update(editing.id, payload)
        : adminProvincesApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(
        editing ? t("admin.provinceUpdated") : t("admin.provinceAdded"),
      );
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setCoords(null);
    setTranslations({});
    form.reset({ name: "", summary: "", description: "" });
    setCreating(true);
  };

  const openEdit = (province: Province) => {
    setEditing(province);
    setServerError(null);
    setCoords(toLatLng(province));
    setTranslations(province.translations ?? {});
    form.reset({
      name: province.name,
      summary: province.summary ?? "",
      description: province.description ?? "",
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const columns: Column<Province>[] = [
    {
      key: "name",
      header: t("admin.provinceName"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-basalt-900">{row.name}</p>
          {row.summary ? (
            <p className="truncate text-xs text-basalt-600/70">{row.summary}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: "coords",
      header: t("admin.coordinates"),
      hideOnMobile: true,
      cell: (row) => {
        const point = toLatLng(row);
        return point ? (
          <span dir="ltr" className="text-xs tabular-nums text-basalt-600/80">
            {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
          </span>
        ) : (
          <span className="text-xs text-basalt-600/50">{t("common.none")}</span>
        );
      },
    },
    {
      key: "status",
      header: t("common.status"),
      cell: (row) => <StatusBadge active={row.status} />,
    },
  ];

  return (
    <AdminPage
      icon={MapPin}
      title={t("admin.provinces")}
      description={t("admin.provincesHint")}
      action={
        <Button onClick={openCreate}>
          <Plus />
          {t("admin.newProvince")}
        </Button>
      }
    >
      <DataTable
        rows={query.data ?? []}
        columns={columns}
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle={t("admin.noProvinces")}
        emptyDescription={t("admin.noProvincesBody")}
        emptyAction={
          <Button onClick={openCreate}>
            <Plus />
            {t("admin.newProvince")}
          </Button>
        }
        actions={(row) => (
          <>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("admin.media")}
              onClick={() => setMediaFor(row)}
            >
              <Images />
            </Button>
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
              onDelete={() => adminProvincesApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newProvince")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={`${t("admin.name")} — ${t("admin.baseLanguage")}`}
          htmlFor="name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input
            id="name"
            placeholder={t("ph.provinceName")}
            {...form.register("name")}
          />
        </Field>

        <Field label={t("admin.summary")} htmlFor="summary">
          <Input
            id="summary"
            placeholder={t("ph.summary")}
            {...form.register("summary")}
          />
        </Field>

        <Field label={t("admin.description")} htmlFor="description">
          <Textarea
            id="description"
            placeholder={t("ph.description")}
            {...form.register("description")}
          />
        </Field>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "name", label: t("admin.name") },
            { name: "summary", label: t("admin.summary") },
            { name: "description", label: t("admin.description"), multiline: true },
          ]}
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-basalt-800">
            {t("map.pickLocation")}
          </span>
          <Suspense fallback={<MapPickerFallback />}>
            <MapPicker value={coords} onChange={setCoords} />
          </Suspense>
        </div>
      </FormDialog>

      <ProvinceMediaDialog province={mediaFor} onClose={() => setMediaFor(null)} />
    </AdminPage>
  );
}

function ProvinceMediaDialog({
  province,
  onClose,
}: {
  province: Province | null;
  onClose: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["admin", "province", province?.id],
    queryFn: () => adminProvincesApi.byId(province!.id),
    enabled: !!province,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "province", province?.id],
    });
    void queryClient.invalidateQueries({ queryKey: ["admin", "provinces"] });
  };

  return (
    <Dialog open={!!province} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {t("admin.mediaOf", { name: province?.name ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("admin.mediaCoverHint")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 py-4">
          {province ? (
            <>
              <MediaManager
                kind="images"
                items={(detail.data?.images ?? []).map((image) => ({
                  id: image.id,
                  url: image.image_url,
                }))}
                onUpload={(files) =>
                  adminProvincesApi.uploadImages(province.id, files)
                }
                onDelete={(id) => adminProvincesApi.deleteImage(id)}
                onChanged={refresh}
              />

              <MediaManager
                kind="videos"
                items={(detail.data?.videos ?? []).map((video) => ({
                  id: video.id,
                  url: video.video_url,
                  title: video.title,
                }))}
                onUpload={(files) =>
                  adminProvincesApi.uploadVideos(province.id, files)
                }
                onDelete={(id) => adminProvincesApi.deleteVideo(id)}
                onChanged={refresh}
              />
            </>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
