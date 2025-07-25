import { useCallback, useEffect, useRef, useState } from 'react';

type UseDebounceOptions = {
  delay?: number;
  leading?: boolean;
};

export function useDebounce<T>(
  value: T,
  callback: (value: T) => void,
  options: UseDebounceOptions = {}
): [T, (value: T) => void] {
  const { delay = 500, leading = false } = options;
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isMounted = useRef(true);
  const timeoutRef = useRef<number>(null);
  const shouldCallLeading = useRef(true);

  // Cleanup function
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Handle debounced value changes
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (leading && shouldCallLeading.current) {
      callback(value);
      shouldCallLeading.current = false;
    }

    timeoutRef.current = setTimeout(() => {
      if (isMounted.current) {
        setDebouncedValue(value);
        if (!leading) {
          callback(value);
        } else {
          shouldCallLeading.current = true;
        }
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, callback, leading]);

  return [debouncedValue, setDebouncedValue];
}

export function useDebouncedCallback<T>(
  callback: (value: T) => void,
  delay: number = 500
): (value: T) => void {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<number>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (value: T) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(value);
      }, delay);
    },
    [delay]
  );

  return debouncedCallback;
}
