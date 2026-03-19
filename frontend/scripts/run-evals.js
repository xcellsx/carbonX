#!/usr/bin/env node
/**
 * Run golden-set evals for Sprout AI (chat + report writer).
 * Requires Node 18+ (for fetch) and OPENROUTER_API_KEY in the environment.
 *
 * Usage (from repo root or frontend):
 *   OPENROUTER_API_KEY=your_key node frontend/scripts/run-evals.js
 *   Or from frontend/: OPENROUTER_API_KEY=your_key node scripts/run-evals.js
 */

const fs = require('fs');
const path = require('path');

// Auto-load .env from frontend/ or repo root so VITE_OPENROUTER_API_KEY is available without manually setting env vars.
(function loadDotEnv() {
  const candidates = [
    path.join(process.cwd(), '.env'),
    path.join(process.cwd(), 'frontend', '.env'),
    path.join(__dirname, '..', '.env'),
  ];
  for (const f of candidates) {
    if (fs.existsSync(f)) {
      const lines = fs.readFileSync(f, 'utf8').split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (key && !(key in process.env)) process.env[key] = val;
      }
      break;
    }
  }
})();

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL = 'google/gemini-2.5-pro';
const REPORT_MODEL = 'anthropic/claude-3.5-sonnet';

const REPORT_WRITER_SYSTEM = `You are a sustainability report writer for CarbonX. The user has requested a report – generate ALL content yourself based on their request. Do not use static templates or placeholder text. Invent plausible, professional content tailored to whatever they asked for (e.g. a company name, sector like F&B or retail, a product, Scope 3, packaging, year). Use the conversation context if provided to infer company/sector/scope.

Respond with ONLY a valid JSON object (no markdown, no code fence, no extra text). The JSON must have exactly these keys:
- reportTitle (string)
- reportSummary (string)
- productName (string)
- companyName (string, optional)
- boardStatement (string)
- companyProfile (string)
- sustainabilityApproach (string)
- stakeholderEngagement (string)
- frameworks (array of strings)
- environmentalAnalysis (array of objects with title, keyData, strategy, performance, outlook)
- socialAnalysis (array of objects, same structure)
- governanceAnalysis (array of objects, same structure)
- futureTargets (array of objects with area, goal, status)

Every string must be substantive, professional, and specific to the user's topic. No generic filler.`;

const REQUIRED_REPORT_KEYS = [
  'reportTitle', 'reportSummary', 'productName', 'boardStatement', 'companyProfile',
  'sustainabilityApproach', 'stakeholderEngagement', 'frameworks',
  'environmentalAnalysis', 'socialAnalysis', 'governanceAnalysis', 'futureTargets',
];

function requiredKeysPresent(data) {
  const missing = REQUIRED_REPORT_KEYS.filter((k) => !(k in data) || data[k] == null);
  return { ok: missing.length === 0, missing };
}

function substantive(value) {
  if (value == null) return false;
  const s = typeof value === 'string' ? value.trim() : String(value).trim();
  return s.length >= 3 && !/TBD|TODO|Lorem ipsum|placeholder/i.test(s);
}

async function chatCompletion(messages, options = {}) {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey?.trim()) {
    throw new Error('Set OPENROUTER_API_KEY (or VITE_OPENROUTER_API_KEY) in the environment.');
  }
  const { model = DEFAULT_MODEL, max_tokens = 1024, temperature = 0.7 } = options;
  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens, temperature }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${err}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  return content == null ? '' : String(content);
}

function parseReportText(raw) {
  let text = raw.trim();
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) text = m[1].trim();
  return JSON.parse(text);
}

function validateReportMinimal(data) {
  const { ok, missing } = requiredKeysPresent(data);
  if (!ok) return { valid: false, errors: [`Missing keys: ${missing.join(', ')}`] };
  const errors = [];
  if (!substantive(data.reportTitle)) errors.push('reportTitle empty or placeholder');
  if (!substantive(data.reportSummary)) errors.push('reportSummary empty or placeholder');
  if (!Array.isArray(data.frameworks) || data.frameworks.length === 0) {
    errors.push('frameworks must be non-empty array');
  }
  if (!Array.isArray(data.environmentalAnalysis) || data.environmentalAnalysis.length === 0) {
    errors.push('environmentalAnalysis must be non-empty array');
  }
  return {
    valid: errors.length === 0,
    errors,
  };
}

function promptsPath() {
  const fromRoot = path.join(process.cwd(), 'frontend', 'docs', 'evals', 'golden-prompts.json');
  const fromFrontend = path.join(process.cwd(), 'docs', 'evals', 'golden-prompts.json');
  if (fs.existsSync(fromRoot)) return fromRoot;
  if (fs.existsSync(fromFrontend)) return fromFrontend;
  throw new Error('golden-prompts.json not found. Run from repo root or frontend/.');
}

async function runChatEvals(prompts) {
  const systemContent = 'You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. Answer concisely.';
  const results = [];
  for (const t of prompts) {
    try {
      const reply = await chatCompletion(
        [
          { role: 'system', content: systemContent },
          { role: 'user', content: t.prompt },
        ],
        { max_tokens: 512, temperature: 0.3 }
      );
      const lower = reply.toLowerCase();
      const matched = (t.expectKeywords || []).filter((k) => lower.includes(k.toLowerCase()));
      const pass = matched.length >= Math.min(2, (t.expectKeywords || []).length);
      results.push({
        id: t.id,
        description: t.description,
        pass,
        keywordMatches: matched,
        replyLength: reply.length,
      });
    } catch (err) {
      results.push({ id: t.id, description: t.description, pass: false, error: err.message });
    }
  }
  return results;
}

async function runReportEvals(prompts) {
  const results = [];
  for (const t of prompts) {
    try {
      const raw = await chatCompletion(
        [
          { role: 'system', content: REPORT_WRITER_SYSTEM },
          { role: 'user', content: t.prompt },
        ],
        { model: REPORT_MODEL, max_tokens: 4096, temperature: 0.6 }
      );
      const data = parseReportText(raw);
      const validation = validateReportMinimal(data);
      results.push({
        id: t.id,
        description: t.description,
        pass: validation.valid,
        errors: validation.errors,
      });
    } catch (err) {
      results.push({ id: t.id, description: t.description, pass: false, error: err.message });
    }
  }
  return results;
}

async function main() {
  const promptsPath = promptsPath();
  const json = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

  console.log('Running chat evals (Gemini 2.5)...\n');
  const chatResults = await runChatEvals(json.chat || []);
  chatResults.forEach((r) => {
    console.log(r.pass ? '  ✓' : '  ✗', r.id, r.description || '');
    if (r.keywordMatches) console.log('    Keywords matched:', r.keywordMatches.join(', '));
    if (r.error) console.log('    Error:', r.error);
  });

  console.log('\nRunning report evals (Claude)...\n');
  const reportResults = await runReportEvals(json.report || []);
  reportResults.forEach((r) => {
    console.log(r.pass ? '  ✓' : '  ✗', r.id, r.description || '');
    if (r.errors?.length) console.log('    Errors:', r.errors.join('; '));
    if (r.error) console.log('    Error:', r.error);
  });

  const chatPass = chatResults.filter((r) => r.pass).length;
  const reportPass = reportResults.filter((r) => r.pass).length;
  console.log('\n--- Summary ---');
  console.log(`Chat:   ${chatPass}/${chatResults.length} passed`);
  console.log(`Report: ${reportPass}/${reportResults.length} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
