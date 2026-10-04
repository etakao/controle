'use client';

import {
  ChevronDown,
  ChevronUp,
  Home,
  LogOut,
  Plus,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BrutalCard } from '@/components/ui/BrutalCard';
import { GROUPS_CHANGED_EVENT } from '@/lib/groupEvents';
import { requestWithToast } from '@/lib/request';
import { cn } from '@/lib/utils';
import { useMobileSidebar } from './MobileSidebarContext';

type Group = { id: string; name: string };

const linkClass =
  'flex items-center gap-2 rounded-brutal border-2 border-ink px-3 py-2 text-sm font-black transition';
const idleClass =
  'bg-white shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0.5 active:shadow-none';
const activeClass = 'bg-butter shadow-brutal';

export function Sidebar() {
  const pathname = usePathname();
  const activeGroupId = pathname.match(/^\/groups\/([^/]+)/)?.[1];
  const selectedGroupId = activeGroupId && activeGroupId !== 'new' ? activeGroupId : null;
  const [groupsOpen, setGroupsOpen] = useState(Boolean(selectedGroupId));
  const [groups, setGroups] = useState<Group[]>([]);
  const router = useRouter();
  const { isOpen, close } = useMobileSidebar();

  useEffect(() => {
    function loadGroups() {
      fetch('/api/groups')
        .then((r) => r.json())
        .then((data) => setGroups(data.groups ?? []));
    }
    loadGroups();
    window.addEventListener(GROUPS_CHANGED_EVENT, loadGroups);
    return () => window.removeEventListener(GROUPS_CHANGED_EVENT, loadGroups);
  }, []);

  useEffect(() => {
    if (selectedGroupId) setGroupsOpen(true);
  }, [selectedGroupId]);

  async function logout() {
    const loggedOut = await requestWithToast('/api/auth/logout', { method: 'POST' }, {
      success: 'Você saiu da conta.',
      error: 'Não foi possível sair da conta.'
    });
    if (!loggedOut) return;
    router.push('/login');
  }

  const navContent = (
    <div className='flex flex-col gap-2'>
      <Link
        aria-current={pathname === '/' ? 'page' : undefined}
        className={cn(linkClass, pathname === '/' ? activeClass : idleClass)}
        href='/'
        title='Dashboard'
        onClick={close}
      >
        <Home size={16} className='shrink-0' />
        Dashboard
      </Link>

      <div>
        <button
          aria-expanded={groupsOpen}
          className={cn(linkClass, idleClass, 'w-full justify-between', selectedGroupId && 'bg-butter/60')}
          onClick={() => setGroupsOpen((o) => !o)}
          title='Grupos'
        >
          <div className='flex items-center gap-2'>
            <Users size={16} className='shrink-0' />
            Grupos
          </div>
          {groupsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {groupsOpen && groups.length > 0 && (
          <div className='ml-2 mt-2 grid gap-1.5 border-l-2 border-ink pl-2'>
            {groups.map((group) => {
              const isSelected = group.id === selectedGroupId;
              return (
                <Link
                  key={group.id}
                  aria-current={isSelected ? 'page' : undefined}
                  className={cn(
                    'block truncate rounded-brutal border-2 border-ink px-3 py-1.5 text-xs font-black transition',
                    isSelected
                      ? 'bg-butter shadow-brutal'
                      : 'bg-white shadow-brutal hover:-translate-y-0.5',
                  )}
                  href={`/groups/${group.id}`}
                  title={group.name}
                  onClick={close}
                >
                  {group.name}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Link
        aria-current={pathname === '/groups/new' ? 'page' : undefined}
        className={cn(linkClass, pathname === '/groups/new' ? activeClass : idleClass)}
        href='/groups/new'
        title='Novo grupo'
        onClick={close}
      >
        <Plus size={16} className='shrink-0' />
        Novo grupo
      </Link>

      <button
        className={cn(linkClass, idleClass)}
        title='Sair'
        onClick={logout}
      >
        <LogOut size={16} className='shrink-0' />
        Sair
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 lg:hidden ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={close}
      />

      {/* Sidebar: fixed drawer on mobile, sticky in flow on desktop */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 lg:static lg:inset-auto lg:z-auto lg:shrink-0 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <BrutalCard
          className='h-full overflow-y-auto lg:h-auto lg:sticky lg:top-24 p-3'
          tone='sky'
        >
          <button
            className='mb-3 flex items-center justify-center rounded-brutal border-2 border-ink bg-white p-2 shadow-brutal transition hover:-translate-y-0.5 hover:shadow-brutal-lg active:translate-y-0.5 active:shadow-none lg:hidden'
            onClick={close}
            aria-label='Fechar menu'
          >
            <X size={20} />
          </button>
          {navContent}
        </BrutalCard>
      </aside>
    </>
  );
}
