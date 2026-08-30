import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOCALE, isLocale, type Locale } from "@/i18n/config";
import { ar } from "@/i18n/messages/ar";
import { en } from "@/i18n/messages/en";
import { de } from "@/i18n/messages/de";
import { tr } from "@/i18n/messages/tr";

const DICTIONARIES = { ar, en, de, tr };

/**
 * حدود الخطأ مكوّن صنفي فلا يمكنه استخدام الـ hooks، ولأنه قد يعمل بعد
 * انهيار الشجرة كلها (بما فيها مزوّد اللغة) نقرأ اللغة من التخزين مباشرة.
 */
function readLocale(): Locale {
  try {
    const stored = localStorage.getItem("tourist.locale");
    if (isLocale(stored)) return stored;
  } catch {
    /* التخزين معطّل */
  }
  return DEFAULT_LOCALE;
}

interface State {
  error: Error | null;
}

/** يمنع الشاشة البيضاء عند وقوع خطأ غير متوقّع في العرض. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    const messages = DICTIONARIES[readLocale()];

    return (
      <div className="grid min-h-dvh place-items-center bg-sand-50 px-6">
        <div className="flex max-w-md flex-col items-center gap-4 text-center">
          <span className="grid size-16 place-items-center rounded-3xl bg-clay-500/12 text-clay-500">
            <AlertTriangle className="size-8" aria-hidden />
          </span>
          <h1 className="font-display text-3xl text-basalt-900">
            {messages["state.unexpected"]}
          </h1>
          <p className="text-sm leading-relaxed text-basalt-600/85">
            {messages["state.unexpectedBody"]}
          </p>
          <Button size="lg" className="mt-2" onClick={() => window.location.reload()}>
            <RotateCcw />
            {messages["state.reload"]}
          </Button>
        </div>
      </div>
    );
  }
}
