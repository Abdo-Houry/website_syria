import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Inbox, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/locale-context";
import { cn } from "@/lib/utils";

/** حالة فارغة أنيقة بدل جدول فارغ. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl2)] border border-dashed border-basalt-900/12 bg-white/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-sand-100 text-basalt-600/70">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-basalt-900">{title}</h3>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-basalt-600/80">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

/** حالة خطأ مع إمكانية إعادة المحاولة — تميّز خطأ الشبكة عن خطأ الخادم. */
export function ErrorState({
  message,
  onRetry,
  isNetwork,
  className,
}: {
  message: string;
  onRetry?: () => void;
  isNetwork?: boolean;
  className?: string;
}) {
  const t = useT();
  const Icon = isNetwork ? WifiOff : AlertTriangle;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-[var(--radius-xl2)] border border-clay-500/25 bg-clay-500/6 px-6 py-12 text-center",
        className,
      )}
    >
      <span className="grid size-14 place-items-center rounded-full bg-clay-500/12 text-clay-500">
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="text-base font-bold text-basalt-900">
        {isNetwork ? t("state.networkTitle") : t("state.errorTitle")}
      </h3>
      <p className="max-w-sm text-sm leading-relaxed text-basalt-700">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
          <RefreshCw />
          {t("common.retry")}
        </Button>
      ) : null}
    </div>
  );
}
