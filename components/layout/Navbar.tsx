import { UserRound } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { getCurrentUser } from "@/lib/auth";
import { NavbarMenuButton } from "@/components/layout/NavbarMenuButton";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-ink bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <NavbarMenuButton />
          <Link className="focus-visible:brutal-focus" href="/">
            <Logo />
          </Link>
        </div>
        <div className="flex min-w-0 items-center gap-2 rounded-brutal border-2 border-ink bg-white px-3 py-2 shadow-brutal">
          <UserRound className="shrink-0" size={16} />
          <span className="max-w-24 truncate text-sm font-black sm:max-w-32">{user?.name ?? "Controlê"}</span>
        </div>
      </div>
    </header>
  );
}
