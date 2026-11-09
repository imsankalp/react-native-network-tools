import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../../config/color';
import { spacing } from '../../../../config/spacing';
import { typography } from '../../../../config/typography';
import { JsonViewer } from '../../../../components/JsonViewer';
import type { BodyEncoding } from '../../../../context/types';

interface BodySectionProps {
  body?: string;
  truncated?: boolean;
  encoding?: BodyEncoding;
  emptyLabel: string;
}

export const BodySection: React.FC<BodySectionProps> = ({
  body,
  truncated,
  encoding,
  emptyLabel,
}) => {
  if (encoding === 'omitted') {
    return (
      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          Binary or non-UTF-8 body — not captured
        </Text>
      </View>
    );
  }

  if (!body) {
    return (
      <View style={styles.notice}>
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <>
      {truncated ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Truncated at the body capture limit
          </Text>
        </View>
      ) : null}
      <JsonViewer value={body} />
    </>
  );
};

const styles = StyleSheet.create({
  notice: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noticeText: {
    ...typography.caption,
    color: colors.warning,
  },
  emptyText: {
    ...typography.caption,
    color: colors.textMuted,
    fontWeight: '400',
  },
});
