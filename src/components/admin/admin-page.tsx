import { useEffect, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** رأس صفحة إدارية موحّد + ضبط عنوان المتصفح. */
export function AdminPage({
  title,
  description,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} — لوحة الإدارة`;
  }, [title]);

  return (
    <div className="animate-fade-up">
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          {Icon ? (
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-basalt-900 text-gold-300">
              <Icon className="size-5" aria-hidden />
            </span>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold text-basalt-900">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-basalt-600/80">{description}</p>
            ) : null}
          </div>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>

      {children}
    </div>
  );
}
