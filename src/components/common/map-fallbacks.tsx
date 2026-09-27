import { Loader2 } from "lucide-react";

/**
 * لوحات الانتظار مكان الخرائط ريثما تُحمَّل.
 *
 * تعيش في ملف مستقلّ عن مكوّنات الخريطة عمداً: الصفحات تستورد لوحة
 * الانتظار استيراداً ثابتاً والخريطةَ نفسها استيراداً كسولاً، فلو بقيت
 * اللوحة داخل ملف الخريطة لَجرّ استيرادُها مكتبةَ leaflet كاملة (نحو
 * 146KB) إلى الحزمة الأولى — وهي آخر ما يحتاجه زائر صفحة الدخول.
 */

/** انتظار مُنتقي الموقع في لوحة الإدارة. */
export function MapPickerFallback() {
  return (
    <div className="grid h-64 w-full place-items-center rounded-2xl border border-basalt-900/10 bg-sand-100">
      <Loader2 className="size-6 animate-spin text-basalt-600/50" aria-hidden />
    </div>
  );
}

/** انتظار خريطة العرض في صفحات الأماكن والمحافظات. */
export function LocationMapFallback() {
  return (
    <div className="grid h-72 w-full place-items-center rounded-[var(--radius-xl2)] border border-basalt-900/10 bg-sand-100">
      <Loader2 className="size-6 animate-spin text-basalt-600/50" aria-hidden />
    </div>
  );
}
