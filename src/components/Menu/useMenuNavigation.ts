import { useCallback, useState } from 'react';
import type { MenuItem } from './types';

export type NavDirection = 1 | -1;

interface NavState {
  trail: MenuItem[];
  direction: NavDirection;
  returnFocusId: string | null;
}

const INITIAL_STATE: NavState = { trail: [], direction: 1, returnFocusId: null };

export interface MenuNavigation {
  trail: MenuItem[];
  current: MenuItem | undefined;
  items: MenuItem[];
  depth: number;
  direction: NavDirection;
  returnFocusId: string | null;
  open: (group: MenuItem) => void;
  back: () => void;
  reset: () => void;
}

export function useMenuNavigation(rootItems: MenuItem[]): MenuNavigation {
  const [state, setState] = useState<NavState>(INITIAL_STATE);

  const open = useCallback((group: MenuItem) => {
    setState((prev) => ({
      trail: [...prev.trail, group],
      direction: 1,
      returnFocusId: null,
    }));
  }, []);

  const back = useCallback(() => {
    setState((prev) => {
      if (prev.trail.length === 0) return prev;
      const leaving = prev.trail[prev.trail.length - 1];
      return {
        trail: prev.trail.slice(0, -1),
        direction: -1,
        returnFocusId: leaving.id,
      };
    });
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const current = state.trail[state.trail.length - 1];

  return {
    trail: state.trail,
    current,
    items: current ? current.children! : rootItems,
    depth: state.trail.length,
    direction: state.direction,
    returnFocusId: state.returnFocusId,
    open,
    back,
    reset,
  };
}
