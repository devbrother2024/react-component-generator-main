export async function* readEventData(body: ReadableStream<Uint8Array> | null) {
  if (!body) throw new Error('응답 스트림을 열 수 없습니다.');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let data: string[] = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf('\n');
      while (newline !== -1) {
        const line = buffer.slice(0, newline).replace(/\r$/, '');
        buffer = buffer.slice(newline + 1);
        if (line.startsWith('data:')) {
          data.push(line.slice(5).replace(/^ /, ''));
        } else if (line === '' && data.length) {
          yield data.join('\n');
          data = [];
        }
        newline = buffer.indexOf('\n');
      }
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export type GenerationEvent =
  | { type: 'delta'; text: string }
  | { type: 'reset' }
  | { type: 'complete'; code: string }
  | { type: 'error'; message: string };
