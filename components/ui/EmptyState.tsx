import { WalletCards } from "lucide-react";
import { BrutalCard } from "@/components/ui/BrutalCard";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <BrutalCard className="grid place-items-center gap-3 p-8 text-center" tone="butter">
      <div className="grid h-16 w-16 place-items-center rounded-brutal border-2 border-ink bg-white shadow-brutal">
        <WalletCards size={30} />
      </div>
      <h3 className="font-display text-xl font-black">{title}</h3>
      {description ? <p className="max-w-md text-sm font-bold">{description}</p> : null}
      {action}
    </BrutalCard>
  );
}
