import * as React from 'react';
import { cn } from '@/lib/utils';
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      'min-h-12 w-full rounded-md border border-border bg-background px-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-blue',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';
