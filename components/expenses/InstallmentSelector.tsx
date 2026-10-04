import { CreditCard } from "lucide-react";
import { BrutalInput } from "@/components/ui/BrutalInput";

type InstallmentSelectorProps = {
  value: number;
  onChange: (value: number) => void;
};

export function InstallmentSelector({ value, onChange }: InstallmentSelectorProps) {
  return (
    <label className="grid gap-1 text-xs font-black uppercase">
      <span className="inline-flex items-center gap-2">
        <CreditCard size={14} />
        Quantidade de parcelas
      </span>
      <BrutalInput
        max={48}
        min={2}
        required
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
