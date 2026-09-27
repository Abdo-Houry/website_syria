import { Suspense, lazy, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Compass, Images, MapPinned, Pencil, Plus } from "lucide-react";
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
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminAreasApi,
  adminPlacesApi,
  adminProvincesApi,
} from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Place } from "@/types/api";

const MapPicker = lazy(() =>
  import("@/components/common/map-picker").then((m) => ({ default: m.MapPicker })),
);

/* "none" = مكان بلا منطقة (Radix Select لا يقبل قيمة فارغة). */
const NO_AREA = "none";

const schema = z.object({
  provinceId: z.string().min(1),
  areaId: z.string(),
  name: z.string().trim().min(2),
  summary: z.string().trim().optional(),
  description: z.string().trim().optional(),
  visit_info: z.string().trim().optional(),
  /* مكان استكشاف: تفاصيل ووسائط وموقع فقط — بلا تحديات ولا طوابع ولا QR. */
  isExploration: z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

function toLatLng(place: Place | null): LatLng | null {
  if (!place || place.latitude == null || place.longitude == null) return null;
  const lat = Number(place.latitude);
  const lng = Number(place.longitude);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export function AdminPlacesPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Place | null>(null);
  const [mediaFor, setMediaFor] = useState<Place | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const places = useQuery({
    queryKey: ["admin", "places"],
    queryFn: adminPlacesApi.list,
  });

  const provinces = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: adminProvincesApi.list,
  });

  const areas = useQuery({
    queryKey: ["admin", "areas"],
    queryFn: adminAreasApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provinceId: "",
      areaId: NO_AREA,
      name: "",
      summary: "",
      description: "",
      visit_info: "",
      isExploration: false,
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "places"] });

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const shared = {
        areaId: values.areaId === NO_AREA ? null : Number(values.areaId),
        name: values.name,
        summary: values.summary || undefined,
        description: values.description || undefined,
        visit_info: values.visit_info || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        isExploration: values.isExploration ?? false,
        translations: pruneTranslations(translations),
      };

      /* التعديل لا يقبل provinceId — راجع updatePlaceSchema بالباك اند. */
      return editing
        ? adminPlacesApi.update(editing.id, shared)
        : adminPlacesApi.create({
            ...shared,
            provinceId: Number(values.provinceId),
          });
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.placeUpdated") : t("admin.placeAdded"));
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setCoords(null);
    setTranslations({});
    form.reset({
      provinceId: provinceFilter !== "all" ? provinceFilter : "",
      areaId: NO_AREA,
      name: "",
      summary: "",
      description: "",
      visit_info: "",
      isExploration: false,
    });
    setCreating(true);
  };

  const openEdit = (place: Place) => {
    setEditing(place);
    setServerError(null);
    setCoords(toLatLng(place));
    setTranslations(place.translations ?? {});
    form.reset({
      provinceId: place.province ? String(place.province.id) : "",
      areaId: place.area ? String(place.area.id) : NO_AREA,
      name: place.name,
      summary: place.summary ?? "",
      description: place.description ?? "",
      visit_info: place.visit_info ?? "",
      isExploration: place.is_exploration ?? false,
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const rows = useMemo(() => {
    const all = places.data ?? [];
    if (provinceFilter === "all") return all;
    return all.filter(
      (place) => String(place.province?.id ?? "") === provinceFilter,
    );
  }, [places.data, provinceFilter]);

  /* المناطق المتاحة للمحافظة المختارة في النموذج. */
  const selectedProvinceId = form.watch("provinceId");
  const areaOptions = (areas.data ?? []).filter(
    (area) => String(area.province?.id ?? "") === selectedProvinceId,
  );

  const columns: Column<Place>[] = [
    {
      key: "name",
      header: t("admin.place"),
      /* الاسم وحده — الوصف يُقرأ في نافذة التعديل لا في الجدول. */
      cell: (row) => (
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-bold text-basalt-900">{row.name}</p>
          {row.is_exploration ? (
            <Badge variant="gold" className="shrink-0">
              <Compass />
              {t("admin.exploration")}
            </Badge>
          ) : null}
        </div>
      ),
    },
    {
      key: "province",
      header: t("admin.provinceName"),
      cell: (row) => (
        <span className="text-sm text-basalt-700">
          {row.province?.name ?? t("common.none")}
        </span>
      ),
    },
    {
      key: "area",
      header: t("admin.area"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-sm text-basalt-700">
          {row.area?.name ?? t("admin.noArea")}
        </span>
      ),
    },
    {
      key: "media",
      header: t("admin.media"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs tabular-nums text-basalt-600/75">
          {t("admin.imagesCount", { count: row.images?.length ?? 0 })} ·{" "}
          {t("admin.videosCount", { count: row.videos?.length ?? 0 })}
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
      icon={MapPinned}
      title={t("admin.places")}
      description={t("admin.placesHint")}
      action={
        <Button onClick={openCreate} disabled={!provinces.data?.length}>
          <Plus />
          {t("admin.newPlace")}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-basalt-700">
          {t("admin.provinceName")}:
        </span>
        <div className="w-56">
          <Select value={provinceFilter} onValueChange={setProvinceFilter}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.allProvinces")}</SelectItem>
              {(provinces.data ?? []).map((province) => (
                <SelectItem key={province.id} value={String(province.id)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        resetKey={provinceFilter}
        isLoading={places.isPending}
        error={places.error}
        onRetry={() => void places.refetch()}
        emptyTitle={
          provinces.data?.length
            ? t("admin.noPlacesMatch")
            : t("admin.addProvinceFirst")
        }
        emptyDescription={
          provinces.data?.length
            ? t("admin.noPlacesMatchBody")
            : t("admin.addProvinceFirstBody")
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
              onDelete={() => adminPlacesApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newPlace")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={t("admin.provinceName")}
          htmlFor="provinceId"
          error={
            form.formState.errors.provinceId ? t("admin.selectProvince") : undefined
          }
          hint={editing ? t("admin.provinceLocked") : undefined}
        >
          <Select
            value={form.watch("provinceId")}
            onValueChange={(value) => {
              form.setValue("provinceId", value);
              /* المنطقة تتبع المحافظة — تبديل المحافظة يلغي الاختيار السابق. */
              form.setValue("areaId", NO_AREA);
            }}
            disabled={!!editing}
          >
            <SelectTrigger id="provinceId">
              <SelectValue placeholder={t("admin.selectProvince")} />
            </SelectTrigger>
            <SelectContent>
              {(provinces.data ?? []).map((province) => (
                <SelectItem key={province.id} value={String(province.id)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label={t("admin.area")} htmlFor="areaId" hint={t("admin.areaHint")}>
          <Select
            value={form.watch("areaId")}
            onValueChange={(value) => form.setValue("areaId", value)}
            disabled={!selectedProvinceId}
          >
            <SelectTrigger id="areaId">
              <SelectValue placeholder={t("admin.selectArea")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_AREA}>{t("admin.noArea")}</SelectItem>
              {areaOptions.map((area) => (
                <SelectItem key={area.id} value={String(area.id)}>
                  {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label={`${t("admin.name")} — ${t("admin.baseLanguage")}`}
          htmlFor="place-name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input
            id="place-name"
            placeholder={t("ph.placeName")}
            {...form.register("name")}
          />
        </Field>

        <Field label={t("admin.summary")} htmlFor="place-summary">
          <Input
            id="place-summary"
            placeholder={t("ph.summary")}
            {...form.register("summary")}
          />
        </Field>

        <Field label={t("admin.description")} htmlFor="place-description">
          <Textarea
            id="place-description"
            placeholder={t("ph.description")}
            {...form.register("description")}
          />
        </Field>

        <Field
          label={t("admin.visitInfo")}
          htmlFor="visit_info"
          hint={t("admin.visitInfoHint")}
        >
          <Textarea
            id="visit_info"
            placeholder={t("ph.visitInfo")}
            {...form.register("visit_info")}
          />
        </Field>

        <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-basalt-900/10 bg-sand-50/50 p-4">
          <input
            type="checkbox"
            className="mt-0.5 size-4 shrink-0 accent-gold-600"
            {...form.register("isExploration")}
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-basalt-900">
              {t("admin.placeExploration")}
            </span>
            <span className="mt-0.5 block text-xs leading-relaxed text-basalt-600/75">
              {t("admin.placeExplorationHint")}
            </span>
          </span>
        </label>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "name", label: t("admin.name") },
            { name: "summary", label: t("admin.summary") },
            { name: "description", label: t("admin.description"), multiline: true },
            { name: "visit_info", label: t("admin.visitInfo"), multiline: true },
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

      <PlaceMediaDialog place={mediaFor} onClose={() => setMediaFor(null)} />
    </AdminPage>
  );
}

function PlaceMediaDialog({
  place,
  onClose,
}: {
  place: Place | null;
  onClose: () => void;
}) {
  const t = useT();
  const queryClient = useQueryClient();

  const detail = useQuery({
    queryKey: ["admin", "place", place?.id],
    queryFn: () => adminPlacesApi.byId(place!.id),
    enabled: !!place,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({
      queryKey: ["admin", "place", place?.id],
    });
    void queryClient.invalidateQueries({ queryKey: ["admin", "places"] });
  };

  return (
    <Dialog open={!!place} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("admin.mediaOf", { name: place?.name ?? "" })}</DialogTitle>
          <DialogDescription>{t("admin.mediaCoverHint")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex flex-col gap-4 py-4">
          {place ? (
            <>
              <MediaManager
                kind="images"
                items={(detail.data?.images ?? []).map((image) => ({
                  id: image.id,
                  url: image.image_url,
                }))}
                onUpload={(files) => adminPlacesApi.uploadImages(place.id, files)}
                onDelete={(id) => adminPlacesApi.deleteImage(id)}
                onChanged={refresh}
              />

              <MediaManager
                kind="videos"
                items={(detail.data?.videos ?? []).map((video) => ({
                  id: video.id,
                  url: video.video_url,
                  title: video.title,
                }))}
                onUpload={(files) => adminPlacesApi.uploadVideos(place.id, files)}
                onDelete={(id) => adminPlacesApi.deleteVideo(id)}
                onChanged={refresh}
              />
            </>
          ) : null}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
