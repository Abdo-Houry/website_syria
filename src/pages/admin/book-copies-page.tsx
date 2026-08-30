import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  BookCopy as BookCopyIcon,
  CircleCheck,
  CircleDashed,
  Download,
  DownloadCloud,
  Plus,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete";
import { DataTable, type Column } from "@/components/admin/data-table";
import { FormDialog } from "@/components/admin/form-dialog";
import { QrImage } from "@/components/admin/qr-image";
import { useQrTargets } from "@/components/admin/use-qr-targets";
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
import { Field } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminBookCopiesApi, adminBooksApi } from "@/api/admin/books.api";
import { useLocale, useT } from "@/i18n/locale-context";
import { downloadQrPng } from "@/lib/qr-image";
import { formatDate } from "@/lib/utils";
import type { BookCopy } from "@/types/api";

/* الرسائل تُترجَم عند العرض لا هنا — المخطّط وحدة ثابتة خارج شجرة React. */
const schema = z.object({
  bookId: z.string().min(1),
  serial_number: z.string().trim().min(1),
  version: z.string().trim().min(1),
});

type FormValues = z.infer<typeof schema>;

export function AdminBookCopiesPage() {
  const t = useT();
  const { locale } = useLocale();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const [serverError, setServerError] = useState<unknown>(null);
  const [qrFor, setQrFor] = useState<BookCopy | null>(null);

  const bookFilter = searchParams.get("book") ?? "all";

  const copies = useQuery({
    queryKey: ["admin", "book-copies"],
    queryFn: adminBookCopiesApi.list,
  });

  const books = useQuery({
    queryKey: ["admin", "books"],
    queryFn: adminBooksApi.list,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { bookId: "", serial_number: "", version: "001" },
  });

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "book-copies"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "books"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "qr-codes"] }),
    ]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      adminBookCopiesApi.create({
        bookId: Number(values.bookId),
        serial_number: values.serial_number,
        version: values.version,
      }),
    onSuccess: async (copy) => {
      await invalidate();
      toast.success(t("admin.copyCreated"));
      setCreating(false);
      /* نفتح ورقة الرموز فوراً — هذا هو الإجراء التالي الطبيعي. */
      const full = await adminBookCopiesApi.byId(copy.id);
      setQrFor(full);
    },
    onError: (error) => setServerError(error),
  });

  const rows = useMemo(() => {
    const all = copies.data ?? [];
    if (bookFilter === "all") return all;
    return all.filter((copy) => String(copy.book?.id ?? "") === bookFilter);
  }, [copies.data, bookFilter]);

  const openCreate = () => {
    setServerError(null);
    form.reset({
      bookId: bookFilter !== "all" ? bookFilter : "",
      serial_number: "",
      version: "001",
    });
    setCreating(true);
  };

  const columns: Column<BookCopy>[] = [
    {
      key: "serial",
      header: t("admin.serial"),
      cell: (row) => (
        <div className="min-w-0">
          <p dir="ltr" className="truncate font-bold tabular-nums text-basalt-900">
            {row.serial_number}
          </p>
          <p dir="ltr" className="text-xs text-basalt-600/70">
            v{row.version}
          </p>
        </div>
      ),
    },
    {
      key: "book",
      header: t("admin.book"),
      cell: (row) => (
        <span className="text-sm text-basalt-700">
          {row.book?.name ?? t("common.none")}
        </span>
      ),
    },
    {
      key: "sold",
      header: t("common.status"),
      cell: (row) =>
        row.is_sold ? (
          <Badge variant="gold">
            <CircleCheck />
            {t("admin.copySold")}
          </Badge>
        ) : (
          <Badge variant="neutral">
            <CircleDashed />
            {t("admin.copyAvailable")}
          </Badge>
        ),
    },
    {
      key: "qrs",
      header: t("admin.codes"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-sm tabular-nums text-basalt-700">
          {row.qrs?.length ?? 0}
        </span>
      ),
    },
    {
      key: "created",
      header: t("admin.createdAt"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-basalt-600/75">
          {formatDate(row.created_at, locale)}
        </span>
      ),
    },
  ];

  return (
    <AdminPage
      icon={BookCopyIcon}
      title={t("admin.copies")}
      description={t("admin.copiesHint")}
      action={
        <Button onClick={openCreate} disabled={!books.data?.length}>
          <Plus />
          {t("admin.newCopy")}
        </Button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-basalt-700">
          {t("admin.book")}:
        </span>
        <div className="w-64">
          <Select
            value={bookFilter}
            onValueChange={(value) =>
              setSearchParams(value === "all" ? {} : { book: value })
            }
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.allBooks")}</SelectItem>
              {(books.data ?? []).map((book) => (
                <SelectItem key={book.id} value={String(book.id)}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        resetKey={bookFilter}
        isLoading={copies.isPending}
        error={copies.error}
        onRetry={() => void copies.refetch()}
        emptyTitle={
          books.data?.length ? t("admin.noCopies") : t("admin.createBookFirst")
        }
        emptyDescription={
          books.data?.length
            ? t("admin.noCopiesBody")
            : t("admin.createBookFirstBody")
        }
        actions={(row) => (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                const full = await adminBookCopiesApi.byId(row.id);
                setQrFor(full);
              }}
            >
              <QrCode />
              {t("admin.codes")}
            </Button>
            <ConfirmDeleteButton
              label={`${t("admin.copy")} ${row.serial_number}`}
              onDelete={() => adminBookCopiesApi.remove(row.id)}
              onDeleted={() => void invalidate()}
            />
          </>
        )}
      />

      <FormDialog
        open={creating}
        onOpenChange={setCreating}
        title={t("admin.newCopy")}
        description={t("admin.copiesHint")}
        submitLabel={t("admin.createAndGenerate")}
        isSubmitting={mutation.isPending}
        serverError={serverError}
        onSubmit={form.handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
      >
        <Field
          label={t("admin.book")}
          htmlFor="copy-book"
          error={form.formState.errors.bookId ? t("admin.selectBook") : undefined}
        >
          <Select
            value={form.watch("bookId")}
            onValueChange={(value) => form.setValue("bookId", value)}
          >
            <SelectTrigger id="copy-book">
              <SelectValue placeholder={t("admin.selectBook")} />
            </SelectTrigger>
            <SelectContent>
              {(books.data ?? []).map((book) => (
                <SelectItem key={book.id} value={String(book.id)}>
                  {book.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          label={t("admin.serial")}
          htmlFor="serial_number"
          hint={t("admin.serialHint")}
          error={
            form.formState.errors.serial_number
              ? t("admin.serialRequired")
              : undefined
          }
        >
          <Input
            id="serial_number"
            dir="ltr"
            placeholder="000001"
            {...form.register("serial_number")}
          />
        </Field>

        <Field
          label={t("admin.version")}
          htmlFor="version"
          hint={t("admin.versionHint")}
          error={
            form.formState.errors.version ? t("admin.versionRequired") : undefined
          }
        >
          <Input
            id="version"
            dir="ltr"
            placeholder="001"
            {...form.register("version")}
          />
        </Field>
      </FormDialog>

      <QrSheetDialog copy={qrFor} onClose={() => setQrFor(null)} />
    </AdminPage>
  );
}

/**
 * ورقة رموز النسخة.
 *
 * كل رمز يحمل اسم المكان أو المحافظة لا معرّفهما، والتنزيل يعطي الصورة
 * بالاسم نفسه المستخدَم في صفحة الرموز — فلا يختلف الملف الواصل إلى
 * المصمّم باختلاف الصفحة التي نُزِّل منها.
 */
function QrSheetDialog({
  copy,
  onClose,
}: {
  copy: BookCopy | null;
  onClose: () => void;
}) {
  const t = useT();
  const { targetLabel, fileNameFor } = useQrTargets();
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const qrs = copy?.qrs ?? [];

  const downloadAll = async () => {
    setDownloadingAll(true);
    let failed = 0;
    try {
      for (const qr of qrs) {
        try {
          await downloadQrPng({
            value: qr.qr_value,
            /* الصورة رمزٌ فقط — بلا سطر السيريال والإصدار أسفلها. */
            fileName: fileNameFor(qr),
            transparent: true,
          });
        } catch {
          failed += 1;
        }
        /*
          المتصفّح يحجب التنزيلات المتتابعة بلا فاصل، فننتظر قليلاً بين
          ملف وآخر حتى تصل كل الصور فعلاً.
        */
        await new Promise((resolve) => setTimeout(resolve, 350));
      }

      if (failed) {
        toast.error(t("admin.qrDownloadPartial", { count: failed }));
      } else {
        toast.success(t("admin.qrAllDownloaded", { count: qrs.length }));
      }
    } finally {
      setDownloadingAll(false);
    }
  };

  return (
    <Dialog open={!!copy} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {t("admin.copyCodesTitle", { serial: copy?.serial_number ?? "" })}
          </DialogTitle>
          <DialogDescription>{t("admin.copyCodesBody")}</DialogDescription>
        </DialogHeader>

        <DialogBody className="py-4">
          {qrs.length === 0 ? (
            <p className="py-8 text-center text-sm text-basalt-600/75">
              {t("admin.noCodesForCopy")}
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {qrs.map((qr) => (
                <figure
                  key={qr.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-basalt-900/10 p-3 text-center"
                >
                  <QrImage value={qr.qr_value} size={132} />
                  {/* اسم المكان أو المحافظة — لا «مكان #6» */}
                  <figcaption className="line-clamp-2 min-w-0 text-xs font-bold text-basalt-900">
                    {targetLabel(qr)}
                  </figcaption>

                  <Button
                    variant="ghost"
                    size="sm"
                    loading={downloadingId === qr.id}
                    disabled={downloadingAll}
                    onClick={async () => {
                      setDownloadingId(qr.id);
                      try {
                        await downloadQrPng({
                          value: qr.qr_value,
                          fileName: fileNameFor(qr),
                          transparent: true,
                        });
                      } catch {
                        toast.error(t("admin.qrDownloadFailed"));
                      } finally {
                        setDownloadingId(null);
                      }
                    }}
                  >
                    {downloadingId === qr.id ? null : <Download />}
                    {t("admin.download")}
                  </Button>
                </figure>
              ))}
            </div>
          )}
        </DialogBody>

        <DialogFooter>
          <Button
            onClick={() => void downloadAll()}
            loading={downloadingAll}
            disabled={!qrs.length}
          >
            {downloadingAll ? null : <DownloadCloud />}
            {t("admin.downloadAll", { count: qrs.length })}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={downloadingAll}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
