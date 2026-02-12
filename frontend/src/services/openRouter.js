/**
 * OpenRouter API client for Sprout AI chat.
 * Set VITE_OPENROUTER_API_KEY in .env (see .env.example).
 *
 * Models:
 * - Default (chat, report summary): Gemini 2.5 Pro – strong reasoning, large context.
 * - Report generation: Perplexity Sonar Pro – web-backed retrieval for up-to-date, factual report content.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-2.5-pro';
const REPORT_MODEL = 'perplexity/sonar-pro';

/**
 * @param {Array<{ role: 'user' | 'assistant' | 'system', content: string }>} messages
 * @param {Object} options - { model?, max_tokens?, temperature? }
 * @returns {Promise<string>} Assistant reply text
 */
export async function chatCompletion(messages, options = {}) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('OpenRouter API key is missing. Add VITE_OPENROUTER_API_KEY to your .env file.');
  }

  const { model = DEFAULT_MODEL, max_tokens = 1024, temperature = 0.7 } = options;

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens,
      temperature,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    let message = `OpenRouter error ${res.status}`;
    try {
      const j = JSON.parse(errBody);
      if (j.error?.message) message = j.error.message;
    } catch (_) {}
    throw new Error(message);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (content == null) throw new Error('No response content from OpenRouter');
  return typeof content === 'string' ? content : String(content);
}

const REPORT_SUMMARY_SYSTEM = `You are Sprout AI in a conversational chat. The user has asked for a sustainability/carbon report (possibly as a follow-up, e.g. "write it for Shake Shack instead").

Reply in 2–4 short, natural sentences. Say what this report covers (company/sector/year if relevant) and that they can view the full report below. If the user refined a previous request (e.g. different company or scope), acknowledge that naturally (e.g. "I've generated an updated report for Shake Shack…" or "Done — same F&B 2025 scope, now for Shake Shack."). Sound like a helpful assistant, not a template. Do not write the full report in your response.`;

/**
 * Short summary for chat when user requests a report.
 * @param {string} fullRequest - User's latest message plus optional conversation context
 * @returns {Promise<string>}
 */
export async function reportSummaryForChat(fullRequest) {
  return chatCompletion(
    [
      { role: 'system', content: REPORT_SUMMARY_SYSTEM },
      { role: 'user', content: fullRequest },
    ],
    { max_tokens: 256, temperature: 0.6 }
  );
}

const REPORT_WRITER_SYSTEM = `You are a sustainability report writer for CarbonX. The user has requested a report – generate ALL content yourself based on their request. Do not use static templates or placeholder text. Invent plausible, professional content tailored to whatever they asked for (e.g. a company name, sector like F&B or retail, a product, Scope 3, packaging, year). Use the conversation context if provided to infer company/sector/scope.

Respond with ONLY a valid JSON object (no markdown, no code fence, no extra text). The JSON must have exactly these keys:
- reportTitle (string): a short, professional name for the report (e.g. "WingStop Carbon Report", "FY2025 F&B Sustainability Report"). Use the company/sector/scope from the request – do not repeat the user's raw prompt
- reportSummary (string): 1–2 sentences summarizing what this report covers (scope, focus areas, period). Used as the report description in the list
- productName (string): report scope/title from the user's request (e.g. company name, product, or "FY2025 F&B")
- companyName (string, optional): legal or display name of the company for sign-off and "About" section; if omitted, productName is used
- boardStatement (string): 2-4 paragraphs, formal board statement – written for the inferred company/sector
- companyProfile (string): 1-2 paragraphs about the company (invent a credible profile if not given)
- sustainabilityApproach (string): 1 paragraph
- stakeholderEngagement (string): 1 paragraph
- frameworks (array of strings): e.g. ["GRI Standards", "GHG Protocol", "TCFD"]
- environmentalAnalysis (array of objects): each with title, keyData, strategy, performance, outlook (all strings) – 3-4 items, specific to the request
- socialAnalysis (array of objects): same structure, 3-4 items
- governanceAnalysis (array of objects): same structure, 3-4 items
- futureTargets (array of objects): each with area, goal, status (all strings) – 3-5 items

Every string must be substantive, professional, and specific to the user's topic. No generic filler.`;

/**
 * Generate full structured report JSON for the Report page.
 * @param {string} userRequest
 * @returns {Promise<Object>} Parsed report fullData
 */
export async function generateStructuredReport(userRequest) {
  const raw = await chatCompletion(
    [
      { role: 'system', content: REPORT_WRITER_SYSTEM },
      { role: 'user', content: userRequest },
    ],
    { model: REPORT_MODEL, max_tokens: 4096, temperature: 0.6 }
  );
  let text = raw.trim();
  const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeMatch) text = codeMatch[1].trim();
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Invalid report structure');
  return data;
}
