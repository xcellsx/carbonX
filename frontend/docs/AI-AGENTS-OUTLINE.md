# AI Agents Across CarbonX – Consolidated Outline

## Overview

CarbonX uses **OpenRouter** as a single API layer and one unified assistant persona (**Sprout AI**) across the app. Different pages call different **agent roles** (general chat, report summary, report writer); **models** are chosen per role for best results.

**Models (OpenRouter):**
- **Default (chat, report summary):** `google/gemini-2.5-pro` – strong reasoning, large context.
- **Report generation:** `perplexity/sonar-pro` – web-backed retrieval for up-to-date, factual report content and data scraping.

---

## 1. Where AI Is Used

| Page / Surface        | What runs                        | Purpose |
|-----------------------|----------------------------------|--------|
| **Sprout AI** (`/chat`)| General chat + report flow       | Full conversational assistant; generates reports on request and saves to Report page. |
| **Dashboard**         | Popup chat (Sprout AI)           | In-context Q&A about metrics/dashboard without leaving the page. |
| **Analytics**         | Popup chat (Sprout AI)           | In-context Q&A about products/analytics without leaving the page. |
| **Report**            | No AI on page                    | Displays AI-generated reports; “Go to Sprout AI” when there’s no content. |

---

## 2. Agent Roles (Implemented in `openRouter.js`)

All use the same OpenRouter chat API; behavior is shaped by **system prompts** and **usage**.

### 2.1 General assistant (Sprout AI)

- **Used on:** Sprout AI page, Dashboard popup, Analytics popup  
- **API:** `chatCompletion(messages, options)`  
- **Behavior:** Answers questions about sustainability, Scope 1/2/3, LCA, carbon reporting, metrics, inventory. Can be given page context (e.g. “user is on Dashboard” / “user is on Analytics”).

**Why it’s used:**  
- One assistant everywhere keeps tone and knowledge consistent.  
- Same model and API (OpenRouter) means one integration to maintain and one place to upgrade the model.  
- Page-specific context (Dashboard vs Analytics) makes answers relevant without separate agents.

---

### 2.2 Report summary for chat

- **Used on:** Sprout AI page only  
- **API:** `reportSummaryForChat(fullRequest)` → calls `chatCompletion` with a dedicated system prompt  
- **Behavior:** When the user asks for a report, this returns a short (2–4 sentence) chat reply describing what the report covers and that they can view it below. Does **not** generate the full report.

**Why it’s used:**  
- Keeps the chat reply short and natural instead of dumping the whole report into the thread.  
- Separates “what we say in chat” from “what we save as the report,” so the UX is clear and the report can be structured (JSON) for the Report page.

---

### 2.3 Report writer (structured report)

- **Used on:** Sprout AI page only (triggered when the user asks for a report)  
- **Model:** Perplexity Sonar Pro (web-backed) for up-to-date, retrieval-enhanced content.  
- **API:** `generateStructuredReport(userRequest)` → calls `chatCompletion` with the report-writer system prompt  
- **Behavior:** Generates a **single JSON object** with: `reportTitle`, `reportSummary`, `productName`, `companyName`, `boardStatement`, `companyProfile`, pillars (environmental/social/governance), `futureTargets`, etc. Content is fully generated from the user’s request (no hardcoded template); Perplexity improves factual and current data.

**Why it’s used:**  
- Structured output (JSON) is required for the Report page (view, PDF, DOCX). A dedicated “report writer” prompt keeps format and fields stable.  
- One specialized prompt for “write a full report” avoids mixing long-form generation with short chat and keeps the main assistant prompt simple.  
- User intent (e.g. “for WingStop,” “FY2025 F&B”) is passed in one request so the model can tailor company/sector/scope in one go.

---

## 3. Why This Setup Is a Good Fit

1. **Single provider (OpenRouter)**  
   One API key, one client, one place to change model or add fallbacks. Easier to maintain and to add logging/monitoring later.

2. **Single assistant brand (Sprout AI)**  
   Users see one assistant everywhere (Sprout AI page + popups). No confusion between “dashboard bot” and “report bot.”

3. **Role-based behavior, not separate models**  
   Different behaviors (general chat vs report summary vs full report) are handled by **system prompts and different functions**, not by separate agents or models. Same model can do all three well, with clear boundaries.

4. **Context where it matters**  
   Popup chat gets page context (Dashboard vs Analytics) so answers can reference “your dashboard” or “your analytics” without building separate integrations.

5. **Report flow is two-step on purpose**  
   Report summary (chat) + report writer (JSON) keeps the chat readable and the report structured. The Report page stays a consumer of that JSON (view/export), not an AI caller.

6. **Popup chats sync to History**  
   Dashboard and Analytics popup conversations are persisted into the same `sproutai_sessions` store used by the Sprout AI History tab, so all conversations are in one place.

---

## 4. Quick Reference

| Capability              | Sprout AI page | Dashboard popup | Analytics popup | Report page |
|-------------------------|----------------|-----------------|-----------------|------------|
| General Q&A             | ✅             | ✅              | ✅              | —          |
| Report summary (chat)   | ✅             | —               | —               | —          |
| Full report (JSON)      | ✅             | —               | —               | Displays   |
| Page context            | —              | “Dashboard”      | “Analytics”     | —          |
| Sessions in History     | ✅             | ✅              | ✅              | —          |

---

*Implementation: `frontend/src/services/openRouter.js` (API, `DEFAULT_MODEL` = Gemini 2.5 Pro, `REPORT_MODEL` = Perplexity Sonar Pro); `SproutAIPage.jsx` (chat + report); `AIChatPopup` (Dashboard/Analytics popup).*
