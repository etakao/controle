import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-mint text-ink hover:bg-butter",
  secondary: "bg-lavender text-ink hover:bg-sky",
  danger: "bg-coral text-ink hover:bg-rose",
  ghost: "bg-white text-ink hover:bg-paper"
};

type BrutalButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function BrutalButton({ className, variant = "primary", type = "button", ...props }: BrutalButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-brutal border-2 border-ink px-4 py-2 text-sm font-black shadow-brutal transition",
        "hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0.5 active:shadow-none focus-visible:brutal-focus",
        "disabled:pointer-events-none disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
