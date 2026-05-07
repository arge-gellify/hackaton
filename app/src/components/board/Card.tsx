import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Minus, Plus, MessageSquare, GripVertical } from 'lucide-react';
import type { Card as CardT } from '../../domain/types';
import { useAppStore } from '../../stores/useAppStore';
import { can } from '../../domain/permissions';
import { Tooltip } from '../ui/Tooltip';
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
  const [open, setOpen] = useState(false);

  const myVotes = card.votes.filter((v) => v.userId === me).length;
  const canVote = can(role, 'vote') && !readOnly;
  const canDrag = can(role, 'reorder_card') && !readOnly;
  const exhausted = votesUsed >= voteBudget;

  const sortable = useSortable({ id: card.id, disabled: !canDrag });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
    opacity: sortable.isDragging ? 0.5 : 1,
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
            <button
              {...sortable.listeners}
              {...sortable.attributes}
              className="text-text-dim hover:text-text cursor-grab active:cursor-grabbing -ml-1 mt-0.5"
              aria-label="Drag card"
            >
              <GripVertical size={14} />
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="flex-1 text-left text-sm text-text leading-snug"
          >
            {card.text}
          </button>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-surface-border/60">
          <Tooltip label={!canVote ? 'Members+ on active retros' : exhausted && myVotes === 0 ? 'No votes left' : undefined}>
            <div className="flex items-center gap-1">
              <button
                disabled={!canVote || myVotes === 0}
                onClick={() => me && removeVote(retroId, card.id, me)}
                className="btn-ghost btn-sm h-6 w-6 px-0"
                aria-label="Remove vote"
              >
                <Minus size={12} />
              </button>
              <span className={`text-xs font-mono w-6 text-center ${myVotes > 0 ? 'text-primary' : 'text-text-muted'}`}>
                {card.votes.length}
              </span>
              <button
                disabled={!canVote || exhausted}
                onClick={() => me && addVote(retroId, card.id, me)}
                className="btn-ghost btn-sm h-6 w-6 px-0"
                aria-label="Add vote"
              >
                <Plus size={12} />
              </button>
            </div>
          </Tooltip>
          {card.actionItems.length > 0 && (
            <span className="badge-neutral">
              <MessageSquare size={10} /> {card.actionItems.length}
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

