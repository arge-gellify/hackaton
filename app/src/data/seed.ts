import type { Project, Retro, Report, User } from '../domain/types';

const now = new Date();
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();

export const seedUsers: User[] = [
  { id: 'u_alice', name: 'Alice', avatarColor: '#0C5CAB' },
  { id: 'u_bob', name: 'Bob', avatarColor: '#10b981' },
  { id: 'u_carol', name: 'Carol', avatarColor: '#f59e0b' },
  { id: 'u_dan', name: 'Dan', avatarColor: '#a855f7' },
];

export const seedProjects: Project[] = [
  {
    id: 'p_phoenix',
    name: 'Phoenix Engineering',
    description: 'Core platform team — sprint retros and continuous improvement.',
    createdAt: daysAgo(60),
    members: [
      { userId: 'u_alice', role: 'admin' },
      { userId: 'u_bob', role: 'scrum_master' },
      { userId: 'u_carol', role: 'member' },
      { userId: 'u_dan', role: 'viewer' },
    ],
  },
  {
    id: 'p_marketing',
    name: 'Marketing Squad',
    description: 'Cross-functional marketing initiatives.',
    createdAt: daysAgo(30),
    members: [{ userId: 'u_alice', role: 'member' }],
  },
];

export const seedRetros: Retro[] = [
  {
    id: 'r_phoenix_active',
    projectId: 'p_phoenix',
    title: 'Sprint 24 Retro',
    templateId: 'wgw-wgb',
    status: 'active',
    createdAt: daysAgo(2),
    voteBudgetPerUser: 3,
    cards: [
      {
        id: 'c1', retroId: 'r_phoenix_active', columnKey: 'went_well', order: 0,
        text: 'Deployment pipeline stability — zero rollbacks.',
        authorId: 'u_carol',
        votes: [{ userId: 'u_alice' }, { userId: 'u_bob' }, { userId: 'u_carol' }],
        actionItems: [],
      },
      {
        id: 'c2', retroId: 'r_phoenix_active', columnKey: 'went_well', order: 1,
        text: 'Pairing on the auth refactor sped things up.',
        authorId: 'u_bob',
        votes: [{ userId: 'u_alice' }],
        actionItems: [],
      },
      {
        id: 'c3', retroId: 'r_phoenix_active', columnKey: 'went_badly', order: 0,
        text: 'Standups have been running 25+ minutes.',
        authorId: 'u_alice',
        votes: [{ userId: 'u_alice' }, { userId: 'u_bob' }],
        actionItems: [
          { id: 'ai1', cardId: 'c3', title: 'Introduce 15-min hard cap', assigneeId: 'u_bob', dueDate: daysAgo(-7), status: 'in_progress', createdAt: daysAgo(2) },
        ],
      },
      {
        id: 'c4', retroId: 'r_phoenix_active', columnKey: 'went_badly', order: 1,
        text: 'Flaky integration tests blocked main twice.',
        authorId: 'u_carol',
        votes: [{ userId: 'u_carol' }, { userId: 'u_bob' }, { userId: 'u_alice' }, { userId: 'u_alice' }],
        actionItems: [
          { id: 'ai2', cardId: 'c4', title: 'Quarantine flaky tests + own remediation', assigneeId: 'u_carol', dueDate: daysAgo(-14), status: 'open', createdAt: daysAgo(2) },
        ],
      },
      {
        id: 'c5', retroId: 'r_phoenix_active', columnKey: 'went_well', order: 2,
        text: 'New onboarding doc helped Dan get productive day one.',
        authorId: 'u_dan',
        votes: [],
        actionItems: [],
      },
    ],
  },
  {
    id: 'r_phoenix_closed_1',
    projectId: 'p_phoenix',
    title: 'Sprint 23 Retro',
    templateId: 'wgw-wgb',
    status: 'closed',
    createdAt: daysAgo(16),
    closedAt: daysAgo(14),
    voteBudgetPerUser: 3,
    cards: [
      { id: 'c10', retroId: 'r_phoenix_closed_1', columnKey: 'went_well', order: 0, text: 'Shipped the analytics rewrite ahead of schedule.', authorId: 'u_alice', votes: [{ userId: 'u_alice' }, { userId: 'u_bob' }, { userId: 'u_carol' }], actionItems: [] },
      { id: 'c11', retroId: 'r_phoenix_closed_1', columnKey: 'went_badly', order: 0, text: 'On-call rotation was uneven.', authorId: 'u_bob', votes: [{ userId: 'u_carol' }, { userId: 'u_bob' }], actionItems: [
        { id: 'ai10', cardId: 'c11', title: 'Rebalance on-call calendar', assigneeId: 'u_alice', dueDate: daysAgo(-3), status: 'done', createdAt: daysAgo(14) },
      ] },
    ],
  },
  {
    id: 'r_phoenix_closed_2',
    projectId: 'p_phoenix',
    title: 'Sprint 22 Retro',
    templateId: 'wgw-wgb',
    status: 'closed',
    createdAt: daysAgo(30),
    closedAt: daysAgo(28),
    voteBudgetPerUser: 3,
    cards: [
      { id: 'c20', retroId: 'r_phoenix_closed_2', columnKey: 'went_well', order: 0, text: 'Cross-team API design review was excellent.', authorId: 'u_carol', votes: [{ userId: 'u_alice' }], actionItems: [] },
      { id: 'c21', retroId: 'r_phoenix_closed_2', columnKey: 'went_badly', order: 0, text: 'Sprint planning ran over by 90 minutes.', authorId: 'u_alice', votes: [{ userId: 'u_alice' }, { userId: 'u_bob' }], actionItems: [
        { id: 'ai20', cardId: 'c21', title: 'Pre-groom backlog 24h before planning', assigneeId: 'u_bob', dueDate: daysAgo(-21), status: 'done', createdAt: daysAgo(28) },
      ] },
    ],
  },
  {
    id: 'r_marketing_active',
    projectId: 'p_marketing',
    title: 'Q2 Campaign Retro',
    templateId: 'wgw-wgb',
    status: 'active',
    createdAt: daysAgo(5),
    voteBudgetPerUser: 3,
    cards: [
      { id: 'cm1', retroId: 'r_marketing_active', columnKey: 'went_well', order: 0, text: 'Launch landing page converted 2x baseline.', authorId: 'u_alice', votes: [{ userId: 'u_alice' }], actionItems: [] },
    ],
  },
];

export const seedReports: Report[] = [
  {
    id: 'rep_1',
    retroId: 'r_phoenix_closed_1',
    generatedAt: daysAgo(14),
    isFinal: false,
    summary: '## Highlights\n\nAnalytics rewrite landed early. On-call uneven; rebalance scheduled.\n\n## Actions\n\n- Rebalance on-call calendar (done).',
  },
  {
    id: 'rep_2',
    retroId: 'r_phoenix_closed_2',
    generatedAt: daysAgo(28),
    isFinal: true,
    summary: '## Highlights\n\nStrong design review culture. Planning hygiene needs work.\n\n## Actions\n\n- Pre-groom backlog 24h before planning (done).',
  },
];
