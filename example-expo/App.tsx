import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  NetworkMonitorProvider,
  FloatingNetworkMonitor,
} from 'react-native-network-tools';

function HomeScreen() {
  useEffect(() => {
    // Make a sample request on mount to populate the network monitor
    fetch('https://jsonplaceholder.typicode.com/posts/1').catch(() => {});
    fetch('https://jsonplaceholder.typicode.com/users/1').catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Tools</Text>
      <Text style={styles.subtitle}>Expo Example</Text>
      <Text style={styles.hint}>
        Tap the floating button to open the network monitor
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <NetworkMonitorProvider>
          <HomeScreen />
          <FloatingNetworkMonitor />
        </NetworkMonitorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  hint: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
