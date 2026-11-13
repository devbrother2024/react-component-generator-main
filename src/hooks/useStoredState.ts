import { useEffect, useState } from 'react';

export function useStoredState<T>(
  name: string,
  fallback: T,
  restore: (value: unknown) => T,
) {
  const key = `react-component-generator:${name}`;
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved === null ? fallback : restore(JSON.parse(saved));
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // The app can still use in-memory state when browser storage is unavailable.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
