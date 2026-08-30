import { cn, percent } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "gold",
}: {
  value: number;
  className?: string;
  tone?: "gold" | "dark" | "light";
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const bar =
    tone === "gold"
      ? "bg-gradient-to-l from-gold-500 to-gold-300"
      : tone === "dark"
        ? "bg-basalt-900"
        : "bg-sand-50";

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2.5 w-full overflow-hidden rounded-full bg-basalt-900/10",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", bar)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

/** حلقة تقدّم دائرية — تُستخدم في بطاقة الرحلة. */
export function ProgressRing({
  done,
  total,
  size = 112,
  label,
}: {
  done: number;
  total: number;
  size?: number;
  label?: string;
}) {
  const value = percent(done, total);
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-basalt-900/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-gold-500 transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-basalt-900">{value}%</span>
        {label ? (
          <span className="mt-1 text-[11px] font-medium text-basalt-600/70">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
