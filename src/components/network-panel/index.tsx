import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { colors } from '../../config/color';
import { PANEL_SLIDE_DURATION } from '../../config/animation';
import { TabBar } from '../TabBar';
import { StackHeader } from '../StackHeader';
import Navigator, { type NavigatorHandle } from '../../navigation/Navigator';
import {
  NavigatorProvider,
  useNavigator,
} from '../../navigation/NavigatorContext';

interface NetworkPanelProps {
  onClose: () => void;
}

// PanelContent lives inside NavigatorProvider so it can read context.
const PanelContent: React.FC<{
  onClose: () => void;
  navigatorRef: React.RefObject<NavigatorHandle | null>;
}> = ({ onClose, navigatorRef }) => {
  const { activeTab, canGoBack, switchTab, popToRoot } = useNavigator();

  const handleTabPress = (tab: typeof activeTab) => {
    if (tab === activeTab) {
      popToRoot();
    } else {
      switchTab(tab);
    }
  };

  const handleBack = () => {
    navigatorRef.current?.pop();
  };

  return (
    <View style={styles.inner}>
      {/* withProvider=false — NavigatorProvider is already above this tree */}
      <Navigator
        ref={navigatorRef}
        onClose={onClose}
        withProvider={false}
        headerSlot={
          <StackHeader
            title="Network Monitor"
            onBack={canGoBack ? handleBack : undefined}
            onClose={onClose}
          />
        }
      />
      <TabBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

export const NetworkPanel: React.FC<NetworkPanelProps> = ({ onClose }) => {
  const screenHeight = Dimensions.get('window').height;
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const navigatorRef = useRef<NavigatorHandle>(null);

  // Slide up from bottom on mount.
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: PANEL_SLIDE_DURATION,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
    >
      <SafeAreaView style={styles.safeArea}>
        <NavigatorProvider>
          <PanelContent onClose={onClose} navigatorRef={navigatorRef} />
        </NavigatorProvider>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
});
