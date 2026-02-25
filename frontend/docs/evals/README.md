# Sprout AI evals

This folder holds **golden prompts** and instructions for evaluating Sprout AI accuracy.

## Golden prompts

Edit `golden-prompts.json` to add or change test prompts:

- **chat**: List of `{ id, prompt, expectKeywords?, description }`. The script sends each prompt to the main chat model (Gemini 2.5) and checks that the reply contains at least 2 of the listed keywords (or all if fewer than 2).
- **report**: List of `{ id, prompt, description }`. The script asks the report model (Claude) to generate a report, parses JSON, and validates required keys and non-empty content.

## Running evals

From the **repo root** or from **frontend/**:

```bash
OPENROUTER_API_KEY=your_openrouter_key node frontend/scripts/run-evals.js
```

Or from `frontend/`:

```bash
OPENROUTER_API_KEY=your_openrouter_key node scripts/run-evals.js
```

Requires **Node 18+** (for `fetch`). The script prints pass/fail per prompt and a short summary. Use this to catch regressions after changing models or system prompts.

## In-app evaluation

- **Report schema**: Every generated report is validated with `validateReportSchema()` in the app; failures are logged and counted in `localStorage` under `sproutai_report_validation` (pass/fail counts and last errors).
- **Thumbs up/down**: Chat messages on the Sprout AI page have feedback buttons. Feedback is stored in `localStorage` under `sproutai_feedback`. You can aggregate this (e.g. in a dashboard or script) to track helpfulness over time.
