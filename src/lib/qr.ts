import type { MessageKey } from "@/i18n/messages/ar";
import type { QrTargetType } from "@/types/api";

/**
 * تحليل محتوى الـ QR.
 *
 * الشكل الذي ينتجه الباك اند (services/qr-code.service.ts):
 *   `${FRONTEND_URL}/qr/${target_type}/${target_id}?serial=...&version=...`
 *
 * تنبيه واقعي: `FRONTEND_URL` غير معرّف في ملف `.env` الحالي للباك اند، لذلك
 * القيمة المطبوعة قد تبدأ بـ `undefined/qr/...`. لهذا لا نعتمد على كون النص
 * رابطاً صالحاً، بل نبحث عن النمط `/qr/<TYPE>/<ID>` داخل أي نص، مع دعم:
 *   - الرابط الكامل
 *   - المسار وحده
 *   - مسار الـ API المباشر: /api/public/qr/:serial/:version/:type/:id
 *   - محتوى JSON
 */

export type QrParseResult =
  | {
      kind: "target";
      targetType: QrTargetType;
      targetId: number;
      serial: string;
      version: string;
      raw: string;
    }
  | {
      /** رمز يحمل معرّف نسخة الكتيّب مباشرة (لتفعيل الكتيّب). */
      kind: "book-copy";
      bookCopyId: number;
      serial?: string;
      version?: string;
      raw: string;
    }
  /** `reasonKey` مفتاح قاموس لا نصاً جاهزاً — الرسالة تُترجَم عند العرض. */
  | { kind: "unsupported"; reasonKey: MessageKey; raw: string };

const TARGET_TYPES: QrTargetType[] = ["PROVINCE", "PLACE"];

function normalizeType(value: string): QrTargetType | null {
  const upper = value.trim().toUpperCase();
  return (TARGET_TYPES as string[]).includes(upper) ? (upper as QrTargetType) : null;
}

function readSearchParams(raw: string): URLSearchParams {
  const queryIndex = raw.indexOf("?");
  if (queryIndex === -1) return new URLSearchParams();
  return new URLSearchParams(raw.slice(queryIndex + 1));
}

/** /api/public/qr/:serial/:version/:type/:id — الشكل المباشر لنقطة النهاية. */
const API_PATTERN =
  /\/(?:api\/)?public\/qr\/([^/?\s]+)\/([^/?\s]+)\/(PROVINCE|PLACE)\/(\d+)/i;

/** /qr/:type/:id?serial=&version= — الشكل المُخزَّن في qr_value. */
const FRONTEND_PATTERN = /\/qr\/(PROVINCE|PLACE)\/(\d+)/i;

export function parseQrPayload(input: string): QrParseResult {
  const raw = (input ?? "").trim();

  if (!raw) {
    return { kind: "unsupported", reasonKey: "errors.qrEmpty", raw };
  }

  /* 1) محتوى JSON صريح */
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      const copyId = Number(parsed.bookCopyId ?? parsed.book_copy_id ?? parsed.copyId);
      if (Number.isFinite(copyId) && copyId > 0) {
        return {
          kind: "book-copy",
          bookCopyId: copyId,
          serial: typeof parsed.serial === "string" ? parsed.serial : undefined,
          version: typeof parsed.version === "string" ? parsed.version : undefined,
          raw,
        };
      }

      const type = normalizeType(String(parsed.type ?? parsed.target_type ?? ""));
      const targetId = Number(parsed.id ?? parsed.target_id ?? parsed.targetId);
      const serial = String(parsed.serial ?? parsed.serial_number ?? "");
      const version = String(parsed.version ?? "");

      if (type && Number.isFinite(targetId) && serial && version) {
        return { kind: "target", targetType: type, targetId, serial, version, raw };
      }
    } catch {
      /* ليس JSON صالحاً — نكمل بالأنماط النصية */
    }
  }

  /* 2) مسار الـ API المباشر */
  const apiMatch = raw.match(API_PATTERN);
  if (apiMatch) {
    const [, serial, version, type, id] = apiMatch;
    const normalized = normalizeType(type!);
    if (normalized) {
      return {
        kind: "target",
        targetType: normalized,
        targetId: Number(id),
        serial: decodeURIComponent(serial!),
        version: decodeURIComponent(version!),
        raw,
      };
    }
  }

  /* 3) الشكل المُخزَّن في qr_value */
  const frontendMatch = raw.match(FRONTEND_PATTERN);
  if (frontendMatch) {
    const [, type, id] = frontendMatch;
    const params = readSearchParams(raw);
    const serial = params.get("serial")?.trim();
    const version = params.get("version")?.trim();
    const normalized = normalizeType(type!);

    if (!normalized) {
      return {
        kind: "unsupported",
        reasonKey: "errors.qrTypeUnsupported",
        raw,
      };
    }

    if (!serial || !version) {
      return {
        kind: "unsupported",
        reasonKey: "errors.qrMissingSerial",
        raw,
      };
    }

    return {
      kind: "target",
      targetType: normalized,
      targetId: Number(id),
      serial,
      version,
      raw,
    };
  }

  /* 4) رمز يحمل معرّف نسخة الكتيّب — /book-copy/12 أو ?bookCopyId=12 */
  const copyMatch = raw.match(/\/book-cop(?:y|ies)\/(\d+)/i);
  const copyParam = readSearchParams(raw).get("bookCopyId");
  const copyId = Number(copyMatch?.[1] ?? copyParam ?? NaN);
  if (Number.isFinite(copyId) && copyId > 0) {
    const params = readSearchParams(raw);
    return {
      kind: "book-copy",
      bookCopyId: copyId,
      serial: params.get("serial") ?? undefined,
      version: params.get("version") ?? undefined,
      raw,
    };
  }

  /* 5) رقم مجرّد — نعامله كمعرّف نسخة كتيّب (إدخال يدوي) */
  if (/^\d+$/.test(raw)) {
    return { kind: "book-copy", bookCopyId: Number(raw), raw };
  }

  return {
    kind: "unsupported",
    reasonKey: "errors.qrForeign",
    raw,
  };
}

/** يبني المسار الداخلي الذي تُحلّ عنده نتيجة المسح. */
export function qrRoutePath(result: Extract<QrParseResult, { kind: "target" }>) {
  const params = new URLSearchParams({
    serial: result.serial,
    version: result.version,
  });
  return `/qr/${result.targetType}/${result.targetId}?${params.toString()}`;
}
