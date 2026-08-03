import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NetworkMonitorProvider } from 'react-native-network-tools';

function HomeScreen() {
  useEffect(() => {
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
    <NetworkMonitorProvider>
      <HomeScreen />
    </NetworkMonitorProvider>
  );
}

const styles = StyleSheet.create({
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
