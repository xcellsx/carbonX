import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './SproutAIPage.css';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import { Send, FileText, MessageSquare, Sprout, PlusCircle, Trash2, Sparkles, ThumbsUp, ThumbsDown, X } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { chatCompletion, reportSummaryForChat, generateStructuredReport, generateSuggestedPrompts } from '../../services/openRouter';
import { useProSubscription } from '../../hooks/useProSubscription';
import { validateReportSchema } from '../../utils/reportSchema';
import { productAPI } from '../../services/api';
import { getScopeTotalsFromProduct } from '../../utils/emission';

const MarkdownMessage = ({ content }) => (
  <div className="message-markdown">
    <ReactMarkdown>{content || ''}</ReactMarkdown>
  </div>
);

const SESSIONS_KEY = 'sproutai_sessions';
const CURRENT_MESSAGES_KEY = 'sproutai_current_messages';
const FEEDBACK_KEY = 'sproutai_feedback';

function loadFeedbackMap() {
  try {
    const s = localStorage.getItem(FEEDBACK_KEY);
    if (s) {
      const o = JSON.parse(s);
      return typeof o === 'object' && o !== null ? o : {};
    }
  } catch (e) {}
  return {};
}

function saveFeedbackMap(map) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(map));
  } catch (e) {}
}

const SYSTEM_PROMPT = `You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. You ONLY answer questions related to:
- Climate, carbon and greenhouse gas emissions (Scope 1/2/3)
- Life cycle assessment (LCA) and product footprints
- ESG / sustainability strategy, targets, and reporting
- The user's CarbonX data: inventory products, metrics, dashboards, and reports

Formatting rules (very important):
- Start with 1 short orienting sentence, then go straight into structure.
- Use clear markdown headings for sections (e.g. \"### Overview\", \"### Week 1\", \"### Next steps\") but keep the number of headings small.
- Prefer short bullet lists over long paragraphs; keep each bullet to one sentence.
- Avoid huge walls of text. For long plans (like 30-day plans), group days into 3–4 themed sections (e.g. Week 1/2/3) and keep each section compact.
- Only use **bold** for key phrases, not entire sentences.

For normal questions or requests (including plans and recommendations), provide a complete, helpful answer directly in chat following these formatting rules.
Only when the user explicitly asks for a sustainability or carbon \"report\" should you keep the chat reply brief, because a separate full report will be generated elsewhere.

If the user asks about anything outside sustainability, climate, ESG, or their CarbonX data (for example: personal life advice, entertainment, coding unrelated to CarbonX, general trivia, etc.), politely refuse and respond with a short sentence such as: \"I’m focused on sustainability and your CarbonX data, so I can’t help with that topic.\" Do NOT answer off-topic questions.`;

/**
 * Build a compact inventory + company context block from localStorage for regular chat.
 * Keeps the prompt lean (max ~1500 chars) so it doesn't inflate every message.
 */
function buildChatInventoryContext() {
  const lines = [];

  try {
    const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
    const userId = localStorage.getItem('userId') || '';
    const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;
    const company = allCompanyData[userId] ?? allCompanyData[storageKey] ?? null;
    if (company?.companyName) {
      lines.push(`Company: ${company.companyName}${company.sector ? ` | Sector: ${company.sector}` : ''}${company.industry ? ` | Industry: ${company.industry}` : ''}${company.reportingYear ? ` | Year: ${company.reportingYear}` : ''}`);
    }
  } catch (_) {}

  try {
    const lcaByName = JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}');
    const entries = Object.entries(lcaByName)
      .filter(([, v]) => v && typeof v === 'object')
      .map(([name, v]) => ({
        name,
        total: Number(v.total) || (Number(v.scope1 || 0) + Number(v.scope2 || 0) + Number(v.scope3 || 0)),
        scope1: Number(v.scope1) || 0,
        scope2: Number(v.scope2) || 0,
        scope3: Number(v.scope3) || 0,
      }))
      .filter((e) => e.total > 0)
      .sort((a, b) => b.total - a.total);

    if (entries.length > 0) {
      lines.push(`\nUser's inventory (${entries.length} product${entries.length !== 1 ? 's' : ''} with LCA data, sorted by total emissions):`);
      entries.slice(0, 10).forEach((e) => {
        lines.push(`  - ${e.name}: ${e.total.toFixed(2)} kgCO2e total (S1: ${e.scope1.toFixed(2)}, S2: ${e.scope2.toFixed(2)}, S3: ${e.scope3.toFixed(2)})`);
      });
      if (entries.length > 10) lines.push(`  … and ${entries.length - 10} more product(s)`);
      const totS1 = entries.reduce((s, e) => s + e.scope1, 0);
      const totS2 = entries.reduce((s, e) => s + e.scope2, 0);
      const totS3 = entries.reduce((s, e) => s + e.scope3, 0);
      lines.push(`  Portfolio totals — Scope 1: ${totS1.toFixed(2)}, Scope 2: ${totS2.toFixed(2)}, Scope 3: ${totS3.toFixed(2)}, Grand total: ${(totS1 + totS2 + totS3).toFixed(2)} kgCO2e`);
      lines.push('When the user asks about highest/lowest emitting products, most carbon-intensive products, or compares products, use ONLY the inventory data above.');
    }
  } catch (_) {}

  if (lines.length === 0) return '';
  const block = lines.join('\n');
  return block.length > 1500 ? block.slice(0, 1500) + '\n[inventory context truncated]' : block;
}

function summarizeSessionTitle(messages) {
  const firstUser = messages.find(m => m.sender === 'user');
  const text = (firstUser?.text || firstUser?.content || 'Chat').trim();
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 56) return oneLine;
  const firstSentence = oneLine.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || oneLine.slice(0, 56);
  return firstSentence.length <= 56 ? firstSentence : firstSentence.slice(0, 53) + '…';
}

// Heuristic: did the user ask SproutAI to generate something they might want to rate?
function isGenerationRequest(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  const phrases = [
    'generate ',
    'create ',
    'write ',
    'draft ',
    'plan ',
    'reduction plan',
    'report',
    'analysis',
    'analyze',
    'analyse',
    'explain',
    'summarize',
    'summary',
  ];
  return phrases.some((p) => lower.includes(p));
}

// Only show thumbs when the assistant message itself is substantial (not just "Okay, generating now").
function isFeedbackWorthyMessage(text) {
  if (!text) return false;
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Rough threshold: at least ~3 sentences or a short multi-step plan.
  return trimmed.length >= 200;
}


const SPROUTAI_CAROUSEL_SLIDES = [
  { title: 'Welcome to Sprout AI', description: 'Sprout AI is your sustainability assistant. Ask questions about emissions, LCA, carbon reporting, or your data. You can also request AI-generated reports—they will appear in the Report page.', icon: <Sprout size={40} /> },
  { title: 'Chat & History', description: 'Send messages in the chat. Your conversations are saved—switch to the History tab to see past sessions and reopen any chat. Start a new chat with the + button.', icon: <MessageSquare size={40} /> },
  { title: 'Generate reports', description: 'Ask Sprout to "generate a sustainability report" or "write a carbon report". The report will be created and saved; open the Report page to view and download it as PDF or DOCX.', icon: <FileText size={40} /> },
];

function loadSessions() {
  try {
    const s = localStorage.getItem(SESSIONS_KEY);
    if (s) {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [];
    }
  } catch (e) {}
  return [];
}

function loadCurrentMessages() {
  try {
    const s = localStorage.getItem(CURRENT_MESSAGES_KEY);
    if (s) {
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [];
    }
  } catch (e) {}
  return [];
}

const SproutAiPage = () => {
  const { isProUser } = useProSubscription();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'history'
  const [sessions, setSessions] = useState(loadSessions);
  const [messages, setMessages] = useState(loadCurrentMessages);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState(null);
  const chatHistoryRef = useRef(null);
  const lastSentRef = useRef({ text: '', time: 0 });
  /* If user opened a session from History but hasn't sent any message, don't create a duplicate on tab switch */
  const viewingSessionIdRef = useRef(null);
  const openedSessionIdRef = useRef(null);
  const currentChatIdRef = useRef(`cur_${Date.now()}`);
  const [feedbackMap, setFeedbackMap] = useState(loadFeedbackMap);
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const [suggestedPromptsLoading, setSuggestedPromptsLoading] = useState(false);
  const [reportToast, setReportToast] = useState(null); // { reportId, generating, elapsed, failed }
  const reportToastTimerRef = useRef(null);
  const reportToastElapsedRef = useRef(null);

  const showGeneratingToast = (reportId) => {
    if (reportToastTimerRef.current) clearTimeout(reportToastTimerRef.current);
    if (reportToastElapsedRef.current) clearInterval(reportToastElapsedRef.current);
    const startTime = Date.now();
    setReportToast({ reportId, generating: true, elapsed: 0, failed: false });
    reportToastElapsedRef.current = setInterval(() => {
      setReportToast((prev) => prev ? { ...prev, elapsed: Math.floor((Date.now() - startTime) / 1000) } : null);
    }, 1000);
  };

  const showReportToast = (reportId, failed = false) => {
    if (reportToastElapsedRef.current) clearInterval(reportToastElapsedRef.current);
    if (reportToastTimerRef.current) clearTimeout(reportToastTimerRef.current);
    setReportToast({ reportId, generating: false, elapsed: 0, failed });
    if (!failed) {
      reportToastTimerRef.current = setTimeout(() => setReportToast(null), 8000);
    }
  };

  const dismissReportToast = () => {
    if (reportToastTimerRef.current) clearTimeout(reportToastTimerRef.current);
    if (reportToastElapsedRef.current) clearInterval(reportToastElapsedRef.current);
    setReportToast(null);
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // Generate context-aware starter prompts based on user's inventory + dashboard scope totals.
  // Falls back to static prompts (with real product names if available) if OpenRouter key is missing.
  useEffect(() => {
    if (messages.length > 0) return;
    let isCancelled = false;

    const safeCompany = () => {
      try {
        const all = JSON.parse(localStorage.getItem('companyData') || '{}');
        const uid = localStorage.getItem('userId') || '';
        const key = uid.includes('/') ? uid.split('/').pop() : uid;
        const c = all[uid] ?? all[key] ?? null;
        return c && typeof c === 'object' ? c : null;
      } catch {
        return null;
      }
    };

    const run = async () => {
      setSuggestedPromptsLoading(true);
      try {
        const company = safeCompany();
        let list = [];
        try {
          const res = await productAPI.getAllProducts();
          list = Array.isArray(res?.data) ? res.data : [];
        } catch (_) {
          list = [];
        }

        const totals = list.reduce(
          (acc, p) => {
            const t = getScopeTotalsFromProduct({ DPP: p?.DPP ?? p?.dpp, emissionInformation: p?.emissionInformation ?? p?.emission_information });
            acc.scope1 += t.scope1 || 0;
            acc.scope2 += t.scope2 || 0;
            acc.scope3 += t.scope3 || 0;
            return acc;
          },
          { scope1: 0, scope2: 0, scope3: 0 }
        );
        totals.total = totals.scope1 + totals.scope2 + totals.scope3;

        const topProducts = list
          .map((p) => {
            const name = (p?.name ?? p?.productName ?? p?.dpp?.name ?? '').toString().trim();
            const t = getScopeTotalsFromProduct({ DPP: p?.DPP ?? p?.dpp, emissionInformation: p?.emissionInformation ?? p?.emission_information });
            return { name, totalKgCO2e: t.total || 0 };
          })
          .filter((p) => p.name)
          .sort((a, b) => (b.totalKgCO2e || 0) - (a.totalKgCO2e || 0))
          .slice(0, 3);

        const ai = await generateSuggestedPrompts({
          company: {
            companyName: company?.companyName,
            sector: company?.sector,
            industry: company?.industry,
            reportingYear: company?.reportingYear,
          },
          inventory: { productCount: list.length, topProducts },
          dashboard: totals,
        });

        const fallbackProduct = topProducts[0]?.name || 'my product';
        const fallback = [
          `Summarize my current Scope 1, 2, and 3 emissions and what they mean.`,
          `Which of my products has the highest carbon footprint, and what should I improve first?`,
          `Create a 30-day reduction plan for ${fallbackProduct} based on my inventory.`,
        ];

        if (isCancelled) return;
        setSuggestedPrompts(Array.isArray(ai) && ai.length >= 3 ? ai : fallback);
      } finally {
        if (!isCancelled) setSuggestedPromptsLoading(false);
      }
    };

    run();
    return () => {
      isCancelled = true;
    };
  }, [messages.length]);

  useEffect(() => {
    try {
      localStorage.setItem(CURRENT_MESSAGES_KEY, JSON.stringify(messages));
    } catch (e) {}
  }, [messages]);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (e) {}
  }, [sessions]);

  /* When user switches to History tab: only add a new entry if they actually sent a message (edited).
     If they only opened a session from History and didn't send anything, keep it in the original – no duplicate. */
  useEffect(() => {
    if (activeTab !== 'history') return;
    if (viewingSessionIdRef.current !== null) {
      viewingSessionIdRef.current = null;
      return;
    }
    if (messages.length > 0) {
      const title = summarizeSessionTitle(messages);
      const newSession = {
        id: `sess_${Date.now()}`,
        title,
        messages: [...messages],
        createdAt: new Date().toISOString(),
      };
      const oldCurId = currentChatIdRef.current;
      const newId = newSession.id;
      setFeedbackMap((prev) => {
        const next = { ...prev };
        Object.keys(prev).forEach((k) => {
          if (k.startsWith(`${oldCurId}_`)) {
            const idx = k.slice(oldCurId.length + 1);
            next[`${newId}_${idx}`] = prev[k];
            delete next[k];
          }
        });
        saveFeedbackMap(next);
        return next;
      });
      currentChatIdRef.current = `cur_${Date.now()}`;
      setSessions(prev => [newSession, ...prev]);
      setMessages([]);
    }
  }, [activeTab]);

  const startNewChat = () => {
    if (messages.length === 0) return;
    viewingSessionIdRef.current = null;
    openedSessionIdRef.current = null;
    currentChatIdRef.current = `cur_${Date.now()}`;
    const title = summarizeSessionTitle(messages);
    const newSession = {
      id: `sess_${Date.now()}`,
      title,
      messages: [...messages],
      createdAt: new Date().toISOString(),
    };
    setSessions(prev => [newSession, ...prev]);
    setMessages([]);
  };

  const deleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
  };

  const handleConfirmDeleteSession = () => {
    if (deleteConfirmSessionId) {
      deleteSession(deleteConfirmSessionId);
      setDeleteConfirmSessionId(null);
    }
  };

  const openSessionInChat = (session) => {
    viewingSessionIdRef.current = session.id;
    openedSessionIdRef.current = session.id;
    setMessages(session.messages);
    setActiveTab('chat');
  };

  const getEffectiveSessionId = () => {
    if (openedSessionIdRef.current) return openedSessionIdRef.current;
    if (messages.length > 0) return currentChatIdRef.current;
    return null;
  };

  const setFeedback = (sessionId, messageIndex, helpful) => {
    if (!sessionId) return;
    const key = `${sessionId}_${messageIndex}`;
    setFeedbackMap((prev) => {
      const next = { ...prev, [key]: helpful };
      saveFeedbackMap(next);
      return next;
    });
  };

  const isReportRequest = (text) => {
    if (!text) return false;
    const lower = text.toLowerCase();

    // Explicit sustainability/carbon report phrases — always trigger report generation
    const sustainabilityKeywords = [
      'sustainability report',
      'carbon report',
      'carbon footprint report',
      'ghg report',
      'esg report',
      'climate report',
      'emissions report',
    ];
    if (sustainabilityKeywords.some((k) => lower.includes(k))) return true;

    // Regenerate / update / redo the existing report
    const regeneratePhrases = [
      'regenerate the report',
      'regenerate my report',
      'regenerate report',
      'update the report',
      'update my report',
      'update report',
      'redo the report',
      'redo my report',
      'rewrite the report',
      'rewrite my report',
      'refresh the report',
      'refresh my report',
      'new version of the report',
      'recreate the report',
      'generate a new report',
      'generate the report again',
      'make a new report',
    ];
    if (regeneratePhrases.some((p) => lower.includes(p))) return true;

    // Otherwise keep it as normal chat
    return false;
  };

  function buildReportRequestWithContext(currentText) {
    const recent = messages.slice(-6);
    const lines = [];
    if (recent.length > 0) {
      lines.push('Recent conversation (latest messages, truncated):');
      recent.forEach((m) => {
        const label = m.sender === 'user' ? 'User' : 'Assistant';
        const body = m.sender === 'user'
          ? (m.text || m.content)
          : (m.type === 'report_success' ? '[Generated a report]' : (m.content || m.text || ''));
        lines.push(`${label}: ${(body || '').slice(0, 200)}`);
      });
      lines.push('');
    }

    // --- Company Info ---
    let companyName = '';
    try {
      const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
      const userId = localStorage.getItem('userId') || '';
      const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;
      const company = allCompanyData[userId] ?? allCompanyData[storageKey] ?? null;
      if (company && typeof company === 'object') {
        companyName = company.companyName || '';
        lines.push('Company context (very important — write the report about this company, not CarbonX):');
        lines.push(`- Company name: ${company.companyName || 'Unknown'}`);
        lines.push(`- Sector: ${company.sector || 'Unknown'}`);
        lines.push(`- Industry: ${company.industry || 'Unknown'}`);
        lines.push(`- Reporting year: ${company.reportingYear || 'Unknown'}`);
        lines.push('');
      }
    } catch (_) {}

    // --- Real GHG emissions from inventory (localStorage LCA cache) ---
    try {
      const userId = localStorage.getItem('userId') || '';
      const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;

      // Read by-name cache for full scope breakdown
      const lcaByName = JSON.parse(localStorage.getItem('carbonx_lca_cache_by_name_v1') || '{}');
      const nameEntries = Object.entries(lcaByName);

      // Aggregate totals across all products
      let totalScope1 = 0, totalScope2 = 0, totalScope3 = 0;
      const productLines = [];
      nameEntries.forEach(([name, entry]) => {
        if (entry && typeof entry === 'object') {
          totalScope1 += Number(entry.scope1) || 0;
          totalScope2 += Number(entry.scope2) || 0;
          totalScope3 += Number(entry.scope3) || 0;
          const total = Number(entry.total) || ((Number(entry.scope1) || 0) + (Number(entry.scope2) || 0) + (Number(entry.scope3) || 0));
          if (total > 0) {
            productLines.push(`  - ${name}: ${total.toFixed(2)} kgCO2e total (Scope 1: ${(Number(entry.scope1)||0).toFixed(2)}, Scope 2: ${(Number(entry.scope2)||0).toFixed(2)}, Scope 3: ${(Number(entry.scope3)||0).toFixed(2)})`);
          }
        }
      });
      const grandTotal = totalScope1 + totalScope2 + totalScope3;

      if (grandTotal > 0 || productLines.length > 0) {
        lines.push('ACTUAL GHG EMISSIONS DATA (from product LCA calculations — use these exact numbers in the report):');
        lines.push(`- Scope 1 (Direct): ${totalScope1.toFixed(2)} kgCO2e`);
        lines.push(`- Scope 2 (Purchased Energy): ${totalScope2.toFixed(2)} kgCO2e`);
        lines.push(`- Scope 3 (Value Chain): ${totalScope3.toFixed(2)} kgCO2e`);
        lines.push(`- Total GHG: ${grandTotal.toFixed(2)} kgCO2e`);
        if (productLines.length > 0) {
          lines.push('Product-level breakdown (top products by emissions):');
          productLines.sort((a, b) => {
            const getTotal = (s) => { const m = s.match(/(\d+\.?\d*) kgCO2e total/); return m ? parseFloat(m[1]) : 0; };
            return getTotal(b) - getTotal(a);
          });
          productLines.slice(0, 8).forEach((l) => lines.push(l));
        }
        lines.push('');
      }
    } catch (_) {}

    // --- Dashboard ESG metrics (user-entered values) ---
    const METRIC_LABELS = {
      'FB-FR-110a.2': 'Fleet fuel consumed',
      'FB-FR-110a.3': 'Fleet percentage renewable fuel',
      'FB-FR-110a.1': 'Percentage grid electricity',
      'FB-FR-130a.1': 'Operational energy consumed',
      'FB-FR-130a.2': 'Percentage grid electricity (energy)',
      'FB-FR-130a.3': 'Percentage renewable energy',
      'FB-FR-250a.1': 'Food waste generated',
      'FB-FR-250a.2': 'Percentage food waste diverted from waste stream',
      'FB-FR-230a.1': 'Number of data breaches',
      'FB-FR-230a.2': 'Percentage that are personal data breaches',
      'FB-FR-230a.4': 'Number of customers affected by data breaches',
      'FB-FR-250b.1': 'High-risk food safety violation rate',
      'FB-FR-250b.2': 'Number of food recalls',
      'FB-FR-250b.3': 'Number of units recalled',
      'FB-FR-250b.4': 'Percentage of units recalled that are private-label',
      'FB-FR-260a.2': 'Revenue from health & nutrition labelled products (SGD)',
      'FB-FR-270a.1': 'Number of non-compliance incidents (labelling/marketing)',
      'FB-FR-270a.2': 'Monetary losses from labelling/marketing legal proceedings (SGD)',
      'FB-FR-270a.3': 'Revenue from GMO-labelled products (SGD)',
      'FB-FR-270a.4': 'Revenue from non-GMO-labelled products (SGD)',
      'FB-FR-330a.1': 'Average hourly wage (SGD)',
      'FB-FR-330a.2': 'Percentage of employees earning minimum wage',
      'FB-FR-330a.3': 'Percentage of workforce under collective agreements',
      'FB-FR-330a.4': 'Number of work stoppages',
      'FB-FR-330a.5': 'Total days idle from work stoppages',
      'FB-FR-330a.6': 'Monetary losses from labour law violations (SGD)',
      'FB-FR-330a.7': 'Monetary losses from employment discrimination (SGD)',
      'FB-FR-430a.1': 'Revenue from certified sustainable sourcing (SGD)',
      'FB-FR-430a.2': 'Percentage of eggs from cage-free environment',
      'FB-FR-430a.5': 'Percentage of pork without gestation crates',
      'FB-FR-110b.1': 'Scope 1 emissions from refrigerants (tCO2e)',
      'FB-FR-110b.2': 'Percentage of refrigerants with zero ozone-depleting potential',
      'FB-FR-110b.3': 'Average refrigerant emissions rate',
    };
    try {
      const dashMetrics = JSON.parse(localStorage.getItem('carbonx_dashboard_metrics') || '{}');
      const enteredMetrics = Object.entries(dashMetrics).filter(([key, entry]) => {
        if (!METRIC_LABELS[key]) return false;
        const v = entry?.value;
        return v !== null && v !== undefined && v !== '' && v !== 'User Input' && !String(v).startsWith('User Input');
      });
      if (enteredMetrics.length > 0) {
        lines.push('ACTUAL ESG METRICS (user-entered dashboard values — use these exact figures in the report):');
        enteredMetrics.forEach(([key, entry]) => {
          const label = METRIC_LABELS[key];
          const unit = entry.unit ? ` ${entry.unit}` : '';
          lines.push(`- ${label}: ${entry.value}${unit}`);
        });
        lines.push('');
      }
    } catch (_) {}

    lines.push(`Latest request from user (what the report should focus on): ${currentText}`);
    lines.push('');
    lines.push('IMPORTANT: Use the actual emissions data and ESG metrics above (where provided) as the real figures in the report. Do NOT invent different numbers — ground keyData, performance statements, and targets in the actual values supplied. CarbonX is only the software platform; do not treat it as the reporting company.');

    // Hard cap: keep prompt under ~6000 chars (~1500 tokens) to avoid model timeouts
    const joined = lines.join('\n');
    return joined.length > 6000 ? joined.slice(0, 6000) + '\n[context truncated for length]' : joined;
  }

  const handleSend = async (overrideText = null) => {
    const textToSend = (overrideText || input).trim();
    if (textToSend === '' || isSending) return;

    const now = Date.now();
    if (textToSend === lastSentRef.current.text && now - lastSentRef.current.time < 2500) {
      return;
    }
    lastSentRef.current = { text: textToSend, time: now };

    if (messages.length === 0 && !openedSessionIdRef.current) {
      currentChatIdRef.current = `cur_${Date.now()}`;
    }
    viewingSessionIdRef.current = null;
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    const historyForApi = messages.slice(-20).map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.sender === 'user' ? msg.text : (msg.content || (msg.type === 'report_success' ? 'I generated a report for the user.' : '')),
    })).filter(m => m.content && m.content.trim());
    const inventoryCtx = buildChatInventoryContext();
    const systemContent = inventoryCtx
      ? `${SYSTEM_PROMPT}\n\n---\n${inventoryCtx}`
      : SYSTEM_PROMPT;
    const openRouterMessages = [
      { role: 'system', content: systemContent },
      ...historyForApi,
      { role: 'user', content: textToSend },
    ];

    try {
      if (isReportRequest(textToSend)) {
        const fullRequest = buildReportRequestWithContext(textToSend);

        // Step 1: get the chat summary fast and show it immediately — don't wait for the full report
        const rawChatSummary = await reportSummaryForChat(fullRequest);
        let chatSummary = rawChatSummary || '';

        // Derive report name from company info
        const fallbackTitle = textToSend.slice(0, 60) + (textToSend.length > 60 ? '…' : '');
        let reportName = fallbackTitle;
        try {
          const allCompanyData = JSON.parse(localStorage.getItem('companyData') || '{}');
          const userId = localStorage.getItem('userId') || '';
          const storageKey = userId.includes('/') ? userId.split('/').pop() : userId;
          const company = allCompanyData[userId] ?? allCompanyData[storageKey] ?? null;
          const companyName = company?.companyName?.trim();
          const reportingYear = company?.reportingYear?.trim();
          if (companyName) {
            reportName = `${companyName} Carbon Footprint Report${reportingYear ? ' ' + reportingYear : ''}`;
          }
        } catch (_) {}

        if (!chatSummary || chatSummary.trim().length < 40 || /^\d+\.?$/.test(chatSummary.trim())) {
          chatSummary = `Generating your sustainability report for ${reportName}. The full report will be ready shortly — click View Report to open it.`;
        }

        // Create a placeholder report entry right away so the "View" button works immediately
        const reportId = `rpt_${Date.now()}`;
        const placeholderReport = {
          id: reportId,
          reportName,
          description: chatSummary.slice(0, 200),
          date: new Date().toISOString().split('T')[0],
          fullData: {
            productName: reportName,
            boardStatement: 'Report is still being generated. Please check back in a moment.',
            frameworks: ['AI Generated'],
            aiGenerated: true,
            generating: true,
          },
        };
        const existingReports = JSON.parse(localStorage.getItem('carbonx_reports') || '[]');
        localStorage.setItem('carbonx_reports', JSON.stringify([placeholderReport, ...existingReports]));

        // Show the summary + View button immediately — user is unblocked
        setMessages(prev => [...prev, { sender: 'assistant', type: 'report_success', content: chatSummary, reportId }]);
        setIsSending(false);

        // Show a "generating..." toast with live elapsed timer
        showGeneratingToast(reportId);

        // Hard timeout: abort if background generation takes more than 90 seconds
        const TIMEOUT_MS = 90_000;
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Report generation timed out after 90 seconds.')), TIMEOUT_MS)
        );

        // Step 2: generate the full structured report in the background
        Promise.race([generateStructuredReport(fullRequest), timeoutPromise]).then((fullData) => {
          if (!fullData) return;

          const validation = validateReportSchema(fullData);
          if (!validation.valid) {
            console.warn('[Sprout AI] Report schema validation failed:', validation.errors);
            try {
              const stats = JSON.parse(localStorage.getItem('sproutai_report_validation') || '{}');
              stats.fail = (stats.fail || 0) + 1;
              stats.lastErrors = validation.errors.slice(0, 5);
              stats.lastAt = new Date().toISOString();
              localStorage.setItem('sproutai_report_validation', JSON.stringify(stats));
            } catch (_) {}
          } else {
            try {
              const stats = JSON.parse(localStorage.getItem('sproutai_report_validation') || '{}');
              stats.pass = (stats.pass || 0) + 1;
              localStorage.setItem('sproutai_report_validation', JSON.stringify(stats));
            } catch (_) {}
          }

          const finalName = fullData.reportTitle || reportName;
          const description = fullData.reportSummary || chatSummary.slice(0, 200);
          const finalReport = { id: reportId, reportName: finalName, description, date: placeholderReport.date, fullData };

          // Replace the placeholder with the completed report
          const current = JSON.parse(localStorage.getItem('carbonx_reports') || '[]');
          const updated = current.map((r) => r.id === reportId ? finalReport : r);
          localStorage.setItem('carbonx_reports', JSON.stringify(updated));

          // Show "ready" toast now that the full report is complete
          showReportToast(reportId, false);
        }).catch((err) => {
          console.warn('[Sprout AI] Background report generation failed:', err);
          showReportToast(reportId, true);
        });

        // Summary shown + background generation kicked off — re-enable input and exit
        return;
      } else {
        // Non-report chat: allow a larger response window so 30‑day plans and similar outputs are less likely to be cut off.
        const reply = await chatCompletion(openRouterMessages, { max_tokens: 3072 });
        setMessages(prev => [...prev, { sender: 'assistant', type: 'text', content: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', type: 'text', content: `Sorry, I couldn't complete that: ${err.message}` }]);
      setIsSending(false);
      return;
    }
    setIsSending(false);
  };

  return (
    <div className="container">
      <InstructionalCarousel pageId="sproutai" slides={SPROUTAI_CAROUSEL_SLIDES} newUserOnly />
      <Navbar />
      <div className="content-section-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        <div className="content-container-main sproutai-header" style={{ paddingBottom: '0' }}> 
          <div className="header-group">
            <h1>SproutAI</h1>
            <p className="medium-regular">{activeTab === 'chat' ? 'Your Friendly Assistant to Help You Out!' : 'Collection of Chat Histories.'}</p>
          </div>
          
          <div className="sub-header">
            <div className="chip-group">
              <button type="button" className={`chip ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
              <button type="button" className={`chip ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>History</button>
            </div>
            <button
                  type="button"
                  className="default"
                  style={{ whiteSpace: 'nowrap', width: 'auto', paddingLeft: '1rem', paddingRight: '1rem' }}
                  onClick={() => {
                  if (activeTab === 'history') {
                    setMessages([]);
                    setActiveTab('chat');
                  } else {
                    startNewChat();
                  }
                }}
                  disabled={activeTab === 'chat' && messages.length === 0}
                  title="Start a new chat">
                  New Chat
            </button>
          </div>
        </div>
        
        {activeTab === 'chat' && (
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className={`chat-welcome-container ${suggestedPromptsLoading ? 'chat-welcome-loading' : ''}`}>
                <Sprout size={48} className="sproutai-welcome-icon" />
                <p className="large-bold sproutai-welcome-text">What can I help you with today?</p>
              </div>
            ) : (
              <div className="chat-output-wrapper">
                <div className="chat-history-container chat-output-box" ref={chatHistoryRef}>
                  {messages.map((msg, index) => {
                    const prev = index > 0 ? messages[index - 1] : null;
                    const prevUserText =
                      prev && prev.sender === 'user'
                        ? (prev.text || prev.content || '')
                        : '';
                    const showFeedback =
                      msg.sender === 'assistant' &&
                      getEffectiveSessionId() &&
                      isGenerationRequest(prevUserText) &&
                      isFeedbackWorthyMessage(msg.text || msg.content);

                    return (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                      <div className="message-content">
                        {msg.type === 'report_success' ? (
                          <div className="message-report-block">
                            <MarkdownMessage content={msg.content} />
                            <button
                              className="default report-view-btn"
                              onClick={() => navigate('/report', { state: { openReportId: msg.reportId } })}
                            >
                              <FileText size={18} />
                              View Generated Report
                            </button>
                          </div>
                        ) : msg.sender === 'assistant' ? (
                          <MarkdownMessage content={msg.text || msg.content} />
                        ) : (
                          (msg.text || msg.content)
                        )}
                        {showFeedback && (
                          <div className="message-feedback" aria-label="Was this helpful?">
                            <button
                              type="button"
                              className={`message-feedback-btn ${feedbackMap[`${getEffectiveSessionId()}_${index}`] === true ? 'active' : ''}`}
                              onClick={() => setFeedback(getEffectiveSessionId(), index, true)}
                              aria-label="Helpful"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              type="button"
                              className={`message-feedback-btn ${feedbackMap[`${getEffectiveSessionId()}_${index}`] === false ? 'active' : ''}`}
                              onClick={() => setFeedback(getEffectiveSessionId(), index, false)}
                              aria-label="Not helpful"
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )})}
                  {isSending && (
                    <div className="chat-message assistant">
                      <div className="message-content typing-indicator">
                        <span></span><span></span><span></span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className={`chat-footer ${messages.length === 0 ? 'chat-footer-empty' : ''}`}>
              {messages.length === 0 && !suggestedPromptsLoading && (
                <div className="suggestion-cards-grid">
                  {(suggestedPrompts.length ? suggestedPrompts : [
                    'Summarize my current Scope 1, 2, and 3 emissions.',
                    'Which of my products has the highest carbon footprint?',
                    'Generate a reduction plan for my highest-emission product.'
                  ]).slice(0, 6).map((prompt, idx) => (
                    <div key={idx} className="suggestion-card" onClick={() => handleSend(prompt)}>
                      <Sparkles size={18} />
                      <p>{prompt}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="chat-input-container">
                <input
                  type="text"
                  className="chat-input"
                  placeholder="What can I help you with today?"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
                  disabled={isSending}
                />
                <button className="send-button" onClick={() => handleSend()} disabled={isSending}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="sproutai-history-container" style={{ marginTop: '1rem' }}>
            {sessions.length === 0 ? (
              <p className="sproutai-history-empty">
                No chat histories yet. Start a conversation in the Chat tab, then use &quot;New chat&quot; to save it here.
              </p>
            ) : (
              <ul className="sproutai-history-list">
                {sessions.map((session) => (
                  <li key={session.id} className="sproutai-history-item">
                    <button
                      type="button"
                      className="sproutai-history-item-title"
                      onClick={() => openSessionInChat(session)}
                    >
                      <MessageSquare size={18} className="sproutai-history-icon" />
                      <span className="sproutai-history-item-text">{session.title}</span>
                      {session.createdAt && (
                        <span className="sproutai-history-item-date">
                          {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      className="icon" style={{ backgroundColor: 'rgba(var(--danger), 1)' }}
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirmSessionId(session.id); }}
                      title="Delete this chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={deleteConfirmSessionId != null}
        onClose={() => setDeleteConfirmSessionId(null)}
        onConfirm={handleConfirmDeleteSession}
        title="Delete chat"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
      >
        Delete this chat from history?
      </ConfirmationModal>

      {reportToast && (
        <div className={`report-toast${reportToast.failed ? ' report-toast--failed' : ''}`}>
          {reportToast.generating ? (
            <div className="report-toast-spinner" />
          ) : (
            <FileText size={18} className="report-toast-icon" />
          )}
          <div className="report-toast-text">
            {reportToast.generating ? (
              <>
                <span className="report-toast-title">Generating report…</span>
                <span className="report-toast-sub">
                  {reportToast.elapsed < 5
                    ? 'Starting up…'
                    : reportToast.elapsed < 30
                    ? `${reportToast.elapsed}s — writing sections…`
                    : reportToast.elapsed < 60
                    ? `${reportToast.elapsed}s — almost there…`
                    : `${reportToast.elapsed}s — still working…`}
                </span>
              </>
            ) : reportToast.failed ? (
              <>
                <span className="report-toast-title">Generation failed</span>
                <span className="report-toast-sub">The placeholder report was saved — try regenerating.</span>
              </>
            ) : (
              <>
                <span className="report-toast-title">Report ready!</span>
                <span className="report-toast-sub">Your report has been generated and saved.</span>
              </>
            )}
          </div>
          {!reportToast.generating && (
            <button
              type="button"
              className="report-toast-view"
              onClick={() => { dismissReportToast(); navigate('/report', { state: { openReportId: reportToast.reportId } }); }}
            >
              View
            </button>
          )}
          <button type="button" className="report-toast-close" onClick={dismissReportToast} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SproutAiPage;