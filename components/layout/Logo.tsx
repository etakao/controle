import Image from "next/image";
import { cn } from "@/lib/utils";

export function Logo({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <Image
      alt="Controlê"
      className={cn("inline-block", className)}
      height={size}
      priority
      src="/icons/icon-192.png"
      width={size}
    />
  );
}
