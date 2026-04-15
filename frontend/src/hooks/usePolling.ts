import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for polling an API endpoint every `interval` ms.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  interval: number = 2000
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const poll = useCallback(async () => {
    try {
      const result = await fetcher();
      if (mountedRef.current) {
        setData(result);
        setError(null);
        setLoading(false);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    }
  }, [fetcher]);

  useEffect(() => {
    mountedRef.current = true;
    poll(); // Initial fetch
    const handle = setInterval(poll, interval);
    return () => {
      mountedRef.current = false;
      clearInterval(handle);
    };
  }, [poll, interval]);

  return { data, error, loading };
}
