import { useState, useEffect, useRef } from 'react';
/**
 * Delays updating a value until after a specified delay has passed.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
/**
 * Synchronizes state with localStorage for non-critical UI preferences.
 */
export function usePersistedState<T>(key: string, initialState: T): [T, (val: T) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialState;
    } catch (error) {
      return initialState;
    }
  });
  const setPersistedState = (value: T) => {
    setState(value);
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  };
  return [state, setPersistedState];
}