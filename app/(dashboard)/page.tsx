import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BrutalBadge } from '@/components/ui/BrutalBadge';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCurrentUser } from '@/lib/auth';
import { monthRangeUTC, todayUTC } from '@/lib/dates';
import { prisma } from '@/lib/prisma';
import { formatCurrency } from '@/lib/utils';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.id } } },
    include: {
      _count: { select: { members: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const groupIds = groups.map((g) => g.id);
  const { from: periodStart, to: periodEnd } = monthRangeUTC(todayUTC());

  const [incomeSums, expenseSums] = await Promise.all([
    prisma.income.groupBy({
      by: ['groupId'],
      where: {
        groupId: { in: groupIds },
        date: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ['groupId'],
      where: {
        groupId: { in: groupIds },
        date: { gte: periodStart, lte: periodEnd },
      },
      _sum: { amount: true },
    }),
  ]);

  const incomeByGroup = Object.fromEntries(
    incomeSums.map((r) => [r.groupId, Number(r._sum.amount ?? 0)]),
  );
  const expenseByGroup = Object.fromEntries(
    expenseSums.map((r) => [r.groupId, Number(r._sum.amount ?? 0)]),
  );

  return (
    <div className='grid gap-6 px-4 py-6'>
      <section className='flex flex-col justify-between gap-4 border-b-2 border-ink pb-6 sm:flex-row sm:items-end'>
        <div>
          <BrutalBadge color='#FFF0A0'>Dashboard pessoal</BrutalBadge>
          <h1 className='mt-3 font-display text-4xl font-black'>
            Suas finanças, no controle.
          </h1>
        </div>
      </section>

      {groups.length === 0 ? (
        <EmptyState
          action={
            <Link
              className='inline-flex min-h-10 items-center rounded-brutal border-2 border-ink bg-mint px-4 py-2 text-sm font-black shadow-brutal'
              href='/groups/new'
            >
              Criar primeiro grupo
            </Link>
          }
          description='Crie um grupo pessoal ou compartilhado para começar a registrar receitas, despesas e divisões.'
          title='Nenhum grupo ainda'
        />
      ) : (
        <div className='grid gap-4 md:grid-cols-2'>
          {groups.map((group) => {
            const income = incomeByGroup[group.id] ?? 0;
            const expense = expenseByGroup[group.id] ?? 0;

            return (
              <Link
                key={group.id}
                href={`/groups/${group.id}`}
              >
                <BrutalCard
                  className='grid gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-brutal-lg'
                  tone='white'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div>
                      <h2 className='font-display text-2xl font-black'>
                        {group.name}
                      </h2>
                      {group.description ? (
                        <p className='mt-1 text-sm font-bold'>
                          {group.description}
                        </p>
                      ) : null}
                    </div>
                    <BrutalBadge color='#C2E4FF'>
                      {group._count.members} membros
                    </BrutalBadge>
                  </div>
                  <div className='flex flex-col gap-1.5'>
                    <div className='flex items-center justify-between gap-2 rounded-brutal border-2 border-ink bg-mint px-2 py-1.5'>
                      <span className='text-xs font-black uppercase'>
                        Receitas
                      </span>
                      <span className='money text-xs font-black'>
                        {formatCurrency(income)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between gap-2 rounded-brutal border-2 border-ink bg-peach px-2 py-1.5'>
                      <span className='text-xs font-black uppercase'>
                        Despesas
                      </span>
                      <span className='money text-xs font-black'>
                        {formatCurrency(expense)}
                      </span>
                    </div>
                    <div className='flex items-center justify-between gap-2 rounded-brutal border-2 border-ink bg-butter px-2 py-1.5'>
                      <span className='text-xs font-black uppercase'>
                        Saldo
                      </span>
                      <span className='money text-xs font-black'>
                        {formatCurrency(income - expense)}
                      </span>
                    </div>
                  </div>
                </BrutalCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

