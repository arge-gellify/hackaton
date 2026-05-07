export type UserId = string;
export type ProjectId = string;
export type RetroId = string;
export type CardId = string;
export type ActionItemId = string;
export type ReportId = string;

export type Role = 'admin' | 'scrum_master' | 'member' | 'viewer';

export interface User {
  id: UserId;
  name: string;
  avatarColor: string;
}

export interface Membership {
  userId: UserId;
  role: Role;
}

export interface Project {
  id: ProjectId;
  name: string;
  description?: string;
  createdAt: string;
  members: Membership[];
}

export type RetroStatus = 'active' | 'closed';

export interface RetroTemplate {
  id: string;
  name: string;
  columns: { key: string; title: string }[];
}

export interface Vote {
  userId: UserId;
}

export type ActionItemStatus = 'open' | 'in_progress' | 'done';

export interface ActionItem {
  id: ActionItemId;
  cardId: CardId;
  title: string;
  assigneeId?: UserId;
  dueDate?: string;
  status: ActionItemStatus;
  createdAt: string;
}

export interface Card {
  id: CardId;
  retroId: RetroId;
  columnKey: string;
  text: string;
  authorId: UserId;
  order: number;
  votes: Vote[];
  actionItems: ActionItem[];
}

export interface Retro {
  id: RetroId;
  projectId: ProjectId;
  title: string;
  templateId: string;
  status: RetroStatus;
  createdAt: string;
  closedAt?: string;
  voteBudgetPerUser: number;
  cards: Card[];
}

export interface Report {
  id: ReportId;
  retroId: RetroId;
  generatedAt: string;
  isFinal: boolean;
  summary: string;
}
