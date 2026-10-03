"use client";

import { useMemo } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalInput } from "@/components/ui/BrutalInput";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { formatCurrency, resolveSplitAmounts } from "@/lib/utils";

type Member = {
  user: {
    id: string;
    name: string;
  };
};

export type SplitEntry = { userId: string; amount?: number };

type SplitDividerProps = {
  members: Member[];
  selected: SplitEntry[];
  amount: number;
  onChange: (entries: SplitEntry[]) => void;
};

export function SplitDivider({ members, selected, amount, onChange }: SplitDividerProps) {
  const resolvedAmounts = useMemo(() => resolveSplitAmounts(amount, selected), [amount, selected]);

  const total = useMemo(() => {
    return resolvedAmounts.reduce((sum, value) => sum + value, 0);
  }, [resolvedAmounts]);

  const hasCustomAmounts = selected.some((e) => e.amount !== undefined);

  function toggle(userId: string, checked: boolean) {
    if (checked) {
      onChange([...selected, { userId }]);
    } else {
      onChange(keepOneAutomatic(selected.filter((e) => e.userId !== userId)));
    }
  }

  function setAmount(userId: string, rawValue: string) {
    const parsed = Number(rawValue.replace(",", "."));
    const amount = isNaN(parsed) ? undefined : parsed;
    // Edited entry goes last, so the oldest edit is the first to become automatic again
    const others = keepOneAutomatic(selected.filter((e) => e.userId !== userId));
    onChange([...others, { userId, amount }]);
  }

  function resetEqual() {
    onChange(selected.map((e) => ({ userId: e.userId })));
  }

  return (
    <div className="grid gap-3 rounded-brutal border-2 border-ink bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-black uppercase">Divisão da despesa</span>
        <div className="flex flex-wrap gap-2">
          {hasCustomAmounts ? (
            <BrutalButton className="min-h-0 px-2 py-1 text-xs" type="button" variant="ghost" onClick={resetEqual}>
              Dividir igualmente
            </BrutalButton>
          ) : selected.length ? (
            <BrutalBadge color="#B8F0D4">{formatCurrency(resolvedAmounts[resolvedAmounts.length - 1])} por pessoa (igual)</BrutalBadge>
          ) : null}
          {Math.abs(total - amount) > 0.005 ? (
            <BrutalBadge color="#FFD6C0">Total dividido: {formatCurrency(total)}</BrutalBadge>
          ) : null}
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {members.map((member) => {
          const entryIndex = selected.findIndex((e) => e.userId === member.user.id);
          const isSelected = entryIndex !== -1;
          return (
            <div key={member.user.id} className="flex items-center gap-2">
              <BrutalInput
                checked={isSelected}
                className="h-5 min-h-0 w-5 shrink-0"
                type="checkbox"
                onChange={(e) => toggle(member.user.id, e.target.checked)}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-bold">{member.user.name}</span>
              {isSelected ? (
                <CurrencyInput
                  className="w-32"
                  value={String(resolvedAmounts[entryIndex])}
                  onValueChange={(value) => setAmount(member.user.id, value)}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Keeps at least one entry without a custom amount so it absorbs the remaining value. */
function keepOneAutomatic(entries: SplitEntry[]) {
  if (!entries.length || entries.some((e) => e.amount === undefined)) return entries;
  return [{ userId: entries[0].userId }, ...entries.slice(1)];
}
