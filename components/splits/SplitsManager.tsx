"use client";

import { CheckCircle2, Circle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { BrutalSelect } from "@/components/ui/BrutalSelect";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodFilter, PeriodState } from "@/components/ui/PeriodFilter";
import { formatDateOnly } from "@/lib/dates";
import { formatCurrency } from "@/lib/utils";

type Split = {
  id: string;
  amount: string;
  status: "PENDING" | "PAID";
  user: { id: string; name: string };
  expense: {
    id: string;
    amount: string;
    date: string;
    description?: string;
    installments: number;
    installmentNum?: number | null;
    installmentRef?: string | null;
    category?: { name: string; color?: string } | null;
    responsible: { id: string; name: string };
  };
};

type SplitPayload = {
  splits: Split[];
  pendingTotal: number;
  paidTotal: number;
};

export function SplitsManager({ groupId }: { groupId: string }) {
  const [data, setData] = useState<SplitPayload>({ splits: [], pendingTotal: 0, paidTotal: 0 });
  const [period, setPeriod] = useState<PeriodState>({ period: "month" });
  const [status, setStatus] = useState("all");
  const [groupBy, setGroupBy] = useState("expense");

  const query = useMemo(() => {
    const params = new URLSearchParams({ period: period.period });
    if (period.period === "custom") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }
    if (status !== "all") {
      params.set("status", status);
    }
    return params.toString();
  }, [period, status]);

  async function load() {
    const response = await fetch(`/api/groups/${groupId}/splits?${query}`);
    const json = await response.json();
    setData(json);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, query]);

  async function toggle(split: Split) {
    const next = split.status === "PAID" ? "PENDING" : "PAID";
    setData((current) => ({
      ...current,
      splits: current.splits.map((item) => item.id === split.id ? { ...item, status: next } : item)
    }));
    await fetch(`/api/groups/${groupId}/splits/${split.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next })
    });
    await load();
  }

  const sortedSplits = [...data.splits].sort((a, b) => {
    const aKey = groupBy === "person" ? a.expense.responsible.name : (a.expense.description ?? "Despesa");
    const bKey = groupBy === "person" ? b.expense.responsible.name : (b.expense.description ?? "Despesa");
    return aKey.localeCompare(bKey, "pt-BR");
  });

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <BrutalBadge color="#FFCCE0">Divisões</BrutalBadge>
          <h1 className="mt-2 font-display text-3xl font-black">Minhas pendências</h1>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <BrutalCard className="p-4" tone="rose">
          <span className="text-xs font-black uppercase">Pendente</span>
          <strong className="money mt-2 block text-2xl font-black">{formatCurrency(data.pendingTotal)}</strong>
        </BrutalCard>
        <BrutalCard className="p-4" tone="mint">
          <span className="text-xs font-black uppercase">Pago</span>
          <strong className="money mt-2 block text-2xl font-black">{formatCurrency(data.paidTotal)}</strong>
        </BrutalCard>
        <label className="grid gap-1 text-xs font-black uppercase">
          Status
          <BrutalSelect value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Todos</option>
            <option value="PENDING">Pendentes</option>
            <option value="PAID">Pagos</option>
          </BrutalSelect>
        </label>
        <label className="grid gap-1 text-xs font-black uppercase">
          Agrupar por
          <BrutalSelect value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
            <option value="expense">Despesa</option>
            <option value="person">Pessoa</option>
          </BrutalSelect>
        </label>
      </div>

      {sortedSplits.length === 0 ? <EmptyState title="Nenhuma divisão no período" /> : (
        <div className="grid gap-3">
          {sortedSplits.map((split) => (
            <BrutalCard key={split.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex flex-wrap gap-2">
                  <BrutalBadge color={split.status === "PAID" ? "#B8F0D4" : "#FFD6C0"}>{split.status === "PAID" ? "Pago" : "Pendente"}</BrutalBadge>
                  <BrutalBadge color="#C2E4FF">Pagar para {split.expense.responsible.name}</BrutalBadge>
                  <BrutalBadge color={split.expense.category?.color ?? "#D4C5F9"}>{split.expense.category?.name ?? "Sem categoria"}</BrutalBadge>
                  {split.expense.installments > 1 && split.expense.installmentNum ? (
                    <BrutalBadge color="#FFF0A0">Parcela {split.expense.installmentNum}/{split.expense.installments}</BrutalBadge>
                  ) : null}
                </div>
                <p className="mt-2 font-black">{split.expense.description || "Despesa"}</p>
                <p className="text-sm font-bold">{formatDateOnly(split.expense.date)}</p>
              </div>
              <div className="flex items-center gap-3">
                <strong className="money text-xl font-black">{formatCurrency(split.amount)}</strong>
                <BrutalButton aria-label="Alternar status" className="h-9 w-9 px-0" variant={split.status === "PAID" ? "secondary" : "primary"} onClick={() => toggle(split)}>
                  {split.status === "PAID" ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </BrutalButton>
              </div>
            </BrutalCard>
          ))}
        </div>
      )}
    </div>
  );
}
