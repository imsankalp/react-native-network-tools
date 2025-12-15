import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

export type ButtonType = 'solid' | 'outline' | 'clear';

export interface ButtonProps {
  title: string;
  onPress?: () => void;

  type?: ButtonType;
  loading?: boolean;
  disabled?: boolean;
  raised?: boolean;

  icon?: React.ReactNode;

  containerStyle?: StyleProp<ViewStyle>;
  buttonStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}
