import { readEventData } from '../shared/eventStream';
import type { GenerationEvent } from '../shared/eventStream';
import { withModelFallback } from './fallback';
import { ensureRenderCall, stripCodeFences } from './generator';
import { GOOGLE_MODELS, requestAnthropic, requestGoogle } from './providerRequests';

const TRUNCATED = '생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.';

type Append = (text: string) => void;

async function readAnthropic(response: Response, append: Append) {
  if (!response.ok) throw new Error(`Claude API error: ${response.status}`);

  for await (const data of readEventData(response.body)) {
    const event = JSON.parse(data) as {
      type: string;
      delta?: { type?: string; text?: string; stop_reason?: string };
      error?: { type?: string };
    };
    if (event.type === 'error') {
      if (event.error?.type === 'overloaded_error') throw new Error('Claude API error: 503');
      if (event.error?.type === 'rate_limit_error') throw new Error('Claude API error: 429');
      throw new Error('Claude API 스트리밍 중 오류가 발생했습니다.');
    }
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      append(event.delta.text ?? '');
    }
    if (event.type === 'message_delta') {
      if (event.delta?.stop_reason === 'max_tokens') throw new Error(TRUNCATED);
      if (event.delta?.stop_reason === 'refusal') throw new Error('Claude가 코드 생성을 거부했습니다.');
    }
    if (event.type === 'message_stop') return;
  }
  throw new Error('Claude 응답이 완료되기 전에 연결이 끊겼습니다.');
}

async function readGoogle(response: Response, append: Append) {
  if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

  for await (const data of readEventData(response.body)) {
    const event = JSON.parse(data) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
        finishReason?: string;
      }>;
      error?: { code?: number };
      promptFeedback?: { blockReason?: string };
    };
    if (event.error) throw new Error(`Gemini API error: ${event.error.code ?? 'unknown'}`);
    if (event.promptFeedback?.blockReason) throw new Error('Gemini가 코드 생성을 차단했습니다.');

    const candidate = event.candidates?.[0];
    const reason = candidate?.finishReason;
    if (reason === 'MAX_TOKENS') throw new Error(TRUNCATED);
    if (reason && reason !== 'STOP') throw new Error(`Gemini 코드 생성이 중단되었습니다 (${reason}).`);

    for (const part of candidate?.content?.parts ?? []) {
      if (!part.thought) append(part.text ?? '');
    }
    if (reason === 'STOP') return;
  }
  throw new Error('Gemini 응답이 완료되기 전에 연결이 끊겼습니다.');
}

export function generationError(err: unknown) {
  const message = err instanceof Error ? err.message : 'Unknown error';
  if (message.includes('503')) {
    return { message: 'API 서버가 일시적으로 과부하 상태입니다. 잠시 후 다시 시도해주세요.', status: 503 };
  }
  if (message.includes('429')) {
    return { message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', status: 429 };
  }
  return { message, status: 500 };
}

export function generationStream(
  provider: string, prompt: string, key: string, system: string, request: typeof fetch = fetch,
): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: GenerationEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      let text = '';
      const append = (delta: string) => {
        if (!delta) return;
        text += delta;
        send({ type: 'delta', text: delta });
      };
      const completeCode = () => {
        const code = stripCodeFences(text);
        if (!code.trim()) throw new Error('모델이 코드를 반환하지 않았습니다.');
        return ensureRenderCall(code);
      };

      try {
        let code: string;
        if (provider === 'google') {
          code = await withModelFallback(GOOGLE_MODELS, async (model) => {
            abort.signal.throwIfAborted();
            if (text) send({ type: 'reset' });
            text = '';
            await readGoogle(await requestGoogle(request, prompt, key, system, model, abort.signal), append);
            return completeCode();
          });
        } else {
          await readAnthropic(await requestAnthropic(request, prompt, key, system, abort.signal), append);
          code = completeCode();
        }
        send({ type: 'complete', code });
      } catch (err) {
        send({ type: 'error', message: generationError(err).message });
      } finally {
        if (!abort.signal.aborted) controller.close();
      }
    },
    cancel() {
      abort.abort();
    },
  });
}
