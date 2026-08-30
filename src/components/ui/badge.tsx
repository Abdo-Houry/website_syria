import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold [&_svg]:size-3.5",
  {
    variants: {
      variant: {
        neutral: "bg-sand-100 text-basalt-700",
        gold: "bg-gold-500/18 text-gold-700",
        success: "bg-basalt-400/18 text-basalt-600",
        danger: "bg-clay-500/15 text-clay-500",
        outline: "border border-basalt-900/15 text-basalt-700",
        dark: "bg-basalt-900/85 text-sand-50 backdrop-blur-sm",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
