import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../config/color';
import { spacing } from '../../../../config/spacing';
import { typography } from '../../../../config/typography';
import { KeyValueTable } from '../../../../components/KeyValueTable';
import { JsonViewer } from '../../../../components/JsonViewer';
import type { NetworkRequest } from '../../../../context/types';

interface ResponseTabProps {
  request: NetworkRequest;
}

export const ResponseTab: React.FC<ResponseTabProps> = ({ request }) => {
  const hasHeaders =
    request.responseHeaders && Object.keys(request.responseHeaders).length > 0;
  const hasError = Boolean(request.error || request.customError);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Headers</Text>
      {hasHeaders ? (
        <KeyValueTable data={request.responseHeaders} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No response headers</Text>
        </View>
      )}

      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Body</Text>
      {request.responseBody ? (
        <JsonViewer value={request.responseBody} />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No response body</Text>
        </View>
      )}

      {hasError ? (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Error Details</Text>
          <View style={styles.errorBlock}>
            {request.error ? (
              <Text style={styles.errorText} selectable>
                {request.error}
              </Text>
            ) : null}
            {request.customError ? (
              <Text style={styles.errorText} selectable>
                {request.customError.message}
              </Text>
            ) : null}
          </View>
        </>
      ) : null}
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
  errorBlock: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#2D1515',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: {
    ...typography.mono,
    color: colors.textPrimary,
  },
});
