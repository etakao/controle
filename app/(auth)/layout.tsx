import { KeyboardAwareScroll } from "@/components/layout/KeyboardAwareScroll";
import { Logo } from "@/components/layout/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center px-4 py-10">
      <KeyboardAwareScroll />
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Logo size={88} />
          <p className="mt-2 text-sm font-bold">Suas finanças, no controle.</p>
        </div>
        {children}
      </div>
    </main>
  );
}
