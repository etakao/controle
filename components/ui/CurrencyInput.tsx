"use client";

import { BrutalInput } from "@/components/ui/BrutalInput";
import { cn, formatCurrency } from "@/lib/utils";

const MAX_DIGITS = 13;

type CurrencyInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "type" | "inputMode" | "value" | "onChange"
> & {
  /** Valor decimal em string (ex.: "1234.56") ou "" quando vazio. */
  value: string | number;
  onValueChange: (value: string) => void;
};

export function CurrencyInput({ value, onValueChange, className, ...props }: CurrencyInputProps) {
  const display = value === "" || value === null || value === undefined ? "" : formatCurrency(value);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const digits = event.target.value.replace(/\D/g, "").replace(/^0+/, "").slice(0, MAX_DIGITS);
    onValueChange(digits ? (Number(digits) / 100).toFixed(2) : "");
  }

  return (
    <BrutalInput
      autoComplete="off"
      className={cn("money", className)}
      inputMode="numeric"
      placeholder="R$ 0,00"
      type="text"
      value={display}
      onChange={handleChange}
      {...props}
    />
  );
}
