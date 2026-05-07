import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Tooltip } from '../ui/Tooltip';
import type { ActionItemStatus, Card as CardT } from '../../domain/types';
import { useAppStore } from '../../stores/useAppStore';
import { can } from '../../domain/permissions';
import { fmtDate } from '../../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  card: CardT;
  retroId: string;
  projectId: string;
  readOnly: boolean;
}

const STATUS: { value: ActionItemStatus; label: string; cls: string }[] = [
  { value: 'open', label: 'Open', cls: 'badge-neutral' },
  { value: 'in_progress', label: 'In Progress', cls: 'badge-warning' },
  { value: 'done', label: 'Done', cls: 'badge-success' },
];

export function CardDetailModal({ open, onClose, card, retroId, projectId, readOnly }: Props) {
  const me = useAppStore((s) => s.currentUserId);
  const role = useAppStore((s) => s.getRoleInProject(projectId));
  const users = useAppStore((s) => s.users);
  const editCard = useAppStore((s) => s.editCard);
  const deleteCard = useAppStore((s) => s.deleteCard);
  const addActionItem = useAppStore((s) => s.addActionItem);
  const updateActionItem = useAppStore((s) => s.updateActionItem);
  const deleteActionItem = useAppStore((s) => s.deleteActionItem);

  const [text, setText] = useState(card.text);
  const [newAi, setNewAi] = useState('');

  const isOwn = card.authorId === me;
  const canEditText = !readOnly && (can(role, 'edit_any') || (isOwn && can(role, 'edit_own')));
  const canDelete = !readOnly && (can(role, 'edit_any') || (isOwn && can(role, 'edit_own')));
  const canAddAi = !readOnly && can(role, 'add_action_item');

  const save = () => {
    if (!canEditText || text === card.text) return;
    editCard(retroId, card.id, text);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Card detail"
      size="lg"
      footer={
        <div className="flex gap-2 w-full">
          {canDelete && (
            <button
              onClick={() => { deleteCard(retroId, card.id); onClose(); }}
              className="btn-danger mr-auto"
            >
              <Trash2 size={14} /> Delete card
            </button>
          )}
          <button onClick={onClose} className="btn-secondary ml-auto">Close</button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div>
          <label className="label block mb-1.5">Card text</label>
          <textarea
            disabled={!canEditText}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={save}
            className="input h-24 py-2"
          />
          {!canEditText && <p className="text-xs text-text-dim mt-1.5">Read-only — owner or Scrum Master can edit.</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="label">Action items ({card.actionItems.length})</h3>
          </div>

          <div className="flex flex-col gap-2">
            {card.actionItems.map((ai) => {
              const isOwnItem = false; // action items don't track author beyond card; treat Member+ as owner-like for own card
              const canEdit = !readOnly && (can(role, 'edit_any') || (isOwn && can(role, 'edit_own')) || isOwnItem);
              return (
                <div key={ai.id} className="panel-raised p-3 flex flex-col gap-2">
                  <input
                    disabled={!canEdit}
                    className="input"
                    value={ai.title}
                    onChange={(e) => updateActionItem(retroId, card.id, ai.id, { title: e.target.value })}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      disabled={!canEdit}
                      className="input"
                      value={ai.assigneeId ?? ''}
                      onChange={(e) => updateActionItem(retroId, card.id, ai.id, { assigneeId: e.target.value || undefined })}
                    >
                      <option value="">Unassigned</option>
                      {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                    <input
                      disabled={!canEdit}
                      type="date"
                      className="input"
                      value={ai.dueDate ? ai.dueDate.slice(0, 10) : ''}
                      onChange={(e) => updateActionItem(retroId, card.id, ai.id, { dueDate: e.target.value || undefined })}
                    />
                    <select
                      disabled={!canEdit}
                      className="input"
                      value={ai.status}
                      onChange={(e) => updateActionItem(retroId, card.id, ai.id, { status: e.target.value as ActionItemStatus })}
                    >
                      {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between text-xs text-text-dim">
                    <span>Created {fmtDate(ai.createdAt)}</span>
                    {canEdit && (
                      <button onClick={() => deleteActionItem(retroId, card.id, ai.id)} className="text-danger hover:underline inline-flex items-center gap-1">
                        <Trash2 size={12} /> Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {canAddAi && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (newAi.trim()) { addActionItem(retroId, card.id, newAi.trim()); setNewAi(''); } }}
              className="mt-3 flex gap-2"
            >
              <input
                value={newAi}
                onChange={(e) => setNewAi(e.target.value)}
                placeholder="New action item…"
                className="input"
              />
              <Tooltip label={canAddAi ? undefined : 'Member+ only'}>
                <button type="submit" className="btn-primary" disabled={!newAi.trim()}>
                  <Plus size={14} /> Add
                </button>
              </Tooltip>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}
