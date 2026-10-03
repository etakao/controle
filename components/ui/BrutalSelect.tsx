import { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function BrutalSelect({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "min-h-10 w-full rounded-brutal border-2 border-ink bg-white px-3 py-2 text-sm font-bold outline-none",
        "focus:shadow-[inset_0_0_0_2px_#1a1a1a,0_2px_0_#1a1a1a]",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
