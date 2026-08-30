import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react';
import { navigatorReducer, INITIAL_STATE } from './reducer';
import type { NavigatorContextType, Screen, Tab } from './types';

// ─── Context ──────────────────────────────────────────────────────────────────

const NavigatorContext = createContext<NavigatorContextType | undefined>(
  undefined
);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const NavigatorProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(navigatorReducer, INITIAL_STATE);

  const currentStack = state.stacks[state.activeTab];
  const currentScreen = currentStack[currentStack.length - 1] as Screen;
  const canGoBack = currentStack.length > 1;
  const stackDepth = currentStack.length;

  const switchTab = useCallback((tab: Tab) => {
    dispatch({ type: 'SWITCH_TAB', tab });
  }, []);

  const push = useCallback((screen: Screen) => {
    dispatch({ type: 'PUSH', screen });
  }, []);

  const pop = useCallback(() => {
    dispatch({ type: 'POP' });
  }, []);

  const popToRoot = useCallback(() => {
    dispatch({ type: 'POP_TO_ROOT' });
  }, []);

  const value = useMemo<NavigatorContextType>(
    () => ({
      activeTab: state.activeTab,
      currentScreen,
      canGoBack,
      stackDepth,
      switchTab,
      push,
      pop,
      popToRoot,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.activeTab, currentScreen, canGoBack, stackDepth]
  );

  return (
    <NavigatorContext.Provider value={value}>
      {children}
    </NavigatorContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useNavigator(): NavigatorContextType {
  const context = useContext(NavigatorContext);
  if (context === undefined) {
    throw new Error('useNavigator must be called within NavigatorProvider');
  }
  return context;
}

export default NavigatorContext;
