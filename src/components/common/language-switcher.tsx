import { FlagIcon } from "@/components/common/flag-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { LOCALES, LOCALE_META, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/** مبدّل اللغة — يغيّر نصوص الواجهة واتجاه الصفحة ولغة المحتوى معاً. */
export function LanguageSwitcher({
  className,
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "dark";
}) {
  const { locale, setLocale } = useLocale();

  return (
    <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
      <SelectTrigger
        aria-label={LOCALE_META[locale].englishLabel}
        className={cn(
          "h-9 w-auto gap-1.5 rounded-full px-3 text-xs font-semibold",
          variant === "dark"
            ? "border-white/20 bg-white/10 text-sand-50 hover:bg-white/15"
            : "border-basalt-900/10 bg-white/80",
          className,
        )}
      >
        <FlagIcon locale={locale} />
        <span>{LOCALE_META[locale].label}</span>
      </SelectTrigger>

      <SelectContent className="min-w-40">
        {LOCALES.map((item) => (
          <SelectItem key={item} value={item}>
            <span className="flex items-center gap-2">
              <FlagIcon locale={item} />
              {LOCALE_META[item].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
