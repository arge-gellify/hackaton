import { format, formatDistanceToNow, parseISO } from 'date-fns';

export const fmtDate = (iso?: string) => (iso ? format(parseISO(iso), 'MMM d, yyyy') : '—');
export const fmtRel = (iso?: string) =>
  iso ? formatDistanceToNow(parseISO(iso), { addSuffix: true }) : '—';
