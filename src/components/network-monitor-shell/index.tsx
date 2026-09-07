import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DevSettings, Modal, StyleSheet, View } from 'react-native';
import { FloatingButton } from '../floating-button';
import { NetworkPanel } from '../network-panel';

export type TriggerMode = 'dev-menu' | 'floating' | 'both';

interface NetworkMonitorShellProps {
  triggerMode?: TriggerMode;
  showFloatingMonitor: boolean;
}

export const NetworkMonitorShell: React.FC<NetworkMonitorShellProps> = ({
  triggerMode = 'both',
  showFloatingMonitor,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const openPanel = useCallback(() => setIsVisible(true), []);
  const closePanel = useCallback(() => setIsVisible(false), []);

  // Stable ref so the DevSettings handler never captures a stale closure.
  const openRef = useRef(openPanel);
  openRef.current = openPanel;

  // Register DevSettings menu item once — only in __DEV__, never for floating-only mode.
  useEffect(() => {
    if (!__DEV__) return;
    if (triggerMode === 'floating') return;
    DevSettings.addMenuItem('Open Network Monitor 🔍', () => openRef.current());
  }, [triggerMode]);

  // If the host hides the floating monitor while the panel is open, close it.
  useEffect(() => {
    if (!showFloatingMonitor && isVisible) {
      setIsVisible(false);
    }
  }, [showFloatingMonitor, isVisible]);

  const showFab =
    showFloatingMonitor &&
    (triggerMode === 'floating' || triggerMode === 'both');

  return (
    <>
      {/* Modal A — FAB layer. Always transparent, touch pass-through on wrapper. */}
      {showFab ? (
        <Modal
          visible={true}
          transparent
          animationType="none"
          statusBarTranslucent
        >
          <View style={styles.fabLayer} pointerEvents="box-none">
            <FloatingButton onPress={openPanel} />
          </View>
        </Modal>
      ) : null}

      {/* Modal B — Panel. Mounted fresh each session so Navigator state is clean. */}
      {isVisible ? (
        <Modal
          visible={true}
          transparent
          animationType="none"
          statusBarTranslucent
          onRequestClose={closePanel}
        >
          <NetworkPanel onClose={closePanel} />
        </Modal>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  fabLayer: { flex: 1 },
});
