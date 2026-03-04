/**
 * OpenRouter API client for Sprout AI chat.
 * Set VITE_OPENROUTER_API_KEY in .env (see .env.example).
 *
 * Models:
 * - Main SproutAI interface (chat, report summary): Gemini 2.5 Pro.
 * - Popup chatbot (Dashboard/Analytics): Perplexity Sonar Pro – web-backed, in-context Q&A.
 * - Report writing (structured JSON): Gemini 2.0 Flash – fast structured JSON, no thinking overhead.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
/** Main SproutAI page: general chat + report summary in chat. */
const DEFAULT_MODEL = 'google/gemini-2.5-pro';
/** Popup chatbot on Dashboard/Analytics. */
export const POPUP_MODEL = 'perplexity/sonar-pro';
/** Full structured report JSON generation. */
const REPORT_MODEL = 'google/gemini-2.0-flash-001';

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

  // Bump default max_tokens so long-form answers (like 30-day plans) are less likely to be cut off.
  const { model = DEFAULT_MODEL, max_tokens = 2048, temperature = 0.7 } = options;

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

const REPORT_SUMMARY_SYSTEM = `You are Sprout AI in a conversational chat. The user has asked for a sustainability/carbon report.

Write a substantive, informative chat summary of the report you are generating. Your reply must:
- Open with one sentence naming the company, reporting year (if known), and the primary focus of the report.
- Follow with 3–5 bullet points covering the key highlights — include actual numbers where the context provides them (e.g. Scope 1/2/3 totals in kgCO2e, specific ESG metric values, targets). If real data is present in the context, use it; do not invent figures.
- Close with 1 sentence on what the user can do next (e.g. view the full report for detailed analysis).
- Use plain markdown (bold key figures with **...**). Keep each bullet concise — one sentence each.
- Do NOT mention buttons, the UI, or generation status. Do NOT write the full report here.`;

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
    { model: REPORT_MODEL, max_tokens: 700, temperature: 0.6 }
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

// --- Company facts helper (web-backed via POPUP_MODEL) ---
// Used to ground reports in real company information when possible.
const COMPANY_FACTS_SYSTEM = `You are a research assistant for CarbonX.

Your job is to look up factual information about the company or product mentioned in the user's request using web search (the model you are using already has browsing capabilities – use them).

Return ONLY a compact JSON object with this shape (no markdown, no extra text):
{
  "companyName": string | null,
  "sector": string | null,
  "industry": string | null,
  "country": string | null,
  "description": string | null,
  "keySustainabilityFacts": string[]   // 3–8 short bullet-style facts about climate / ESG / sustainability performance, targets, or disclosures
}

Rules:
- If you are NOT confident a detail is correct, omit it or set it to null – do NOT invent numbers or certifications.
- Prefer information from the company's own website, annual reports, or well-known ESG frameworks (e.g. CDP, SBTi, GRI).
- If you cannot reliably identify the company, return all fields as null and an empty keySustainabilityFacts array.`;

async function fetchCompanyFacts(userRequest) {
  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: COMPANY_FACTS_SYSTEM },
        { role: 'user', content: userRequest },
      ],
      { model: POPUP_MODEL, max_tokens: 900, temperature: 0.3 }
    );
    let text = raw.trim();
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) text = codeMatch[1].trim();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch (_) {
    return null;
  }
}

/**
 * Product Analysis suggestions: use main SproutAI (Gemini 2.5) for short, data-grounded advice.
 * Why Gemini 2.5: task is analytical and instruction-following (no web search like Perplexity, no long report like Claude).
 * @param {{ productName: string, topContributors: Array<{name: string, amount: string}>, componentNames?: string[], hasPackaging?: boolean, hasTransport?: boolean }} context
 * @returns {Promise<string[]>} Array of 3–5 suggestion strings; empty on parse/API failure (caller should fallback).
 */
const PRODUCT_ANALYSIS_SYSTEM = `You are Sprout AI, a sustainability analyst for CarbonX. Given a product and its emission data, suggest 3–5 brief, actionable improvements to reduce carbon footprint. Be specific to the product and the top contributors. Keep each suggestion to one short sentence. Do not use generic filler.

Respond with ONLY a JSON array of strings, e.g. ["Suggestion one.", "Suggestion two."]. No markdown, no code fence, no other text.`;

export async function generateProductAnalysisSuggestions(context) {
  if (!context?.productName && (!context?.topContributors || context.topContributors.length === 0)) {
    return [];
  }
  const lines = [
    `Product: ${context.productName || 'Unknown'}`,
    'Top emission contributors:',
    ...(context.topContributors || []).slice(0, 5).map((c) => `- ${c.name}: ${c.amount}`),
  ];
  if (context.componentNames?.length) {
    lines.push(`Components: ${context.componentNames.slice(0, 15).join(', ')}`);
  }
  if (context.hasPackaging) lines.push('Includes packaging.');
  if (context.hasTransport) lines.push('Includes transport.');
  const userContent = lines.join('\n');

  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: PRODUCT_ANALYSIS_SYSTEM },
        { role: 'user', content: userContent },
      ],
      { model: DEFAULT_MODEL, max_tokens: 512, temperature: 0.5 }
    );
    let text = raw.trim();
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) text = codeMatch[1].trim();
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) return [];
    return arr.filter((s) => typeof s === 'string' && s.trim().length > 0).slice(0, 5).map((s) => s.trim());
  } catch (_) {
    return [];
  }
}

/**
 * Generate context-aware suggested prompts for SproutAI.
 * @param {{ company?: { sector?: string, industry?: string, companyName?: string, reportingYear?: string }, inventory?: { productCount?: number, topProducts?: Array<{ name: string, totalKgCO2e?: number }> }, dashboard?: { scope1?: number, scope2?: number, scope3?: number, total?: number } }} context
 * @returns {Promise<string[]>} 3–6 short prompt strings
 */
const SUGGESTED_PROMPTS_SYSTEM = `You are Sprout AI inside CarbonX. Generate 3–6 suggested prompts a user can click to start a helpful chat.

Rules:
- Prompts MUST reference the user's own context when provided (sector/industry, products, scope totals).
- Make them concrete and action-oriented (analysis, recommendations, "what should I do next", "compare", "explain").
- Avoid generic filler and avoid placeholders like "Product X".
- Do not mention internal APIs or code.

Respond with ONLY a JSON array of strings. No markdown, no code fence, no extra text.`;

export async function generateSuggestedPrompts(context) {
  const company = context?.company || {};
  const inventory = context?.inventory || {};
  const dashboard = context?.dashboard || {};

  const topNames = Array.isArray(inventory.topProducts) ? inventory.topProducts.map((p) => p?.name).filter(Boolean).slice(0, 5) : [];
  const lines = [
    `Company: ${company.companyName || 'Unknown'}`,
    `Sector: ${company.sector || 'Unknown'} | Industry: ${company.industry || 'Unknown'} | Year: ${company.reportingYear || 'Unknown'}`,
    `Inventory: ${inventory.productCount ?? 0} products`,
    topNames.length ? `Top products: ${topNames.join(', ')}` : 'Top products: (none)',
    `Dashboard scopes (kgCO2e): S1=${dashboard.scope1 ?? 0}, S2=${dashboard.scope2 ?? 0}, S3=${dashboard.scope3 ?? 0}, Total=${dashboard.total ?? 0}`,
  ];

  try {
    const raw = await chatCompletion(
      [
        { role: 'system', content: SUGGESTED_PROMPTS_SYSTEM },
        { role: 'user', content: lines.join('\n') },
      ],
      { model: DEFAULT_MODEL, max_tokens: 400, temperature: 0.6 }
    );
    let text = raw.trim();
    const codeMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) text = codeMatch[1].trim();
    const arr = JSON.parse(text);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((s) => typeof s === 'string' && s.trim().length > 0)
      .map((s) => s.trim())
      .slice(0, 6);
  } catch (_) {
    return [];
  }
}

/**
 * Generate full structured report JSON for the Report page.
 * @param {string} userRequest
 * @returns {Promise<Object>} Parsed report fullData
 */
export async function generateStructuredReport(userRequest) {
  // Only fetch web company facts when real LCA/ESG data is NOT already injected.
  // If the request already contains actual emissions data (from buildReportRequestWithContext),
  // skip the slow web-search step — it adds 10-20s and the real data is more accurate anyway.
  const hasRealData = userRequest.includes('ACTUAL GHG EMISSIONS DATA') || userRequest.includes('ACTUAL ESG METRICS') || userRequest.includes('Company context');

  let facts = null;
  if (!hasRealData) {
    try {
      facts = await fetchCompanyFacts(userRequest);
    } catch (_) {
      facts = null;
    }
  }

  const enrichedRequest = facts
    ? `Factual context about the company/product (from web research, do not contradict this data; if a field is null, stay high-level and avoid inventing specifics):
${JSON.stringify(facts, null, 2)}

User's request for the report:
${userRequest}

When writing the report, ground any specific company descriptions or sustainability claims in the factual context above. If data is missing or uncertain, prefer qualitative descriptions over made-up numbers.`
    : userRequest;

  const raw = await chatCompletion(
    [
      { role: 'system', content: REPORT_WRITER_SYSTEM },
      { role: 'user', content: enrichedRequest },
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

