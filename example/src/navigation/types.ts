// Define the parameter list for the root stack
export type RootStackParamList = {
  Home: undefined;
  ApiPlayground: undefined;
  AuthFlow: undefined;
  ErrorCases: undefined;
};

// Export the type for use with useNavigation
export type RootNavigationProp =
  import('@react-navigation/native').NavigationProp<RootStackParamList>;
