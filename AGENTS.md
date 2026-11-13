# AGENTS.md

## Operational Commands

- 개발 서버: `bun run dev`
- 테스트: `bun run test`. Vite 설정이 지정한 Vitest로 브라우저와 서버 테스트를 함께 실행한다.
- 린트: `bun run lint`
- 타입 검사 및 빌드: `bun run build`
- 의존성 변경에는 Bun을 사용하고 `bun.lock`을 갱신한다.

## Golden Rules

- 개발 API는 상대 경로 `/api`로 호출한다. 서버 포트를 바꿀 때는 Vite 프록시 대상도 함께 바꾼다. 근거: `src/hooks/useComponentGenerator.ts:23`, `vite.config.ts:8-14`, `server/index.ts:138-140`.
- 생성 코드는 브라우저의 `react-live`에서 직접 평가된다. 모델 출력은 외부 import와 TypeScript 문법 없이 작성하고 `render(...)` 호출을 유지한다. 시스템 프롬프트와 서버 정규화가 같은 계약을 지킨다. 근거: `server/index.ts:7-20`, `server/index.ts:188-190`, `src/components/LivePreview.tsx:14`.
- 서버 환경변수의 API 키는 서버에서만 사용한다. `/api/config`는 제공사별 키 유무를 불리언으로 반환한다. 직접 입력한 키는 생성 요청에만 전달하고 브라우저 저장소에 기록하지 않는다. 근거: `server/index.ts:59-66`, `server/index.ts:147-156`, `src/App.tsx:14-19`, `src/hooks/useComponentGenerator.ts:23-27`.

## TDD Rule

> **이 규칙은 Rigid — 상황에 맞게 변형하지 마라**

### 적용 기준

- **필수:** 비즈니스 로직, API, 유틸리티, 버그 수정.
- **불필요:** 타입 정의, 설정 파일, 순수 UI(레이아웃·스타일), SQL.
- 한 변경에 두 범주가 섞이면 **필수 대상 동작**에 TDD를 적용한다.

### RED → GREEN → REFACTOR

1. **RED:** 동작 하나당 테스트 하나를 먼저 작성하고 반드시 실행해 실패를 확인한다. 실패 이유는 **기능 미구현**이어야 한다. 버그 수정에서는 테스트가 기존 버그를 재현해야 한다. 테스트 설정이나 문법 오류로 실패하면 바로잡고 다시 실행한다.
2. **GREEN:** 테스트를 통과시키는 **최소한의 프로덕션 코드**만 작성한다. **YAGNI** 원칙에 따라 현재 동작에 필요한 코드만 추가한다. 신규 테스트와 기존 테스트를 모두 실행해 통과를 확인한다.
3. **REFACTOR:** 필요하면 중복을 제거하고, 이름을 개선하고, 헬퍼를 추출한다. 테스트를 다시 실행해 **GREEN을 유지**한다. **새 동작을 추가하지 않는다.**
4. **반복:** 다음 동작에 대한 **RED**로 돌아간다.

### 삭제 강제 규칙

TDD 적용 대상의 프로덕션 코드를 테스트보다 먼저 작성했다면 **먼저 작성한 코드를 삭제하고 RED부터 재시작한다.** 주석이나 별도 파일에 **참고용으로 남기는 것도 금지한다.**

### 변명 차단표

| 변명 | 적용 규칙 |
| --- | --- |
| 너무 단순해서 테스트 불필요 | 필수 대상이면 단순한 동작도 테스트 하나로 확인한다. |
| 나중에 추가하겠다 | 구현 전에 테스트를 실행해 RED를 확인한다. |
| 시간이 없다 | 한 번에 구현할 동작의 범위를 줄이고 사이클을 지킨다. |
| 삭제하면 낭비 | 먼저 작성한 코드를 삭제하고 실패하는 테스트에서 다시 시작한다. |
| 프로토타입이다 | 프로토타입에서도 필수 대상 동작은 같은 사이클을 따른다. |

### 하위 디렉토리 우선

이 섹션은 **전역 기본값(fallback)**이다. 하위 디렉토리의 `AGENTS.md`에 별도 TDD 규칙이 있으면 해당 디렉토리 범위에서 **하위 규칙을 우선 적용한다.**

## Project Context

사용자가 자연어로 요청한 React UI를 생성해 실행 결과를 확인하고 코드를 복사할 수 있게 한다.

React, TypeScript, Vite, Bun, Vitest, react-live.

## Standards & References

- 설치와 실행 환경은 [README](./README.md)를 참고한다.
- 커밋 요청은 [commit 스킬](./.agents/skills/commit/SKILL.md)을 따른다. 변경을 목적별로 묶고 `feat/fix/refactor/chore: 한국어 요약` 형식을 사용한다. 별도 승인 없이 커밋한다.
- 규칙과 구현이 어긋나면 근거를 확인하고 해당 규칙의 갱신을 제안한다.

## Context Map

- [브라우저 UI, 입력, 미리보기](./src/AGENTS.md)
- [생성 API, 모델 호출, 출력 정규화](./server/AGENTS.md)
