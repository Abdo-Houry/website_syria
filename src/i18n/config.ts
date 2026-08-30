/**
 * اللغات المدعومة.
 *
 * العربية هي لغة الأساس: نصوص المحتوى تُخزَّن في أعمدة الكيان الأصلية،
 * وباقي اللغات في عمود `translations` من نوع jsonb.
 */
export const LOCALES = ["ar", "en", "de", "tr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "ar";

/*
   الأعلام تُرسم في `components/common/flag-icon.tsx` كـ SVG لا كإيموجي،
   لأن إيموجي 🇸🇾 يعرض العلم القديم في كل خطوط الأنظمة.
*/
export const LOCALE_META: Record<
  Locale,
  { label: string; englishLabel: string; dir: "rtl" | "ltr" }
> = {
  ar: { label: "العربية", englishLabel: "Arabic", dir: "rtl" },
  en: { label: "English", englishLabel: "English", dir: "ltr" },
  de: { label: "Deutsch", englishLabel: "German", dir: "ltr" },
  tr: { label: "Türkçe", englishLabel: "Turkish", dir: "ltr" },
};

/** اللغات القابلة للترجمة في لوحة الإدارة (كل شيء عدا الأساس). */
export const TRANSLATABLE_LOCALES = LOCALES.filter(
  (locale) => locale !== DEFAULT_LOCALE,
) as Exclude<Locale, "ar">[];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
