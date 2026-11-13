export const GOOGLE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.5-flash'];

export function requestAnthropic(
  request: typeof fetch, prompt: string, apiKey: string, system: string, signal?: AbortSignal,
) {
  return request('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
      stream: Boolean(signal),
    }),
  });
}

export function requestGoogle(
  request: typeof fetch, prompt: string, apiKey: string, system: string, model: string, signal?: AbortSignal,
) {
  const method = signal ? 'streamGenerateContent?alt=sse' : 'generateContent';
  return request(`https://generativelanguage.googleapis.com/v1beta/models/${model}:${method}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 8192 },
    }),
  });
}
