"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useEffect, useMemo, useState } from "react";
import { BrutalBadge } from "@/components/ui/BrutalBadge";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PeriodFilter, PeriodState } from "@/components/ui/PeriodFilter";
import { formatCurrency } from "@/lib/utils";

type CategoryPoint = { name: string; value: number; color: string };
type MonthlyPoint = { month: string; income: number; expense: number; balance: number };
type ChartPayload = {
  expensesByCategory: CategoryPoint[];
  monthly: MonthlyPoint[];
  balanceLine: { month: string; balance: number }[];
  totals: { income: number; expense: number; balance: number };
};

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-brutal border-2 border-ink bg-white p-3 text-sm font-black shadow-brutal">
      {label ? <p>{label}</p> : null}
      {payload.map((item) => (
        <p key={item.name}>{item.name}: {formatCurrency(item.value)}</p>
      ))}
    </div>
  );
}

export function ChartsPanel({ groupId }: { groupId: string }) {
  const [period, setPeriod] = useState<PeriodState>({ period: "month" });
  const [data, setData] = useState<ChartPayload | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ period: period.period });
    if (period.period === "custom") {
      if (period.from) params.set("from", period.from);
      if (period.to) params.set("to", period.to);
    }
    return params.toString();
  }, [period]);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/charts?${query}`)
      .then((response) => response.json())
      .then(setData);
  }, [groupId, query]);

  if (!data) {
    return <EmptyState title="Carregando gráficos" />;
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <BrutalBadge color="#C2E4FF">Gráficos</BrutalBadge>
          <h1 className="mt-2 font-display text-3xl font-black">Leitura visual do dinheiro</h1>
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <BrutalCard className="p-4" tone="mint">
          <span className="text-xs font-black uppercase">Receitas</span>
          <strong className="money mt-2 block text-2xl font-black">{formatCurrency(data.totals.income)}</strong>
        </BrutalCard>
        <BrutalCard className="p-4" tone="peach">
          <span className="text-xs font-black uppercase">Despesas</span>
          <strong className="money mt-2 block text-2xl font-black">{formatCurrency(data.totals.expense)}</strong>
        </BrutalCard>
        <BrutalCard className="p-4" tone="butter">
          <span className="text-xs font-black uppercase">Saldo</span>
          <strong className="money mt-2 block text-2xl font-black">{formatCurrency(data.totals.balance)}</strong>
        </BrutalCard>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <BrutalCard className="p-4">
          <h2 className="font-display text-xl font-black">Despesas por categoria</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer height="100%" width="100%">
              <PieChart>
                <Pie data={data.expensesByCategory} dataKey="value" innerRadius={70} outerRadius={115} stroke="#1a1a1a" strokeWidth={2}>
                  {data.expensesByCategory.map((item) => <Cell key={item.name} fill={item.color} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </BrutalCard>

        <BrutalCard className="p-4">
          <h2 className="font-display text-xl font-black">Receitas vs despesas</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={data.monthly}>
                <CartesianGrid stroke="#1a1a1a" strokeDasharray="0" />
                <XAxis dataKey="month" stroke="#1a1a1a" />
                <YAxis stroke="#1a1a1a" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="income" fill="#B8F0D4" name="Receitas" stroke="#1a1a1a" strokeWidth={2} />
                <Bar dataKey="expense" fill="#FFD6C0" name="Despesas" stroke="#1a1a1a" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </BrutalCard>

        <BrutalCard className="p-4 xl:col-span-2">
          <h2 className="font-display text-xl font-black">Evolução do saldo</h2>
          <div className="mt-4 h-80">
            <ResponsiveContainer height="100%" width="100%">
              <LineChart data={data.balanceLine}>
                <CartesianGrid stroke="#1a1a1a" strokeDasharray="0" />
                <XAxis dataKey="month" stroke="#1a1a1a" />
                <YAxis stroke="#1a1a1a" />
                <Tooltip content={<CustomTooltip />} />
                <Line dataKey="balance" name="Saldo" stroke="#D4C5F9" strokeWidth={4} type="monotone" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </BrutalCard>
      </div>
    </div>
  );
}
