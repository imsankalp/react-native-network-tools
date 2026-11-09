import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../../../config/color';
import { spacing } from '../../../config/spacing';
import { typography } from '../../../config/typography';
import { EmptyState } from '../../../components/EmptyState';
import { useNavigator } from '../../../navigation/NavigatorContext';
import { useSessions } from '../../../hooks/useSessions';
import { RequestListItem } from '../../network-requests/components/RequestListItem';
import type { SessionRequestSummary } from '../../../context/types';
import { formatElapsed, pluralizeRequests } from '../format';

function useElapsed(startTime: number | undefined): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (startTime === undefined) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return startTime === undefined ? 0 : now - startTime;
}

const SessionRecordingScreen: React.FC = () => {
  const { activeSession, activeRequests, stopSession } = useSessions();
  const { push, replace, pop } = useNavigator();
  const [saving, setSaving] = useState(false);
  const elapsed = useElapsed(activeSession?.startTime);

  const handleStop = useCallback(async () => {
    setSaving(true);
    const entry = await stopSession();
    if (entry) {
      replace({ name: 'session-detail', sessionId: entry.id });
    } else {
      setSaving(false);
      Alert.alert(
        'Session not saved',
        'The recording could not be written to disk.'
      );
      pop();
    }
  }, [stopSession, replace, pop]);

  const renderItem = useCallback(
    ({ item }: { item: SessionRequestSummary }) => (
      <RequestListItem
        request={item}
        onPress={() => push({ name: 'request-detail', requestId: item.id })}
      />
    ),
    [push]
  );

  if (saving) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.savingText}>Saving session…</Text>
      </View>
    );
  }

  if (!activeSession) {
    return (
      <View style={styles.container}>
        <EmptyState icon="⏹" title="No active recording" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.recDot} />
          <Text style={styles.name} numberOfLines={1}>
            {activeSession.name}
          </Text>
        </View>
        <Text style={styles.meta}>
          {formatElapsed(elapsed)} ·{' '}
          {pluralizeRequests(activeSession.requestCount)}
        </Text>
        {activeSession.limitReached ? (
          <Text style={styles.limit}>
            Request limit reached — new requests are no longer added.
          </Text>
        ) : null}
        <Text style={styles.note}>
          Requests still in flight when you stop aren't included.
        </Text>
        <TouchableOpacity
          style={styles.stopButton}
          onPress={handleStop}
          accessibilityRole="button"
        >
          <Text style={styles.stopText}>■ Stop</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={activeRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          activeRequests.length === 0 ? styles.emptyContent : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="📡"
            title="Waiting for requests"
            subtitle="Use the app; completed requests appear here."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  savingText: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  name: { ...typography.mono, color: colors.textPrimary, flex: 1 },
  meta: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  limit: { ...typography.label, color: colors.warning, marginTop: spacing.xs },
  note: { ...typography.label, color: colors.textMuted, marginTop: spacing.xs },
  stopButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stopText: {
    ...typography.label,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  emptyContent: { flexGrow: 1 },
});

export default SessionRecordingScreen;
