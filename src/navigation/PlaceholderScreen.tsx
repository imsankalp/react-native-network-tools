import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../config/color';
import { typography } from '../config/typography';
import type { Screen } from './types';

interface Props {
  screen: Screen;
}

export const PlaceholderScreen: React.FC<Props> = ({ screen }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{LABELS[screen.name] ?? screen.name}</Text>
    <Text style={styles.subtitle}>Coming in a future release</Text>
  </View>
);

const LABELS: Partial<Record<Screen['name'], string>> = {
  'websocket-list': 'WebSocket Inspector',
  'websocket-detail': 'WebSocket Detail',
  'session-list': 'Session Recording',
  'session-detail': 'Session Detail',
  'session-recording': 'Recording',
  'insights-overview': 'Insights',
  'insights-performance': 'Performance',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
