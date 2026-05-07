import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, UserPlus } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { ROLE_LABEL, can } from '../../domain/permissions';
import type { Role } from '../../domain/types';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';

const ROLES: Role[] = ['admin', 'scrum_master', 'member', 'viewer'];

export function SettingsTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const project = useAppStore((s) => s.projects.find((p) => p.id === projectId));
  const users = useAppStore((s) => s.users);
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const addMember = useAppStore((s) => s.addMember);
  const removeMember = useAppStore((s) => s.removeMember);
  const changeMemberRole = useAppStore((s) => s.changeMemberRole);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const pushToast = useAppStore((s) => s.pushToast);

  const [openAdd, setOpenAdd] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  if (!project) return null;
  if (!can(role, 'manage_members')) {
    return <p className="text-text-muted">Admins only.</p>;
  }

  const eligible = users.filter((u) => !project.members.some((m) => m.userId === u.id));

  return (
    <div className="grid gap-5">
      <div className="panel">
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <h3 className="font-semibold">Members ({project.members.length})</h3>
          <button onClick={() => setOpenAdd(true)} className="btn-primary" disabled={eligible.length === 0}>
            <UserPlus size={14} /> Add Member
          </button>
        </div>
        <table className="w-full text-sm">
          <caption className="sr-only">Project members and their roles</caption>
          <thead className="text-xs uppercase tracking-wider text-text-muted">
            <tr>
              <th scope="col" className="text-left px-4 py-2 font-medium">User</th>
              <th scope="col" className="text-left px-4 py-2 font-medium">Role</th>
              <th scope="col" className="px-4 py-2 w-16"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {project.members.map((m) => {
              const u = users.find((x) => x.id === m.userId);
              if (!u) return null;
              return (
                <tr key={m.userId} className="border-t border-surface-border">
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} color={u.avatarColor} size={28} />
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      className="input w-44 h-8 text-xs"
                      value={m.role}
                      onChange={(e) => changeMemberRole(project.id, m.userId, e.target.value as Role)}
                      aria-label={`Role for ${u.name}`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => { removeMember(project.id, m.userId); pushToast({ kind: 'info', message: `${u.name} removed` }); }}
                      className="btn-ghost btn-sm text-danger hover:bg-danger/10"
                      aria-label={`Remove ${u.name}`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="panel border-danger/30 p-4">
        <h3 className="font-semibold mb-1">Danger zone</h3>
        <p className="text-sm text-text-muted mb-3">Deleting the project removes all retros, action items, and reports.</p>
        <button onClick={() => setConfirmDel(true)} className="btn-danger">
          <Trash2 size={14} /> Delete Project
        </button>
      </div>

      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add Member"
        footer={<button onClick={() => setOpenAdd(false)} className="btn-secondary">Done</button>}
      >
        {eligible.length === 0 ? (
          <p className="text-text-muted text-sm">All seeded users are already members.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {eligible.map((u) => (
              <div key={u.id} className="panel-raised p-3 flex items-center gap-3">
                <Avatar name={u.name} color={u.avatarColor} size={28} />
                <span className="flex-1 text-sm">{u.name}</span>
                <select
                  id={`role-${u.id}`}
                  className="input w-40 h-8 text-xs"
                  defaultValue="member"
                  aria-label={`Role for ${u.name}`}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
                <button
                  onClick={() => {
                    const sel = document.getElementById(`role-${u.id}`) as HTMLSelectElement | null;
                    addMember(project.id, u.id, (sel?.value as Role) ?? 'member');
                    pushToast({ kind: 'success', message: `${u.name} added` });
                  }}
                  className="btn-primary btn-sm"
                  aria-label={`Add ${u.name}`}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={confirmDel}
        onClose={() => setConfirmDel(false)}
        title="Delete project?"
        footer={
          <>
            <button onClick={() => setConfirmDel(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={() => { deleteProject(project.id); pushToast({ kind: 'info', message: 'Project deleted' }); navigate('/projects'); }}
              className="btn-danger"
            >
              Yes, delete
            </button>
          </>
        }
      >
        <p className="text-sm text-text-muted">
          This will permanently remove <strong className="text-text">{project.name}</strong> and all of its data.
        </p>
      </Modal>
    </div>
  );
}
