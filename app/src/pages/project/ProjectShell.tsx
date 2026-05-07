import { useMemo } from 'react';
import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, KanbanSquare, ListChecks, Settings, Clock, FileText } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ROLE_LABEL, can } from '../../domain/permissions';
import type { Role } from '../../domain/types';
import { Tooltip } from '../../components/ui/Tooltip';
import { downloadProjectZip } from '../../features/export/projectZip';

const ROLE_BADGE: Record<Role, string> = {
  admin: 'badge-primary',
  scrum_master: 'badge-success',
  member: 'badge-neutral',
  viewer: 'badge-warning',
};

export function ProjectShell() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = useAppStore((s) => s.projects.find((p) => p.id === projectId));
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const allRetros = useAppStore((s) => s.retros);
  const retros = useMemo(
    () => allRetros.filter((r) => r.projectId === projectId),
    [allRetros, projectId]
  );
  const reports = useAppStore((s) => s.reports);
  const users = useAppStore((s) => s.users);
  const me = useAppStore((s) => s.currentUserId);
  const pushToast = useAppStore((s) => s.pushToast);

  if (!project || !role) {
    return (
      <div className="mx-auto max-w-[1400px] px-6 py-12 text-center">
        <p className="text-text-muted">Project not found or you don't have access.</p>
        <button onClick={() => navigate('/projects')} className="btn-secondary mt-4">Back to Projects</button>
      </div>
    );
  }

  const tabs: { to: string; label: string; icon: typeof Settings; gated?: boolean }[] = [
    { to: 'retros', label: 'Retros', icon: KanbanSquare },
    { to: 'history', label: 'History', icon: Clock },
    { to: 'action-items', label: 'Action Items', icon: ListChecks },
    { to: 'reports', label: 'Reports', icon: FileText },
    { to: 'settings', label: 'Settings', icon: Settings, gated: !can(role, 'manage_members') },
  ];

  const onDownload = async () => {
    const me_user = users.find((u) => u.id === me);
    await downloadProjectZip(project, retros, reports, me_user!);
    pushToast({ kind: 'success', message: 'Project archive downloaded' });
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 pt-6 pb-12">
      <button onClick={() => navigate('/projects')} className="btn-ghost -ml-2 mb-3 text-xs">
        <ChevronLeft size={14} /> All projects
      </button>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <span className={ROLE_BADGE[role]}>{ROLE_LABEL[role]}</span>
          </div>
          {project.description && <p className="text-sm text-text-muted max-w-2xl">{project.description}</p>}
        </div>
        <Tooltip label={can(role, 'download_project') ? undefined : 'Admin only'}>
          <button onClick={onDownload} disabled={!can(role, 'download_project')} className="btn-secondary">
            <Download size={14} /> Download Project
          </button>
        </Tooltip>
      </div>

      <nav className="border-b border-surface-border mb-6 -mx-1">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(({ to, label, icon: Icon, gated }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
                  isActive
                    ? 'border-primary text-text'
                    : 'border-transparent text-text-muted hover:text-text'
                } ${gated ? 'opacity-50 pointer-events-none' : ''}`
              }
              end={to === 'retros' ? false : true}
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
