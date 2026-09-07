import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, httpMethodColors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';

// ─── HTTP Method Badge ────────────────────────────────────────────────────────

type HttpMethod = keyof typeof httpMethodColors;

interface MethodBadgeProps {
  method: string;
}

export const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const upper = method.toUpperCase() as HttpMethod;
  const scheme = httpMethodColors[upper] ?? {
    backgroundColor: colors.surface2,
    textColor: colors.textSecondary,
  };
  return (
    <View style={[styles.pill, { backgroundColor: scheme.backgroundColor }]}>
      <Text style={[styles.pillText, { color: scheme.textColor }]}>
        {upper}
      </Text>
    </View>
  );
};

// ─── HTTP Status Badge ────────────────────────────────────────────────────────

function statusColor(status: number): {
  backgroundColor: string;
  textColor: string;
} {
  if (status >= 500)
    return { backgroundColor: '#B71C1C', textColor: '#EF9A9A' };
  if (status >= 400)
    return { backgroundColor: '#E65100', textColor: '#FFCC80' };
  if (status >= 300)
    return { backgroundColor: '#0D47A1', textColor: '#90CAF9' };
  if (status >= 200)
    return { backgroundColor: '#1B5E20', textColor: '#A5D6A7' };
  return { backgroundColor: colors.surface2, textColor: colors.textSecondary };
}

interface StatusBadgeProps {
  status: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const scheme = statusColor(status);
  return (
    <View style={[styles.pill, { backgroundColor: scheme.backgroundColor }]}>
      <Text style={[styles.pillText, { color: scheme.textColor }]}>
        {status}
      </Text>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pillText: {
    ...typography.label,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
