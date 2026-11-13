import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PromptInput } from './PromptInput';

describe('PromptInput', () => {
  it('프롬프트가 비어 있으면 생성 버튼이 비활성이다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
  });

  it('입력하면 버튼이 활성화되고 클릭 시 입력값으로 onGenerate가 호출된다', async () => {
    const onGenerate = vi.fn();
    const user = userEvent.setup();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    await user.type(screen.getByRole('textbox'), '프로필 카드');
    const submit = screen.getByRole('button', { name: '컴포넌트 생성' });
    expect(submit).toBeEnabled();

    await user.click(submit);
    expect(onGenerate).toHaveBeenCalledWith('프로필 카드');
  });

  it('로딩 중에는 생성 버튼이 비활성이고 "생성 중..." 을 보여준다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={true} />);
    expect(screen.getByRole('button', { name: '생성 중...' })).toBeDisabled();
  });

  it('앞뒤 공백을 제외한 500자 프롬프트를 제출한다', () => {
    const onGenerate = vi.fn();
    const prompt = '가'.repeat(500);
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: ` ${prompt} ` } });
    fireEvent.click(screen.getByRole('button', { name: '컴포넌트 생성' }));
    expect(onGenerate).toHaveBeenCalledWith(prompt);
  });

  it('500자를 넘기면 오류를 표시하고 생성 버튼을 비활성화한다', () => {
    render(<PromptInput onGenerate={vi.fn()} isLoading={false} />);
    const field = screen.getByRole('textbox');

    fireEvent.change(field, { target: { value: '가'.repeat(501) } });

    expect(screen.getByRole('button', { name: '컴포넌트 생성' })).toBeDisabled();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('프롬프트를 500자 이하로 줄여주세요.')).toBeVisible();
    expect(screen.getByText('501 / 500자')).toBeVisible();
  });

  it.each(['ctrlKey', 'metaKey'])('초과 입력의 %s+Enter 제출을 차단한다', (modifier) => {
    const onGenerate = vi.fn();
    render(<PromptInput onGenerate={onGenerate} isLoading={false} />);
    const field = screen.getByRole('textbox');

    fireEvent.change(field, { target: { value: '가'.repeat(501) } });
    fireEvent.keyDown(field, { key: 'Enter', [modifier]: true });

    expect(onGenerate).not.toHaveBeenCalled();
  });
});
