import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';
import { STACK_HEADER_HEIGHT } from '../config/layout';

interface StackHeaderProps {
  title: string;
  onBack?: () => void;
  onClose?: () => void;
  rightAction?: React.ReactNode;
}

const BackArrow: React.FC = () => <Text style={styles.backArrow}>‹</Text>;

export const StackHeader: React.FC<StackHeaderProps> = ({
  title,
  onBack,
  onClose,
  rightAction,
}) => (
  <View style={styles.container}>
    {/* Left slot: back arrow or empty spacer */}
    <View style={styles.side}>
      {onBack ? (
        <TouchableOpacity
          onPress={onBack}
          hitSlop={styles.hitSlop}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <BackArrow />
        </TouchableOpacity>
      ) : null}
    </View>

    <Text style={styles.title} numberOfLines={1}>
      {title}
    </Text>

    {/* Right slot: custom action or close button */}
    <View style={[styles.side, styles.sideRight]}>
      {rightAction ??
        (onClose ? (
          <TouchableOpacity
            onPress={onClose}
            hitSlop={styles.hitSlop}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        ) : null)}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    height: STACK_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: {
    width: 48,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  backArrow: {
    fontSize: 28,
    lineHeight: 32,
    color: colors.primary,
    fontWeight: '300',
  },
  closeIcon: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  hitSlop: { top: 12, bottom: 12, left: 12, right: 12 },
});
