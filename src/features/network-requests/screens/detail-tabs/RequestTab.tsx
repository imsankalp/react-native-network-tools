import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../config/color';
import { spacing } from '../../../../config/spacing';
import { typography } from '../../../../config/typography';
import { KeyValueTable } from '../../../../components/KeyValueTable';
import { JsonViewer } from '../../../../components/JsonViewer';
import type { NetworkRequest } from '../../../../context/types';

interface RequestTabProps {
  request: NetworkRequest;
}

export const RequestTab: React.FC<RequestTabProps> = ({ request }) => {
  const hasHeaders =
    request.requestHeaders && Object.keys(request.requestHeaders).length > 0;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Headers</Text>
      {hasHeaders ? (
        <KeyValueTable data={request.requestHeaders} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No request headers</Text>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Body</Text>
      {request.requestBody ? (
        <JsonViewer value={request.requestBody} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No request body</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  sectionTitle: {
    ...typography.overline,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  divider: {
    height: spacing.sm,
    backgroundColor: colors.divider,
  },
  empty: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '400',
  },
});
