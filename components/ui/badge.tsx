import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        success:
          "border-transparent bg-green-100 text-green-800 hover:bg-green-200",
        /** Code — seling warna 1: coklat halus. */
        code:
          "border border-[#7f5539]/25 bg-[#e8e0d5]/70 dark:bg-[#7f5539]/20 text-[#5c3d2e] dark:text-[#e8d5c4]",
        /** Code — seling warna 2: slate. */
        codeSlate:
          "border border-slate-300/80 dark:border-slate-500/50 bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-200",
        /** Code — seling warna 3: teal. */
        codeTeal:
          "border border-teal-200 dark:border-teal-500/50 bg-teal-50 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200",
        /** Code — seling warna 4: amber. */
        codeAmber:
          "border border-amber-200 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-200",
        /** Untuk total/count — hijau halus. */
        count:
          "rounded-full border border-emerald-200 dark:border-emerald-500/40 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 px-3 py-1 text-sm font-semibold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/** Variant code untuk seling warna (pakai: CODE_BADGE_VARIANTS[index % 4]). */
export const CODE_BADGE_VARIANTS = ["code", "codeSlate", "codeTeal", "codeAmber"] as const;
export type CodeBadgeVariant = (typeof CODE_BADGE_VARIANTS)[number];

export { Badge, badgeVariants };

