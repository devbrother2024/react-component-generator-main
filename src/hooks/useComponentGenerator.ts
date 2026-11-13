import { readEventData, type GenerationEvent } from '../../shared/eventStream';
import { useState, useCallback, useRef } from 'react';
import { useStoredState } from './useStoredState';
import type { GeneratedComponent, Provider } from '../types';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  pendingComponent: GeneratedComponent | null;
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
  const [pendingComponent, setPendingComponent] = useState<GeneratedComponent | null>(null);
  const generating = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    if (generating.current) return;
    generating.current = true;
    const pending = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      prompt,
      code: '',
      createdAt: new Date(),
    };
    setPendingComponent(pending);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      let code: string | undefined;
      for await (const data of readEventData(res.body)) {
        const event = JSON.parse(data) as GenerationEvent;
        switch (event.type) {
          case 'delta':
            setPendingComponent((prev) => prev && { ...prev, code: prev.code + event.text });
            break;
          case 'reset':
            setPendingComponent(pending);
            break;
          case 'error':
            throw new Error(event.message);
          case 'complete':
            code = event.code;
            break;
        }
        if (code !== undefined) break;
      }

      if (!code) throw new Error('코드 생성이 완료되기 전에 연결이 끊겼습니다.');
      const newComponent = { ...pending, code };
      setComponents((prev) => [newComponent, ...prev]);
      setPromptHistory((prev) => [prompt, ...prev.filter((entry) => entry !== prompt)]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setPendingComponent(null);
      generating.current = false;
    }
  }, [setComponents, setPromptHistory]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, pendingComponent, promptHistory, isLoading: pendingComponent !== null, error, generate, removeComponent, clearAll };
}
