import { WifiOff } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { BrutalCard } from "@/components/ui/BrutalCard";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo />
        </div>
        <BrutalCard className="grid gap-4 p-6" tone="butter">
          <div className="flex h-12 w-12 items-center justify-center rounded-brutal border-2 border-ink bg-white shadow-brutal">
            <WifiOff size={22} />
          </div>
          <h1 className="font-display text-2xl font-black">Você está offline</h1>
          <p className="font-bold">
            Não foi possível carregar esta página. Verifique sua conexão e tente novamente.
          </p>
          {/* Link comum (não next/link) para forçar uma navegação completa ao voltar a conexão. */}
          <a
            className="inline-flex min-h-10 items-center justify-center rounded-brutal border-2 border-ink bg-mint px-4 py-2 text-sm font-black shadow-brutal"
            href="/"
          >
            Tentar novamente
          </a>
        </BrutalCard>
      </div>
    </main>
  );
}
