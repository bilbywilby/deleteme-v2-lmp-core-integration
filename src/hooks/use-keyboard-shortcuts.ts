import { useEffect, useCallback } from 'react';
type KeyHandler = (event: KeyboardEvent) => void;
/**
 * Custom keyboard shortcut hook for OBLIVION v5.
 * Fixes critical 'useRef' null crashes and handles input focus checks.
 */
export function useKeyboardShortcut(key: string, callback: KeyHandler, active: boolean = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!active) return;
      // Ignore if user is typing in an input or textarea
      const target = event.target as HTMLElement;
      const isInput = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;
      if (isInput) return;
      if (event.key.toLowerCase() === key.toLowerCase()) {
        callback(event);
      }
    },
    [key, callback, active]
  );
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}