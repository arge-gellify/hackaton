import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Plus, Search, Users } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { ROLE_LABEL } from '../domain/permissions';
import type { Role } from '../domain/types';
import { Modal } from '../components/ui/Modal';
import { fmtDate } from '../lib/format';

const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-primary',
  scrum_master: 'badge-success',
  member: 'badge-neutral',
  viewer: 'badge-warning',
};

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useAppStore((s) => s.projects);
  const retros = useAppStore((s) => s.retros);
  const me = useAppStore((s) => s.currentUserId);
  const createProject = useAppStore((s) => s.createProject);
  const pushToast = useAppStore((s) => s.pushToast);

  const [q, setQ] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const visible = useMemo(() => {
    return projects
      .map((p) => ({ p, role: p.members.find((m) => m.userId === me)?.role }))
      .filter(({ role }) => !!role)
      .filter(({ p }) => p.name.toLowerCase().includes(q.toLowerCase()))
      .filter(({ role }) => roleFilter === 'all' || role === roleFilter);
  }, [projects, me, q, roleFilter]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !me) return;
    const id = createProject(name.trim(), description.trim() || undefined, me);
    pushToast({ kind: 'success', message: `Project "${name.trim()}" created` });
    setOpenNew(false);
    setName(''); setDescription('');
    navigate(`/projects/${id}`);
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="label mb-1">Workspaces</p>
          <h1 className="text-2xl font-semibold tracking-tight">Your Projects</h1>
          <p className="text-sm text-text-muted mt-1">Pick a project to run a retro, browse history, or download an archive.</p>
        </div>
        <button onClick={() => setOpenNew(true)} className="btn-primary">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="panel p-3 mb-5 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter by project name…"
            className="input pl-9"
          />
        </div>
        <select
          className="input w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as 'all' | Role)}
        >
          <option value="all">All my roles</option>
          <option value="admin">Admin</option>
          <option value="scrum_master">Scrum Master</option>
          <option value="member">Member</option>
          <option value="viewer">Viewer</option>
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="panel p-10 text-center text-text-muted">
          <Folder className="mx-auto text-text-dim mb-3" />
          <p>No projects match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map(({ p, role }) => {
            const projectRetros = retros.filter((r) => r.projectId === p.id);
            const active = projectRetros.filter((r) => r.status === 'active').length;
            return (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="panel p-5 text-left hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-primary/15 border border-primary/30">
                      <Folder size={16} className="text-primary" />
                    </span>
                    <div>
                      <h3 className="font-semibold">{p.name}</h3>
                      <p className="text-xs text-text-dim">Created {fmtDate(p.createdAt)}</p>
                    </div>
                  </div>
                  {role && <span className={ROLE_BADGE[role]}>{ROLE_LABEL[role]}</span>}
                </div>
                <p className="text-sm text-text-muted line-clamp-2 mb-4 min-h-[40px]">
                  {p.description ?? 'No description.'}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-dim">
                  <span className="flex items-center gap-1"><Users size={12} /> {p.members.length} members</span>
                  <span>•</span>
                  <span>{projectRetros.length} retros</span>
                  {active > 0 && <><span>•</span><span className="text-success">{active} active</span></>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Modal
        open={openNew}
        onClose={() => setOpenNew(false)}
        title="Create new project"
        footer={
          <>
            <button onClick={() => setOpenNew(false)} className="btn-secondary">Cancel</button>
            <button form="new-project" type="submit" className="btn-primary">Create</button>
          </>
        }
      >
        <form id="new-project" onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="label block mb-1.5">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div>
            <label className="label block mb-1.5">Description (optional)</label>
            <textarea
              className="input h-24 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this project for?"
            />
          </div>
          <p className="text-xs text-text-muted">You'll be the Admin and the only member to start.</p>
        </form>
      </Modal>
    </div>
  );
}
