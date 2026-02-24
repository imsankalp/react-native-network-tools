import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  FlatList,
} from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkMonitor } from '../../context/NetworkMonitorContext';
import NetworkMonitorHeader from '../header/NetworkMonitorHeader';
import type { NetworkRequest } from '../../context/types';
import { NetworkDetail } from '../request-detail/NetworkDetails';
import { colors } from '../../config/color';
import { spacing } from '../../config/spacing';
import type { ViewStyle } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const HORIZONTAL_PADDING = 0;
const EXPANDED_HEIGHT = SCREEN_HEIGHT;
const EXPANDED_WIDTH = SCREEN_WIDTH - 2 * HORIZONTAL_PADDING;

type Position = {
  x: number;
  y: number;
};

interface FloatingNetworkMonitorProps {
  onPress?: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
}

const FloatingNetworkMonitor: React.FC<FloatingNetworkMonitorProps> = ({
  onPress,
  onClose,
  isExpanded = false,
}) => {
  const { top: STATUS_BAR_PADDING_TOP } = useSafeAreaInsets();
  const { requests, clearRequests } = useNetworkMonitor();
  const [contentVisible, setContentVisible] = useState(isExpanded);
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest>();

  const handleRequestPress = (request: NetworkRequest) => {
    setSelectedRequest(request);
  };

  const position = useSharedValue<Position>({
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: 50,
  });
  const collapsedPosition = useSharedValue<Position>({
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: 50,
  });
  const expandedSV = useSharedValue(isExpanded ? 1 : 0);
  const offset = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle((): ViewStyle => {
    const width = interpolate(
      expandedSV.value,
      [0, 1],
      [BUTTON_SIZE, EXPANDED_WIDTH]
    );
    const height = interpolate(
      expandedSV.value,
      [0, 1],
      [BUTTON_SIZE, EXPANDED_HEIGHT]
    );
    const borderRadius = interpolate(
      expandedSV.value,
      [0, 1],
      [BUTTON_SIZE / 2, 20]
    );

    return {
      width: withSpring(width, { damping: 15, stiffness: 100 }),
      height: withSpring(height, { damping: 15, stiffness: 100 }),
      borderRadius,
      transform: [
        { translateX: position.value.x },
        { translateY: position.value.y },
        { scale: scale.value },
      ],
    };
  });

  const panGesture = Gesture.Pan()
    .onStart(() => {
      if (expandedSV.value === 0) {
        offset.value = {
          x: position.value.x,
          y: position.value.y,
        };
        scale.value = withTiming(1.1, { duration: 100 });
      }
    })
    .onUpdate((e) => {
      if (expandedSV.value === 0) {
        position.value = {
          x: Math.max(
            0,
            Math.min(
              SCREEN_WIDTH - BUTTON_SIZE,
              offset.value.x + e.translationX
            )
          ),
          y: Math.max(
            0,
            Math.min(
              SCREEN_HEIGHT - BUTTON_SIZE,
              offset.value.y + e.translationY
            )
          ),
        };
      }
    })
    .onEnd(() => {
      if (expandedSV.value === 0) {
        const snapX =
          position.value.x < SCREEN_WIDTH / 2
            ? 20
            : SCREEN_WIDTH - BUTTON_SIZE - 20;

        position.value = withSpring(
          { x: snapX, y: position.value.y },
          { damping: 15, stiffness: 100 }
        );
        scale.value = withTiming(1, { duration: 100 });
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    if (expandedSV.value < 0.5) {
      const nextState = 1;

      expandedSV.value = withSpring(nextState, { damping: 15, stiffness: 100 });

      collapsedPosition.value = {
        x: position.value.x,
        y: position.value.y,
      };

      position.value = withSpring(
        {
          x: (SCREEN_WIDTH - EXPANDED_WIDTH) / 2,
          y: 0,
        },
        { damping: 15, stiffness: 100 }
      );
      runOnJS(setContentVisible)(true);
      if (onPress) runOnJS(onPress)();
    }
  });

  const gesture = Gesture.Race(panGesture, tapGesture) as any;

  const handleClosePress = useCallback(() => {
    expandedSV.value = 0;
    position.value = withSpring(
      {
        x: collapsedPosition.value.x,
        y: collapsedPosition.value.y,
      },
      { damping: 15, stiffness: 100 }
    );
    setContentVisible(false);
    if (onClose) onClose();
  }, [onClose, expandedSV, position, collapsedPosition]);

  const renderListHeader = useCallback(
    () => (
      <NetworkMonitorHeader
        title={`Network Monitor`}
        closePresshandler={handleClosePress}
        onClear={clearRequests}
      />
    ),
    [handleClosePress, clearRequests]
  );
  const renderFooterComponent = useCallback(
    () => <View style={styles.footerStyle} />,
    []
  );

  const renderRequestItem = useCallback(
    ({ item }: { item: NetworkRequest }) => {
      console.log('item', JSON.stringify(item, null, 2));
      return (
        <TouchableOpacity
          style={styles.requestItem}
          onPress={() => handleRequestPress(item)}
        >
          <View style={styles.requestHeader}>
            <Text style={styles.methodText}>{item.method}</Text>
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.responseCode >= 400 ? colors.error : colors.success,
                },
              ]}
            >
              {item.responseCode || '-'}
            </Text>
          </View>
          <Text style={styles.urlText} numberOfLines={2}>
            {item.url}
          </Text>
          <Text style={styles.timestampText}>
            {new Date(item.requestTime).toLocaleTimeString()}
          </Text>
        </TouchableOpacity>
      );
    },
    []
  );

  const keyExtractor = useCallback((item: NetworkRequest) => item.id, []);

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          // @ts-ignore Some error to be fixed later
          style={[
            styles.container,
            animatedStyle,
            { top: STATUS_BAR_PADDING_TOP },
          ]}
        >
          {!contentVisible ? (
            <View style={styles.button}>
              <Image
                source={require('../../asset/NetworkLogo.png')}
                resizeMode="cover"
              />
            </View>
          ) : (
            <View style={styles.expandedContent}>
              {renderListHeader()}
              <FlatList
                data={requests}
                keyExtractor={keyExtractor}
                style={styles.list}
                contentContainerStyle={styles.listContent}
                renderItem={renderRequestItem}
                ListFooterComponent={renderFooterComponent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>
                      No network requests yet
                    </Text>
                  </View>
                }
              />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
      {selectedRequest && (
        <NetworkDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(undefined)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    // position: 'absolute',
    // justifyContent: 'center',
    // alignItems: 'center',
    elevation: 3,
    shadowColor: colors.grey5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 999,
    overflow: 'hidden',
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  expandedContent: {
    flex: 1,
    flexGrow: 1,
    width: '100%',
    paddingTop: spacing.lg,
  },
  list: {
    flex: 1,
    flexGrow: 1,
  },
  listContent: {
    flexGrow: 1,
  },
  requestItem: {
    backgroundColor: colors.grey5,
    padding: spacing.md,
    marginVertical: spacing.xs,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  methodText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  urlText: {
    color: colors.white,
    fontSize: 14,
    marginBottom: spacing.xs,
  },
  timestampText: {
    color: colors.grey3,
    fontSize: 10,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    color: colors.grey3,
    textAlign: 'center',
    fontSize: 16,
  },
  footerStyle: {
    height: spacing.xxl,
  },
});

export default FloatingNetworkMonitor;
