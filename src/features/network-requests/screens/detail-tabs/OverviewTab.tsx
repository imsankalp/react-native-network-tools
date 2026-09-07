import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../config/color';
import { spacing } from '../../../../config/spacing';
import { typography } from '../../../../config/typography';
import { MethodBadge, StatusBadge } from '../../../../components/Badge';
import type { NetworkRequest } from '../../../../context/types';

interface OverviewTabProps {
  request: NetworkRequest;
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleString();
}

interface FieldRowProps {
  label: string;
  children: React.ReactNode;
}

const FieldRow: React.FC<FieldRowProps> = ({ label, children }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.value}>{children}</View>
  </View>
);

export const OverviewTab: React.FC<OverviewTabProps> = ({ request }) => (
  <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
    <FieldRow label="URL">
      <Text style={styles.url} selectable>
        {request.url}
      </Text>
    </FieldRow>

    <FieldRow label="Method">
      <MethodBadge method={request.method} />
    </FieldRow>

    <FieldRow label="Status">
      {request.responseCode ? (
        <StatusBadge status={request.responseCode} />
      ) : (
        <Text style={styles.pending}>Pending…</Text>
      )}
    </FieldRow>

    <FieldRow label="Duration">
      <Text style={styles.text}>{formatDuration(request.duration)}</Text>
    </FieldRow>

    <FieldRow label="Started">
      <Text style={styles.text}>{formatTimestamp(request.requestTime)}</Text>
    </FieldRow>

    <FieldRow label="Completed">
      <Text style={styles.text}>{formatTimestamp(request.responseTime)}</Text>
    </FieldRow>

    {request.customError ? (
      <View style={styles.errorBlock}>
        <Text style={styles.errorTitle}>Custom Error</Text>
        <Text style={styles.errorMsg}>{request.customError.message}</Text>
        {request.customError.code ? (
          <Text style={styles.errorCode}>Code: {request.customError.code}</Text>
        ) : null}
        {request.customError.type ? (
          <Text style={styles.errorCode}>Type: {request.customError.type}</Text>
        ) : null}
      </View>
    ) : null}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingVertical: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
    width: 80,
    paddingTop: 2,
  },
  value: {
    flex: 1,
  },
  url: {
    ...typography.mono,
    color: colors.textPrimary,
    flexWrap: 'wrap',
  },
  text: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
  },
  pending: {
    ...typography.label,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  errorBlock: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#2D1515',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorTitle: {
    ...typography.label,
    color: colors.error,
    marginBottom: spacing.xs,
    fontWeight: '700',
  },
  errorMsg: {
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  errorCode: {
    ...typography.mono,
    color: colors.textSecondary,
  },
});
