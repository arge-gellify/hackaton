import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Card } from '../../domain/types';
import { BoardCard } from './Card';
import { useAppStore } from '../../stores/useAppStore';
import { can } from '../../domain/permissions';

interface Props {
  columnKey: string;
  title: string;
  cards: Card[];
  retroId: string;
  projectId: string;
  readOnly: boolean;
  votesUsed: number;
  voteBudget: number;
}

export function Column({ columnKey, title, cards, retroId, projectId, readOnly, votesUsed, voteBudget }: Props) {
  const me = useAppStore((s) => s.currentUserId);
  const role = useAppStore((s) => s.getRoleInProject(projectId));
  const addCard = useAppStore((s) => s.addCard);
  const { setNodeRef, isOver } = useDroppable({ id: `col_${columnKey}` });
  const [text, setText] = useState('');
  const canAdd = !readOnly && can(role, 'add_card');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !me) return;
    addCard(retroId, columnKey, text.trim(), me);
    setText('');
  };

  return (
    <div ref={setNodeRef} className={`panel p-3 flex flex-col min-h-[200px] ${isOver ? 'border-primary/60 shadow-glow' : ''}`}>
      <div className="flex items-center justify-between px-1 mb-3">
        <h3 className="font-semibold text-sm">{title}</h3>
        <span className="badge-neutral">{cards.length}</span>
      </div>

      {canAdd && (
        <form onSubmit={submit} className="flex gap-1.5 mb-3">
          <input
            className="input"
            placeholder="Add a card…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="btn-primary px-2.5" disabled={!text.trim()} aria-label="Add card">
            <Plus size={14} />
          </button>
        </form>
      )}

      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 flex-1">
          {cards.map((c) => (
            <BoardCard
              key={c.id}
              card={c}
              retroId={retroId}
              projectId={projectId}
              readOnly={readOnly}
              votesUsed={votesUsed}
              voteBudget={voteBudget}
            />
          ))}
          {cards.length === 0 && (
            <p className="text-xs text-text-dim italic px-1 py-4">No cards yet.</p>
          )}
        </div>
      </SortableContext>
    </div>
  );
}
