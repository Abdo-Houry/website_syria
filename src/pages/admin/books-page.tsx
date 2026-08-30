import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, BookOpen, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { MultiPicker } from "@/components/admin/multi-picker";
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
import { adminBooksApi } from "@/api/admin/books.api";
import {
  adminChallengesApi,
  adminPartnersApi,
  adminPlacesApi,
  adminProvincesApi,
  adminStampsApi,
} from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";
import type { Book } from "@/types/api";

const schema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  provinceId: z.string().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AdminBooksPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  /* الجواز قيد التعديل — null يعني إنشاء جواز جديد. */
  const [editing, setEditing] = useState<Book | null>(null);
  const [serverError, setServerError] = useState<unknown>(null);
  const [translations, setTranslations] = useState<EntityTranslations>({});

  const [places, setPlaces] = useState<number[]>([]);
  const [challenges, setChallenges] = useState<number[]>([]);
  const [stamps, setStamps] = useState<number[]>([]);
  const [partners, setPartners] = useState<number[]>([]);

  const books = useQuery({
    queryKey: ["admin", "books"],
    queryFn: adminBooksApi.list,
  });

  const provincesQuery = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: adminProvincesApi.list,
  });
  const placesQuery = useQuery({
    queryKey: ["admin", "places"],
    queryFn: adminPlacesApi.list,
  });
  const challengesQuery = useQuery({
    queryKey: ["admin", "challenges"],
    queryFn: adminChallengesApi.list,
  });
  const stampsQuery = useQuery({
    queryKey: ["admin", "stamps"],
    queryFn: adminStampsApi.list,
  });
  const partnersQuery = useQuery({
    queryKey: ["admin", "partners"],
    queryFn: adminPartnersApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", provinceId: "" },
  });

  const provinceId = form.watch("provinceId");

  /* المحتوى المعروض للاختيار مقيّد بمحافظة الجواز — الأماكن تتبع محافظة. */
  const provincePlaces = (placesQuery.data ?? []).filter(
    (place) => !provinceId || String(place.province?.id ?? "") === provinceId,
  );
  const provincePlaceIds = new Set(provincePlaces.map((place) => place.id));

  const provinceChallenges = (challengesQuery.data ?? []).filter(
    (challenge) => challenge.place && provincePlaceIds.has(challenge.place.id),
  );
  const provinceStamps = (stampsQuery.data ?? []).filter(
    (stamp) => stamp.place && provincePlaceIds.has(stamp.place.id),
  );

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] }),
      /* النسخ تعرض اسم جوازها، فتتبدّل معه. */
      queryClient.invalidateQueries({ queryKey: ["admin", "book-copies"] }),
    ]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        description: values.description || undefined,
        provinceId: Number(values.provinceId),
        places,
        challenges,
        stamps,
        partners,
        translations: pruneTranslations(translations),
      };

      return editing
        ? adminBooksApi.update(editing.id, payload)
        : adminBooksApi.create(payload);
    },
    onSuccess: async () => {
      await invalidate();
      toast.success(editing ? t("admin.bookUpdated") : t("admin.bookCreated"));
      close();
    },
    onError: (error) => setServerError(error),
  });

  const openCreate = () => {
    setEditing(null);
    setServerError(null);
    form.reset({ name: "", description: "", provinceId: "" });
    setPlaces([]);
    setChallenges([]);
    setStamps([]);
    setPartners([]);
    setTranslations({});
    setCreating(true);
  };

  /*
    التعديل يبدأ من نسخة الجواز الكاملة: `GET /admin/books` يعيد المحتوى
    المرتبط، فنملأ منه المنتقيات مباشرة بلا طلب إضافي.
  */
  const openEdit = (book: Book) => {
    setEditing(book);
    setServerError(null);
    form.reset({
      name: book.name,
      description: book.description ?? "",
      provinceId: book.province ? String(book.province.id) : "",
    });
    setPlaces((book.places ?? []).map((item) => item.id));
    setChallenges((book.challenges ?? []).map((item) => item.id));
    setStamps((book.stamps ?? []).map((item) => item.id));
    setPartners((book.partners ?? []).map((item) => item.id));
    setTranslations(book.translations ?? {});
    setCreating(true);
  };

  const close = () => {
    setCreating(false);
    setEditing(null);
    setServerError(null);
  };

  const columns: Column<Book>[] = [
    {
      key: "name",
      header: t("admin.book"),
      cell: (row) => (
        <div className="min-w-0">
          <p className="truncate font-bold text-basalt-900">{row.name}</p>
          <p className="truncate text-xs text-basalt-600/70">
            {row.province?.name ?? t("common.none")}
          </p>
        </div>
      ),
    },
    {
      key: "content",
      header: t("admin.bookContent"),
      hideOnMobile: true,
      cell: (row) => (
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="neutral">
            {t("province.countPlaces", { count: row.places?.length ?? 0 })}
          </Badge>
          <Badge variant="neutral">
            {t("province.countChallenges", { count: row.challenges?.length ?? 0 })}
          </Badge>
          <Badge variant="neutral">
            {t("province.countStamps", { count: row.stamps?.length ?? 0 })}
          </Badge>
        </div>
      ),
    },
    {
      key: "copies",
      header: t("admin.copies"),
      cell: (row) => (
        <span className="text-sm font-bold tabular-nums text-basalt-900">
          {row.copies?.length ?? 0}
        </span>
      ),
    },
  ];

  return (
    <AdminPage
      icon={BookOpen}
      title={t("admin.booksLabel")}
      description={t("admin.booksHint")}
      action={
        <Button onClick={openCreate} disabled={!provincesQuery.data?.length}>
          <Plus />
          {t("admin.newBook")}
        </Button>
      }
    >
      <DataTable
        rows={books.data ?? []}
        columns={columns}
        isLoading={books.isPending}
        error={books.error}
        onRetry={() => void books.refetch()}
        emptyTitle={
          provincesQuery.data?.length
            ? t("admin.noBooks")
            : t("admin.addProvinceFirst")
        }
        emptyDescription={
          provincesQuery.data?.length
            ? t("admin.noBooksBody")
            : t("admin.addProvinceBeforeBook")
        }
        actions={(row) => (
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/admin/copies?book=${row.id}`}>
                {t("admin.copies")}
                <ArrowLeft />
              </Link>
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
              onDelete={() => adminBooksApi.remove(row.id)}
              onDeleted={() => void invalidate()}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={(open) => (open ? setCreating(true) : close())}
        title={
          editing ? `${t("common.edit")} — ${editing.name}` : t("admin.newBook")
        }
        description={
          editing ? t("admin.bookEditHint") : t("admin.chooseProvinceFirst")
        }
        submitLabel={editing ? t("common.saveChanges") : t("admin.createBook")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={t("admin.provinceName")}
          htmlFor="book-province"
          error={
            form.formState.errors.provinceId ? t("admin.selectProvince") : undefined
          }
        >
          <Select
            value={provinceId}
            onValueChange={(value) => {
              form.setValue("provinceId", value);
              /* تغيير المحافظة يُبطل اختيارات المحتوى السابقة */
              setPlaces([]);
              setChallenges([]);
              setStamps([]);
            }}
          >
            <SelectTrigger id="book-province">
              <SelectValue placeholder={t("admin.selectProvince")} />
            </SelectTrigger>
            <SelectContent>
              {(provincesQuery.data ?? []).map((province) => (
                <SelectItem key={province.id} value={String(province.id)}>
                  {province.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label={`${t("admin.bookName")} — ${t("admin.baseLanguage")}`}
          htmlFor="book-name"
          error={form.formState.errors.name ? t("admin.nameRequired") : undefined}
        >
          <Input id="book-name" {...form.register("name")} />
        </Field>

        <Field label={t("admin.description")} htmlFor="book-description">
          <Textarea id="book-description" {...form.register("description")} />
        </Field>

        <TranslationsEditor
          value={translations}
          onChange={setTranslations}
          fields={[
            { name: "name", label: t("admin.bookName") },
            { name: "description", label: t("admin.description"), multiline: true },
          ]}
        />

        <Field label={t("admin.pickPlaces", { count: places.length })} htmlFor="book-places">
          <MultiPicker
            options={provincePlaces.map((place) => ({
              id: place.id,
              /* أماكن الاستكشاف تُرفَق بالجواز كغيرها — نُميّزها بوسم فقط. */
              label: place.is_exploration
                ? `${place.name} · ${t("admin.exploration")}`
                : place.name,
              hint: place.summary ?? undefined,
            }))}
            selected={places}
            onChange={setPlaces}
            emptyLabel={
              provinceId
                ? t("admin.noPlacesInProvince")
                : t("admin.selectProvinceToSee")
            }
          />
        </Field>

        <Field
          label={t("admin.pickChallenges", { count: challenges.length })}
          htmlFor="book-challenges"
        >
          <MultiPicker
            options={provinceChallenges.map((challenge) => ({
              id: challenge.id,
              label: challenge.title,
              hint: challenge.place?.name,
            }))}
            selected={challenges}
            onChange={setChallenges}
            emptyLabel={t("admin.noChallengesInProvince")}
          />
        </Field>

        <Field
          label={t("admin.pickStamps", { count: stamps.length })}
          htmlFor="book-stamps"
        >
          <MultiPicker
            options={provinceStamps.map((stamp) => ({
              id: stamp.id,
              label: stamp.name,
              hint: stamp.place?.name,
            }))}
            selected={stamps}
            onChange={setStamps}
            emptyLabel={t("admin.noStampsInProvince")}
          />
        </Field>

        <Field
          label={t("admin.pickPartners", { count: partners.length })}
          htmlFor="book-partners"
        >
          <MultiPicker
            options={(partnersQuery.data ?? []).map((partner) => ({
              id: partner.id,
              label: partner.name,
              hint: t("partners.discount", {
                value: Number(partner.discount_percentage) || 0,
              }),
            }))}
            selected={partners}
            onChange={setPartners}
            emptyLabel={t("admin.noPartnersRegistered")}
          />
        </Field>
      </FormDialog>
    </AdminPage>
  );
}
