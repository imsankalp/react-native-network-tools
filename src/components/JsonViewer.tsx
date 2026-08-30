import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';

interface JsonViewerProps {
  /** Raw JSON string or already-parsed value. */
  value: string | unknown;
  /** Maximum characters before showing truncation notice (default 20 000). */
  maxLength?: number;
}

function tryFormat(value: string | unknown, maxLength: number): string {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    const formatted = JSON.stringify(parsed, null, 2);
    if (formatted.length > maxLength) {
      return formatted.slice(0, maxLength) + '\n\n… (truncated)';
    }
    return formatted;
  } catch {
    // Not valid JSON — display as-is
    const raw = typeof value === 'string' ? value : String(value);
    return raw.length > maxLength
      ? raw.slice(0, maxLength) + '\n\n… (truncated)'
      : raw;
  }
}

export const JsonViewer: React.FC<JsonViewerProps> = ({
  value,
  maxLength = 20_000,
}) => {
  const formatted = useMemo(
    () => tryFormat(value, maxLength),
    [value, maxLength]
  );

  if (!formatted) return null;

  return (
    <ScrollView
      style={styles.scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.container}>
        <Text style={styles.code} selectable>
          {formatted}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    padding: spacing.md,
    backgroundColor: colors.surfaceBg,
    borderRadius: 6,
    margin: spacing.md,
  },
  code: {
    ...typography.mono,
    color: colors.textPrimary,
  },
});
