import { ar, type MessageKey } from "@/i18n/messages/ar";

/**
 * جسر ترجمة خارج شجرة React.
 *
 * طبقة الـ HTTP تُنتج أخطاءً قبل أن يصل أي مكوّن إلى `useT()`، ومعالجات
 * الأحداث (toast) تحتاج النص باللغة الحالية لحظة الاستدعاء لا لحظة الرسم.
 * لذلك يسجّل `LocaleProvider` دالة الترجمة هنا، وتقرأها هذه الوحدة عند الطلب.
 */

/** قيم الاستبدال داخل النص: `{name}` → القيمة. */
export type TranslateValues = Record<string, string | number>;

export type Translator = (key: MessageKey, values?: TranslateValues) => string;

let activeTranslator: Translator | null = null;

export function registerTranslator(translator: Translator | null) {
  activeTranslator = translator;
}

export function interpolate(
  template: string,
  values?: TranslateValues,
): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * يترجم بالمزوّد المسجَّل، ويرجع إلى العربية قبل تركيب الشجرة أو خارجها —
 * فلا يظهر مفتاح خام للمستخدم في أي حال.
 */
export function translateMessage(
  key: MessageKey,
  values?: TranslateValues,
): string {
  if (activeTranslator) return activeTranslator(key, values);
  return interpolate(ar[key] ?? key, values);
}
