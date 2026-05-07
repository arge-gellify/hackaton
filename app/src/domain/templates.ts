import type { RetroTemplate } from './types';

export const TEMPLATES: RetroTemplate[] = [
  {
    id: 'wgw-wgb',
    name: 'What went well / What went badly',
    columns: [
      { key: 'went_well', title: 'What went well' },
      { key: 'went_badly', title: 'What went badly' },
    ],
  },
];

export const getTemplate = (id: string) =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
