import type { NavAction, NavigatorState, Tab, Screen } from './types';

// ─── Root screens ─────────────────────────────────────────────────────────────
// Each tab's stack always starts with its designated root screen.
// When POP_TO_ROOT fires, the stack is trimmed back to this single entry.

const ROOT_SCREENS: Record<Tab, Screen> = {
  requests: { name: 'request-list' },
  websocket: { name: 'websocket-list' },
  sessions: { name: 'session-list' },
  insights: { name: 'insights-overview' },
};

// ─── Initial state ────────────────────────────────────────────────────────────

export const INITIAL_STATE: NavigatorState = {
  activeTab: 'requests',
  stacks: {
    requests: [ROOT_SCREENS.requests],
    websocket: [ROOT_SCREENS.websocket],
    sessions: [ROOT_SCREENS.sessions],
    insights: [ROOT_SCREENS.insights],
  },
};

// Factory used in tests so each test gets an independent state object.
export function createInitialState(): NavigatorState {
  return {
    activeTab: 'requests',
    stacks: {
      requests: [ROOT_SCREENS.requests],
      websocket: [ROOT_SCREENS.websocket],
      sessions: [ROOT_SCREENS.sessions],
      insights: [ROOT_SCREENS.insights],
    },
  };
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

export function navigatorReducer(
  state: NavigatorState,
  action: NavAction
): NavigatorState {
  switch (action.type) {
    case 'SWITCH_TAB': {
      // Switching to the already-active tab is a no-op — return same reference
      // so downstream selectors / React.memo consumers don't re-render.
      if (action.tab === state.activeTab) return state;
      return { ...state, activeTab: action.tab };
    }

    case 'PUSH': {
      const currentStack = state.stacks[state.activeTab];
      return {
        ...state,
        stacks: {
          ...state.stacks,
          [state.activeTab]: [...currentStack, action.screen],
        },
      };
    }

    case 'POP': {
      const currentStack = state.stacks[state.activeTab];
      // Already at root — no-op, return same reference to avoid re-render.
      if (currentStack.length <= 1) return state;
      return {
        ...state,
        stacks: {
          ...state.stacks,
          [state.activeTab]: currentStack.slice(0, -1),
        },
      };
    }

    case 'POP_TO_ROOT': {
      const currentStack = state.stacks[state.activeTab];
      // Already at root — no-op.
      if (currentStack.length <= 1) return state;
      return {
        ...state,
        stacks: {
          ...state.stacks,
          [state.activeTab]: [ROOT_SCREENS[state.activeTab]],
        },
      };
    }
  }
}
