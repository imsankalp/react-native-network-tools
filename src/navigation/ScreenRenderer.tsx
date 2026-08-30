import React from 'react';
import type { Screen } from './types';
import { PlaceholderScreen } from './PlaceholderScreen';
import RequestListScreen from '../features/network-requests/screens/RequestListScreen';
import RequestDetailScreen from '../features/network-requests/screens/RequestDetailScreen';

// ─── Screen component type ────────────────────────────────────────────────────

type ScreenComponent<S extends Screen = Screen> = React.ComponentType<{
  screen: S;
}>;

// ─── Registry ─────────────────────────────────────────────────────────────────
// Must contain an entry for every Screen['name'] value.
// TypeScript enforces exhaustiveness: adding a new Screen variant without
// registering it here produces a compile error on the Record type below.

const SCREEN_REGISTRY: {
  [K in Screen['name']]: ScreenComponent<Extract<Screen, { name: K }>>;
} = {
  // ── Requests ──────────────────────────────────────────────────────────────
  'request-list': RequestListScreen as ScreenComponent<
    Extract<Screen, { name: 'request-list' }>
  >,
  'request-detail': RequestDetailScreen,

  // ── WebSocket (placeholder — implemented in a future release) ─────────────
  'websocket-list': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'websocket-list' }>
  >,
  'websocket-detail': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'websocket-detail' }>
  >,

  // ── Sessions (placeholder — implemented in a future release) ──────────────
  'session-list': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'session-list' }>
  >,
  'session-detail': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'session-detail' }>
  >,
  'session-recording': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'session-recording' }>
  >,

  // ── Insights (placeholder — implemented in a future release) ──────────────
  'insights-overview': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'insights-overview' }>
  >,
  'insights-performance': PlaceholderScreen as ScreenComponent<
    Extract<Screen, { name: 'insights-performance' }>
  >,
};

// ─── Renderer ────────────────────────────────────────────────────────────────
// Accepts no props — reads the active screen exclusively from NavigatorContext
// via the `screen` prop passed in by Navigator.tsx.

interface ScreenRendererProps {
  screen: Screen;
}

export const ScreenRenderer: React.FC<ScreenRendererProps> = ({ screen }) => {
  const Component = SCREEN_REGISTRY[screen.name] as ScreenComponent;
  return <Component screen={screen} />;
};
