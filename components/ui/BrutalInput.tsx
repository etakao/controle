import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const BrutalInput = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function BrutalInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'min-h-10 w-full rounded-brutal border-2 border-ink bg-white px-3 py-2 text-sm outline-none',
        'focus:shadow-[inset_0_0_0_2px_#1a1a1a,0_2px_0_#1a1a1a]',
        className,
      )}
      {...props}
    />
  );
});

export function BrutalTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'min-h-24 w-full rounded-brutal border-2 border-ink bg-white px-3 py-2 text-sm outline-none',
        'focus:shadow-[inset_0_0_0_2px_#1a1a1a,0_2px_0_#1a1a1a]',
        className,
      )}
      {...props}
    />
  );
}

