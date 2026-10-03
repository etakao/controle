'use client';

import { Menu } from 'lucide-react';
import { useMobileSidebar } from './MobileSidebarContext';

export function NavbarMenuButton() {
  const { isOpen, toggle } = useMobileSidebar();
  return (
    <button
      className='flex shrink-0 lg:hidden items-center justify-center rounded-brutal border-2 border-ink bg-white p-2 shadow-brutal transition hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0.5 active:shadow-none'
      onClick={toggle}
      aria-expanded={isOpen}
      aria-label='Abrir menu'
    >
      <Menu size={20} />
    </button>
  );
}
