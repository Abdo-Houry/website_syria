import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "h-12 w-full rounded-2xl border border-basalt-900/12 bg-white px-4 text-sm text-basalt-900 shadow-xs outline-none transition-colors",
        "placeholder:text-basalt-600/45",
        "focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15",
        "disabled:cursor-not-allowed disabled:bg-sand-100 disabled:opacity-70",
        "aria-invalid:border-clay-500 aria-invalid:ring-clay-500/15",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-28 w-full resize-y rounded-2xl border border-basalt-900/12 bg-white px-4 py-3 text-sm leading-relaxed text-basalt-900 outline-none transition-colors",
      "placeholder:text-basalt-600/45",
      "focus:border-gold-500 focus:ring-4 focus:ring-gold-500/15",
      "aria-invalid:border-clay-500 aria-invalid:ring-clay-500/15",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
