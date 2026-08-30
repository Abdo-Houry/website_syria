import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Layers, Pencil, Plus } from "lucide-react";
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
import { Field } from "@/components/ui/label";
import { Input, Textarea } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminAreasApi, adminProvincesApi } from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Area } from "@/types/api";

const schema = z.object({
  provinceId: z.string().min(1),
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
});

type FormValues = z.infer<typeof schema>;

/**
 * المناطق — تجميع عدة أماكن تحت اسم واحد داخل محافظة
 * (مثل «أبواب حلب»). الربط نفسه يتم من نموذج المكان.
 */
export function AdminAreasPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const areas = useQuery({
    queryKey: ["admin", "areas"],
    queryFn: adminAreasApi.list,
  });

  const provinces = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: adminProvincesApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provinceId: "",
      name: "",
      description: "",
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ["admin", "areas"] });
    /* الأماكن تعرض اسم منطقتها — تحديثه ينعكس عليها. */
    await queryClient.invalidateQueries({ queryKey: ["admin", "places"] });
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        provinceId: Number(values.provinceId),
        name: values.name,
        description: values.description || undefined,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminAreasApi.update(editing.id, payload)
        : adminAreasApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.areaUpdated") : t("admin.areaAdded"));
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    setTranslations({});
    form.reset({
      provinceId: provinceFilter !== "all" ? provinceFilter : "",
      name: "",
      description: "",
    });
    setCreating(true);
  };

  const openEdit = (area: Area) => {
    setEditing(area);
    setServerError(null);
    setTranslations(area.translations ?? {});
    form.reset({
      provinceId: area.province ? String(area.province.id) : "",
      name: area.name,
      description: area.description ?? "",
    });
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const rows = useMemo(() => {
    const all = areas.data ?? [];
    if (provinceFilter === "all") return all;
    return all.filter((area) => String(area.province?.id ?? "") === provinceFilter);
  }, [areas.data, provinceFilter]);

  const columns: Column<Area>[] = [
    {
      key: "name",
      header: t("admin.area"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-basalt-900">{row.name}</p>
          {row.description ? (
            <p className="truncate text-xs text-basalt-600/70">{row.description}</p>
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
      key: "places",
      header: t("admin.places"),
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          <Badge variant="neutral">
            {t("admin.areaPlacesCount", { count: row.places?.length ?? 0 })}
          </Badge>
          {(row.places ?? []).slice(0, 4).map((place) => (
            <span
              key={place.id}
              className="rounded-full bg-sand-100 px-2 py-0.5 text-[11px] font-semibold text-basalt-700"
            >
              {place.name}
            </span>
          ))}
          {(row.places?.length ?? 0) > 4 ? (
            <span className="text-[11px] text-basalt-600/70">…</span>
          ) : null}
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
      icon={Layers}
      title={t("admin.areas")}
      description={t("admin.areasHint")}
      action={
        <Button onClick={openCreate} disabled={!provinces.data?.length}>
          <Plus />
          {t("admin.newArea")}
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
        isLoading={areas.isPending}
        error={areas.error}
        onRetry={() => void areas.refetch()}
        emptyTitle={
          provinces.data?.length ? t("admin.noAreas") : t("admin.addProvinceFirst")
        }
        emptyDescription={
          provinces.data?.length
            ? t("admin.noAreasBody")
            : t("admin.addProvinceFirstBody")
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
              onDelete={() => adminAreasApi.remove(row.id)}
              onDeleted={invalidate}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newArea")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={t("admin.provinceName")}
          htmlFor="area-provinceId"
          error={
            form.formState.errors.provinceId ? t("admin.selectProvince") : undefined
          }
        >
          <Select
            value={form.watch("provinceId")}
            onValueChange={(value) => form.setValue("provinceId", value)}
          >
            <SelectTrigger id="area-provinceId">
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

        <Field
          label={`${t("admin.name")} — ${t("admin.baseLanguage")}`}
          htmlFor="area-name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input
            id="area-name"
            placeholder={t("admin.areaNamePlaceholder")}
            {...form.register("name")}
          />
        </Field>

        <Field label={t("admin.description")} htmlFor="area-description">
          <Textarea id="area-description" {...form.register("description")} />
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
