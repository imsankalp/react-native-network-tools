export const colors = {
  // ── Brand ──────────────────────────────────────────────────────────────────
  primary: '#4A6FA5',
  secondary: '#6B4E90',

  // ── Semantic states ────────────────────────────────────────────────────────
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',

  // ── Surfaces ───────────────────────────────────────────────────────────────
  background: '#1E1E1E', // root panel background
  surfaceBg: '#121212', // elevated card / code block background
  surface2: '#2A2A2A', // row hover / pressed state background

  // ── Grey scale ─────────────────────────────────────────────────────────────
  grey0: '#F8F9FA',
  grey1: '#E9ECEF',
  grey2: '#DEE2E6',
  grey3: '#ADB5BD',
  grey4: '#6C757D',
  grey5: '#495057',
  greyOutline: '#CED4DA',
  searchBg: '#F1F3F5',

  // ── Base ───────────────────────────────────────────────────────────────────
  white: '#FFFFFF',
  black: '#212529',
  transparent: 'transparent',

  // ── Semantic UI tokens (new) ────────────────────────────────────────────────
  border: '#2E2E2E', // thin separator lines between rows / sections
  divider: '#1A1A1A', // heavier section divider (e.g. between header and list)
  tabBarBackground: '#181818', // bottom tab bar background
  tabBarActiveIndicator: '#4A6FA5', // 2px underline on the active tab (same as primary)
  overlayDim: 'rgba(0,0,0,0.45)', // semi-transparent backdrop for modals
  inputBackground: '#252525', // search bar and text input fill
  placeholderText: '#5A5A5A', // TextInput placeholder colour
  textPrimary: '#E8E8E8', // main body text on dark background
  textSecondary: '#9E9E9E', // de-emphasised labels, metadata
  textMuted: '#616161', // fully de-emphasised — timestamps, secondary captions
} as const;

export const httpMethodColors = {
  GET: { backgroundColor: '#1B5E20', textColor: '#A5D6A7' },
  POST: { backgroundColor: '#0D47A1', textColor: '#90CAF9' },
  PUT: { backgroundColor: '#E65100', textColor: '#FFCC80' },
  PATCH: { backgroundColor: '#4A148C', textColor: '#CE93D8' },
  DELETE: { backgroundColor: '#B71C1C', textColor: '#EF9A9A' },
  HEAD: { backgroundColor: '#006064', textColor: '#80DEEA' },
  OPTIONS: { backgroundColor: '#33691E', textColor: '#C5E1A5' },
  CONNECT: { backgroundColor: '#1A237E', textColor: '#9FA8DA' },
  TRACE: { backgroundColor: '#880E4F', textColor: '#F48FB1' },
} as const;
