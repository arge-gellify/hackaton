import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCorners,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ChevronLeft, Lock, CheckCircle2, Search } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { getTemplate } from '../../domain/templates';
import { Column } from '../../components/board/Column';
import { Tooltip } from '../../components/ui/Tooltip';
import { can } from '../../domain/permissions';
import { fmtDate } from '../../lib/format';

export function RetroBoardPage({ readOnlyOverride }: { readOnlyOverride?: boolean } = {}) {
  const { projectId, retroId } = useParams<{ projectId: string; retroId: string }>();
  const navigate = useNavigate();
  const retro = useAppStore((s) => s.retros.find((r) => r.id === retroId));
  const role = useAppStore((s) => (projectId ? s.getRoleInProject(projectId) : undefined));
  const me = useAppStore((s) => s.currentUserId);
  const moveCard = useAppStore((s) => s.moveCard);
  const closeRetro = useAppStore((s) => s.closeRetro);
  const pushToast = useAppStore((s) => s.pushToast);

  const [q, setQ] = useState('');
  const [colFilter, setColFilter] = useState<'all' | string>('all');
  const [minVotes, setMinVotes] = useState(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (!retro) {
    return <p className="text-text-muted">Retro not found.</p>;
  }
  const tpl = getTemplate(retro.templateId);
  const readOnly = readOnlyOverride ?? retro.status === 'closed';

  const votesUsed = useMemo(
    () => retro.cards.reduce((acc, c) => acc + c.votes.filter((v) => v.userId === me).length, 0),
    [retro, me]
  );

  const filteredCardsByCol = useMemo(() => {
    return tpl.columns.reduce<Record<string, typeof retro.cards>>((acc, col) => {
      acc[col.key] = retro.cards
        .filter((c) => c.columnKey === col.key)
        .filter((c) => colFilter === 'all' || c.columnKey === colFilter)
        .filter((c) => !q || c.text.toLowerCase().includes(q.toLowerCase()))
        .filter((c) => c.votes.length >= minVotes)
        .sort((a, b) => a.order - b.order);
      return acc;
    }, {});
  }, [retro.cards, tpl.columns, colFilter, q, minVotes]);

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const cardId = String(active.id);
    const overId = String(over.id);
    let toCol: string;
    let toIndex: number;
    if (overId.startsWith('col_')) {
      toCol = overId.slice(4);
      toIndex = filteredCardsByCol[toCol]?.length ?? 0;
    } else {
      const overCard = retro.cards.find((c) => c.id === overId);
      if (!overCard) return;
      toCol = overCard.columnKey;
      const list = filteredCardsByCol[toCol];
      toIndex = list.findIndex((c) => c.id === overId);
      if (toIndex < 0) toIndex = list.length;
    }
    moveCard(retro.id, cardId, toCol, toIndex);
  };

  const handleClose = () => {
    if (!confirm('Close this retro? It will become read-only and a draft report will be generated.')) return;
    closeRetro(retro.id);
    pushToast({ kind: 'success', message: 'Retro closed. Report generated.' });
  };

  const remaining = retro.voteBudgetPerUser - votesUsed;

  return (
    <div>
      <button onClick={() => navigate(`/projects/${projectId}/retros`)} className="btn-ghost -ml-2 mb-3 text-xs">
        <ChevronLeft size={14} /> All retros
      </button>

      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-semibold">{retro.title}</h2>
            <span className={retro.status === 'active' ? 'badge-success' : 'badge-neutral'}>
              {retro.status === 'active' ? 'Active' : 'Closed'}
            </span>
            {readOnly && <span className="badge-warning"><Lock size={10} /> Read-only</span>}
          </div>
          <p className="text-xs text-text-muted">
            {tpl.name} • Created {fmtDate(retro.createdAt)} {retro.closedAt && `• Closed ${fmtDate(retro.closedAt)}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="panel-raised px-3 h-9 flex items-center gap-2 text-sm">
            <span className="text-text-muted">Votes</span>
            <span className={`font-mono font-semibold ${remaining === 0 ? 'text-warning' : 'text-text'}`}>
              {votesUsed} / {retro.voteBudgetPerUser}
            </span>
          </div>
          {retro.status === 'active' && (
            <Tooltip label={can(role, 'close_retro') ? undefined : 'Scrum Master / Admin only'}>
              <button onClick={handleClose} disabled={!can(role, 'close_retro')} className="btn-primary">
                <CheckCircle2 size={14} /> Close Retro
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      <div className="panel p-3 mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim" />
          <input className="input pl-9" placeholder="Search cards…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" value={colFilter} onChange={(e) => setColFilter(e.target.value)}>
          <option value="all">All columns</option>
          {tpl.columns.map((c) => <option key={c.key} value={c.key}>{c.title}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Min votes</span>
          <input type="number" min={0} className="input w-20" value={minVotes} onChange={(e) => setMinVotes(Number(e.target.value))} />
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={onDragEnd}>
        <div className={`grid gap-3 ${tpl.columns.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {tpl.columns.map((col) => (
            <Column
              key={col.key}
              columnKey={col.key}
              title={col.title}
              cards={filteredCardsByCol[col.key] ?? []}
              retroId={retro.id}
              projectId={projectId!}
              readOnly={readOnly}
              votesUsed={votesUsed}
              voteBudget={retro.voteBudgetPerUser}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}
