import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';

interface KeyValueTableProps {
  data: Record<string, string> | [string, string][];
  /** Optional section title rendered above the table in overline style. */
  title?: string;
}

function toEntries(data: KeyValueTableProps['data']): [string, string][] {
  return Array.isArray(data) ? data : Object.entries(data);
}

export const KeyValueTable: React.FC<KeyValueTableProps> = ({
  data,
  title,
}) => {
  const entries = toEntries(data);
  if (entries.length === 0) return null;

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {entries.map(([key, value], idx) => (
        <View
          key={`${key}-${idx}`}
          style={[styles.row, idx < entries.length - 1 && styles.rowBorder]}
        >
          <Text style={styles.key} numberOfLines={1}>
            {key}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.valueScroll}
          >
            <Text style={styles.value} selectable>
              {value}
            </Text>
          </ScrollView>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.overline,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xs,
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  key: {
    ...typography.mono,
    color: colors.textSecondary,
    width: 120,
    flexShrink: 0,
    marginRight: spacing.sm,
  },
  valueScroll: {
    flex: 1,
  },
  value: {
    ...typography.mono,
    color: colors.textPrimary,
  },
});
