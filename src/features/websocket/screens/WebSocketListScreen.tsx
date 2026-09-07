import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../../config/color';
import { EmptyState } from '../../../components/EmptyState';

// Placeholder — full implementation in a future release.
const WebSocketListScreen: React.FC = () => (
  <View style={styles.container}>
    <EmptyState
      icon="🔌"
      title="WebSocket Inspector"
      subtitle="Coming in a future release"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});

export default WebSocketListScreen;
