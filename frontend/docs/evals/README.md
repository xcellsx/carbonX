# Sprout AI evals

This folder holds **golden prompts** and instructions for evaluating Sprout AI accuracy.

## Golden prompts

Edit `golden-prompts.json` to add or change test prompts:

- **chat**: List of `{ id, prompt, expectKeywords?, description }`. The script runs **every** chat prompt twice: once on **Gemini 2.5 Pro** (main Sprout AI) and once on **Perplexity Sonar Pro** (popup), then checks that each reply contains at least 2 of the listed keywords (or all if fewer than 2).
- **report**: List of `{ id, prompt, description }`. The script asks the report model configured in `frontend/scripts/run-evals.js` (`REPORT_MODEL`) to generate a report, parses JSON, and validates required keys and non-empty content.

## Running evals

From the **repo root** or from **frontend/**:

```bash
OPENROUTER_API_KEY=your_openrouter_key node frontend/scripts/run-evals.js
```

Same report JSON golden prompts on **Gemini** and **Perplexity** (in addition to **Claude**) for side‑by‑side comparison (more API calls):

```bash
OPENROUTER_API_KEY=your_openrouter_key node frontend/scripts/run-evals.js --full
```

Or from `frontend/`:

```bash
OPENROUTER_API_KEY=your_openrouter_key node scripts/run-evals.js
```

Requires **Node 18+** (for `fetch`). The script prints pass/fail per prompt and a short summary. Use this to catch regressions after changing models or system prompts.

Output files use `chatEvals` and `reportEvals` arrays (one block per model); see `latest.json`.

### Detailed outputs (for reports)

Each run also writes structured artifacts to:

- `frontend/docs/evals/results/latest.md` (human-readable report: per-test **golden prompt**, **full chat replies**, **full report raw output** — very large runs produce large files; `latest.json` still has the same content for tooling)
- `frontend/docs/evals/results/latest.json` (machine-readable details, including full `reply` / `rawResponse` per test)

Timestamped files are also created in the same folder (e.g. `eval-2026-04-03T10-40-24-611Z.md`), so you can compare runs over time.

## In-app evaluation

- **Report schema**: Every generated report is validated with `validateReportSchema()` in the app; failures are logged and counted in `localStorage` under `sproutai_report_validation` (pass/fail counts and last errors).
- **Thumbs up/down**: Chat messages on the Sprout AI page have feedback buttons. Feedback is stored in `localStorage` under `sproutai_feedback`. You can aggregate this (e.g. in a dashboard or script) to track helpfulness over time.
