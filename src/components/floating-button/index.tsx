import React, { useRef } from 'react';
import {
  Animated,
  Dimensions,
  PanResponder,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors } from '../../config/color';
import {
  FLOATING_BUTTON_DEFAULT_RIGHT_OFFSET,
  FLOATING_BUTTON_DEFAULT_Y_FRACTION,
  FLOATING_BUTTON_EDGE_PADDING,
  FLOATING_BUTTON_SIZE,
  TAP_DISTANCE_THRESHOLD,
} from '../../config/layout';
import {
  BUTTON_SNAP_FRICTION,
  BUTTON_SNAP_TENSION,
} from '../../config/animation';

interface FloatingButtonProps {
  onPress: () => void;
}

function getInitialPosition() {
  const { width, height } = Dimensions.get('window');
  return {
    x: width - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_DEFAULT_RIGHT_OFFSET,
    y: height * FLOATING_BUTTON_DEFAULT_Y_FRACTION,
  };
}

export const FloatingButton: React.FC<FloatingButtonProps> = ({ onPress }) => {
  const initial = useRef(getInitialPosition()).current;
  const position = useRef(new Animated.ValueXY(initial)).current;
  // Track raw pixel position for snap calculation without reading Animated internals.
  const posXY = useRef({ x: initial.x, y: initial.y });

  // Listen to animated value changes to keep posXY in sync.
  React.useEffect(() => {
    const xId = position.x.addListener(({ value }) => {
      posXY.current.x = value;
    });
    const yId = position.y.addListener(({ value }) => {
      posXY.current.y = value;
    });
    return () => {
      position.x.removeListener(xId);
      position.y.removeListener(yId);
    };
  }, [position]);

  const dragDelta = useRef({ dx: 0, dy: 0 });

  const snapToEdge = () => {
    const { width, height } = Dimensions.get('window');
    const safeTop =
      Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 44;
    const safeBottom = Platform.OS === 'ios' ? 34 : 0;

    const currentX = posXY.current.x;
    const currentY = posXY.current.y;

    const snapLeft = FLOATING_BUTTON_EDGE_PADDING;
    const snapRight =
      width - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_EDGE_PADDING;
    const targetX = currentX < width / 2 ? snapLeft : snapRight;

    const minY = safeTop + FLOATING_BUTTON_EDGE_PADDING;
    const maxY =
      height - safeBottom - FLOATING_BUTTON_SIZE - FLOATING_BUTTON_EDGE_PADDING;
    const targetY = Math.min(Math.max(currentY, minY), maxY);

    Animated.spring(position, {
      toValue: { x: targetX, y: targetY },
      tension: BUTTON_SNAP_TENSION,
      friction: BUTTON_SNAP_FRICTION,
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        dragDelta.current = { dx: 0, dy: 0 };
        position.setOffset({ x: posXY.current.x, y: posXY.current.y });
        position.setValue({ x: 0, y: 0 });
      },

      onPanResponderMove: (_, gestureState) => {
        dragDelta.current = { dx: gestureState.dx, dy: gestureState.dy };
        Animated.event([null, { dx: position.x, dy: position.y }], {
          useNativeDriver: false,
        })(_, gestureState);
      },

      onPanResponderRelease: (_, gestureState) => {
        position.flattenOffset();
        const dist = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        if (dist < TAP_DISTANCE_THRESHOLD) {
          // Treat as tap — snap first (position was already at rest), then call handler.
          snapToEdge();
          onPress();
        } else {
          snapToEdge();
        }
      },

      onPanResponderTerminate: () => {
        position.flattenOffset();
        snapToEdge();
      },
    })
  ).current;

  return (
    <Animated.View
      style={[styles.button, { transform: position.getTranslateTransform() }]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={styles.inner}
        onPress={onPress}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Open Network Monitor"
      >
        <Text style={styles.icon}>🔍</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    width: FLOATING_BUTTON_SIZE,
    height: FLOATING_BUTTON_SIZE,
    borderRadius: FLOATING_BUTTON_SIZE / 2,
    backgroundColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: FLOATING_BUTTON_SIZE / 2,
  },
  icon: {
    fontSize: 22,
  },
});
