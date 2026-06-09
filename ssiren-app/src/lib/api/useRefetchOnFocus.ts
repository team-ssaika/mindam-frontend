import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

/**
 * Refetch a query when the screen regains focus, preserving the previous
 * useFocusEffect-based refresh behavior. Skips the very first focus (the query
 * already fetches on mount) to avoid a redundant request.
 */
export function useRefetchOnFocus(refetch: () => void) {
  const isFirst = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (isFirst.current) {
        isFirst.current = false;
        return;
      }
      refetch();
    }, [refetch])
  );
}
