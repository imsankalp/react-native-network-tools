import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import type { RootStackParamList } from './types';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import ApiPlaygroundScreen from '../screens/ApiPlaygroundScreen';
import AuthFlowScreen from '../screens/AuthFlowScreen';
import ErrorCasesScreen from '../screens/ErrorCasesScreen';

const Stack = createStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Network Tools Example' }}
        />
        <Stack.Screen
          name="ApiPlayground"
          component={ApiPlaygroundScreen}
          options={{ title: 'API Playground' }}
        />
        <Stack.Screen
          name="AuthFlow"
          component={AuthFlowScreen}
          options={{ title: 'Auth Flow' }}
        />
        <Stack.Screen
          name="ErrorCases"
          component={ErrorCasesScreen}
          options={{ title: 'Error Cases' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
