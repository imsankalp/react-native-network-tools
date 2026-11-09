import React, { useCallback, useEffect } from 'react';
import {
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
import type { SessionIndexEntry } from '../../../context/types';
import { formatDateTime, formatElapsed, pluralizeRequests } from '../format';

const UNAVAILABLE_COPY = {
  'native-unavailable': {
    title: 'Sessions unavailable',
    subtitle:
      'The native module is not available. Use a development build (not Expo Go).',
  },
  'capture-inactive': {
    title: 'Network capture is off',
    subtitle:
      'Recording needs native capture. Sessions only work in debug builds where the app activates NetworkTools.',
  },
} as const;

const SessionListScreen: React.FC = () => {
  const {
    availability,
    activeSession,
    sessions,
    startSession,
    refreshSessions,
    deleteSession,
    clearSessions,
  } = useSessions();
  const { push } = useNavigator();

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  const handleStart = useCallback(() => {
    if (startSession()) {
      push({ name: 'session-recording' });
    } else {
      Alert.alert(
        'Could not start recording',
        'A recording may already be in progress.'
      );
    }
  }, [startSession, push]);

  const handleDeleteAll = useCallback(() => {
    Alert.alert('Delete all sessions?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: () => clearSessions(),
      },
    ]);
  }, [clearSessions]);

  const renderItem = useCallback(
    ({ item }: { item: SessionIndexEntry }) => (
      // Siblings, not nested: a nested touchable is hidden from VoiceOver on iOS.
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.rowText}
          activeOpacity={0.7}
          onPress={() => push({ name: 'session-detail', sessionId: item.id })}
        >
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.rowMeta}>
            {formatDateTime(item.startTime)} ·{' '}
            {formatElapsed(item.endTime - item.startTime)} ·{' '}
            {pluralizeRequests(item.requestCount)}
          </Text>
          {item.limitReached ? (
            <Text style={styles.limit}>Limit reached</Text>
          ) : null}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteSession(item.id)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.name}`}
        >
          <Text style={styles.deleteOne}>✕</Text>
        </TouchableOpacity>
      </View>
    ),
    [push, deleteSession]
  );

  if (availability !== 'available') {
    const copy = UNAVAILABLE_COPY[availability];
    return (
      <View style={styles.container}>
        <EmptyState icon="🎬" title={copy.title} subtitle={copy.subtitle} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activeSession ? (
        <TouchableOpacity
          style={styles.banner}
          onPress={() => push({ name: 'session-recording' })}
          accessibilityRole="button"
        >
          <View style={styles.recDot} />
          <Text style={styles.bannerText}>Recording… tap to return</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.toolbar}>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStart}
            accessibilityRole="button"
          >
            <Text style={styles.startText}>● Start recording</Text>
          </TouchableOpacity>
          {sessions.length > 0 ? (
            <TouchableOpacity
              onPress={handleDeleteAll}
              accessibilityRole="button"
            >
              <Text style={styles.deleteAll}>Delete all</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={
          sessions.length === 0 ? styles.emptyContent : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="🎬"
            title="No sessions yet"
            subtitle="Start a recording to capture the requests of one flow."
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  startButton: {
    backgroundColor: colors.error,
    borderRadius: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  startText: { ...typography.label, color: colors.white, fontWeight: '600' },
  deleteAll: { ...typography.label, color: colors.error },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
    marginRight: spacing.sm,
  },
  bannerText: { ...typography.label, color: colors.textPrimary },
  emptyContent: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowText: { flex: 1, marginRight: spacing.sm },
  rowName: { ...typography.mono, color: colors.textPrimary },
  rowMeta: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  limit: { ...typography.label, color: colors.warning, marginTop: 2 },
  deleteOne: { ...typography.body, color: colors.textMuted },
});

export default SessionListScreen;
