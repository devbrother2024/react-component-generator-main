import { useState, useCallback } from 'react';
import { useStoredState } from './useStoredState';
import type { GeneratedComponent, Provider } from '../types';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  promptHistory: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

function restoreComponents(value: unknown): GeneratedComponent[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object' ||
        !('id' in item) || typeof item.id !== 'string' ||
        !('prompt' in item) || typeof item.prompt !== 'string' ||
        !('code' in item) || typeof item.code !== 'string' ||
        !('createdAt' in item) || typeof item.createdAt !== 'string') {
      return [];
    }

    const createdAt = new Date(item.createdAt);
    if (Number.isNaN(createdAt.getTime())) return [];

    return [{ id: item.id, prompt: item.prompt, code: item.code, createdAt }];
  });
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = useStoredState('components', [], restoreComponents);
  const [promptHistory, setPromptHistory] = useStoredState<string[]>(
    'prompt-history',
    [],
    (value) => Array.isArray(value)
      ? value.filter((prompt): prompt is string => typeof prompt === 'string' && Boolean(prompt.trim()))
      : [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate component');
      }

      const newComponent: GeneratedComponent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        prompt,
        code: data.code,
        createdAt: new Date(),
      };

      setComponents((prev) => [newComponent, ...prev]);
      setPromptHistory((prev) => [prompt, ...prev.filter((entry) => entry !== prompt)]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [setComponents, setPromptHistory]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, promptHistory, isLoading, error, generate, removeComponent, clearAll };
}
