'use client';

import {
  BarChart3,
  FolderKanban,
  HandCoins,
  Info,
  Landmark,
  ReceiptText,
  SplitSquareHorizontal,
} from 'lucide-react';
import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { segment: '', label: 'Resumo', icon: FolderKanban },
  { segment: 'income', label: 'Receitas', icon: Landmark },
  { segment: 'expenses', label: 'Despesas', icon: ReceiptText },
  { segment: 'splits', label: 'Divisões', icon: SplitSquareHorizontal },
  { segment: 'categories', label: 'Categorias', icon: HandCoins },
  { segment: 'charts', label: 'Gráficos', icon: BarChart3 },
  { segment: 'info', label: 'Informações', icon: Info },
];

export function GroupNav({ groupId }: { groupId: string }) {
  const activeSegment = useSelectedLayoutSegment() ?? '';
  const activeRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeSegment]);

  return (
    <nav className='min-w-0 flex gap-2 overflow-x-auto border-b-2 border-ink p-4'>
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = item.segment === activeSegment;
        return (
          <Link
            key={item.segment}
            ref={isActive ? activeRef : undefined}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'inline-flex min-h-10 shrink-0 items-center gap-2 rounded-brutal border-2 border-ink px-3 py-2 text-sm font-black transition',
              isActive
                ? 'bg-butter shadow-brutal'
                : 'bg-white shadow-brutal hover:-translate-y-0.5',
            )}
            href={`/groups/${groupId}${item.segment ? `/${item.segment}` : ''}`}
          >
            <Icon size={16} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
