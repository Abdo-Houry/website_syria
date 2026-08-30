import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  icon: Icon,
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
    <div className={cn("mb-5 flex items-end justify-between gap-4", className)}>
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-gold-500/15 text-gold-700">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
        <div>
          <h2 className="font-display text-2xl leading-tight text-basalt-900">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-relaxed text-basalt-600/80">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
