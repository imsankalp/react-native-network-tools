import React from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { styles, stylesByType, titleStylesByType } from './styles';
import type { ButtonProps } from './types';

export const RNButton: React.FC<ButtonProps> = ({
  title,
  onPress,
  type = 'solid',
  loading = false,
  disabled = false,
  raised = false,
  icon,

  containerStyle,
  buttonStyle,
  titleStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <View style={containerStyle}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          stylesByType[type],
          raised && styles.raised,
          pressed && !isDisabled && styles.pressed,
          isDisabled && styles.disabled,
          buttonStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={type === 'solid' ? '#fff' : '#2089dc'} />
        ) : (
          <>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text
              style={[
                styles.title,
                titleStylesByType[type],
                isDisabled && styles.disabledTitle,
                titleStyle,
              ]}
            >
              {title}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
};
