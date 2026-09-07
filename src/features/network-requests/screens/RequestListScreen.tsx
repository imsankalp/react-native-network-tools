import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { colors } from '../../../config/color';
import {
  LIST_ITEM_HEIGHT,
  LIST_ITEM_DIVIDER_HEIGHT,
} from '../../../config/layout';
import { useNetworkMonitor } from '../../../context/NetworkMonitorContext';
import { useNavigator } from '../../../navigation/NavigatorContext';
import { EmptyState } from '../../../components/EmptyState';
import { SearchBar } from '../../../components/SearchBar';
import { RequestListItem } from '../components/RequestListItem';
import type { NetworkRequest } from '../../../context/types';

function filterRequests(
  requests: NetworkRequest[],
  query: string
): NetworkRequest[] {
  if (!query.trim()) return requests;
  const q = query.toLowerCase();
  return requests.filter(
    (r) =>
      r.url.toLowerCase().includes(q) ||
      r.method.toLowerCase().includes(q) ||
      String(r.responseCode).includes(q)
  );
}

const ITEM_TOTAL_HEIGHT = LIST_ITEM_HEIGHT + LIST_ITEM_DIVIDER_HEIGHT;

const RequestListScreen: React.FC = () => {
  const { requests } = useNetworkMonitor();
  const { push } = useNavigator();
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterRequests(requests, query),
    [requests, query]
  );

  const handlePress = useCallback(
    (id: string) => {
      push({ name: 'request-detail', requestId: id });
    },
    [push]
  );

  const keyExtractor = useCallback((item: NetworkRequest) => item.id, []);

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_TOTAL_HEIGHT,
      offset: ITEM_TOTAL_HEIGHT * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: NetworkRequest }) => (
      <RequestListItem request={item} onPress={() => handlePress(item.id)} />
    ),
    [handlePress]
  );

  const emptyComponent = useMemo(
    () =>
      query ? (
        <EmptyState
          icon="🔍"
          title={`No results for "${query}"`}
          subtitle="Try a different URL, method, or status code."
        />
      ) : (
        <EmptyState
          icon="📡"
          title="No Requests Yet"
          subtitle="Make a network request and it will appear here."
        />
      ),
    [query]
  );

  return (
    <View style={styles.container}>
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search URL, method, status…"
      />
      <FlatList
        data={filtered}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        ListEmptyComponent={emptyComponent}
        initialNumToRender={20}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default RequestListScreen;
