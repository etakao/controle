import { cn } from "@/lib/utils";

type BrutalBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  color?: string;
};

export function BrutalBadge({ className, color = "#D4C5F9", style, ...props }: BrutalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-badge border border-ink px-2 py-1 text-xs font-black uppercase leading-none whitespace-nowrap",
        className
      )}
      style={{ backgroundColor: color, ...style }}
      {...props}
    />
  );
}
