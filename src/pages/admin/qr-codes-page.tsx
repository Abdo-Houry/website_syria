import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Copy,
  Download,
  MapPin,
  MapPinned,
  QrCode,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/admin-page";
import { DataTable, type Column } from "@/components/admin/data-table";
import { QrImage } from "@/components/admin/qr-image";
import { useQrTargets } from "@/components/admin/use-qr-targets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { adminQrCodesApi } from "@/api/admin/books.api";
import { useT } from "@/i18n/locale-context";
import { downloadQrPng } from "@/lib/qr-image";
import type { QrCode as QrCodeEntity } from "@/types/api";

export function AdminQrCodesPage() {
  const t = useT();
  const [term, setTerm] = useState("");
  const [preview, setPreview] = useState<QrCodeEntity | null>(null);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: ["admin", "qr-codes"],
    queryFn: adminQrCodesApi.list,
  });

  /* أسماء الوجهات — الباك اند يعيد نوع الهدف ومعرّفه فقط. */
  const { targetName, targetLabel, fileNameFor } = useQrTargets();

  const rows = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const all = query.data ?? [];
    if (!needle) return all;
    return all.filter(
      (qr) =>
        qr.serial_number.toLowerCase().includes(needle) ||
        qr.version.toLowerCase().includes(needle) ||
        qr.qr_value.toLowerCase().includes(needle) ||
        (targetName(qr) ?? "").toLowerCase().includes(needle),
    );
  }, [query.data, term, targetName]);

  const copyValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(t("common.copied"));
    } catch {
      toast.error(t("admin.copyFailed"));
    }
  };

  const download = async (row: QrCodeEntity) => {
    setDownloadingId(row.id);
    try {
      await downloadQrPng({
        value: row.qr_value,
        /* الصورة رمزٌ فقط — بلا سطر السيريال والإصدار أسفلها. */
        fileName: fileNameFor(row),
        /* الصورة المنزَّلة بلا خلفية — للطباعة فوق تصميم الجواز. */
        transparent: true,
      });
      toast.success(t("admin.qrDownloaded"));
    } catch {
      toast.error(t("admin.qrDownloadFailed"));
    } finally {
      setDownloadingId(null);
    }
  };

  const columns: Column<QrCodeEntity>[] = [
    {
      key: "target",
      header: t("admin.target"),
      cell: (row) => (
        <Badge variant={row.target_type === "PROVINCE" ? "gold" : "neutral"}>
          {row.target_type === "PROVINCE" ? <MapPin /> : <MapPinned />}
          {targetLabel(row)}
        </Badge>
      ),
    },
    {
      key: "serial",
      header: t("admin.copy"),
      cell: (row) => (
        <span dir="ltr" className="text-sm tabular-nums text-basalt-800">
          {row.serial_number} / {row.version}
        </span>
      ),
    },
    {
      key: "book",
      header: t("admin.book"),
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-sm text-basalt-700">
          {row.book_copy?.book?.name ?? t("common.none")}
        </span>
      ),
    },
    {
      key: "value",
      header: t("admin.link"),
      hideOnMobile: true,
      cell: (row) => (
        <span
          dir="ltr"
          className="block max-w-[22rem] truncate text-xs text-basalt-600/75"
          title={row.qr_value}
        >
          {row.qr_value}
        </span>
      ),
    },
  ];

  return (
    <AdminPage
      icon={QrCode}
      title={t("admin.qrCodes")}
      description={t("admin.qrHint")}
    >
      <div className="relative mb-4 max-w-sm">
        <Search
          className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
          aria-hidden
        />
        <Input
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder={t("admin.qrSearch")}
          className="h-11 ps-11"
          aria-label={t("common.search")}
        />
      </div>

      <DataTable
        rows={rows}
        columns={columns}
        resetKey={term}
        isLoading={query.isPending}
        error={query.error}
        onRetry={() => void query.refetch()}
        emptyTitle={query.data?.length ? t("admin.noQrMatch") : t("admin.noQr")}
        emptyDescription={
          query.data?.length
            ? t("admin.noQrMatchBody")
            : t("admin.noQrBody")
        }
        actions={(row) => (
          <>
            <Button
              variant="outline"
              size="sm"
              loading={downloadingId === row.id}
              onClick={() => void download(row)}
            >
              {downloadingId === row.id ? null : <Download />}
              {t("admin.download")}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("admin.previewCode")}
              onClick={() => setPreview(row)}
            >
              <QrCode />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={t("admin.copyLink")}
              onClick={() => void copyValue(row.qr_value)}
            >
              <Copy />
            </Button>
          </>
        )}
      />

      <Dialog open={!!preview} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader className="items-center text-center">
            <DialogTitle>{preview ? targetLabel(preview) : null}</DialogTitle>
          </DialogHeader>
          <DialogBody className="flex flex-col items-center gap-3 pb-6">
            {preview ? <QrImage value={preview.qr_value} size={220} /> : null}
            <p dir="ltr" className="text-xs tabular-nums text-basalt-600/75">
              {preview?.serial_number} / {preview?.version}
            </p>
            {preview ? (
              <Button
                variant="outline"
                size="sm"
                loading={downloadingId === preview.id}
                onClick={() => void download(preview)}
              >
                {downloadingId === preview.id ? null : <Download />}
                {t("admin.download")}
              </Button>
            ) : null}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
