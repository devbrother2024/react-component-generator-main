import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import App from './App';

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
    ok: true,
    json: async () => url === '/api/config'
      ? { envKeys: { anthropic: true, google: true } }
      : { code: 'render(<div>Generated preview</div>);' },
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
