export const colors = {
  primary: '#4A6FA5', // Primary brand color
  secondary: '#6B4E90', // Secondary brand color
  success: '#4CAF50', // Success state
  warning: '#FFC107', // Warning state
  error: '#F44336', // Error state
  background: '#1E1E1E', // Main background
  surfaceBg: '#121212', // Surface background
  grey0: '#F8F9FA', // Lightest grey (replacing surface)
  grey1: '#E9ECEF', // Light grey
  grey2: '#DEE2E6', // Border color
  grey3: '#ADB5BD', // Secondary text
  grey4: '#6C757D', // Muted text
  grey5: '#495057', // Dark grey
  greyOutline: '#CED4DA', // Outline color
  searchBg: '#F1F3F5', // Search background
  white: '#FFFFFF',
  black: '#212529', // Primary text
  transparent: 'transparent',
};

const theme = {
  lightColors: {
    ...colors,
  },
  darkColors: {
    ...colors,
    primary: '#5D8BF4',
    background: '#121212',
    grey0: '#1E1E1E', // Dark mode background
    grey1: '#2D2D2D', // Dark mode surface
    grey2: '#3E3E3E', // Dark mode borders
    grey3: '#ADB5BD', // Dark mode secondary text
    grey4: '#8E8E93', // Dark mode muted text
    grey5: '#C7C7CC', // Dark mode dark grey
    searchBg: '#1C1C1E', // Dark mode search background
    black: '#F8F9FA', // Dark mode text
  },
  mode: 'light',
  components: {
    Button: {
      raised: true,
      buttonStyle: {
        borderRadius: 8,
        paddingVertical: 10,
      },
      titleStyle: {
        fontWeight: '600',
      },
      containerStyle: {
        margin: 4,
      },
    },
    Card: {
      containerStyle: {
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    },
    Input: {
      inputContainerStyle: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        borderColor: colors.grey2,
      },
      inputStyle: {
        fontSize: 16,
        color: colors.black,
      },
      labelStyle: {
        color: colors.grey4,
        marginBottom: 4,
        fontSize: 14,
      },
      errorStyle: {
        marginTop: 4,
        color: colors.error,
      },
      placeholderTextColor: colors.grey3,
    },
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '600' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.grey4,
  },
};

export default theme;
