# CarbonX Frontend – Full Outline

Single entry point for the **React + Vite** app: structure, routing, backend integration, local persistence, and **Sprout AI / OpenRouter** usage. For deep product/API field mapping, see [BACKEND-PRODUCTS-MAPPING.md](./BACKEND-PRODUCTS-MAPPING.md).

---

## 1. Purpose & stack

CarbonX frontend is an **LCA / PCF–oriented** SPA: login and company setup, **inventory** of products (dishes, ingredients), **add/browse templates**, **analytics** and **dashboard** metrics, **network** graph view, **reports** (view/export), **settings**, and **Sprout AI** conversational assistance.

| Layer | Choice |
|--------|--------|
| UI | React **19**, Vite **6** |
| Routing | `react-router-dom` **v7** |
| HTTP | `axios` → `src/services/api.js` (`/api` by default; see env) |
| Charts / maps | Chart.js, D3, Leaflet |
| Documents | `jspdf`, `docx`, `file-saver` |
| Markdown in chat | `react-markdown` |

Full dependency list: `frontend/package.json`.

---

## 2. Running & configuration

From `frontend/`:

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (hot reload) |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | ESLint |

**Environment (Vite):**

| Variable | Role |
|----------|------|
| `VITE_API_BASE_URL` | Optional absolute API origin; if unset, requests use **`/api`** (proxy in dev avoids CORS). |
| `VITE_COMPANY_NAME` | Company/users namespace for auth (default `SingaporeMarine`). |
| `VITE_DATA_DATABASE` | Arango DB name for products/graph templates (default `default`). |
| `VITE_MARITIME_DATABASE` | DB for maritime endpoints (default `SingaporeMarine`; `default` is normalized to `SingaporeMarine`). |

**OpenRouter (AI):** `VITE_OPENROUTER_API_KEY` in env; used by `src/services/openRouter.js`.

**Deployed base path:** `main.jsx` wraps the app with `<BrowserRouter basename="/carbonX">`, so production URLs are under `/carbonX/...`.

---

## 3. Routing & pages

Routes are declared in `src/App.jsx`.

| Path | Page | Notes |
|------|------|--------|
| `/`, `/login` | `LoginPage` | Entry default |
| `/signup` | `SignupPage` | |
| `/company-info` | `CompanyInfoPage` | |
| `/dashboard` | `DashboardPage` | Popup Sprout AI |
| `/inventory` | `InventoryPage` | Products table, LCA actions |
| `/add-products` | `AddProductsPage` | Browse templates / add flow |
| `/add-products/edit/:id` | `EditTemplatePage` | Template editor |
| `/analytics` | `AnalyticsPage` | Popup Sprout AI; Product Analysis (AI suggestions) |
| `/network` | `NetworkPage` | Supply-chain style graph |
| `/settings` | `SettingsPage` | Billing, SASB inputs, etc. |
| `/report` | `ReportPage` | Displays generated report; export |
| `/chat` | `SproutAIPage` | Full Sprout AI + report generation |

---

## 4. Source layout (high level)

```
frontend/src/
  App.jsx, main.jsx
  pages/
    Auth/, Company/, Dashboard/, Inventory/, AddProducts/
    Analytics/, Network/, Report/, Settings/, SproutAI/
  components/
    AIChatPopup/, Navbar/, DppModal/, DownloadFormatModal/, ...
  services/
    api.js          ← REST client + auth/users/products/graph/maritime
    openRouter.js   ← OpenRouter chat + report + product suggestions
  hooks/
    useCompanyForm.jsx, useProSubscription.jsx
  utils/
    api helpers, emission.js, reportSchema.js, reportToDocx.js,
    sproutAiStorage.js, parseLlmJson.js, sasb.js, ...
```

**Key UI integration points**

- **Navbar** – global navigation.
- **`AIChatPopup`** – Dashboard / Analytics in-page chat (same session store as Sprout AI history where applicable).
- **`SproutAIPage`** – main chat, report flow, history tab.
- **`ProGate` / `ProModal`** – subscription gating where used.

---

## 5. Backend integration (`api.js`)

`src/services/api.js` centralizes HTTP and env-derived base paths.

| Client export | Backend area |
|---------------|----------------|
| `productAPI` | Products CRUD, rough LCA `GET /api/lca/rough`, optional LCA save |
| `processAPI` | Processes |
| `graphAPI` / `networkAPI` | Product graph (`/api/graph/productgraph`, metadata, edges, vertices, query) |
| `templateAPI` | Template maps / connected nodes |
| `maritimeAPI` | Ships, ship logs, locations, maritime LCA |
| `authAPI` | Register/login shim over `users` endpoints + local password store for demo |
| `usersAPI` | List/get users |
| `userLcaAPI` | Per-user LCA map persisted on backend |

**Helpers:** `normalizeUserIdKey`, `stableSessionUserId`, `getLocalLcaMap`, `getLocalLcaCacheByName` bridge Arango-style ids, session, and **localStorage** overlays used across Dashboard / Inventory.

**Product shape → UI:** Field normalization, `userId` filtering, DPP vs `dpp`, and **Total LCA** aggregation are documented in [BACKEND-PRODUCTS-MAPPING.md](./BACKEND-PRODUCTS-MAPPING.md).

---

## 6. Local persistence (non-exhaustive)

| Concern | Where |
|---------|--------|
| Session / user | `localStorage` + `carbonx-session-updated` event (`api.js`) |
| Demo passwords | `carbonx_local_credentials_v1` (`api.js`) |
| LCA by user × product | `userId` keyed map + `carbonx_lca_by_user_product_v1`; name cache `carbonx_lca_cache_by_name_v1` |
| Sprout AI sessions / history | `sproutai_sessions` etc. (`sproutAiStorage.js`) |
| Report validation stats | `sproutai_report_validation` (`reportSchema.js` usage) |
| Chat feedback | `sproutai_feedback` |
| Custom templates | `customTemplatesStorage.js` |

---

<a id="ai-openrouter"></a>

## 7. AI & Sprout AI (OpenRouter)

### 7.1 Overview

CarbonX uses **OpenRouter** as a single API layer and one unified assistant persona (**Sprout AI**) across the app. Different pages call different **agent roles** (general chat, report summary, report writer); **models** are chosen per role for best results.

**Models (OpenRouter):**

- **Main Sprout AI interface** (general chat + product-analysis suggestions): `google/gemini-2.5-pro` – strong reasoning, large context.
- **Popup chatbot** (Dashboard/Analytics): `perplexity/sonar-pro` – web-backed, in-context Q&A.
- **Report flow** (chat summary + structured report JSON): `anthropic/claude-3.5-sonnet` – strong long-form structured report writing.

---

### 7.2 Where AI is used

| Page / Surface | What runs | Purpose |
|----------------|-----------|---------|
| **Sprout AI** (`/chat`) | General chat + report flow | Full conversational assistant; generates reports on request and saves to Report page. |
| **Dashboard** | Popup chat (Sprout AI) | In-context Q&A about metrics/dashboard without leaving the page. |
| **Analytics** | Popup chat (Sprout AI) + Product Analysis card | In-context Q&A; **Suggestions** in Product Analysis are AI-generated (Gemini 2.5); Top 5 contributors are data-driven. |
| **Report** | No AI on page | Displays AI-generated reports; “Go to Sprout AI” when there’s no content. |

---

### 7.3 Agent roles (`openRouter.js`)

All use the same OpenRouter chat API; behavior is shaped by **system prompts** and **usage**.

#### General assistant (Sprout AI)

- **Used on:** Sprout AI page, Dashboard popup, Analytics popup  
- **API:** `chatCompletion(messages, options)`  
- **Behavior:** Answers questions about sustainability, Scope 1/2/3, LCA, carbon reporting, metrics, inventory. Can be given page context (e.g. “user is on Dashboard” / “user is on Analytics”).

**Why it’s used:**

- One assistant everywhere keeps tone and knowledge consistent.  
- Same model and API (OpenRouter) means one integration to maintain and one place to upgrade the model.  
- Page-specific context (Dashboard vs Analytics) makes answers relevant without separate agents.

---

#### Report summary for chat

- **Used on:** Sprout AI page only  
- **API:** `reportSummaryForChat(fullRequest)` → calls `chatCompletion` with a dedicated system prompt  
- **Model:** `anthropic/claude-3.5-sonnet` (same report flow model used for full report generation)  
- **Behavior:** When the user asks for a report, this returns a short (2–4 sentence) chat reply describing what the report covers and that they can view it below. Does **not** generate the full report.

**Why it’s used:**

- Keeps the chat reply short and natural instead of dumping the whole report into the thread.  
- Separates “what we say in chat” from “what we save as the report,” so the UX is clear and the report can be structured (JSON) for the Report page.

---

#### Report writer (structured report)

- **Used on:** Sprout AI page only (triggered when the user asks for a report)  
- **Model:** `anthropic/claude-3.5-sonnet` for structured report generation.  
- **API:** `generateStructuredReport(userRequest)` → calls `chatCompletion` with the report-writer system prompt  
- **Behavior:** Generates a **single JSON object** with: `reportTitle`, `reportSummary`, `productName`, `companyName`, `boardStatement`, `companyProfile`, pillars (environmental/social/governance), `futureTargets`, etc. Content is fully generated from the user’s request (no hardcoded template).

**Why it’s used:**

- Structured output (JSON) is required for the Report page (view, PDF, DOCX). A dedicated “report writer” prompt keeps format and fields stable.  
- One specialized prompt for “write a full report” avoids mixing long-form generation with short chat and keeps the main assistant prompt simple.  
- User intent (e.g. “for WingStop,” “FY2025 F&B”) is passed in one request so the model can tailor company/sector/scope in one go.
- Strong instruction-following and long-form writing quality improves report readability and consistency.

##### Company facts grounding (report enrichment)

- **Used on:** Sprout AI report generation path only, when no real LCA/ESG metrics are already present in the request.  
- **Model:** `perplexity/sonar-pro` (web-backed).  
- **API:** `fetchCompanyFacts(userRequest)` (internal helper used by `generateStructuredReport`)  
- **Behavior:** Attempts to fetch factual company context (name/sector/country/ESG facts) and injects it into the report prompt. If unavailable or uncertain, generation continues without this enrichment.

**Why it’s used:**

- Grounds reports for real companies/products when users ask for public-company style reports without providing internal CarbonX data.  
- Keeps generation robust by gracefully falling back when web facts are missing.

---

#### Product Analysis suggestions (Analytics card)

- **Used on:** Analytics page only (Product Analysis card: “Suggestions” list).  
- **Model:** Gemini 2.5 Pro (same as main Sprout AI).  
- **API:** `generateProductAnalysisSuggestions(context)` → sends product name, top 5 contributors, component names, packaging/transport flags; returns a JSON array of 3–5 short suggestion strings.  
- **Behavior:** The **Top 5 Highest Contributors** list remains data-driven (from DPP components). The **Suggestions** are generated by the LLM from that data; if the API fails or returns empty, the app falls back to rule-based suggestions.

**Why Gemini 2.5 (not Perplexity or report-flow model):**

- Task is analytical and instruction-following: turn structured emission data into brief, actionable text. No web search (Perplexity’s strength) or report-focused generation path.
- Gemini 2.5 handles short, constrained output (JSON array of strings) well and keeps the stack simple (one model for “reason over data” tasks).

---

### 7.4 Why this setup is a good fit

1. **Single provider (OpenRouter)** – One API key, one client, one place to change model or add fallbacks. Easier to maintain and to add logging/monitoring later.

2. **Single assistant brand (Sprout AI)** – Users see one assistant everywhere (Sprout AI page + popups). No confusion between “dashboard bot” and “report bot.”

3. **Role-based behavior** – Different behaviors (general chat vs report summary vs full report) are handled by **system prompts and different functions**. Popup vs full page may still use **different models** (e.g. Perplexity for web Q&A).

4. **Context where it matters** – Popup chat gets page context (Dashboard vs Analytics) so answers can reference “your dashboard” or “your analytics” without building separate integrations.

5. **Report flow is two-step on purpose** – Report summary (chat) + report writer (JSON) keeps the chat readable and the report structured. The Report page stays a consumer of that JSON (view/export), not an AI caller.

6. **Popup chats sync to History** – Dashboard and Analytics popup conversations are persisted into the same `sproutai_sessions` store used by the Sprout AI History tab, so all conversations are in one place.

---

### 7.5 Quick reference

| Capability | Sprout AI page | Dashboard popup | Analytics popup | Report page |
|------------|----------------|-----------------|-----------------|-------------|
| General Q&A | ✅ | ✅ | ✅ | — |
| Report summary (chat) | ✅ | — | — | — |
| Full report (JSON) | ✅ | — | — | Displays |
| Page context | — | “Dashboard” | “Analytics” | — |
| Product Analysis (suggestions) | — | — | ✅ (Gemini 2.5) | — |
| Sessions in History | ✅ | ✅ | ✅ | — |

---

### 7.6 Evaluating AI agent accuracy

You can evaluate accuracy in three ways: **automated checks** (format, schema), **curated test sets** (repeatable Q&A and report prompts), and **in-product feedback** (thumbs up/down, sample review).

#### What to measure

| Concern | Main Sprout AI / Popup | Report writer |
|---------|------------------------|---------------|
| **Factual** | Correctness on Scope 1/2/3, LCA, carbon concepts | Plausible company/sector content; no made-up data presented as real |
| **Relevance** | Answers match question; stays on CarbonX/sustainability | Report matches user request (company, scope, year) |
| **Format** | N/A | Valid JSON; all required keys present; no markdown/code fences |
| **Safety** | No harmful or misleading carbon/financial advice | No inappropriate or off-brand content |

#### Automated checks (report writer)

- **Schema validation:** After `generateStructuredReport()`, validate the returned object against the expected keys (`reportTitle`, `reportSummary`, `companyName`, `boardStatement`, pillars, `futureTargets`, etc.). Track pass/fail and log failures.
- **Required fields:** Ensure no critical string is empty or obviously placeholder (e.g. "TBD", "Lorem ipsum"). You can run this in the frontend before saving to the Report page or in a small Node script that calls the same API with test prompts.

#### Curated test sets (repeatable evals)

- **Chat (main + popup):** Maintain a small set of **golden prompts** and, optionally, expected behavior (e.g. “must mention Scope 1/2/3 when asked about scopes” or “must not invent specific emission numbers”). Run them periodically (e.g. via a script that calls `chatCompletion()` with fixed messages) and compare outputs to criteria or to a reference answer (exact match, or keyword/meaning checks).
- **Report writer:** Use a fixed list of **test prompts** (e.g. “Generate a sustainability report for WingStop FY2025”, “Carbon report for a retail company”) and for each run:
  - Validate JSON schema and required fields.
  - Optionally score content (e.g. “mentions company/sector”, “no empty sections”) with simple heuristics or a rubric.

Storing prompts and expected rules in a JSON or Markdown file in the repo keeps evals reproducible and shareable.

#### In-product feedback and sampling

- **Thumbs up / thumbs down:** Optional feedback on chat replies and on the Report view. Store feedback (e.g. `sessionId`, `messageIndex`, `helpful: true/false`) in the backend or analytics. Use aggregates to spot regressions and to compare models (e.g. after switching popup to Perplexity).
- **Sample review:** Periodically review a random sample of conversations and generated reports (e.g. from persisted `sproutai_sessions` and saved reports). Check for factual errors, off-topic answers, or format issues. This is the most reliable but manual.

#### Optional: logging for evaluation

- To support evals and debugging without storing full conversation content in production, you can:
  - Log **anonymized metadata** only: model id, prompt length, response length, latency, and schema valid/invalid for reports.
  - In a **staging or eval environment**, optionally log full prompts and responses (with user consent) so you can run golden-set evals and spot-check accuracy.

Adding a thin logging layer in `openRouter.js` (e.g. a `logCompletion({ model, role, tokenCounts, latency, schemaValid })` callback or optional export) keeps production minimal while enabling accuracy and performance tracking.

#### Implemented evaluation assets

- **Report schema validator:** `frontend/src/utils/reportSchema.js` — `validateReportSchema(data)` returns `{ valid, errors }`. Used after every generated report in Sprout AI; pass/fail counts are stored in `localStorage` under `sproutai_report_validation`.
- **Thumbs up/down:** Sprout AI chat messages show feedback buttons; feedback is stored in `localStorage` under `sproutai_feedback` keyed by session and message index.
- **Golden prompts + script:** `frontend/docs/evals/golden-prompts.json` and `frontend/scripts/run-evals.js`. Run with `OPENROUTER_API_KEY=your_key node frontend/scripts/run-evals.js` (Node 18+) to run chat and report evals and print pass/fail. See [evals/README.md](./evals/README.md) for usage.

---

### 7.7 Implementation map

| Area | Primary files |
|------|----------------|
| OpenRouter client, models, prompts | `frontend/src/services/openRouter.js` (`DEFAULT_MODEL` = Gemini 2.5 Pro for main Sprout AI and product analysis; `POPUP_MODEL` = Perplexity Sonar Pro for popup chat and optional company-facts grounding; `REPORT_MODEL` = Claude 3.5 Sonnet for report summary + report writing) |
| Full-page chat + report | `frontend/src/pages/SproutAI/SproutAIPage.jsx` |
| Dashboard / Analytics popup | `frontend/src/components/AIChatPopup/AIChatPopup.jsx` |

---

## 8. Related docs

| Doc | Contents |
|-----|----------|
| [BACKEND-PRODUCTS-MAPPING.md](./BACKEND-PRODUCTS-MAPPING.md) | `GET /api/products` → templates, Inventory, DPP / LCA fields |
| [evals/README.md](./evals/README.md) | Golden prompts, `run-evals.js`, outputs under `evals/results/` |
| [AI-AGENTS-OUTLINE.md](./AI-AGENTS-OUTLINE.md) | Pointer to [§ AI / OpenRouter](#ai-openrouter) (keeps old path working) |

---

*Last consolidated: merges app structure with the former standalone AI outline.*
