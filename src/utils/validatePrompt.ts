export const MAX_PROMPT_LENGTH = 500;

export function validatePrompt(prompt: string) {
  const trimmedPrompt = prompt.trim();
  const length = Array.from(trimmedPrompt).length;

  return { trimmedPrompt, length, isTooLong: length > MAX_PROMPT_LENGTH };
}
