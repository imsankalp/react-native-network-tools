import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../config/color';
import { spacing } from '../config/spacing';
import { typography } from '../config/typography';
import { TAB_BAR_HEIGHT } from '../config/layout';
import type { Tab } from '../navigation/types';

interface TabItem {
  tab: Tab;
  label: string;
}

const TABS: TabItem[] = [
  { tab: 'requests', label: 'Requests' },
  { tab: 'websocket', label: 'WebSocket' },
  { tab: 'sessions', label: 'Sessions' },
  { tab: 'insights', label: 'Insights' },
];

interface TabBarProps {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ activeTab, onTabPress }) => {
  return (
    <View style={styles.container}>
      {TABS.map(({ tab, label }) => (
        <TabItem
          key={tab}
          tab={tab}
          label={label}
          isActive={tab === activeTab}
          onPress={onTabPress}
        />
      ))}
    </View>
  );
};

interface TabItemProps {
  tab: Tab;
  label: string;
  isActive: boolean;
  onPress: (tab: Tab) => void;
}

const TabItem: React.FC<TabItemProps> = React.memo(
  ({ tab, label, isActive, onPress }) => {
    const handlePress = useCallback(() => onPress(tab), [tab, onPress]);
    return (
      <TouchableOpacity
        style={styles.tab}
        onPress={handlePress}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive }}
        accessibilityLabel={label}
      >
        <Text style={[styles.label, isActive && styles.labelActive]}>
          {label}
        </Text>
        {isActive ? <View style={styles.indicator} /> : null}
      </TouchableOpacity>
    );
  }
);

TabItem.displayName = 'TabItem';

const styles = StyleSheet.create({
  container: {
    height: TAB_BAR_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primary,
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: spacing.sm,
    right: spacing.sm,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.tabBarActiveIndicator,
  },
});
