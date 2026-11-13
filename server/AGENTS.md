# 서버 작업 지침

## Module Context

생성 API가 제공사별 요청을 중계하고 모델 응답을 브라우저 미리보기용 코드로 변환한다.

## Tech Stack & Constraints

- 라우팅은 `Bun.serve`의 `fetch`에서 처리한다. 제공사 호출에는 기본 `fetch`를 사용한다. 근거: `server/index.ts:68-82`, `server/index.ts:98-109`, `server/index.ts:138-145`.

## Implementation Patterns

- 새 제공사도 응답에서 텍스트를 추출해 공통 정규화 경로로 전달한다. 정규화는 코드 펜스를 제거한 뒤 필요한 렌더 호출을 보완한다. 근거: `server/index.ts:183-190`, `server/generator.ts:5-24`.

## Testing Strategy

- 루트에서 `bun run test server`를 실행한다. 폴백은 호출 함수를 주입하고, 정규화는 문자열 입력과 출력으로 검증한다. 근거: `server/fallback.test.ts:5-39`, `server/generator.test.ts:5-39`.

## Local Golden Rules

- Google 모델은 선언 순서대로 시도한다. 첫 성공 시 중단하고 모두 실패하면 마지막 오류를 전달한다. 이 폴백은 Google 경로에 적용되며 Anthropic 경로는 모델을 한 번 호출한다. 근거: `server/index.ts:4-5`, `server/index.ts:134-135`, `server/index.ts:183-186`, `server/fallback.ts:7-19`.
- Google 응답의 `MAX_TOKENS`는 잘린 코드이므로 성공 결과로 반환하지 않는다. 오류로 처리해야 다음 모델을 시도할 수 있다. 근거: `server/index.ts:122-135`.
- 이미 `render(...)`가 있으면 유지한다. 호출이 없고 컴포넌트 선언을 식별할 수 있을 때만 보완한다. 근거: `server/generator.ts:16-24`, `server/generator.test.ts:21-39`.
