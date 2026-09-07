import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../../../config/color';
import { typography } from '../../../config/typography';
import { TAB_STRIP_HEIGHT } from '../../../config/layout';
import { useNetworkMonitor } from '../../../context/NetworkMonitorContext';
import { EmptyState } from '../../../components/EmptyState';
import { OverviewTab } from './detail-tabs/OverviewTab';
import { RequestTab } from './detail-tabs/RequestTab';
import { ResponseTab } from './detail-tabs/ResponseTab';
import { TimingTab } from './detail-tabs/TimingTab';
import type { ScreenParams } from '../../../navigation/types';

interface Props {
  screen: ScreenParams<'request-detail'>;
}

type DetailTab = 'overview' | 'request' | 'response' | 'timing';

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'request', label: 'Request' },
  { key: 'response', label: 'Response' },
  { key: 'timing', label: 'Timing' },
];

const RequestDetailScreen: React.FC<Props> = ({ screen }) => {
  const { getRequestById } = useNetworkMonitor();
  const request = getRequestById(screen.requestId);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  if (!request) {
    return (
      <EmptyState
        icon="⚠️"
        title="Request not available"
        subtitle="This request may have been cleared."
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Inline tab strip */}
      <View style={styles.tabStrip}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === key }}
          >
            <Text
              style={[
                styles.tabLabel,
                activeTab === key && styles.tabLabelActive,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab content — conditional rendering resets scroll on each switch */}
      <View style={styles.content}>
        {activeTab === 'overview' && <OverviewTab request={request} />}
        {activeTab === 'request' && <RequestTab request={request} />}
        {activeTab === 'response' && <ResponseTab request={request} />}
        {activeTab === 'timing' && <TimingTab request={request} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabStrip: {
    height: TAB_STRIP_HEIGHT,
    flexDirection: 'row',
    backgroundColor: colors.tabBarBackground,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
});

export default RequestDetailScreen;
