// ─── Tabs ────────────────────────────────────────────────────────────────────

export type Tab = 'requests' | 'websocket' | 'sessions' | 'insights';

// ─── Screens ─────────────────────────────────────────────────────────────────
// Each variant is a discriminated union member keyed by `name`.
// To add a new screen: append a new object type to this union.
// No other type changes are required anywhere else.

export type Screen =
  // Requests feature
  | { name: 'request-list' }
  | { name: 'request-detail'; requestId: string }
  // WebSocket feature (forward-compat placeholder)
  | { name: 'websocket-list' }
  | { name: 'websocket-detail'; connectionId: string }
  // Sessions feature (forward-compat placeholder)
  | { name: 'session-list' }
  | { name: 'session-detail'; sessionId: string }
  | { name: 'session-recording' }
  // Insights feature (forward-compat placeholder)
  | { name: 'insights-overview' }
  | { name: 'insights-performance' };

// Utility: extract the params type for a specific screen by name.
export type ScreenParams<N extends Screen['name']> = Extract<
  Screen,
  { name: N }
>;

// ─── Navigator State ──────────────────────────────────────────────────────────

export type NavigatorState = {
  activeTab: Tab;
  // Each tab keeps its own independent navigation stack.
  // Stacks always have at least one entry (the root screen for that tab).
  stacks: Record<Tab, [Screen, ...Screen[]]>;
};

// ─── Actions ─────────────────────────────────────────────────────────────────

export type NavAction =
  | { type: 'SWITCH_TAB'; tab: Tab }
  | { type: 'PUSH'; screen: Screen }
  | { type: 'POP' }
  | { type: 'POP_TO_ROOT' };

// ─── Context ─────────────────────────────────────────────────────────────────

export type NavigatorContextType = {
  activeTab: Tab;
  currentScreen: Screen;
  canGoBack: boolean;
  stackDepth: number;
  switchTab: (tab: Tab) => void;
  push: (screen: Screen) => void;
  pop: () => void;
  popToRoot: () => void;
};
