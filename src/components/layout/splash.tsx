import { BrandMark } from "@/components/common/brand-logo";
import { useT } from "@/i18n/locale-context";

/** شاشة انتظار أولية أثناء استعادة الجلسة. */
export function Splash({ label }: { label?: string }) {
  const t = useT();

  return (
    <div className="grid min-h-dvh place-items-center bg-sand-50 pattern-arabesque">
      <div className="flex flex-col items-center gap-4">
        <BrandMark
          tone="dark"
          className="h-20 animate-[pop_0.5s] rounded-3xl px-6"
          wordmarkClassName="h-8"
        />
        <p className="text-sm font-medium text-basalt-600/80">
          {label ?? t("state.preparing")}
        </p>
      </div>
    </div>
  );
}
