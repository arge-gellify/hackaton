import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export function Toaster() {
  const toasts = useAppStore((s) => s.toasts);
  const dismiss = useAppStore((s) => s.dismissToast);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
        const color = t.kind === 'success' ? 'text-success' : t.kind === 'error' ? 'text-danger' : 'text-primary';
        return (
          <div key={t.id} className="panel-raised flex items-start gap-3 px-3 py-2.5 animate-in fade-in slide-in-from-bottom-2">
            <Icon size={16} className={`${color} mt-0.5 shrink-0`} />
            <p className="text-sm text-text flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-text-dim hover:text-text" aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
