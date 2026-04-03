/**
 * Parse JSON from LLM text that may include markdown fences or trailing prose.
 */

/**
 * @param {string} raw
 * @returns {object|Array}
 */
export function parseJsonFromLlmOutput(raw) {
  let text = String(raw ?? '').trim();
  if (!text) throw new Error('Empty LLM response');

  text = text.replace(/^```(?:json)?\s*\r?\n?/i, '').trim();
  text = text.replace(/\r?\n?```\s*$/i, '').trim();

  try {
    return JSON.parse(text);
  } catch (_) {
    const slice = extractFirstJsonValue(text);
    if (slice == null) throw new Error('Could not parse JSON from model output');
    return JSON.parse(slice);
  }
}

const BRACKET_PAIR = { '{': '}', '[': ']' };

/**
 * Extract first top-level JSON object or array (respects strings; handles mixed `{}` / `[]`).
 * @param {string} s
 * @returns {string|null}
 */
function extractFirstJsonValue(s) {
  const startObj = s.indexOf('{');
  const startArr = s.indexOf('[');
  if (startObj === -1 && startArr === -1) return null;
  const start =
    startObj === -1 ? startArr : startArr === -1 ? startObj : Math.min(startObj, startArr);

  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (c === '\\') {
        escape = true;
        continue;
      }
      if (c === '"') {
        inString = false;
        continue;
      }
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === '{' || c === '[') {
      stack.push(c);
      continue;
    }
    if (c === '}' || c === ']') {
      if (!stack.length) return null;
      const top = stack[stack.length - 1];
      if (BRACKET_PAIR[top] !== c) return null;
      stack.pop();
      if (stack.length === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
