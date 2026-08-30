import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { CountryFlag } from "@/components/common/flag-icon";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useLocale, useT } from "@/i18n/locale-context";
import {
  COUNTRY_CODES,
  findCountry,
  maxDigits,
  nationalDigits,
  phonePlaceholder,
  type CountryCode,
} from "@/lib/country-codes";
import { cn } from "@/lib/utils";

/**
 * حقل رقم الهاتف: منتقي دولة (علم + رمز) وحقل الرقم الوطني.
 *
 * عدد الخانات يتبع الدولة المختارة: `maxLength` يمنع تجاوز أطول صيغة
 * لديها، والتحقّق النهائي في المخطّط يرفض ما لا يطابق إحدى صيغها.
 *
 * قائمة الدول تُفتح في حوار ببحث لا في قائمة منسدلة: 187 دولة لا تُتصفَّح
 * في قائمة، والبحث يقبل الاسم بالعربية أو الإنجليزية أو رمز الاتصال.
 */
export function PhoneField({
  countryIso,
  onCountryChange,
  value,
  onValueChange,
  id = "phone",
  invalid,
  autoComplete = "tel-national",
  disabled,
}: {
  countryIso: string;
  onCountryChange: (iso: string) => void;
  value: string;
  onValueChange: (value: string) => void;
  id?: string;
  invalid?: boolean;
  autoComplete?: string;
  disabled?: boolean;
}) {
  const t = useT();
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");

  const country = findCountry(countryIso);

  const label = (item: CountryCode) =>
    locale === "ar" ? item.name.ar : item.name.en;

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    if (!needle) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (item) =>
        item.name.ar.includes(term.trim()) ||
        item.name.en.toLowerCase().includes(needle) ||
        item.dial.includes(needle) ||
        item.iso.toLowerCase() === needle,
    );
  }, [term]);

  return (
    <>
      <div className="flex gap-2" dir="ltr">
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            setTerm("");
            setOpen(true);
          }}
          aria-label={t("auth.countryCode")}
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-basalt-900/12 bg-white px-3 text-sm font-semibold text-basalt-900 shadow-xs outline-none transition-colors",
            "hover:border-basalt-900/25 focus-visible:border-gold-500 focus-visible:ring-4 focus-visible:ring-gold-500/15",
            "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:opacity-70",
          )}
        >
          <CountryFlag iso={country.iso} />
          <span className="tabular-nums">+{country.dial}</span>
          <ChevronDown className="size-4 text-basalt-600/55" aria-hidden />
        </button>

        <Input
          id={id}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={phonePlaceholder(country)}
          maxLength={maxDigits(country)}
          className="flex-1 tabular-nums"
          aria-invalid={invalid}
          value={value}
          onChange={(event) =>
            /* الأرقام وحدها، وبلا صفر بادئ — نفس ما يُرسل للخادم. */
            onValueChange(
              nationalDigits(event.target.value).slice(0, maxDigits(country)),
            )
          }
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("auth.chooseCountry")}</DialogTitle>
          </DialogHeader>

          <div className="relative px-6 pb-2">
            <Search
              className="pointer-events-none absolute start-10 top-1/2 size-4 -translate-y-1/2 text-basalt-600/45"
              aria-hidden
            />
            <Input
              autoFocus
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder={t("auth.searchCountry")}
              className="ps-11"
              aria-label={t("auth.searchCountry")}
            />
          </div>

          <DialogBody className="pb-6">
            {results.length === 0 ? (
              <p className="py-8 text-center text-sm text-basalt-600/75">
                {t("auth.noCountryMatch")}
              </p>
            ) : (
              <ul className="flex flex-col">
                {results.map((item) => {
                  const active = item.iso === country.iso;
                  return (
                    <li key={item.iso}>
                      <button
                        type="button"
                        onClick={() => {
                          onCountryChange(item.iso);
                          /* تبديل الدولة قد يقصّر الحدّ المسموح. */
                          onValueChange(
                            nationalDigits(value).slice(0, maxDigits(item)),
                          );
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                          active
                            ? "bg-gold-500/12 font-bold text-basalt-900"
                            : "text-basalt-800 hover:bg-sand-100",
                        )}
                      >
                        <CountryFlag iso={item.iso} className="h-4 w-6" />
                        <span className="min-w-0 flex-1 truncate">
                          {label(item)}
                        </span>
                        <span
                          dir="ltr"
                          className="shrink-0 tabular-nums text-basalt-600/70"
                        >
                          +{item.dial}
                        </span>
                        {active ? (
                          <Check className="size-4 shrink-0 text-gold-600" aria-hidden />
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );
}
