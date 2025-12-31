import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Dimensions,
  Image,
  Text,
  Button,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import NetworkRequest from 'react-native-network-tools';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../../example/src/theme';
import NetworkMonitorHeader from '../header/NetworkMonitorHeader';
import type { NetworkLogEntry } from '../../types';
import { NetworkDetail } from '../request-detail/NetworkDetails';
import { TouchableOpacity } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 60;
const HORIZONTAL_PADDING = 16;
const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.95;
const EXPANDED_WIDTH = SCREEN_WIDTH - 2 * HORIZONTAL_PADDING;

type Position = {
  x: number;
  y: number;
};

interface FloatingNetworkMonitorProps {
  onPress?: () => void;
  onClose?: () => void;
  isExpanded?: boolean;
  isEnabled?: boolean;
}

const FloatingNetworkMonitor: React.FC<FloatingNetworkMonitorProps> = ({
  onPress,
  onClose,
  isExpanded = false,
  isEnabled = false,
}) => {
  const { top: STATUS_BAR_PADDING_TOP } = useSafeAreaInsets();

  const [contentVisible, setContentVisible] = useState(isExpanded);
  const [selectedRequest, setSelectedRequest] =
    useState<NetworkLogEntry | null>(null);
  const [requestList, setRequestList] = useState<NetworkLogEntry[]>([]);

  const handleRequestPress = (request: NetworkLogEntry) => {
    setSelectedRequest(request);
  };

  const position = useSharedValue<Position>({
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: 50,
  });
  const collapsedPosition = useSharedValue<Position>({
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: 50,
  }); // Store position before expanding
  const expandedSV = useSharedValue(isExpanded ? 1 : 0);
  const offset = useSharedValue({ x: 0, y: 0 });
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    // Interpolate values based on expandedSV (0 -> 1)
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

  // 2. Pan Gesture
  const panGesture = Gesture.Pan()
    .onStart(() => {
      // Only allow dragging if collapsed
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
        // Snap to nearest edge
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

  // 3. Tap Gesture
  const tapGesture = Gesture.Tap().onEnd(() => {
    // Only handle tap when not expanded
    if (expandedSV.value < 0.5) {
      // Using a threshold since it's an animated value
      const nextState = 1; // Always expand on tap

      // Toggle Shared Value
      expandedSV.value = withSpring(nextState, { damping: 15, stiffness: 100 });

      // EXPAND: Save collapsed position before expanding
      collapsedPosition.value = {
        x: position.value.x,
        y: position.value.y,
      };
      // Center the view
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

  // Combine gestures
  const gesture = Gesture.Race(panGesture, tapGesture) as any;

  // Handle manual close from inside the expanded view
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
        title="Network Monitor"
        closePresshandler={handleClosePress}
      />
    ),
    [handleClosePress]
  );

  if (isEnabled === false) return null;
  console.log('requestList', requestList?.length);

  return (
    <>
      <GestureDetector gesture={gesture}>
        <Animated.View
          // @ts-ignore // Reanimated types are sometimes buggy
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
              <Button
                title="Press Me"
                onPress={() => {
                  const listString = NetworkRequest.getAllRequests();
                  const listData = JSON.parse(listString);

                  setRequestList((prevState) => [...prevState, ...listData]);
                }}
              />
              <FlatList
                data={requestList}
                keyExtractor={(item) => item.id}
                style={{ flex: 1 }}
                contentContainerStyle={{ flexGrow: 1 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{
                      width: '100%',
                      height: 45,
                    }}
                    onPress={() => handleRequestPress(item)}
                  >
                    <Text style={{ color: colors.white }}>{item.url}</Text>
                  </TouchableOpacity>
                )}
                ListHeaderComponent={renderListHeader}
              />
            </View>
          )}
        </Animated.View>
      </GestureDetector>
      {selectedRequest && (
        <NetworkDetail
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.grey5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 9999,
    overflow: 'hidden', // Important for borderRadius animation
  },
  button: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  buttonText: {
    fontSize: 24,
  },
  expandedContent: {
    flex: 1,
    width: '100%',
    paddingTop: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    color: colors.grey1,
    textAlign: 'center',
  },
});

export default FloatingNetworkMonitor;
