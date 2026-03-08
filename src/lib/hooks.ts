import { useState, useEffect, useRef, useCallback } from 'react';
/**
 * Delays updating a value until after a specified delay has passed.
 * Optimized for React 18 concurrent renderer using a ref for stability.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);
  return debouncedValue;
}
/**
 * Synchronizes state with localStorage for non-critical UI preferences.
 * Includes mounted check and stable reference setter to resolve linting errors.
 */
export function usePersistedState<T>(key: string, initialState: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      console.warn(`Local storage read error for key "${key}":`, error);
      return initialState;
    }
  });
  const isMounted = useRef(true);
  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);
  const setPersistedState = useCallback((value: T) => {
    if (!isMounted.current) return;
    setState(value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Local storage write error for key "${key}":`, error);
    }
  }, [key]);
  return [state, setPersistedState];
}