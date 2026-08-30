import type { Locale } from "@/i18n/config";
import { DEFAULT_LOCALE } from "@/i18n/config";

/** شكل عمود `translations` القادم من الباك اند. */
export type EntityTranslations = Partial<
  Record<Locale, Record<string, string | undefined>>
>;

interface Translatable {
  translations?: EntityTranslations | null;
}

/**
 * يقرأ حقلاً نصياً من كيان باللغة المطلوبة.
 *
 * العربية تُقرأ من العمود الأصلي مباشرة. أي لغة أخرى تُقرأ من
 * `translations[locale][field]`، وترجع إلى العربية عند غياب الترجمة —
 * فالمحتوى الناقص لا يترك فراغاً في الواجهة.
 */
export function tField<T extends Translatable>(
  entity: T | null | undefined,
  field: keyof T & string,
  locale: Locale,
): string {
  if (!entity) return "";

  const base = entity[field];
  const fallback = typeof base === "string" ? base : "";

  if (locale === DEFAULT_LOCALE) return fallback;

  const translated = entity.translations?.[locale]?.[field];
  if (typeof translated === "string" && translated.trim()) {
    return translated;
  }

  return fallback;
}

/**
 * نسخة تعيد `undefined` بدل نص فارغ — مفيدة للحقول الاختيارية
 * حيث نريد إخفاء القسم كاملاً بدل عرض فراغ.
 */
export function tFieldOptional<T extends Translatable>(
  entity: T | null | undefined,
  field: keyof T & string,
  locale: Locale,
): string | undefined {
  const value = tField(entity, field, locale);
  return value.trim() ? value : undefined;
}
