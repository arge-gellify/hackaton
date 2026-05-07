import { create } from 'zustand';
import type {
  ActionItem, ActionItemStatus, Card, Project, ProjectId, Report, Retro, RetroId, Role, User, UserId,
} from '../domain/types';
import { seedProjects, seedRetros, seedReports, seedUsers } from '../data/seed';
import { uid } from '../lib/cn';

interface Toast { id: string; kind: 'info' | 'success' | 'error'; message: string }

interface AppState {
  // auth
  currentUserId: UserId | null;
  setCurrentUser: (id: UserId | null) => void;

  // data
  users: User[];
  projects: Project[];
  retros: Retro[];
  reports: Report[];

  // ui
  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;

  // selectors (helper)
  getRoleInProject: (projectId: ProjectId, userId?: UserId) => Role | undefined;

  // projects
  createProject: (name: string, description: string | undefined, ownerId: UserId) => ProjectId;
  deleteProject: (projectId: ProjectId) => void;
  addMember: (projectId: ProjectId, userId: UserId, role: Role) => void;
  removeMember: (projectId: ProjectId, userId: UserId) => void;
  changeMemberRole: (projectId: ProjectId, userId: UserId, role: Role) => void;

  // retros
  createRetro: (input: { projectId: ProjectId; title: string; templateId: string; voteBudgetPerUser: number }) => RetroId;
  closeRetro: (retroId: RetroId) => void;

  // cards
  addCard: (retroId: RetroId, columnKey: string, text: string, authorId: UserId) => void;
  editCard: (retroId: RetroId, cardId: string, text: string) => void;
  deleteCard: (retroId: RetroId, cardId: string) => void;
  moveCard: (retroId: RetroId, cardId: string, toColumnKey: string, toIndex: number) => void;

  // votes
  addVote: (retroId: RetroId, cardId: string, userId: UserId) => void;
  removeVote: (retroId: RetroId, cardId: string, userId: UserId) => void;

  // action items
  addActionItem: (retroId: RetroId, cardId: string, title: string) => void;
  updateActionItem: (retroId: RetroId, cardId: string, itemId: string, patch: Partial<ActionItem>) => void;
  deleteActionItem: (retroId: RetroId, cardId: string, itemId: string) => void;

  // reports
  updateReportSummary: (reportId: string, summary: string) => void;
  setReportFinal: (reportId: string, isFinal: boolean) => void;
}

const updateRetro = (retros: Retro[], id: RetroId, fn: (r: Retro) => Retro): Retro[] =>
  retros.map((r) => (r.id === id ? fn(r) : r));

const updateCard = (retro: Retro, cardId: string, fn: (c: Card) => Card): Retro => ({
  ...retro,
  cards: retro.cards.map((c) => (c.id === cardId ? fn(c) : c)),
});

export const useAppStore = create<AppState>((set, get) => ({
  currentUserId: null,
  setCurrentUser: (id) => set({ currentUserId: id }),

  users: seedUsers,
  projects: seedProjects,
  retros: seedRetros,
  reports: seedReports,

  toasts: [],
  pushToast: (t) => {
    const id = uid('t');
    set((s) => ({ toasts: [...s.toasts, { ...t, id }] }));
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 3500);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  getRoleInProject: (projectId, userId) => {
    const uid_ = userId ?? get().currentUserId ?? undefined;
    if (!uid_) return undefined;
    const p = get().projects.find((x) => x.id === projectId);
    return p?.members.find((m) => m.userId === uid_)?.role;
  },

  createProject: (name, description, ownerId) => {
    const id = uid('p');
    set((s) => ({
      projects: [
        ...s.projects,
        { id, name, description, createdAt: new Date().toISOString(), members: [{ userId: ownerId, role: 'admin' }] },
      ],
    }));
    return id;
  },
  deleteProject: (projectId) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== projectId),
      retros: s.retros.filter((r) => r.projectId !== projectId),
      reports: s.reports.filter((rep) => !s.retros.some((r) => r.id === rep.retroId && r.projectId === projectId)),
    })),
  addMember: (projectId, userId, role) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId && !p.members.some((m) => m.userId === userId)
          ? { ...p, members: [...p.members, { userId, role }] }
          : p
      ),
    })),
  removeMember: (projectId, userId) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId ? { ...p, members: p.members.filter((m) => m.userId !== userId) } : p
      ),
    })),
  changeMemberRole: (projectId, userId, role) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === projectId
          ? { ...p, members: p.members.map((m) => (m.userId === userId ? { ...m, role } : m)) }
          : p
      ),
    })),

  createRetro: ({ projectId, title, templateId, voteBudgetPerUser }) => {
    const id = uid('r');
    set((s) => ({
      retros: [
        ...s.retros,
        { id, projectId, title, templateId, status: 'active', createdAt: new Date().toISOString(), voteBudgetPerUser, cards: [] },
      ],
    }));
    return id;
  },
  closeRetro: (retroId) => {
    const closedAt = new Date().toISOString();
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) => ({ ...r, status: 'closed', closedAt })),
      reports: [
        ...s.reports,
        { id: uid('rep'), retroId, generatedAt: closedAt, isFinal: false, summary: '' },
      ],
    }));
  },

  addCard: (retroId, columnKey, text, authorId) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) => {
        const order = r.cards.filter((c) => c.columnKey === columnKey).length;
        const card: Card = {
          id: uid('c'), retroId, columnKey, text, authorId, order, votes: [], actionItems: [],
        };
        return { ...r, cards: [...r.cards, card] };
      }),
    })),
  editCard: (retroId, cardId, text) =>
    set((s) => ({ retros: updateRetro(s.retros, retroId, (r) => updateCard(r, cardId, (c) => ({ ...c, text }))) })),
  deleteCard: (retroId, cardId) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) => ({ ...r, cards: r.cards.filter((c) => c.id !== cardId) })),
    })),
  moveCard: (retroId, cardId, toColumnKey, toIndex) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) => {
        const moving = r.cards.find((c) => c.id === cardId);
        if (!moving) return r;
        const without = r.cards.filter((c) => c.id !== cardId);
        const inCol = without.filter((c) => c.columnKey === toColumnKey).sort((a, b) => a.order - b.order);
        const others = without.filter((c) => c.columnKey !== toColumnKey);
        inCol.splice(toIndex, 0, { ...moving, columnKey: toColumnKey });
        const reordered = inCol.map((c, i) => ({ ...c, order: i }));
        return { ...r, cards: [...others, ...reordered] };
      }),
    })),

  addVote: (retroId, cardId, userId) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) => updateCard(r, cardId, (c) => ({ ...c, votes: [...c.votes, { userId }] }))),
    })),
  removeVote: (retroId, cardId, userId) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) =>
        updateCard(r, cardId, (c) => {
          const idx = c.votes.findIndex((v) => v.userId === userId);
          if (idx < 0) return c;
          const votes = [...c.votes];
          votes.splice(idx, 1);
          return { ...c, votes };
        })
      ),
    })),

  addActionItem: (retroId, cardId, title) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) =>
        updateCard(r, cardId, (c) => ({
          ...c,
          actionItems: [
            ...c.actionItems,
            { id: uid('ai'), cardId, title, status: 'open' as ActionItemStatus, createdAt: new Date().toISOString() },
          ],
        }))
      ),
    })),
  updateActionItem: (retroId, cardId, itemId, patch) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) =>
        updateCard(r, cardId, (c) => ({
          ...c,
          actionItems: c.actionItems.map((ai) => (ai.id === itemId ? { ...ai, ...patch } : ai)),
        }))
      ),
    })),
  deleteActionItem: (retroId, cardId, itemId) =>
    set((s) => ({
      retros: updateRetro(s.retros, retroId, (r) =>
        updateCard(r, cardId, (c) => ({
          ...c,
          actionItems: c.actionItems.filter((ai) => ai.id !== itemId),
        }))
      ),
    })),

  updateReportSummary: (reportId, summary) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, summary } : r)) })),
  setReportFinal: (reportId, isFinal) =>
    set((s) => ({ reports: s.reports.map((r) => (r.id === reportId ? { ...r, isFinal } : r)) })),
}));
