import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../../config/color';
import { typography } from '../../../config/typography';
import type { ScreenParams } from '../../../navigation/types';

interface Props {
  screen: ScreenParams<'request-detail'>;
}

// Full implementation: Task 4.7
const RequestDetailScreen: React.FC<Props> = ({ screen }) => (
  <View style={styles.container}>
    <Text style={styles.label}>Request: {screen.requestId}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  label: { ...typography.body, color: colors.textMuted },
});

export default RequestDetailScreen;
