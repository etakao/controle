import { BrutalDatePicker } from "@/components/ui/BrutalDatePicker";

type BrutalDateRangePickerProps = {
  from?: string;
  to?: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
};

export function BrutalDateRangePicker({ from, to, onFromChange, onToChange }: BrutalDateRangePickerProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="grid gap-1 text-xs font-black uppercase">
        De
        <BrutalDatePicker value={from ?? ""} onChange={(event) => onFromChange(event.target.value)} />
      </label>
      <label className="grid gap-1 text-xs font-black uppercase">
        Até
        <BrutalDatePicker value={to ?? ""} onChange={(event) => onToChange(event.target.value)} />
      </label>
    </div>
  );
}
