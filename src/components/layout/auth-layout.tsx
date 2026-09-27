import { Outlet } from "react-router-dom";
import { BrandLockup } from "@/components/common/brand-logo";
import { LanguageSwitcher } from "@/components/common/language-switcher";
import { useT } from "@/i18n/locale-context";

/** غلاف صفحات المصادقة — بصريات سفر بدل نموذج إداري جاف. */
export function AuthLayout() {
  const t = useT();

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* الجانب البصري */}
      <aside className="relative hidden overflow-hidden bg-basalt-900 lg:block">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(217,164,65,0.55), transparent 45%), radial-gradient(circle at 80% 70%, rgba(74,116,102,0.7), transparent 50%)",
          }}
          aria-hidden
        />
        <div className="absolute inset-0 pattern-arabesque opacity-30" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-12">
          <BrandLockup on="dark" className="h-20" fallbackClassName="h-12 text-gold-400" />

          <div className="max-w-md">
            <h2 className="font-display text-4xl leading-snug text-sand-50">
              {t("app.tagline")}
            </h2>
            <p className="mt-4 text-base leading-loose text-sand-100/75">
              {t("books.activateSubtitle")}
            </p>
          </div>

          <ul className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-sand-100/70">
            <li>• {t("books.chooseJourneyBody")}</li>
          </ul>
        </div>
      </aside>

      {/* النموذج */}
      <main className="flex items-center justify-center bg-sand-50 pattern-arabesque px-5 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="lg:invisible">
              <BrandLockup className="h-11" fallbackClassName="h-7 text-basalt-900" />
            </div>
            <LanguageSwitcher />
          </div>

          <Outlet />
        </div>
      </main>
    </div>
  );
}
