import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import type { ActionItemStatus } from '../../domain/types';
import { can } from '../../domain/permissions';
import { fmtDate } from '../../lib/format';

const STATUS_CLS: Record<ActionItemStatus, string> = {
  open: 'badge-neutral',
  in_progress: 'badge-warning',
  done: 'badge-success',
};
const STATUS_LABEL: Record<ActionItemStatus, string> = {
  open: 'Open', in_progress: 'In Progress', done: 'Done',
};

export function ActionItemsTab() {
  const { projectId } = useParams<{ projectId: string }>();
  const allRetros = useAppStore((s) => s.retros);
  const retros = useMemo(
    () => allRetros.filter((r) => r.projectId === projectId),
    [allRetros, projectId]
  );
  const users = useAppStore((s) => s.users);
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const updateActionItem = useAppStore((s) => s.updateActionItem);

  const [assignee, setAssignee] = useState<'all' | string>('all');
  const [status, setStatus] = useState<'all' | ActionItemStatus>('all');
  const [retroId, setRetroId] = useState<'all' | string>('all');
  const [sortBy, setSortBy] = useState<'due' | 'status'>('due');

  const items = useMemo(() => {
    const all = retros.flatMap((r) =>
      r.cards.flatMap((c) => c.actionItems.map((ai) => ({ ai, retro: r, cardId: c.id })))
    );
    return all
      .filter((x) => assignee === 'all' || x.ai.assigneeId === (assignee === 'unassigned' ? undefined : assignee))
      .filter((x) => status === 'all' || x.ai.status === status)
      .filter((x) => retroId === 'all' || x.retro.id === retroId)
      .sort((a, b) => {
        if (sortBy === 'due') return (a.ai.dueDate ?? '~').localeCompare(b.ai.dueDate ?? '~');
        return a.ai.status.localeCompare(b.ai.status);
      });
  }, [retros, assignee, status, retroId, sortBy]);

  return (
    <div>
      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-2">
        <select
          className="input w-auto"
          value={assignee}
          onChange={(e) => setAssignee(e.target.value)}
          aria-label="Filter action items by assignee"
        >
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        <select
          className="input w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | ActionItemStatus)}
          aria-label="Filter action items by status"
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          className="input w-auto"
          value={retroId}
          onChange={(e) => setRetroId(e.target.value)}
          aria-label="Filter action items by source retro"
        >
          <option value="all">All source retros</option>
          {retros.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-text-muted" aria-hidden="true">Sort by</span>
        <select
          className="input w-auto"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'due' | 'status')}
          aria-label="Sort action items"
        >
          <option value="due">Due date</option>
          <option value="status">Status</option>
        </select>
      </div>

      {items.length === 0 ? (
        <div className="panel p-10 text-center text-text-muted">
          <ListChecks className="mx-auto text-text-dim mb-3" />
          No action items match.
        </div>
      ) : (
        <div className="panel overflow-hidden">
          <table className="w-full text-sm">
            <caption className="sr-only">Action items across all retros in this project</caption>
            <thead className="bg-surface-raised text-text-muted text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="text-left px-4 py-2 font-medium">Title</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">Assignee</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">Due</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">Status</th>
                <th scope="col" className="text-left px-4 py-2 font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ ai, retro, cardId }) => {
                const assignee = users.find((u) => u.id === ai.assigneeId);
                const canEdit = can(role, 'edit_any');
                return (
                  <tr key={ai.id} className="border-t border-surface-border hover:bg-surface-hover/40">
                    <td className="px-4 py-2.5">{ai.title}</td>
                    <td className="px-4 py-2.5 text-text-muted">{assignee?.name ?? '—'}</td>
                    <td className="px-4 py-2.5 text-text-muted">{fmtDate(ai.dueDate)}</td>
                    <td className="px-4 py-2.5">
                      {canEdit ? (
                        <select
                          className={`input h-7 w-32 text-xs`}
                          value={ai.status}
                          onChange={(e) => updateActionItem(retro.id, cardId, ai.id, { status: e.target.value as ActionItemStatus })}
                          aria-label={`Status for ${ai.title}`}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      ) : (
                        <span className={STATUS_CLS[ai.status]}>{STATUS_LABEL[ai.status]}</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <Link className="text-primary hover:underline" to={`/projects/${projectId}/retros/${retro.id}`}>{retro.title}</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
