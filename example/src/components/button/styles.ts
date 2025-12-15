import { StyleSheet } from 'react-native';

const PRIMARY = '#2089dc';

export const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pressed: {
    opacity: 0.85,
  },

  raised: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },

  disabled: {
    opacity: 0.5,
  },

  title: {
    fontSize: 16,
    fontWeight: '600',
  },

  disabledTitle: {
    color: '#aaa',
  },

  icon: {
    marginRight: 8,
  },
});

export const stylesByType = StyleSheet.create({
  solid: {
    backgroundColor: PRIMARY,
  },
  outline: {
    borderWidth: 1,
    borderColor: PRIMARY,
    backgroundColor: 'transparent',
  },
  clear: {
    backgroundColor: 'transparent',
  },
});

export const titleStylesByType = StyleSheet.create({
  solid: {
    color: '#fff',
  },
  outline: {
    color: PRIMARY,
  },
  clear: {
    color: PRIMARY,
  },
});
