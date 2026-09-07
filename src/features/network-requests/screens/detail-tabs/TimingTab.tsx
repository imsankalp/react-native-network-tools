import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../config/color';
import { spacing } from '../../../../config/spacing';
import { typography } from '../../../../config/typography';
import {
  TIMING_BAR_HEIGHT,
  TIMING_BAR_MAX_REFERENCE_MS,
} from '../../../../config/layout';
import type { NetworkRequest } from '../../../../context/types';

interface TimingTabProps {
  request: NetworkRequest;
}

function barColor(ms: number): string {
  if (ms > 1500) return colors.error;
  if (ms > 500) return colors.warning;
  return colors.success;
}

function formatTs(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  } as Intl.DateTimeFormatOptions);
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

interface TimingRowProps {
  label: string;
  value: string;
}

const TimingRow: React.FC<TimingRowProps> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

export const TimingTab: React.FC<TimingTabProps> = ({ request }) => {
  const duration = request.duration ?? 0;
  const fraction = Math.min(duration / TIMING_BAR_MAX_REFERENCE_MS, 1);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <TimingRow label="Started At" value={formatTs(request.requestTime)} />
      <TimingRow label="Completed At" value={formatTs(request.responseTime)} />
      <TimingRow label="Total Duration" value={formatDuration(duration)} />

      {duration > 0 ? (
        <View style={styles.barSection}>
          <Text style={styles.barLabel}>Duration</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  flex: fraction,
                  backgroundColor: barColor(duration),
                },
              ]}
            />
            {fraction < 1 ? <View style={{ flex: 1 - fraction }} /> : null}
          </View>
          <Text style={styles.barCaption}>
            {duration}ms / {TIMING_BAR_MAX_REFERENCE_MS}ms reference
          </Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  value: {
    ...typography.mono,
    color: colors.textPrimary,
  },
  barSection: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  barLabel: {
    ...typography.overline,
    marginBottom: spacing.sm,
  },
  track: {
    flexDirection: 'row',
    height: TIMING_BAR_HEIGHT,
    backgroundColor: colors.surface2,
    borderRadius: TIMING_BAR_HEIGHT / 2,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: TIMING_BAR_HEIGHT / 2,
  },
  barCaption: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
});
