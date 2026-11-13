import { useRef, useState } from 'react';
import { MAX_PROMPT_LENGTH, validatePrompt } from '../utils/validatePrompt';

interface PromptInputProps {
  onGenerate: (prompt: string) => void;
  isLoading: boolean;
}

const EXAMPLES = [
  { label: 'KPI 카드', prompt: 'SaaS 관리자용 KPI 카드 3개. 매출, 활성 사용자, 전환율을 비교 가능한 형태로 표시' },
  { label: '알림 설정', prompt: '설정 페이지의 알림 토글 패널. 이메일, 슬랙, 주간 리포트 옵션 포함' },
  { label: '검색 필터', prompt: '검색 필터 바. 상태, 담당자, 날짜 범위를 선택하고 결과 수를 보여주는 UI' },
  { label: '온보딩 체크리스트', prompt: '온보딩 체크리스트. 5단계 진행률과 완료/대기 상태를 보여주는 카드' },
  { label: '요금제 비교', prompt: '요금제 비교 카드 3개. 추천 플랜을 강조하고 CTA 버튼 포함' },
  { label: '고객 상세 패널', prompt: '테이블 행 상세보기 패널. 선택한 고객의 기본 정보와 최근 활동 표시' },
];

export function PromptInput({ onGenerate, isLoading }: PromptInputProps) {
  const [prompt, setPrompt] = useState('');
  const promptField = useRef<HTMLTextAreaElement>(null);
  const { trimmedPrompt, length, isTooLong } = validatePrompt(prompt);
  const canGenerate = Boolean(trimmedPrompt) && !isTooLong && !isLoading;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canGenerate) {
      onGenerate(trimmedPrompt);
    }
  };

  const handleExampleClick = (example: string) => {
    setPrompt(example);
    promptField.current?.focus();
  };

  return (
    <div className="prompt-section">
      <form onSubmit={handleSubmit} className="prompt-form">
        <label htmlFor="component-prompt">무엇을 만들까요?</label>
        <textarea
          id="component-prompt"
          ref={promptField}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="예: 아바타와 팔로우 버튼이 있는 프로필 카드를 만들어줘."
          className="prompt-textarea"
          aria-invalid={isTooLong}
          aria-describedby={isTooLong ? 'prompt-length prompt-error' : 'prompt-length'}
          rows={3}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              handleSubmit(e);
            }
          }}
        />
        <div className="prompt-feedback">
          <span id="prompt-length">{length} / {MAX_PROMPT_LENGTH}자</span>
          {isTooLong && (
            <p id="prompt-error" role="alert">
              프롬프트를 {MAX_PROMPT_LENGTH}자 이하로 줄여주세요.
            </p>
          )}
        </div>
        <div className="prompt-actions">
          <span className="keyboard-hint"><kbd>⌘ / Ctrl</kbd> <kbd>Enter</kbd></span>
          <button
            type="submit"
            className="btn-generate"
            disabled={!canGenerate}
          >
            {isLoading ? '생성 중...' : '컴포넌트 생성'}
          </button>
        </div>
      </form>
      <div className="prompt-examples">
        <span className="examples-label">예시 프롬프트</span>
        {EXAMPLES.map(({ label, prompt: example }) => (
          <button
            key={label}
            className="example-chip"
            onClick={() => handleExampleClick(example)}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
