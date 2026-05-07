import { useState } from 'react';
interface Props { label?: string; children: React.ReactNode }
export function Tooltip({ label, children }: Props) {
  const [open, setOpen] = useState(false);
  if (!label) return <>{children}</>;
  return (
    <span className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>
      {children}
      {open && (
        <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded-md border border-surface-border bg-surface-raised px-2 py-1 text-xs text-text shadow-panel z-40">
          {label}
        </span>
      )}
    </span>
  );
}
