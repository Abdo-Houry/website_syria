import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ASSETS_BASE_URL = (
  import.meta.env.VITE_ASSETS_BASE_URL ?? "http://localhost:5000"
).replace(/\/$/, "");

/**
 * الباك اند يخزّن الوسائط كمسار نسبي مثل `/uploads/places/xxx.jpg`.
 * هذه الدالة تحوّله إلى رابط قابل للعرض، وتترك الروابط المطلقة كما هي.
 */
export function assetUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  const value = path.trim();
  if (!value) return undefined;
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  return `${ASSETS_BASE_URL}/${value.replace(/^\//, "")}`;
}

/** نسبة مئوية آمنة (بدون قسمة على صفر). */
export function percent(done: number, total: number): number {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

/** تنسيق تاريخ بلغة الواجهة الحالية. */
export function formatDate(
  value?: string | Date | null,
  locale = "ar",
): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** أول حرفين من الاسم للأفاتار. */
export function initials(name?: string): string {
  if (!name) return "؟";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0] ?? "").join("") || "؟";
}
