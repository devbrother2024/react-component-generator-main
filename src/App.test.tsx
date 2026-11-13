import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url === '/api/config'
    ? Response.json({ envKeys: { anthropic: true, google: true } })
    : new Response('data: {"type":"complete","code":"render(<div>Generated preview</div>);"}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    })));
});

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

test('restores the selected provider after reloading', async () => {
  const user = userEvent.setup();
  const app = render(<App />);
  await user.selectOptions(screen.getByLabelText('모델 제공사'), 'anthropic');
  app.unmount();

  render(<App />);
  expect(screen.getByLabelText('모델 제공사')).toHaveValue('anthropic');
});

test('restores a manually entered API key after reloading', async () => {
  const user = userEvent.setup();
  const app = render(<App />);
  await user.type(screen.getByLabelText('API Key'), 'test-google-key');
  app.unmount();

  render(<App />);
  expect(screen.getByLabelText('API Key')).toHaveValue('test-google-key');
});

test('restores a generated component and persists its removal', async () => {
  const user = userEvent.setup();
  const app = render(<App />);
  await user.type(screen.getByLabelText('무엇을 만들까요?'), '프로필 카드');
  await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await screen.findByRole('button', { name: '삭제' });
  app.unmount();

  const restoredApp = render(<App />);
  const results = screen.getByRole('region', { name: '생성 결과' });
  expect(within(results).getByText('프로필 카드')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '삭제' }));
  restoredApp.unmount();

  render(<App />);
  expect(screen.queryByRole('button', { name: '삭제' })).not.toBeInTheDocument();
});

test('restores a successful prompt for reuse after clearing the results and reloading', async () => {
  const user = userEvent.setup();
  const app = render(<App />);
  await user.type(screen.getByLabelText('무엇을 만들까요?'), '검색 카드 만들기');
  await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  await user.click(await screen.findByRole('button', { name: '전체 삭제' }));
  app.unmount();

  render(<App />);
  await user.click(screen.getByRole('button', { name: '검색 카드 만들기' }));
  expect(screen.getByLabelText('무엇을 만들까요?')).toHaveValue('검색 카드 만들기');
});

test('shows incoming code before switching to the completed preview', async () => {
  const user = userEvent.setup();
  const encoder = new TextEncoder();
  let send!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(controller) { send = controller; },
  });
  vi.mocked(fetch).mockImplementation(async (url) => url === '/api/config'
    ? Response.json({ envKeys: { anthropic: true, google: true } })
    : new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }));

  render(<App />);
  await user.type(screen.getByLabelText('무엇을 만들까요?'), '스트리밍 카드');
  await user.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
  expect(screen.getByRole('button', { name: '코드', pressed: true })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '미리보기' })).toBeDisabled();

  send.enqueue(encoder.encode('data: {"type":"delta","text":"const Card = '));
  send.enqueue(encoder.encode('() => <div>생성 중"}\r\n\r\n'));
  expect(await screen.findByText('const Card = () => <div>생성 중')).toBeInTheDocument();
  expect(localStorage.getItem('react-component-generator:components')).toBe('[]');

  send.enqueue(encoder.encode('data: {"type":"complete","code":"render(<div>Streaming preview</div>);"}\n\n'));
  send.close();
  expect(await screen.findByText('Streaming preview')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '미리보기', pressed: true })).toBeEnabled();
});
