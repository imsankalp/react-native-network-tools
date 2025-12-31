import React, { useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { colors, spacing, typography } from '../../../example/src/theme';
import { type NetworkLogEntry } from '../../types';
import { parseUrlDetails } from '../../util/parseURLDetails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface NetworkDetailProps {
  request: NetworkLogEntry | null;
  onClose: () => void;
}

export const NetworkDetail: React.FC<NetworkDetailProps> = ({
  request,
  onClose,
}) => {
  const HORIZONTAL_PADDING = 16;
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const { top: STATUS_BAR_PADDING_TOP } = useSafeAreaInsets();
  const WIDTH = SCREEN_WIDTH - 2 * HORIZONTAL_PADDING;

  const formattedTime = useMemo(() => {
    if (!request?.requestTime) return 'N/A';
    return new Date(request.requestTime).toLocaleString();
  }, [request?.requestTime]);

  const renderSection = (title: string, content: string | object) => {
    let contentString: string = '';
    if (typeof content === 'object') {
      try {
        contentString = JSON.stringify(content, null, 2);
      } catch {
        contentString = 'Unable to parse content';
      }
    }

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView
          style={styles.contentBox}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.contentText} selectable>
            {contentString || 'No data'}
          </Text>
        </ScrollView>
      </View>
    );
  };

  if (!request) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      // @ts-ignore // Reanimated types are sometimes buggy
      style={[styles.container, { width: WIDTH, top: STATUS_BAR_PADDING_TOP }]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Network Request Details</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('Endpoint', request.url)}
        {renderSection('Method', request.method || 'N/A')}
        {renderSection('Status', request.responseCode.toString() || 'N/A')}
        {renderSection('Time', formattedTime)}
        {renderSection('Duration', `${request.duration || 0}ms`)}

        {parseUrlDetails(request.url).isQueryParamsPresent
          ? Object.keys(parseUrlDetails(request.url).queryParams).length > 0 &&
            renderSection(
              'Query Params',
              parseUrlDetails(request.url).queryParams
            )
          : null}

        {request.requestHeaders &&
          renderSection('Request Headers', request.requestHeaders)}

        {request.requestBody &&
          renderSection('Request Body', request.requestBody)}

        {request.responseHeaders &&
          renderSection('Response Headers', request.responseHeaders)}

        {request.responseBody &&
          renderSection('Response Body', request.responseBody)}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surfaceBg,
    position: 'absolute',
    alignSelf: 'center',
    elevation: 5,
    zIndex: 9999,
    borderRadius: 30,
    paddingHorizontal: 16,

    overflow: 'hidden', // Important for borderRadius animation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.greyOutline,
    backgroundColor: colors.background,
  },
  title: {
    ...typography.h3,
    color: colors.white,
  },
  closeButton: {
    padding: spacing.xs,
  },
  closeButtonText: {
    ...typography.h3,
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.md,
    flexGrow: 1,
  },
  section: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.grey0,
    marginBottom: spacing.xs,
  },
  contentBox: {
    backgroundColor: colors.grey5,
    borderRadius: 8,
    padding: spacing.md,
    maxHeight: 200,
  },
  contentText: {
    ...typography.body,
    color: colors.surfaceBg,
    fontSize: 12,
    fontFamily: 'Menlo', // Monospace for better code display
  },
});
