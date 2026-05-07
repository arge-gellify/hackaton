import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, KanbanSquare } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { TEMPLATES, getTemplate } from '../../domain/templates';
import { Modal } from '../../components/ui/Modal';
import { Tooltip } from '../../components/ui/Tooltip';
import { can } from '../../domain/permissions';
import { fmtDate, fmtRel } from '../../lib/format';
import type { RetroStatus } from '../../domain/types';

export function RetrosTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const allRetros = useAppStore((s) => s.retros);
  const retros = useMemo(
    () => allRetros.filter((r) => r.projectId === projectId),
    [allRetros, projectId]
  );
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const createRetro = useAppStore((s) => s.createRetro);
  const pushToast = useAppStore((s) => s.pushToast);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [voteBudget, setVoteBudget] = useState(3);

  const [statusFilter, setStatusFilter] = useState<'all' | RetroStatus>('all');
  const [tplFilter, setTplFilter] = useState<'all' | string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const visible = useMemo(() => {
    return retros
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => tplFilter === 'all' || r.templateId === tplFilter)
      .filter((r) => !from || r.createdAt >= from)
      .filter((r) => !to || r.createdAt <= `${to}T23:59:59`)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [retros, statusFilter, tplFilter, from, to]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    const id = createRetro({ projectId, title: title.trim(), templateId, voteBudgetPerUser: voteBudget });
    setOpen(false);
    setTitle(''); setVoteBudget(3);
    pushToast({ kind: 'success', message: 'Retro created' });
    navigate(`/projects/${projectId}/retros/${id}`);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 panel p-3 mb-4">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | RetroStatus)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        <select className="input w-auto" value={tplFilter} onChange={(e) => setTplFilter(e.target.value)}>
          <option value="all">All templates</option>
          {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">From</span>
          <input type="date" className="input w-auto" value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="text-xs text-text-muted">To</span>
          <input type="date" className="input w-auto" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="flex-1" />
        <Tooltip label={can(role, 'create_retro') ? undefined : 'Scrum Master / Admin only'}>
          <button onClick={() => setOpen(true)} disabled={!can(role, 'create_retro')} className="btn-primary">
            <Plus size={16} /> New Retro
          </button>
        </Tooltip>
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-text-muted">
          <KanbanSquare className="mx-auto text-text-dim mb-3" />
          No retros yet for this project.
        </div>
      ) : (
        <div className="grid gap-3">
          {visible.map((r) => {
            const tpl = getTemplate(r.templateId);
            const totalVotes = r.cards.reduce((acc, c) => acc + c.votes.length, 0);
            return (
              <button
                key={r.id}
                onClick={() => navigate(`/projects/${projectId}/retros/${r.id}`)}
                className="panel p-4 text-left hover:border-primary/40 flex items-center gap-4"
              >
                <div className={`h-10 w-1 rounded-full ${r.status === 'active' ? 'bg-success' : 'bg-text-dim'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{r.title}</h3>
                    <span className={r.status === 'active' ? 'badge-success' : 'badge-neutral'}>
                      {r.status === 'active' ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">{tpl.name} • {fmtDate(r.createdAt)} • {fmtRel(r.createdAt)}</p>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted">
                  <span><strong className="text-text">{r.cards.length}</strong> cards</span>
                  <span><strong className="text-text">{totalVotes}</strong> votes</span>
                  <span><strong className="text-text">{r.cards.reduce((a, c) => a + c.actionItems.length, 0)}</strong> actions</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New Retro"
        footer={
          <>
            <button onClick={() => setOpen(false)} className="btn-secondary">Cancel</button>
            <button form="new-retro" type="submit" className="btn-primary">Create</button>
          </>
        }
      >
        <form id="new-retro" onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <label className="label block mb-1.5">Title</label>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus placeholder="e.g. Sprint 25 Retro" />
          </div>
          <div>
            <label className="label block mb-1.5">Template</label>
            <select className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label block mb-1.5">Vote budget per user</label>
            <input type="number" min={1} max={20} className="input" value={voteBudget} onChange={(e) => setVoteBudget(Number(e.target.value))} />
          </div>
        </form>
      </Modal>
    </div>
  );
}

