import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_META,
  isLocale,
  type Locale,
} from "@/i18n/config";
import { ar, type MessageKey, type Messages } from "@/i18n/messages/ar";
import { en } from "@/i18n/messages/en";
import { de } from "@/i18n/messages/de";
import { tr } from "@/i18n/messages/tr";
import {
  interpolate,
  registerTranslator,
  type TranslateValues,
} from "@/i18n/runtime";

const DICTIONARIES: Record<Locale, Messages> = { ar, en, de, tr };

const STORAGE_KEY = "tourist.locale";

export type { TranslateValues };

interface LocaleContextValue {
  locale: Locale;
  dir: "rtl" | "ltr";
  setLocale: (locale: Locale) => void;
  t: (key: MessageKey, values?: TranslateValues) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* التخزين معطّل */
  }

  /* لغة المتصفح إن كانت مدعومة، وإلا العربية. */
  const browser = navigator.language?.slice(0, 2);
  return isLocale(browser) ? browser : DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const dir = LOCALE_META[locale].dir;

  /* اتجاه الصفحة ولغتها يتبعان الاختيار — لازم لـ RTL/LTR الصحيح. */
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* التخزين معطّل */
    }
  }, []);

  const t = useCallback(
    (key: MessageKey, values?: TranslateValues) => {
      const dictionary = DICTIONARIES[locale];
      /* الرجوع إلى العربية عند غياب المفتاح يمنع ظهور مفاتيح خام. */
      const template = dictionary[key] ?? ar[key] ?? key;
      return interpolate(template, values);
    },
    [locale],
  );

  /*
     تسجيل دالة الترجمة لمن هم خارج شجرة React — طبقة الـ HTTP ومعالجات
     الأحداث التي تعرض رسائل الأخطاء عبر `toErrorMessage`.
  */
  useEffect(() => {
    registerTranslator(t);
    return () => registerTranslator(null);
  }, [t]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, dir, setLocale, t }),
    [locale, dir, setLocale, t],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used inside <LocaleProvider>");
  }
  return context;
}

/** اختصار للاستخدام الأكثر شيوعاً. */
export function useT() {
  return useLocale().t;
}
