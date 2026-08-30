import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PickerOption {
  id: number;
  label: string;
  hint?: string;
}

/**
 * اختيار متعدّد بصري — يُستخدم لإرفاق الأماكن والتحديات والطوابع والشركاء
 * بالكتيّب. أوضح من قائمة multiple التقليدية وأسهل على الجوال.
 */
export function MultiPicker({
  options,
  selected,
  onChange,
  emptyLabel,
}: {
  options: PickerOption[];
  selected: number[];
  onChange: (next: number[]) => void;
  emptyLabel: string;
}) {
  if (!options.length) {
    return (
      <p className="rounded-2xl bg-sand-100 px-4 py-3 text-xs text-basalt-600/75">
        {emptyLabel}
      </p>
    );
  }

  const toggle = (id: number) => {
    onChange(
      selected.includes(id)
        ? selected.filter((item) => item !== id)
        : [...selected, id],
    );
  };

  return (
    <div className="max-h-56 overflow-y-auto rounded-2xl border border-basalt-900/10 bg-white p-1.5">
      <ul className="flex flex-col gap-1">
        {options.map((option) => {
          const active = selected.includes(option.id);
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => toggle(option.id)}
                aria-pressed={active}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm transition-colors",
                  active
                    ? "bg-gold-500/15 text-basalt-900"
                    : "text-basalt-700 hover:bg-sand-100",
                )}
              >
                <span
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-md border transition-colors",
                    active
                      ? "border-gold-600 bg-gold-500 text-basalt-950"
                      : "border-basalt-900/20 bg-white",
                  )}
                >
                  {active ? <Check className="size-3.5" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {option.label}
                  </span>
                  {option.hint ? (
                    <span className="block truncate text-xs text-basalt-600/70">
                      {option.hint}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
