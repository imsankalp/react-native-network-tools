import { colors } from './color';

export const typography = {
  // ── Headings ────────────────────────────────────────────────────────────────
  h1: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },

  // ── Body ────────────────────────────────────────────────────────────────────
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.grey4,
    fontWeight: '500' as const,
  },

  // ── New tokens ──────────────────────────────────────────────────────────────

  // Tab bar labels, badge text, tight metadata.
  label: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },

  // Fixed-width text for request/response headers, JSON bodies, URLs.
  // Platform-agnostic: 'monospace' resolves to Courier New (iOS) / Droid Sans Mono (Android).
  mono: {
    fontSize: 13,
    fontFamily: 'monospace' as const,
    lineHeight: 20,
  },

  // All-caps section headings above KeyValueTable rows and detail sections.
  overline: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: colors.textSecondary,
  },
};
