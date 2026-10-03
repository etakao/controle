import { cn } from "@/lib/utils";

type BrutalCardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "white" | "lavender" | "mint" | "peach" | "butter" | "sky" | "rose";
};

const tones = {
  white: "bg-white",
  lavender: "bg-lavender",
  mint: "bg-mint",
  peach: "bg-peach",
  butter: "bg-butter",
  sky: "bg-sky",
  rose: "bg-rose"
};

export function BrutalCard({ className, tone = "white", ...props }: BrutalCardProps) {
  return (
    <div
      className={cn("rounded-brutal border-2 border-ink shadow-brutal", tones[tone], className)}
      {...props}
    />
  );
}
