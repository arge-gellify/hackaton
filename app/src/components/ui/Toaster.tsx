import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export function Toaster() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);
  return (
    <ul
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 list-none p-0 m-0"
    >
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
        const color = t.kind === 'success' ? 'text-success' : t.kind === 'error' ? 'text-danger' : 'text-primary';
        return (
          <li
            key={t.id}
            role={t.kind === 'error' ? 'alert' : 'status'}
            className="panel-raised flex items-start gap-3 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2"
          >
            <Icon size={16} className={`${color} mt-0.5 shrink-0`} aria-hidden="true" />
            <p className="text-sm text-text flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-text-dim hover:text-text" aria-label="Dismiss notification">
              <X size={14} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
