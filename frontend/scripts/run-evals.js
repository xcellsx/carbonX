#!/usr/bin/env node
/**
 * Run golden-set evals for Sprout AI (chat + report writer).
 * Requires Node 18+ (for fetch) and OPENROUTER_API_KEY in the environment.
 *
 * Usage (from repo root or frontend):
 *   OPENROUTER_API_KEY=your_key node frontend/scripts/run-evals.js
 *   Or from frontend/: OPENROUTER_API_KEY=your_key node scripts/run-evals.js
 *
 * Chat golden prompts run on both production chat models: Gemini (main) + Perplexity (popup).
 * Report prompts use the configured REPORT_MODEL (Claude) by default.
 * For the same report tests on Gemini + Perplexity too (comparison / school write-ups):
 *   node frontend/scripts/run-evals.js --full
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseJsonFromLlmOutput } from '../src/utils/parseLlmJson.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
const POPUP_MODEL = 'perplexity/sonar-pro';
const REPORT_MODEL = 'anthropic/claude-sonnet-4.6';

const CHAT_EVAL_MODELS = [
  { key: 'gemini', id: DEFAULT_MODEL, label: 'Gemini 2.5 Pro (main Sprout AI)' },
  { key: 'perplexity', id: POPUP_MODEL, label: 'Perplexity Sonar Pro (Dashboard / Analytics popup)' },
];

const REPORT_MODEL_LABEL = 'Claude Sonnet 4.6 (report writer)';

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
  return parseJsonFromLlmOutput(raw);
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

async function runChatEvals(prompts, modelId = DEFAULT_MODEL) {
  const systemContent = 'You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. Answer concisely.';
  const results = [];
  for (const t of prompts) {
    const started = Date.now();
    try {
      const reply = await chatCompletion(
        [
          { role: 'system', content: systemContent },
          { role: 'user', content: t.prompt },
        ],
        { model: modelId, max_tokens: 2048, temperature: 0.3 }
      );
      const lower = reply.toLowerCase();
      const matched = (t.expectKeywords || []).filter((k) => lower.includes(k.toLowerCase()));
      const pass = matched.length >= Math.min(2, (t.expectKeywords || []).length);
      results.push({
        modelId,
        id: t.id,
        description: t.description,
        prompt: t.prompt,
        pass,
        keywordMatches: matched,
        expectedKeywords: t.expectKeywords || [],
        reply,
        replyLength: reply.length,
        replyPreview: reply.slice(0, 280),
        latencyMs: Date.now() - started,
      });
    } catch (err) {
      results.push({
        modelId,
        id: t.id,
        description: t.description,
        prompt: t.prompt,
        pass: false,
        error: err.message,
        latencyMs: Date.now() - started,
      });
    }
  }
  return results;
}

async function runReportEvals(prompts, modelId = REPORT_MODEL) {
  const results = [];
  for (const t of prompts) {
    const started = Date.now();
    let raw = '';
    try {
      raw = await chatCompletion(
        [
          { role: 'system', content: REPORT_WRITER_SYSTEM },
          { role: 'user', content: t.prompt },
        ],
        { model: modelId, max_tokens: 16384, temperature: 0.6 }
      );
      const data = parseReportText(raw);
      const validation = validateReportMinimal(data);
      results.push({
        modelId,
        id: t.id,
        description: t.description,
        prompt: t.prompt,
        pass: validation.valid,
        errors: validation.errors,
        rawResponse: raw,
        rawLength: raw.length,
        parsedHeadline: {
          reportTitle: data.reportTitle,
          reportSummary:
            typeof data.reportSummary === 'string' ? data.reportSummary.slice(0, 2000) : data.reportSummary,
        },
        latencyMs: Date.now() - started,
      });
    } catch (err) {
      results.push({
        modelId,
        id: t.id,
        description: t.description,
        prompt: t.prompt,
        pass: false,
        error: err.message,
        rawResponse: raw || undefined,
        rawLength: raw.length,
        latencyMs: Date.now() - started,
      });
    }
  }
  return results;
}

function pct(num, den) {
  if (!den) return '0.0';
  return ((num / den) * 100).toFixed(1);
}

function avgLatency(results) {
  if (!results.length) return 0;
  return Math.round(results.reduce((acc, r) => acc + (r.latencyMs || 0), 0) / results.length);
}

/** Markdown fenced code block; lengthen fence if body contains the delimiter. */
function mdFence(lang, body) {
  const text = String(body ?? '');
  let delim = '```';
  while (text.includes(delim)) delim += '`';
  const langLine = lang ? delim + lang : delim;
  return `${langLine}\n${text}\n${delim}`;
}

function ensureResultsDir() {
  const p = path.join(process.cwd(), 'frontend', 'docs', 'evals', 'results');
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function chatDetailSections(results) {
  return results.map((r) => {
    const lines = [
      `### Chat test: \`${r.id}\``,
      '',
      `- **Pass:** ${r.pass ? 'YES' : 'NO'}`,
      `- **Latency:** ${r.latencyMs ?? 0} ms`,
      r.description ? `- **Rubric:** ${r.description}` : '',
      r.expectedKeywords?.length ? `- **Expected keyword hints:** ${r.expectedKeywords.join(', ')}` : '',
      r.keywordMatches?.length ? `- **Keywords matched:** ${r.keywordMatches.join(', ')}` : '',
      '',
      '**User prompt (from golden set):**',
      mdFence('', r.prompt ?? ''),
      '',
    ];
    if (r.error) lines.push(`**Error:** ${r.error}`);
    else lines.push('**Model response (full):**', mdFence('', r.reply ?? ''));
    return lines.filter(Boolean).join('\n');
  });
}

function reportDetailSections(results) {
  return results.map((r) => {
    const raw = r.rawResponse ?? '';
    const lines = [
      `### Report test: \`${r.id}\``,
      '',
      `- **Pass:** ${r.pass ? 'YES' : 'NO'}`,
      `- **Latency:** ${r.latencyMs ?? 0} ms`,
      r.description ? `- **Rubric:** ${r.description}` : '',
      `- **Raw response length:** ${raw.length} chars`,
      '',
      '**User prompt (from golden set):**',
      mdFence('', r.prompt ?? ''),
      '',
    ];
    if (r.error) {
      lines.push(`**Parse / validation error:** ${r.error}`);
      if (raw) lines.push('', '**Raw model output (full):**', mdFence('text', raw));
    } else {
      lines.push(
        '**Raw model output (full):**',
        mdFence('json', raw),
        '',
        '**Parsed summary (for quick reading):**',
        `- \`reportTitle\`: ${r.parsedHeadline?.reportTitle ?? '—'}`,
        `- \`reportSummary\`: ${r.parsedHeadline?.reportSummary ?? '—'}`
      );
    }
    return lines.join('\n');
  });
}

function writeDetailedOutputs(payload) {
  const dir = ensureResultsDir();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const jsonPath = path.join(dir, `eval-${stamp}.json`);
  const mdPath = path.join(dir, `eval-${stamp}.md`);
  const latestJson = path.join(dir, 'latest.json');
  const latestMd = path.join(dir, 'latest.md');

  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8');
  fs.writeFileSync(latestJson, JSON.stringify(payload, null, 2), 'utf8');

  const chatBlocks = (payload.chatEvals || []).map(
    (block) =>
      `## Chat tests — ${block.label}\n\n\`${block.id}\`\n\n` + chatDetailSections(block.results).join('\n\n---\n\n')
  );

  const reportBlocks = (payload.reportEvals || []).map(
    (block) =>
      `## Report tests — ${block.label}\n\n\`${block.id}\`\n\n` + reportDetailSections(block.results).join('\n\n---\n\n')
  );

  const summaryChatLines = (payload.chatEvals || []).map(
    (block) =>
      `- **${block.label}** (\`${block.id}\`): ${block.summary.passed}/${block.summary.total} passed (${pct(block.summary.passed, block.summary.total)}%), avg latency ${block.summary.avgLatencyMs} ms`
  );
  const summaryReportLines = (payload.reportEvals || []).map(
    (block) =>
      `- **${block.label}** (\`${block.id}\`): ${block.summary.passed}/${block.summary.total} passed (${pct(block.summary.passed, block.summary.total)}%), avg latency ${block.summary.avgLatencyMs} ms`
  );

  const quickChatTables = (payload.chatEvals || [])
    .map((block) => {
      const rows = [
        `#### ${block.label}`,
        '',
        '| Test ID | Pass | Latency (ms) | Keyword matches |',
        '|---|---:|---:|---|',
        ...block.results.map(
          (r) => `| ${r.id} | ${r.pass ? 'YES' : 'NO'} | ${r.latencyMs || 0} | ${(r.keywordMatches || []).join(', ') || '-'} |`
        ),
        '',
      ];
      return rows.join('\n');
    })
    .join('\n');

  const quickReportTables = (payload.reportEvals || [])
    .map((block) => {
      const rows = [
        `#### ${block.label}`,
        '',
        '| Test ID | Pass | Latency (ms) | Notes |',
        '|---|---:|---:|---|',
        ...block.results.map((r) => {
          const note = r.error || (r.errors?.length ? r.errors.join('; ') : 'OK');
          return `| ${r.id} | ${r.pass ? 'YES' : 'NO'} | ${r.latencyMs || 0} | ${String(note).replace(/\|/g, '\\|')} |`;
        }),
        '',
      ];
      return rows.join('\n');
    })
    .join('\n');

  const md = [
    '# Sprout AI Eval Report',
    '',
    `- Timestamp: ${payload.timestamp}`,
    payload.source?.goldenPromptsFile ? `- Golden prompts file: \`${payload.source.goldenPromptsFile}\`` : '',
    payload.options?.fullReportMatrix
      ? '- Mode: **full** (report JSON tests run on Claude, Gemini, and Perplexity)'
      : '- Mode: **default** (report JSON tests on Claude only; chat still runs on Gemini + Perplexity)',
    '',
    '## Summary',
    '',
    '### Chat',
    '',
    ...summaryChatLines,
    '',
    '### Report',
    '',
    ...summaryReportLines,
    '',
    ...chatBlocks.flatMap((b) => ['', b, '']),
    ...reportBlocks.flatMap((b) => ['', b, '']),
    '## Quick tables',
    '',
    '### Chat',
    '',
    quickChatTables,
    '### Report',
    '',
    quickReportTables,
  ].join('\n');

  fs.writeFileSync(mdPath, md, 'utf8');
  fs.writeFileSync(latestMd, md, 'utf8');

  return { jsonPath, mdPath, latestJson, latestMd };
}

async function main() {
  const fullReportMatrix = process.argv.includes('--full');
  const promptsFile = promptsPath();
  const json = JSON.parse(fs.readFileSync(promptsFile, 'utf8'));

  const chatEvals = [];
  for (const m of CHAT_EVAL_MODELS) {
    console.log(`\nRunning chat evals — ${m.label}...\n`);
    const results = await runChatEvals(json.chat || [], m.id);
    results.forEach((r) => {
      console.log(r.pass ? '  ✓' : '  ✗', r.id, r.description || '');
      if (r.keywordMatches?.length) console.log('    Keywords matched:', r.keywordMatches.join(', '));
      if (r.error) console.log('    Error:', r.error);
    });
    const passed = results.filter((r) => r.pass).length;
    chatEvals.push({
      key: m.key,
      id: m.id,
      label: m.label,
      results,
      summary: { passed, total: results.length, avgLatencyMs: avgLatency(results) },
    });
  }

  const reportModels = fullReportMatrix
    ? [
        { key: 'claude', id: REPORT_MODEL, label: REPORT_MODEL_LABEL },
        {
          key: 'gemini-report',
          id: DEFAULT_MODEL,
          label: 'Gemini 2.5 Pro (cross-model report JSON)',
        },
        {
          key: 'perplexity-report',
          id: POPUP_MODEL,
          label: 'Perplexity Sonar Pro (cross-model report JSON)',
        },
      ]
    : [{ key: 'claude', id: REPORT_MODEL, label: REPORT_MODEL_LABEL }];

  const reportEvals = [];
  for (const m of reportModels) {
    console.log(`\nRunning report evals — ${m.label}...\n`);
    const results = await runReportEvals(json.report || [], m.id);
    results.forEach((r) => {
      console.log(r.pass ? '  ✓' : '  ✗', r.id, r.description || '');
      if (r.errors?.length) console.log('    Errors:', r.errors.join('; '));
      if (r.error) console.log('    Error:', r.error);
    });
    const passed = results.filter((r) => r.pass).length;
    reportEvals.push({
      key: m.key,
      id: m.id,
      label: m.label,
      results,
      summary: { passed, total: results.length, avgLatencyMs: avgLatency(results) },
    });
  }

  const payload = {
    timestamp: new Date().toISOString(),
    source: {
      goldenPromptsFile: path.relative(process.cwd(), promptsFile).replace(/\\/g, '/'),
    },
    options: { fullReportMatrix },
    chatEvals,
    reportEvals,
  };
  const out = writeDetailedOutputs(payload);
  console.log('\n--- Summary ---');
  chatEvals.forEach((b) => console.log(`Chat (${b.key}): ${b.summary.passed}/${b.summary.total} passed`));
  reportEvals.forEach((b) => console.log(`Report (${b.key}): ${b.summary.passed}/${b.summary.total} passed`));
  console.log(`\nSaved detailed reports:\n- ${out.latestMd}\n- ${out.latestJson}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
