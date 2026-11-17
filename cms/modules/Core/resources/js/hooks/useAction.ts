import { useState, useCallback } from 'react';
import { message } from 'antd';

interface UseActionOptions<T, P> {
  action: (params: P) => Promise<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMessage?: string;
}

export function useAction<T = any, P = any>({
  action,
  onSuccess,
  onError,
  successMessage,
}: UseActionOptions<T, P>) {
  const [loading, setLoading] = useState(false);

  const execute = useCallback(
    async (params: P) => {
      setLoading(true);
      try {
        const result = await action(params);
        if (successMessage) {
          message.success(successMessage);
        }
        onSuccess?.(result);
        return result;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || err.message || 'Action failed';
        message.error(errorMsg);
        onError?.(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [action, onSuccess, onError, successMessage]
  );

  return { execute, loading };
}

export default useAction;
