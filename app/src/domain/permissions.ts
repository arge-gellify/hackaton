import type { Role } from './types';

export type Action =
  | 'view'
  | 'add_card'
  | 'vote'
  | 'reorder_card'
  | 'add_action_item'
  | 'edit_own'
  | 'edit_any'
  | 'create_retro'
  | 'close_retro'
  | 'edit_report_summary'
  | 'mark_report_final'
  | 'manage_members'
  | 'delete_project'
  | 'download_project';

const M: Record<Action, Role[]> = {
  view: ['admin', 'scrum_master', 'member', 'viewer'],
  add_card: ['admin', 'scrum_master', 'member'],
  vote: ['admin', 'scrum_master', 'member'],
  reorder_card: ['admin', 'scrum_master', 'member'],
  add_action_item: ['admin', 'scrum_master', 'member'],
  edit_own: ['admin', 'scrum_master', 'member'],
  edit_any: ['admin', 'scrum_master'],
  create_retro: ['admin', 'scrum_master'],
  close_retro: ['admin', 'scrum_master'],
  edit_report_summary: ['admin', 'scrum_master'],
  mark_report_final: ['admin', 'scrum_master'],
  manage_members: ['admin'],
  delete_project: ['admin'],
  download_project: ['admin'],
};

export function can(role: Role | undefined, action: Action): boolean {
  if (!role) return false;
  return M[action].includes(role);
}

export const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  scrum_master: 'Scrum Master',
  member: 'Member',
  viewer: 'Viewer',
};
