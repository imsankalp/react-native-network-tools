import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { NavigatorProvider, useNavigator } from './NavigatorContext';
import { ScreenRenderer } from './ScreenRenderer';
import { colors } from '../config/color';
import { STACK_PUSH_DURATION, STACK_POP_DURATION } from '../config/animation';
import type { Screen, Tab } from './types';

// ─── Imperative handle ────────────────────────────────────────────────────────

export interface NavigatorHandle {
  push: (screen: Screen) => void;
  pop: () => void;
  switchTab: (tab: Tab) => void;
  popToRoot: () => void;
}

// ─── Inner navigator (has access to context) ──────────────────────────────────

interface InnerNavigatorProps {
  // Passed through to StackHeader in Task 2.1 (close button handler)
  onClose: () => void;
  headerSlot: React.ReactNode;
}

const InnerNavigator = React.forwardRef<NavigatorHandle, InnerNavigatorProps>(
  ({ onClose: _onClose, headerSlot }, ref) => {
    const { currentScreen, push, pop, popToRoot, switchTab } = useNavigator();
    const slideAnim = useRef(new Animated.Value(0)).current;
    const screenWidth = Dimensions.get('window').width;

    // Animate push: slide new screen in from the right
    const animatePush = useCallback(() => {
      slideAnim.setValue(screenWidth);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: STACK_PUSH_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }, [slideAnim, screenWidth]);

    // Animated pop: slide current screen out, then dispatch POP.
    // Exposed via imperative handle so StackHeader back button gets animation.
    const animatePop = useCallback(() => {
      Animated.timing(slideAnim, {
        toValue: screenWidth,
        duration: STACK_POP_DURATION,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          slideAnim.setValue(0);
          pop();
        }
      });
    }, [slideAnim, screenWidth, pop]);

    // Expose imperative methods. pop is the animated variant so all callers
    // (StackHeader back button, Android onRequestClose) get the slide-out effect.
    useImperativeHandle(
      ref,
      () => ({ push, pop: animatePop, popToRoot, switchTab }),
      [push, animatePop, popToRoot, switchTab]
    );

    // Track screen identity to trigger push animation on navigation
    const prevScreenRef = useRef<Screen>(currentScreen);

    useEffect(() => {
      const prev = prevScreenRef.current;
      const isNewScreen =
        prev.name !== currentScreen.name ||
        JSON.stringify(prev) !== JSON.stringify(currentScreen);

      if (isNewScreen) {
        animatePush();
      }
      prevScreenRef.current = currentScreen;
    }, [currentScreen, animatePush]);

    return (
      <View style={styles.container}>
        {/* Header slot — receives StackHeader from Navigator parent */}
        {headerSlot}

        {/* Animated screen content */}
        <Animated.View
          style={[
            styles.screenContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <ScreenRenderer screen={currentScreen} />
        </Animated.View>
      </View>
    );
  }
);

InnerNavigator.displayName = 'InnerNavigator';

// ─── Public Navigator ─────────────────────────────────────────────────────────

interface NavigatorProps {
  onClose: () => void;
  /** Slot for StackHeader — passed through so header stays outside the slide animation. */
  headerSlot?: React.ReactNode;
}

const Navigator = React.forwardRef<NavigatorHandle, NavigatorProps>(
  ({ onClose, headerSlot = null }, ref) => {
    return (
      <NavigatorProvider>
        <InnerNavigator ref={ref} onClose={onClose} headerSlot={headerSlot} />
      </NavigatorProvider>
    );
  }
);

Navigator.displayName = 'Navigator';

// ─── Hook for screens to trigger pop with animation ──────────────────────────
// Screens that need an animated back-navigation call this instead of
// useNavigator().pop() directly, because the reducer POP is dispatched
// AFTER the animation completes (see animatePop above).

export function useAnimatedPop() {
  // Screens call useNavigator().pop() via the Navigator ref in practice;
  // this hook is a convenience re-export kept here for discoverability.
  const { pop } = useNavigator();
  return pop;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  screenContainer: {
    flex: 1,
  },
});

export default Navigator;
