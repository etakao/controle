'use client';

import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toLocalISODate } from '@/lib/dates';
import { BrutalButton } from '@/components/ui/BrutalButton';
import { BrutalDateRangePicker } from '@/components/ui/BrutalDateRangePicker';
import { BrutalSelect } from '@/components/ui/BrutalSelect';

export type PeriodState = {
  period: 'month' | 'custom';
  from?: string;
  to?: string;
};

type PeriodFilterProps = {
  value: PeriodState;
  onChange: (value: PeriodState) => void;
};

function toISODate(date: Date) {
  return toLocalISODate(date);
}

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  const now = new Date();

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(now, i + 1);
    return {
      label: format(date, 'MMMM yyyy', { locale: ptBR }),
      from: toISODate(startOfMonth(date)),
      to: toISODate(endOfMonth(date)),
    };
  });

  const prevMonthFrom = toISODate(startOfMonth(subMonths(now, 1)));
  const prevMonthTo = toISODate(endOfMonth(subMonths(now, 1)));
  const isPrevMonth =
    value.period === 'custom' &&
    value.from === prevMonthFrom &&
    value.to === prevMonthTo;

  const selectedMonthValue = last6Months.find(
    (m) =>
      value.period === 'custom' && value.from === m.from && value.to === m.to,
  );

  return (
    <div className='grid gap-3'>
      <div className='flex flex-wrap gap-2'>
        <BrutalButton
          className='min-h-9 px-3 py-1 text-xs'
          variant={value.period === 'month' ? 'primary' : 'ghost'}
          onClick={() => onChange({ period: 'month' })}
        >
          Mês atual
        </BrutalButton>
        <BrutalButton
          className='min-h-9 px-3 py-1 text-xs'
          variant={isPrevMonth ? 'primary' : 'ghost'}
          onClick={() =>
            onChange({ period: 'custom', from: prevMonthFrom, to: prevMonthTo })
          }
        >
          Mês anterior
        </BrutalButton>
        <BrutalButton
          className='min-h-9 px-3 py-1 text-xs'
          variant={
            value.period === 'custom' && !isPrevMonth && !selectedMonthValue
              ? 'primary'
              : 'ghost'
          }
          onClick={() => onChange({ period: 'custom' })}
        >
          Personalizado
        </BrutalButton>
      </div>
      {value.period === 'custom' && !isPrevMonth && !selectedMonthValue ? (
        <BrutalDateRangePicker
          from={value.from}
          to={value.to}
          onFromChange={(from) => onChange({ ...value, from })}
          onToChange={(to) => onChange({ ...value, to })}
        />
      ) : null}
    </div>
  );
}

