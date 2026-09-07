import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search…',
}) => {
  const handleClear = useCallback(() => {
    onChangeText('');
  }, [onChangeText]);

  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholderText}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value.length > 0 ? (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={styles.clearHitSlop}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
        >
          <Text style={styles.clearIcon}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 36,
  },
  searchIcon: {
    fontSize: 18,
    color: colors.placeholderText,
    marginRight: spacing.xs,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    ...typography.body,
    fontSize: 14,
    color: colors.textPrimary,
    padding: 0,
  },
  clearIcon: {
    fontSize: 13,
    color: colors.textMuted,
    paddingLeft: spacing.xs,
  },
  clearHitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
});
