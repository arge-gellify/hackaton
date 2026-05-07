import { useCallback } from 'react';

export type Politeness = 'polite' | 'assertive';

let announceFn: ((politeness: Politeness, text: string) => void) | null = null;

export function setAnnouncer(fn: ((politeness: Politeness, text: string) => void) | null) {
  announceFn = fn;
}

export function announce(politeness: Politeness, text: string) {
  announceFn?.(politeness, text);
}

export function useAnnouncer() {
  return useCallback((politeness: Politeness, text: string) => {
    announceFn?.(politeness, text);
  }, []);
}
