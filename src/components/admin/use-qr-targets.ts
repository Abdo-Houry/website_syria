import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminPlacesApi, adminProvincesApi } from "@/api/admin/content.api";
import { useT } from "@/i18n/locale-context";
import type { QrTargetType } from "@/types/api";

/** الحدّ الأدنى الذي نحتاجه من الرمز لتسميته وتنزيله. */
export interface QrTargetRef {
  target_type: QrTargetType;
  target_id: number;
  serial_number: string;
  version: string;
}

/**
 * أسماء وجهات رموز الـ QR.
 *
 * الباك اند يعيد نوع الوجهة ومعرّفها فقط، لذلك نجلب الأماكن والمحافظات
 * مرّة واحدة (بمفاتيح استعلام مشتركة مع بقية اللوحة فتُخدَّم من الذاكرة)
 * ونبني منها الاسم المعروض واسم الملف — فيتطابق التنزيل من صفحة الرموز
 * ومن ورقة رموز النسخة.
 */
export function useQrTargets() {
  const t = useT();

  const places = useQuery({
    queryKey: ["admin", "places"],
    queryFn: adminPlacesApi.list,
  });

  const provinces = useQuery({
    queryKey: ["admin", "provinces"],
    queryFn: adminProvincesApi.list,
  });

  return useMemo(() => {
    const placeNames = new Map((places.data ?? []).map((p) => [p.id, p.name]));
    const provinceNames = new Map(
      (provinces.data ?? []).map((p) => [p.id, p.name]),
    );

    /** اسم المكان أو المحافظة إن عرفناه. */
    const targetName = (row: QrTargetRef): string | undefined =>
      row.target_type === "PROVINCE"
        ? provinceNames.get(row.target_id)
        : placeNames.get(row.target_id);

    /** الاسم المعروض: الاسم الحقيقي، وإلا النوع مع المعرّف. */
    const targetLabel = (row: QrTargetRef): string =>
      targetName(row) ??
      `${row.target_type === "PROVINCE" ? t("province.badge") : t("admin.place")} #${row.target_id}`;

    /*
      اسم الملف: اسم المكان أو المحافظة + السيريال + الإصدار —
      مع إزالة الأحرف غير المسموحة في أسماء الملفات.
    */
    const fileNameFor = (row: QrTargetRef): string =>
      [targetLabel(row), row.serial_number, row.version]
        .join("-")
        .replace(/[\/:*?"<>|#]+/g, "")
        .replace(/\s+/g, "-");

    return { targetName, targetLabel, fileNameFor, isLoading: places.isPending };
  }, [places.data, places.isPending, provinces.data, t]);
}
