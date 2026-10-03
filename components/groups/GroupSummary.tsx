'use client';

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  SplitSquareHorizontal,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BrutalBadge } from '@/components/ui/BrutalBadge';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { PeriodFilter, PeriodState } from '@/components/ui/PeriodFilter';
import { formatDateOnly } from '@/lib/dates';
import { formatCurrency } from '@/lib/utils';

type TimelineItem = {
  id: string;
  kind: 'income' | 'expense';
  amount: string;
  date: string;
  description?: string;
  category?: { name: string; color?: string } | null;
  responsible: { name: string };
};

type SummaryData = {
  timeline: TimelineItem[];
  summary: {
    incomeTotal: number;
    expenseTotal: number;
    balance: number;
    pendingSplitTotal: number;
  };
};

export function GroupSummary({ groupId }: { groupId: string }) {
  const [period, setPeriod] = useState<PeriodState>({ period: 'month' });
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const query = useMemo(() => {
    const params = new URLSearchParams({ period: period.period });
    if (period.period === 'custom') {
      if (period.from) params.set('from', period.from);
      if (period.to) params.set('to', period.to);
    }
    return params.toString();
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/groups/${groupId}/summary?${query}`)
      .then((response) => response.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [groupId, query]);

  if (loading || !data) {
    return <LoadingSkeleton />;
  }

  const cards = [
    {
      label: 'Receitas',
      value: data.summary.incomeTotal,
      icon: ArrowUpCircle,
      tone: 'mint' as const,
    },
    {
      label: 'Despesas',
      value: data.summary.expenseTotal,
      icon: ArrowDownCircle,
      tone: 'peach' as const,
    },
    {
      label: 'Saldo',
      value: data.summary.balance,
      icon: Scale,
      tone: 'butter' as const,
    },
    {
      label: 'Divisões pendentes',
      value: data.summary.pendingSplitTotal,
      icon: SplitSquareHorizontal,
      tone: 'rose' as const,
    },
  ];

  return (
    <div className='grid min-w-0 gap-5'>
      <div className='flex min-w-0 flex-col justify-between gap-4 sm:flex-row sm:items-end'>
        <div>
          <BrutalBadge color='#D4C5F9'>Extrato</BrutalBadge>
          <h1 className='mt-2 font-display text-3xl font-black'>
            Resumo do grupo
          </h1>
        </div>
        <PeriodFilter
          value={period}
          onChange={setPeriod}
        />
      </div>

      <div className='grid gap-3 md:grid-cols-4'>
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <BrutalCard
              key={card.label}
              className='p-4'
              tone={card.tone}
            >
              <div className='flex items-center justify-between'>
                <span className='text-xs font-black uppercase'>
                  {card.label}
                </span>
                <Icon size={18} />
              </div>
              <strong className='money mt-3 block text-2xl font-black'>
                {formatCurrency(card.value)}
              </strong>
            </BrutalCard>
          );
        })}
      </div>

      {data.timeline.length === 0 ? (
        <EmptyState title='Sem movimentos no período' />
      ) : (
        <div className='grid gap-3'>
          {data.timeline.map((item) => (
            <BrutalCard
              key={`${item.kind}-${item.id}`}
              className='flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center'
            >
              <div className='min-w-0'>
                <div className='flex flex-wrap items-center gap-2'>
                  <BrutalBadge
                    color={item.kind === 'income' ? '#B8F0D4' : '#FFD6C0'}
                  >
                    {item.kind === 'income' ? 'Receita' : 'Despesa'}
                  </BrutalBadge>
                  {item.category ? (
                    <BrutalBadge color={item.category.color ?? '#D4C5F9'}>
                      {item.category.name}
                    </BrutalBadge>
                  ) : null}
                </div>
                <p className='mt-2 truncate font-black'>
                  {item.description || 'Sem descrição'}
                </p>
                <p className='text-sm font-bold'>
                  {formatDateOnly(item.date)} · {item.responsible.name}
                </p>
              </div>
              <strong className='money text-xl font-black'>
                {formatCurrency(item.amount)}
              </strong>
            </BrutalCard>
          ))}
        </div>
      )}
    </div>
  );
}

