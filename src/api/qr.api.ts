import { apiGet } from "@/lib/http";
import type { QrResolveResult, QrTargetType } from "@/types/api";

export interface QrResolveParams {
  serial: string;
  version: string;
  type: QrTargetType;
  targetId: number;
}

export const qrApi = {
  /**
   * GET /api/public/qr/:serial/:version/:type/:id
   *
   * مصادقة اختيارية: عند إرسال توكن المستخدم وامتلاكه لنسخة الكتيّب نفسها
   * (نفس السيريال والإصدار) يسجّل الباك اند الزيارة تلقائياً.
   */
  resolve: ({ serial, version, type, targetId }: QrResolveParams) =>
    apiGet<QrResolveResult>(
      `/public/qr/${encodeURIComponent(serial)}/${encodeURIComponent(
        version,
      )}/${type}/${targetId}`,
    ),
};
