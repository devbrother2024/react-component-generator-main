import { expect, test, vi } from 'vitest';
import { generationStream } from './generationStream';

test('streams Google code, clears a truncated attempt, and completes with normalized fallback code', async () => {
  let send!: ReadableStreamDefaultController<Uint8Array>;
  const upstream = new ReadableStream<Uint8Array>({
    start(controller) { send = controller; },
  });
  const encoder = new TextEncoder();
  const request = vi.fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(upstream))
    .mockResolvedValueOnce(new Response(
      'data: {"candidates":[{"content":{"parts":[{"text":"const Card = () => <div />;"}]},"finishReason":"STOP"}]}\n\n',
    ));

  const response = generationStream('google', 'card', 'fake-key', 'system', request);
  const reader = response.getReader();
  send.enqueue(encoder.encode('data: {"candidates":[{"content":{"parts":[{"text":"const Partial"}]}}]}\n\n'));
  const decoder = new TextDecoder();
  expect(decoder.decode((await reader.read()).value)).toContain('"type":"delta","text":"const Partial"');
  expect(request).toHaveBeenCalledWith(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:streamGenerateContent?alt=sse',
    expect.objectContaining({ headers: expect.objectContaining({ 'x-goog-api-key': 'fake-key' }) }),
  );
  expect(request).toHaveBeenCalledTimes(1);

  send.enqueue(encoder.encode('data: {"candidates":[{"finishReason":"MAX_TOKENS"}]}\n\n'));
  send.close();
  expect(decoder.decode((await reader.read()).value)).toContain('"type":"reset"');
  expect(decoder.decode((await reader.read()).value)).toContain('"type":"delta","text":"const Card');
  expect(decoder.decode((await reader.read()).value)).toContain('render(<Card />);');
  expect((await reader.read()).done).toBe(true);
});

test('streams Anthropic text deltas and rejects a stream without message_stop', async () => {
  const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(
    'event: content_block_delta\ndata: {"type":"content_block_delta","delta":{"type":"text_delta","text":"const Card"}}\n\n',
  ));

  const body = await new Response(generationStream('anthropic', 'card', 'fake-key', 'system', request)).text();
  expect(JSON.parse(String(request.mock.calls[0]?.[1]?.body ?? '{}'))).toMatchObject({ stream: true });
  expect(body).toContain('"type":"delta","text":"const Card"');
  expect(body).toContain('"type":"error"');
  expect(body).not.toContain('"type":"complete"');
});
