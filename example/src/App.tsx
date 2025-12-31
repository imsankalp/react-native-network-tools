import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './navigation/RootNavigator';
import { NetworkMonitorProvider } from 'react-native-network-tools';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NetworkMonitorProvider enabledByDefault={true}>
          <RootNavigator />
        </NetworkMonitorProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
