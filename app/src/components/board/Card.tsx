import { useId, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Minus, Plus, MessageSquare, GripVertical } from 'lucide-react';
import type { Card as CardT } from '../../domain/types';
import { useAppStore } from '../../stores/useAppStore';
import { can } from '../../domain/permissions';
import { Tooltip } from '../ui/Tooltip';
import { announce } from '../../lib/announce';
import { CardDetailModal } from './CardDetailModal';

interface Props {
  card: CardT;
  retroId: string;
  projectId: string;
  readOnly: boolean;
  votesUsed: number;
  voteBudget: number;
}

export function BoardCard({ card, retroId, projectId, readOnly, votesUsed, voteBudget }: Props) {
  const me = useAppStore((s) => s.currentUserId);
  const role = useAppStore((s) => s.getRoleInProject(projectId));
  const addVote = useAppStore((s) => s.addVote);
  const removeVote = useAppStore((s) => s.removeVote);
  const pushToast = useAppStore((s) => s.pushToast);
  const [open, setOpen] = useState(false);

  const myVotes = card.votes.filter((v) => v.userId === me).length;
  const canVote = can(role, 'vote') && !readOnly;
  const canDrag = can(role, 'reorder_card') && !readOnly;
  const exhausted = votesUsed >= voteBudget;
  const dragHintId = useId();

  const sortable = useSortable({ id: card.id, disabled: !canDrag });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
  };

  const reason = !canVote
    ? readOnly
      ? 'This retro is read-only.'
      : 'Members+ on active retros can vote.'
    : exhausted
    ? 'No votes left in your budget.'
    : null;

  const onAddVote = () => {
    if (!me) return;
    if (!canVote) {
      pushToast({ kind: 'info', message: 'Members+ on active retros can vote.' });
      return;
    }
    if (exhausted) {
      pushToast({ kind: 'info', message: 'No votes left in your budget.' });
      return;
    }
    addVote(retroId, card.id, me);
    announce('polite', `Vote added. ${card.votes.length + 1} total.`);
  };

  const onRemoveVote = () => {
    if (!me) return;
    if (!canVote) {
      pushToast({ kind: 'info', message: 'Members+ on active retros can vote.' });
      return;
    }
    if (myVotes === 0) return;
    removeVote(retroId, card.id, me);
    announce('polite', `Vote removed. ${card.votes.length - 1} total.`);
  };

  return (
    <>
      <div
        ref={sortable.setNodeRef}
        style={style}
        className="panel-raised p-3 group hover:border-primary/30 transition-colors"
      >
        <div className="flex items-start gap-2">
          {canDrag && (
            <>
              <button
                {...sortable.listeners}
                {...sortable.attributes}
                className="text-text-dim hover:text-text cursor-grab active:cursor-grabbing -ml-1 mt-0.5"
                aria-label="Drag card"
                aria-roledescription="draggable card"
                aria-describedby={dragHintId}
              >
                <GripVertical size={14} aria-hidden="true" />
              </button>
              <span id={dragHintId} className="sr-only">
                Press space to lift, arrow keys to move, space to drop, escape to cancel.
              </span>
            </>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left text-sm text-text leading-snug"
            aria-label={`Open card detail: ${card.text}`}
          >
            {card.text}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-border/60">
          <Tooltip label={reason ?? undefined}>
            <div className="flex items-center gap-1">
              <button
                aria-disabled={!canVote || myVotes === 0}
                onClick={onRemoveVote}
                className="btn-ghost btn-sm h-6 w-6 px-0"
                aria-label="Remove one of my votes from this card"
              >
                <Minus size={12} aria-hidden="true" />
              </button>
              <span
                aria-hidden="true"
                className={`text-xs font-mono w-6 text-center ${myVotes > 0 ? 'text-primary' : 'text-text-muted'}`}
              >
                {card.votes.length}
              </span>
              <span className="sr-only">
                {card.votes.length} {card.votes.length === 1 ? 'vote' : 'votes'} total{myVotes > 0 ? `, ${myVotes} from you` : ''}.
              </span>
              <button
                aria-disabled={!canVote || exhausted}
                onClick={onAddVote}
                className="btn-ghost btn-sm h-6 w-6 px-0"
                aria-label="Add a vote to this card"
              >
                <Plus size={12} aria-hidden="true" />
              </button>
            </div>
          </Tooltip>
          {card.actionItems.length > 0 && (
            <span className="badge-neutral" aria-label={`${card.actionItems.length} action ${card.actionItems.length === 1 ? 'item' : 'items'}`}>
              <MessageSquare size={10} aria-hidden="true" /> {card.actionItems.length}
            </span>
          )}
          <span className="flex-1" />
          <span className="text-[10px] uppercase tracking-wider text-text-dim">Anonymous</span>
        </div>
      </div>
      <CardDetailModal
        open={open}
        onClose={() => setOpen(false)}
        card={card}
        retroId={retroId}
        projectId={projectId}
        readOnly={readOnly}
      />
    </>
  );
}

