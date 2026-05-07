import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, CheckCircle2, Edit3, Lock } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTemplate } from '../../domain/templates';
import { Tooltip } from '../../components/ui/Tooltip';
import { can } from '../../domain/permissions';
import { fmtDate } from '../../lib/format';
import { buildReportPdf } from '../../features/export/reportPdf';
import { slugify } from '../../lib/cn';

export function ReportPage() {
  const { projectId, reportId } = useParams<{ projectId: string; reportId: string }>();
  const navigate = useNavigate();
  const report = useAppStore((s) => s.reports.find((r) => r.id === reportId));
  const retro = useAppStore((s) => s.retros.find((r) => r.id === report?.retroId));
  const users = useAppStore((s) => s.users);
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const updateReportSummary = useAppStore((s) => s.updateReportSummary);
  const setReportFinal = useAppStore((s) => s.setReportFinal);
  const pushToast = useAppStore((s) => s.pushToast);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(report?.summary ?? '');

  if (!report || !retro) {
    return <p className="text-text-muted">Report not found.</p>;
  }

  const tpl = getTemplate(retro.templateId);
  const canEdit = can(role, 'edit_report_summary') && !report.isFinal;
  const canFinal = can(role, 'mark_report_final');

  const onDownload = () => {
    const doc = buildReportPdf(report, retro, users);
    const name = `${slugify(retro.title)}-report.pdf`;
    doc.save(name);
    pushToast({ kind: 'success', message: 'PDF downloaded' });
  };

  return (
    <div>
      <button onClick={() => navigate(`/projects/${projectId}/reports`)} className="btn-ghost -ml-2 mb-3 text-xs">
        <ChevronLeft size={14} /> All reports
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">{retro.title}</h2>
            <span className={report.isFinal ? 'badge-success' : 'badge-warning'}>
              {report.isFinal ? 'Final' : 'Draft'}
            </span>
            {report.isFinal && <span className="badge-neutral"><Lock size={10} /> Locked</span>}
          </div>
          <p className="text-xs text-text-muted">Report • Generated {fmtDate(report.generatedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip label={canFinal ? undefined : 'Scrum Master / Admin only'}>
            <button
              onClick={() => { setReportFinal(report.id, !report.isFinal); pushToast({ kind: 'info', message: report.isFinal ? 'Unmarked Final' : 'Marked Final' }); }}
              disabled={!canFinal}
              className="btn-secondary"
            >
              <CheckCircle2 size={14} /> {report.isFinal ? 'Unmark Final' : 'Mark Final'}
            </button>
          </Tooltip>
          <button onClick={onDownload} className="btn-primary">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {tpl.columns.map((col) => {
          const top = retro.cards
            .filter((c) => c.columnKey === col.key)
            .sort((a, b) => b.votes.length - a.votes.length)
            .slice(0, 3);
          return (
            <div key={col.key} className="panel p-4">
              <h3 className="font-semibold mb-3">{col.title} — top {top.length}</h3>
              {top.length === 0 ? (
                <p className="text-sm text-text-dim">No cards</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {top.map((c) => (
                    <li key={c.id} className="flex items-start gap-2.5">
                      <span className="badge-primary mt-0.5">{c.votes.length}</span>
                      <span className="text-sm">{c.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <div className="panel p-4 mb-4">
        <h3 className="font-semibold mb-3">Action items rollup</h3>
        <div className="grid grid-cols-3 gap-3">
          {(['open', 'in_progress', 'done'] as const).map((s) => {
            const items = retro.cards.flatMap((c) => c.actionItems).filter((ai) => ai.status === s);
            return (
              <div key={s} className="panel-raised p-3">
                <p className="label mb-1.5">{s.replace('_', ' ')}</p>
                <p className="text-2xl font-semibold">{items.length}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Summary</h3>
          {canEdit && !editing && (
            <button onClick={() => { setEditing(true); setDraft(report.summary); }} className="btn-ghost btn-sm">
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              className="input h-48 py-2 font-mono text-xs"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Markdown supported"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
              <button
                onClick={() => { updateReportSummary(report.id, draft); setEditing(false); pushToast({ kind: 'success', message: 'Summary saved' }); }}
                className="btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        ) : report.summary ? (
          <pre className="whitespace-pre-wrap text-sm text-text leading-relaxed font-sans">{report.summary}</pre>
        ) : (
          <p className="text-sm text-text-dim italic">
            No summary yet.{canEdit ? ' Click Edit to add one.' : ''}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Link to={`/projects/${projectId}/retros/${retro.id}`} className="text-sm text-primary hover:underline">
          View source retro →
        </Link>
      </div>
    </div>
  );
}
