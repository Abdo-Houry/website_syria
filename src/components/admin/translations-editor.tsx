import { Languages } from "lucide-react";
import { FlagIcon } from "@/components/common/flag-icon";
import { Input, Textarea } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LOCALE_META, TRANSLATABLE_LOCALES } from "@/i18n/config";
import { useT } from "@/i18n/locale-context";
import type { EntityTranslations } from "@/i18n/translate-entity";

export interface TranslatableField {
  /** اسم الحقل كما في الكيان (name / summary / description …) */
  name: string;
  label: string;
  /** نص طويل ⇒ Textarea */
  multiline?: boolean;
}

/**
 * محرّر ترجمات الكيان.
 *
 * العربية تبقى في حقول النموذج الأساسية، وهذا المحرّر يغطّي en/de/tr فقط
 * — وهو ما يطابق عمود `translations` في الباك اند تماماً.
 */
export function TranslationsEditor({
  fields,
  value,
  onChange,
}: {
  fields: TranslatableField[];
  value: EntityTranslations;
  onChange: (next: EntityTranslations) => void;
}) {
  const t = useT();

  const setField = (
    locale: (typeof TRANSLATABLE_LOCALES)[number],
    field: string,
    text: string,
  ) => {
    const next: EntityTranslations = {
      ...value,
      [locale]: { ...(value[locale] ?? {}), [field]: text },
    };
    onChange(next);
  };

  return (
    <div className="rounded-2xl border border-basalt-900/10 bg-sand-50/60 p-4">
      <div className="mb-3 flex items-start gap-2">
        <Languages className="mt-0.5 size-4 shrink-0 text-gold-600" aria-hidden />
        <div>
          <p className="text-sm font-bold text-basalt-900">
            {t("admin.translations")}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-basalt-600/75">
            {t("admin.translationsHint")}
          </p>
        </div>
      </div>

      <Tabs defaultValue={TRANSLATABLE_LOCALES[0]}>
        <TabsList>
          {TRANSLATABLE_LOCALES.map((locale) => (
            <TabsTrigger key={locale} value={locale}>
              <FlagIcon locale={locale} />
              {LOCALE_META[locale].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TRANSLATABLE_LOCALES.map((locale) => (
          <TabsContent key={locale} value={locale} className="mt-4 flex flex-col gap-3">
            {fields.map((field) => {
              const id = `tr-${locale}-${field.name}`;
              const current = value[locale]?.[field.name] ?? "";

              return (
                <div key={field.name} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={id}
                    className="text-xs font-semibold text-basalt-700"
                  >
                    {field.label}
                  </label>

                  {field.multiline ? (
                    <Textarea
                      id={id}
                      dir={LOCALE_META[locale].dir}
                      className="min-h-20"
                      value={current}
                      onChange={(event) =>
                        setField(locale, field.name, event.target.value)
                      }
                    />
                  ) : (
                    <Input
                      id={id}
                      dir={LOCALE_META[locale].dir}
                      value={current}
                      onChange={(event) =>
                        setField(locale, field.name, event.target.value)
                      }
                    />
                  )}
                </div>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/** يزيل الحقول الفارغة حتى لا نخزّن ترجمات بلا محتوى. */
export function pruneTranslations(
  value: EntityTranslations,
): EntityTranslations | undefined {
  const result: EntityTranslations = {};

  for (const locale of TRANSLATABLE_LOCALES) {
    const fields = value[locale];
    if (!fields) continue;

    const cleaned: Record<string, string> = {};
    for (const [field, text] of Object.entries(fields)) {
      if (typeof text === "string" && text.trim()) {
        cleaned[field] = text.trim();
      }
    }

    if (Object.keys(cleaned).length) result[locale] = cleaned;
  }

  return Object.keys(result).length ? result : undefined;
}
