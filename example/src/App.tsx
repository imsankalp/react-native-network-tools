import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { NetworkMonitorProvider } from 'react-native-network-tools';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.main}>
      <SafeAreaProvider>
        <NetworkMonitorProvider maxRequests={500} showFloatingMonitor={true}>
          <RootNavigator />
        </NetworkMonitorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  main: { flex: 1 },
});
