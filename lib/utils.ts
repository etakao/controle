import { clsx, type ClassValue } from "clsx";
import { endOfISODate, monthRangeUTC, parseISODate, todayUTC } from "@/lib/dates";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(Number(value));
}

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value));
}

export type PeriodPreset = "month" | "custom";

export function getPeriodRange(searchParams: URLSearchParams) {
  const period = (searchParams.get("period") ?? "month") as PeriodPreset;
  const today = todayUTC();

  if (period === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const month = monthRangeUTC(today);

    return {
      from: from ? parseISODate(from) : month.from,
      to: to ? endOfISODate(to) : month.to
    };
  }

  return monthRangeUTC(today);
}

export const pastelPalette = ["#D4C5F9", "#B8F0D4", "#FFD6C0", "#FFF0A0", "#C2E4FF", "#FFCCE0"];

/**
 * Resolves the amount of each split entry. Entries with a custom amount keep it; the
 * remaining value is divided equally among the other entries, and the rounding
 * remainder (e.g. R$ 10,00 / 3) goes to the first of them so the parts sum to the total.
 */
export function resolveSplitAmounts(total: number, entries: { amount?: number }[]) {
  const customCents = entries.reduce((sum, entry) => sum + Math.round((entry.amount ?? 0) * 100), 0);
  const autoCount = entries.filter((entry) => entry.amount === undefined).length;
  const remainingCents = Math.max(Math.round(total * 100) - customCents, 0);
  const shareCents = autoCount ? Math.floor(remainingCents / autoCount) : 0;
  let extraCents = remainingCents - shareCents * autoCount;

  return entries.map((entry) => {
    if (entry.amount !== undefined) return entry.amount;
    const cents = shareCents + extraCents;
    extraCents = 0;
    return cents / 100;
  });
}
