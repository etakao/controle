'use client';

import { createContext, useContext, useState } from 'react';

type MobileSidebarContextType = {
  isOpen: boolean;
  toggle: () => void;
  close: () => void;
};

const MobileSidebarContext = createContext<MobileSidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
});

export function useMobileSidebar() {
  return useContext(MobileSidebarContext);
}

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <MobileSidebarContext.Provider
      value={{
        isOpen,
        toggle: () => setIsOpen((o) => !o),
        close: () => setIsOpen(false),
      }}
    >
      {children}
    </MobileSidebarContext.Provider>
  );
}
