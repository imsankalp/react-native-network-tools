import React, { useState, useCallback } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';
import { colors } from '../../config/color';
import { spacing } from '../../config/spacing';
import { typography } from '../../config/typography';
import type { NetworkRequest } from '../../context/types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NetworkDetailProps, TabType } from './types';
import { networkDetailsTab } from './networkDetails.config';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const NetworkDetail: React.FC<NetworkDetailProps> = ({
  request,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const slideAnim = React.useRef(new Animated.Value(SCREEN_WIDTH)).current;

  const { top: STATUS_BAR_PADDING_TOP } = useSafeAreaInsets();

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      damping: 15,
      stiffness: 100,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  const animatedStyle = {
    transform: [{ translateX: slideAnim }],
  };

  const handleClose = useCallback(() => {
    Animated.spring(slideAnim, {
      toValue: SCREEN_WIDTH,
      damping: 15,
      stiffness: 100,
      useNativeDriver: true,
    }).start();
    setTimeout(onClose, 300);
  }, [onClose, slideAnim]);

  const renderTabItems = ({
    item: tab,
  }: {
    item: { key: TabType; label: string };
  }) => {
    return (
      <TouchableOpacity
        key={tab.key}
        onPress={() => setActiveTab(tab.key)}
        style={[styles.tab, activeTab === tab.key && styles.activeTab]}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === tab.key && styles.activeTabText,
          ]}
        >
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    // <>
    //   <TouchableOpacity
    //     style={styles.backdrop}
    //     activeOpacity={0.3}
    //     onPress={handleClose}
    //   />

    <Animated.View
      style={[styles.container, { top: STATUS_BAR_PADDING_TOP }, animatedStyle]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Text style={styles.backButtonText}>➔</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          Request Details
        </Text>
        <View style={{ width: 60 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <FlatList
          data={networkDetailsTab}
          keyExtractor={(item) => item.key}
          renderItem={renderTabItems}
          horizontal
        />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'overview' && <OverviewTab request={request} />}
        {activeTab === 'request' && <RequestTab request={request} />}
        {activeTab === 'response' && <ResponseTab request={request} />}
        {activeTab === 'timing' && <TimingTab request={request} />}
      </ScrollView>
    </Animated.View>
    // </>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ request: NetworkRequest }> = ({ request }) => {
  const duration = request.responseTime
    ? new Date(request.responseTime).getTime() -
      new Date(request.requestTime).getTime()
    : 0;

  return (
    <View style={styles.tabContent}>
      <DetailRow label="URL" value={request.url} />
      <DetailRow label="Method" value={request.method} />
      <DetailRow
        label="Status"
        value={`${request.responseCode || '-'}`}
        valueColor={
          request.responseCode && request.responseCode >= 400
            ? colors.error
            : colors.success
        }
      />
      {request.customError && (
        <>
          <DetailRow
            label="Custom Error"
            value={request.customError.message}
            valueColor={colors.error}
          />
          <DetailRow
            label="Error Type"
            value={request.customError.type}
            valueColor={colors.error}
          />
          {request.customError.code && (
            <DetailRow
              label="Error Code"
              value={request.customError.code}
              valueColor={colors.error}
            />
          )}
        </>
      )}
      <DetailRow label="Duration" value={`${duration}ms`} />
      <DetailRow
        label="Request Time"
        value={new Date(request.requestTime).toLocaleString()}
      />
    </View>
  );
};

// Request Tab Component
const RequestTab: React.FC<{ request: NetworkRequest }> = ({ request }) => {
  return (
    <View style={styles.tabContent}>
      <SectionTitle title="Headers" />
      <DataBox data={request.requestHeaders || {}} placeholder="No headers" />
      <SectionTitle title="Body" />
      <DataBox data={request.requestData || {}} placeholder="No body" />
    </View>
  );
};

// Response Tab Component
const ResponseTab: React.FC<{ request: NetworkRequest }> = ({ request }) => {
  const responseData =
    typeof request.responseData === 'string'
      ? safeJsonParse(request.responseData)
      : request.responseData;

  return (
    <View style={styles.tabContent}>
      <SectionTitle title="Headers" />
      <DataBox data={request.responseHeaders || {}} placeholder="No headers" />
      <SectionTitle title="Body" />
      <DataBox data={responseData || {}} placeholder="No body" />
      {request.customError && (
        <>
          <SectionTitle title="Custom Error Details" />
          <DataBox
            data={request.customError.details ?? {}}
            placeholder="No details"
          />
        </>
      )}
    </View>
  );
};

// Timing Tab Component
const TimingTab: React.FC<{ request: NetworkRequest }> = ({ request }) => {
  const duration = request.responseTime
    ? new Date(request.responseTime).getTime() -
      new Date(request.requestTime).getTime()
    : 0;

  return (
    <View style={styles.tabContent}>
      <DetailRow
        label="Started At"
        value={new Date(request.requestTime).toLocaleTimeString()}
      />
      <DetailRow
        label="Completed At"
        value={new Date(
          request.responseTime || request.requestTime
        ).toLocaleTimeString()}
      />
      <DetailRow label="Total Duration" value={`${duration}ms`} />
      <View style={styles.timingBar}>
        <View
          style={[
            styles.timingFill,
            { width: Math.min(100, (duration / 5000) * 100) + '%' },
          ]}
        />
      </View>
    </View>
  );
};

// Reusable Components
const DetailRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, { color: valueColor || colors.white }]}
      numberOfLines={3}
    >
      {value}
    </Text>
  </View>
);

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const safeJsonParse = (value: string): unknown => {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const DataBox: React.FC<{ data: any; placeholder: string }> = ({
  data,
  placeholder,
}) => {
  const isEmpty = !data || Object.keys(data).length === 0;

  return (
    <View style={styles.dataBox}>
      {isEmpty ? (
        <Text style={styles.placeholderText}>{placeholder}</Text>
      ) : (
        <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    // position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
  },
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT,
    backgroundColor: colors.background,
    zIndex: 99999,
    flexDirection: 'column',
    elevation: 5,
    shadowColor: colors.grey5,
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderTopLeftRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyOutline,
    backgroundColor: colors.background,
  },
  backButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  backButtonText: {
    ...typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  title: {
    ...typography.h3,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyOutline,
    backgroundColor: colors.background,
  },
  tab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    marginRight: spacing.md,
    zIndex: 99999,
  },
  activeTab: {
    borderBottomWidth: 3.2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.body,
    color: colors.grey3,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabContent: {
    padding: spacing.md,
  },
  detailRow: {
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyOutline,
  },
  detailLabel: {
    ...typography.caption,
    color: colors.grey3,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  detailValue: {
    ...typography.body,
    color: colors.white,
    lineHeight: 20,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.primary,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  dataBox: {
    backgroundColor: colors.grey5,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  dataText: {
    ...typography.body,
    color: colors.white,
    fontSize: 11,
    fontFamily: 'Menlo',
    lineHeight: 16,
  },
  placeholderText: {
    ...typography.body,
    color: colors.grey3,
    fontStyle: 'italic',
  },
  timingBar: {
    height: 8,
    backgroundColor: colors.grey5,
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  timingFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
});
