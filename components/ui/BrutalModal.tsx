"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { BrutalButton } from "@/components/ui/BrutalButton";
import { BrutalCard } from "@/components/ui/BrutalCard";
import { cn } from "@/lib/utils";

type BrutalModalProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  className?: string;
};

export function BrutalModal({ open, title, children, onClose, className }: BrutalModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
      <BrutalCard aria-modal="true" className={cn("max-h-[90vh] w-full max-w-xl overflow-auto p-5", className)} role="dialog">
        <div className="mb-4 flex items-center justify-between gap-4 border-b-2 border-ink pb-3">
          <h2 className="font-display text-xl font-black">{title}</h2>
          <BrutalButton aria-label="Fechar modal" className="h-9 w-9 px-0" variant="ghost" onClick={onClose}>
            <X size={18} />
          </BrutalButton>
        </div>
        {children}
      </BrutalCard>
    </div>
  );
}
