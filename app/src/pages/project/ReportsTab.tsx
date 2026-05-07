import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { fmtDate } from '../../lib/format';

export function ReportsTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const reports = useAppStore((s) => s.reports);
  const retros = useAppStore((s) => s.retros);

  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'final'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const projectRetroIds = useMemo(
    () => retros.filter((r) => r.projectId === projectId).map((r) => r.id),
    [retros, projectId]
  );

  const visible = useMemo(() => {
    return reports
      .filter((rep) => projectRetroIds.includes(rep.retroId))
      .filter((rep) => statusFilter === 'all' || (statusFilter === 'final' ? rep.isFinal : !rep.isFinal))
      .filter((rep) => !from || rep.generatedAt >= from)
      .filter((rep) => !to || rep.generatedAt <= `${to}T23:59:59`)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
  }, [reports, projectRetroIds, statusFilter, from, to]);

  return (
    <div>
      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-2">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'draft' | 'final')}
          aria-label="Filter reports by status"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="final">Final</option>
        </select>
        <span className="text-xs text-text-muted" aria-hidden="true">From</span>
        <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <span className="text-xs text-text-muted" aria-hidden="true">To</span>
        <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-text-muted">
          <FileText className="mx-auto text-text-dim mb-3" />
          No reports yet. Close a retro to generate one.
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((rep) => {
            const retro = retros.find((r) => r.id === rep.retroId);
            return (
              <Link
                key={rep.id}
                to={`/projects/${projectId}/reports/${rep.id}`}
                className="panel p-4 hover:border-primary/40 flex items-center gap-4"
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30">
                  <FileText size={16} className="text-primary" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{retro?.title ?? 'Retro'}</h3>
                    <span className={rep.isFinal ? 'badge-success' : 'badge-warning'}>
                      {rep.isFinal ? 'Final' : 'Draft'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">Generated {fmtDate(rep.generatedAt)}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
