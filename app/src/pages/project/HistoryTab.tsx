import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { fmtDate, fmtRel } from '../../lib/format';
import type { RetroStatus } from '../../domain/types';

export function HistoryTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const allRetros = useAppStore((s) => s.retros);
  const retros = useMemo(
    () => allRetros.filter((r) => r.projectId === projectId),
    [allRetros, projectId]
  );
  const reports = useAppStore((s) => s.reports);

  const [statusFilter, setStatusFilter] = useState<'all' | RetroStatus>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const visible = useMemo(() => {
    return retros
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => !from || r.createdAt >= from)
      .filter((r) => !to || r.createdAt <= `${to}T23:59:59`)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [retros, statusFilter, from, to]);

  return (
    <div>
      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-2">
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | RetroStatus)}
          aria-label="Filter timeline by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <span className="text-xs text-text-muted" aria-hidden="true">From</span>
        <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <span className="text-xs text-text-muted" aria-hidden="true">To</span>
        <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-text-muted">
          <Clock className="mx-auto text-text-dim mb-3" />
          No retros to show in this range.
        </div>
      ) : (
        <ol className="relative border-l-2 border-surface-border pl-6 space-y-5">
          {visible.map((r) => {
            const totalVotes = r.cards.reduce((acc, c) => acc + c.votes.length, 0);
            const totalAi = r.cards.reduce((acc, c) => acc + c.actionItems.length, 0);
            const report = reports.find((rep) => rep.retroId === r.id);
            return (
              <li key={r.id} className="relative">
                <span aria-hidden="true" className={`absolute -left-[33px] top-2 inline-flex w-4 h-4 rounded-full border-2 border-surface ${r.status === 'active' ? 'bg-success' : 'bg-text-dim'}`} />
                <div className="panel p-4 hover:border-primary/40 transition-colors">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link to={`/projects/${projectId}/retros/${r.id}`} className="font-semibold hover:text-primary">{r.title}</Link>
                    <span className={r.status === 'active' ? 'badge-success' : 'badge-neutral'}>
                      {r.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                    {report && (
                      <Link to={`/projects/${projectId}/reports/${report.id}`} className="badge-primary">
                        <FileText size={10} /> Report
                      </Link>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-2">{fmtDate(r.createdAt)} • {fmtRel(r.createdAt)}</p>
                  <div className="flex items-center gap-4 text-xs text-text-muted">
                    <span><strong className="text-text">{r.cards.length}</strong> cards</span>
                    <span><strong className="text-text">{totalVotes}</strong> votes</span>
                    <span><strong className="text-text">{totalAi}</strong> actions</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
