import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../config/color';
import { spacing } from '../../../config/spacing';
import { typography } from '../../../config/typography';
import { LIST_ITEM_HEIGHT } from '../../../config/layout';
import { MethodBadge, StatusBadge } from '../../../components/Badge';
import type { NetworkRequest } from '../../../context/types';

interface RequestListItemProps {
  request: NetworkRequest;
  onPress: () => void;
}

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatTime(ts: number | null | undefined): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function urlPath(url: string): string {
  try {
    return new URL(url).pathname || url;
  } catch {
    return url;
  }
}

function statusColor(code: number): string {
  if (code >= 500) return colors.error;
  if (code >= 400) return colors.warning;
  if (code >= 200) return colors.success;
  return colors.textMuted;
}

const RequestListItemInner: React.FC<RequestListItemProps> = ({
  request,
  onPress,
}) => {
  const isPending = !request.responseCode;
  const isError = request.responseCode >= 400;

  return (
    <TouchableOpacity
      style={[styles.row, isError && styles.rowError]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Left: HTTP method badge */}
      <View style={styles.methodCol}>
        <MethodBadge method={request.method} />
      </View>

      {/* Center: status + URL path */}
      <View style={styles.centerCol}>
        <View style={styles.centerTop}>
          {isPending ? (
            <Text style={styles.pending}>···</Text>
          ) : (
            <StatusBadge status={request.responseCode} />
          )}
          <Text
            style={[
              styles.statusText,
              !isPending && { color: statusColor(request.responseCode) },
            ]}
          />
        </View>
        <Text style={styles.url} numberOfLines={1} ellipsizeMode="middle">
          {urlPath(request.url)}
        </Text>
      </View>

      {/* Right: duration + time */}
      <View style={styles.metaCol}>
        <Text style={styles.duration}>{formatDuration(request.duration)}</Text>
        <Text style={styles.time}>{formatTime(request.requestTime)}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Re-render only when id or responseCode changes.
export const RequestListItem = React.memo(
  RequestListItemInner,
  (prev, next) =>
    prev.request.id === next.request.id &&
    prev.request.responseCode === next.request.responseCode &&
    prev.onPress === next.onPress
);

const styles = StyleSheet.create({
  row: {
    height: LIST_ITEM_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowError: {
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  methodCol: {
    width: 60,
    marginRight: spacing.sm,
  },
  centerCol: {
    flex: 1,
    justifyContent: 'center',
  },
  centerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  statusText: {
    ...typography.label,
    marginLeft: spacing.xs,
  },
  pending: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 2,
  },
  url: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  metaCol: {
    alignItems: 'flex-end',
    marginLeft: spacing.sm,
  },
  duration: {
    ...typography.label,
    color: colors.textPrimary,
  },
  time: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
});
