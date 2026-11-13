# 프런트엔드 작업 지침

## Module Context

프롬프트와 모델 설정을 입력받고 생성 결과를 미리보기와 코드로 표시한다.

## Tech Stack & Constraints

- 미리보기는 `LiveProvider`의 `noInline` 모드로 실행한다. 실행 중 오류는 같은 패널의 `LiveError`로 표시한다. 근거: `src/components/LivePreview.tsx:13-19`.

## Implementation Patterns

- 최초 생성과 재생성은 `App`의 `handleGenerate`를 공유한다. 로딩·오류·결과 목록 변경은 `useComponentGenerator`에서 처리한다. 근거: `src/App.tsx:33-39`, `src/App.tsx:66`, `src/App.tsx:101-108`, `src/hooks/useComponentGenerator.ts:18-48`.

## Testing Strategy

- 루트에서 `bun run test src`를 실행한다. 프롬프트 동작은 Testing Library의 역할 기반 조회와 `userEvent`로 검증한다. 근거: `vite.config.ts:16-20`, `src/components/PromptInput.test.tsx:1-28`.

## Local Golden Rules

- 생성 버튼과 Ctrl/Cmd+Enter는 같은 제출 처리기를 거친다. 공백뿐인 입력과 생성 중 요청은 처리기에서도 차단한다. 버튼의 비활성 상태만으로는 단축키를 막을 수 없다. 근거: `src/components/PromptInput.tsx:21-25`, `src/components/PromptInput.tsx:35-56`.
- 생성 요청에 선택한 제공사를 명시하고, 제공사를 전환하면 직접 입력한 키를 비운다. UI 초기값은 Google이고 서버에서 제공사를 생략한 요청의 기본값은 Anthropic이다. 근거: `src/App.tsx:14-16`, `src/App.tsx:33-44`, `src/hooks/useComponentGenerator.ts:23-27`, `server/index.ts:159-165`.
