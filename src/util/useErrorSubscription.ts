import { useState, useEffect } from 'react';
import type { AppError } from './types';
import { subscribeToErrors } from './reportError';
const useErrorSubscription = () => {
  const [error, setErrors] = useState<AppError[]>([]);

  useEffect(() => {
    const errorSubscription = subscribeToErrors(setErrors);
    return () => {
      if (typeof errorSubscription === 'function') {
        errorSubscription();
      }
    };
  }, []);

  return error;
};
export default useErrorSubscription;
