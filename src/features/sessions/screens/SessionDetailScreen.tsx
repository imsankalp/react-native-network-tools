import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors } from '../../../config/color';
import { spacing } from '../../../config/spacing';
import { typography } from '../../../config/typography';
import { EmptyState } from '../../../components/EmptyState';
import { SearchBar } from '../../../components/SearchBar';
import { useNavigator } from '../../../navigation/NavigatorContext';
import { useSessions } from '../../../hooks/useSessions';
import { RequestListItem } from '../../network-requests/components/RequestListItem';
import { filterRequests } from '../../../util/filterRequests';
import type { ScreenParams } from '../../../navigation/types';
import type { SessionRequestSummary } from '../../../context/types';
import { formatDateTime, formatElapsed, pluralizeRequests } from '../format';

interface Props {
  screen: ScreenParams<'session-detail'>;
}

const SessionDetailScreen: React.FC<Props> = ({ screen }) => {
  const { sessions, getSessionSummaries } = useSessions();
  const { push } = useNavigator();
  const session = sessions.find((s) => s.id === screen.sessionId);
  const [summaries, setSummaries] = useState<SessionRequestSummary[] | null>(
    null
  );
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getSessionSummaries(screen.sessionId).then((result) => {
      if (!cancelled) setSummaries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [screen.sessionId, getSessionSummaries]);

  const filtered = useMemo(
    () => filterRequests(summaries ?? [], query),
    [summaries, query]
  );

  const renderItem = useCallback(
    ({ item }: { item: SessionRequestSummary }) => (
      <RequestListItem
        request={item}
        onPress={() =>
          push({
            name: 'request-detail',
            requestId: item.id,
            sessionId: screen.sessionId,
          })
        }
      />
    ),
    [push, screen.sessionId]
  );

  if (!session) {
    return (
      <View style={styles.container}>
        <EmptyState
          icon="⚠️"
          title="Session not available"
          subtitle="It may have been deleted."
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>
          {session.name}
        </Text>
        <Text style={styles.meta}>
          {formatDateTime(session.startTime)} →{' '}
          {formatDateTime(session.endTime)}
        </Text>
        <Text style={styles.meta}>
          {formatElapsed(session.endTime - session.startTime)} ·{' '}
          {pluralizeRequests(session.requestCount)}
        </Text>
        {session.limitReached ? (
          <Text style={styles.limit}>
            Request limit reached — later requests were not recorded.
          </Text>
        ) : null}
      </View>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search URL, method, status…"
      />
      {summaries === null ? (
        <ActivityIndicator style={styles.loading} color={colors.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={
            filtered.length === 0 ? styles.emptyContent : undefined
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          ListEmptyComponent={
            query ? (
              <EmptyState
                icon="🔍"
                title={`No results for "${query}"`}
                subtitle="Try a different URL, method, or status code."
              />
            ) : (
              <EmptyState icon="📭" title="No requests in this session" />
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  name: { ...typography.mono, color: colors.textPrimary },
  meta: { ...typography.label, color: colors.textSecondary, marginTop: 2 },
  limit: { ...typography.label, color: colors.warning, marginTop: spacing.xs },
  loading: { marginTop: spacing.lg },
  emptyContent: { flexGrow: 1 },
});

export default SessionDetailScreen;
