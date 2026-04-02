import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sprout } from 'lucide-react';
import { chatCompletion, POPUP_MODEL } from '../../services/openRouter';
import ReactMarkdown from 'react-markdown';
import { loadSproutSessions, saveSproutSessions } from '../../utils/sproutAiStorage';
import './AIChatPopup.css';

const DEFAULT_SYSTEM = `You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. You ONLY answer questions about:
- Scope 1/2/3 emissions and carbon footprints
- Metrics and trends on the current CarbonX page (Dashboard/Analytics/Report)
- Sustainability reports: board statements, ESG pillars, targets, and performance
- Inventory products, LCAs, and supply-chain impacts
- ESG / sustainability strategy related to the user's data
- How the company compares against global and Singapore sustainability benchmarks and targets

When the user asks about benchmarks, targets, or "how far are we", use the GHG BENCHMARKS & TARGETS section in the page context alongside the company's COMPANY GHG DATA to give a specific, quantified answer — for example: "Your Scope 1+2 of X kgCO2e is Y% above the SBTi 2030 pathway" or "To meet the Paris 1.5°C target you need to cut total emissions by Z%". Always be specific and use the actual numbers provided.

The chat window is small, so keep answers concise:
- Aim for 2–4 short sentences, or at most 3–6 brief bullet points.
- Do not use long sections or multiple headings unless the user explicitly asks for a detailed explanation.
- Focus on the single most important insight or next step.

If the user asks about anything outside sustainability, climate, ESG, or their CarbonX data (for example: personal topics, entertainment, unrelated tech, or general trivia), politely refuse and respond with a short sentence such as: "I'm focused on sustainability and your CarbonX data, so I can't help with that topic." Do NOT answer off-topic questions.`;

function summarizeSessionTitle(messages) {
  const firstUser = messages.find(m => m.role === 'user');
  const text = (firstUser?.content || 'Chat').trim().replace(/\s+/g, ' ');
  if (text.length <= 56) return text;
  const firstSentence = text.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || text.slice(0, 56);
  return firstSentence.length <= 56 ? firstSentence : firstSentence.slice(0, 53) + '…';
}

function toSproutMessage(msg) {
  if (msg.role === 'user') return { sender: 'user', text: msg.content };
  return { sender: 'assistant', content: msg.content };
}

/**
 * Popup chat triggered by the AI FAB on Dashboard/Analytics.
 * Persists conversations to the same sproutai_sessions so they appear in SproutAI History.
 * @param {string} pageContext - e.g. "Analytics" or "Dashboard"
 * @param {string} contextSummary - Optional summary of current page data (products, metrics, etc.) so the assistant can summarize the page.
 */
const AIChatPopup = ({ isOpen, onClose, pageContext = '', contextSummary = '' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionIdRef = useRef(null);

  const systemPrompt = [
    pageContext ? `${DEFAULT_SYSTEM} The user is currently on the ${pageContext} page.` : DEFAULT_SYSTEM,
    contextSummary
      ? `\n\nCurrent page data (use this to summarize the page or answer questions about the user's data; when asked to "summarise" or "summarize" the page or compare against benchmarks/targets, use this data):\n${contextSummary}`
      : '',
  ].join('');

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      sessionIdRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Auto-grow textarea so user can see full message */
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  /* Persist popup conversation to SproutAI sessions so it shows in History tab */
  useEffect(() => {
    if (messages.length === 0) return;
    const sproutMessages = messages.map(toSproutMessage);
    const title = summarizeSessionTitle(messages);
    const sessions = loadSproutSessions();
    if (!sessionIdRef.current) {
      sessionIdRef.current = `sess_popup_${Date.now()}`;
    }
    const id = sessionIdRef.current;
    const existingIndex = sessions.findIndex(s => s.id === id);
    const session = {
      id,
      title,
      messages: sproutMessages,
      createdAt: existingIndex >= 0 ? sessions[existingIndex].createdAt : new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }
    saveSproutSessions(sessions);
  }, [messages]);

  const handleSend = async (textOrEvent) => {
    const text = typeof textOrEvent === 'string'
      ? textOrEvent.trim()
      : input.trim();
    if (!text || loading) return;
    if (typeof textOrEvent !== 'string') setInput('');
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const apiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        userMsg,
      ];
      const reply = await chatCompletion(apiMessages, { model: POPUP_MODEL, max_tokens: 600, temperature: 0.6 });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I couldn't complete that: ${err.message}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="ai-chat-popup" role="dialog" aria-label="AI assistant chat">
        <div className="ai-chat-popup-header">
          <div className="ai-chat-popup-header-title">
            <Sprout size={20} />
            <span>Welcome to Sprout AI</span>
          </div>
          <button
            type="button"
            className="ai-chat-popup-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            <X size={20} />
          </button>
        </div>
        <div className="ai-chat-popup-messages">
          {messages.length === 0 ? (
            <>
              <p className="ai-chat-popup-prompt">What can I help you with today?</p>
              <div className="ai-chat-popup-suggestions">
                {pageContext === 'Dashboard' && (
                  <button
                    type="button"
                    className="ai-chat-popup-suggestion-btn"
                    onClick={() => handleSend('Summarise my dashboard data and highlight any key metrics or areas of concern.')}
                    disabled={loading}
                  >
                    Summarise Dashboard
                  </button>
                )}
                {pageContext === 'Analytics' && (
                  <button
                    type="button"
                    className="ai-chat-popup-suggestion-btn"
                    onClick={() => handleSend('Summarise my analytics data and highlight the top emission contributors.')}
                    disabled={loading}
                  >
                    Summarise Analytics
                  </button>
                )}
                {pageContext === 'Report' && (
                  <button
                    type="button"
                    className="ai-chat-popup-suggestion-btn"
                    onClick={() => handleSend('Summarise this sustainability report and highlight the key findings, achievements, and areas for improvement.')}
                    disabled={loading}
                  >
                    Summarise Report
                  </button>
                )}
                <button
                  type="button"
                  className="ai-chat-popup-suggestion-btn"
                  onClick={() => handleSend('How does my company compare against global and Singapore sustainability targets and benchmarks? Show me the gap for each scope.')}
                  disabled={loading}
                >
                  Benchmark vs Targets
                </button>
                <button
                  type="button"
                  className="ai-chat-popup-suggestion-btn"
                  onClick={() => handleSend('What actions can I take to reduce my carbon footprint based on my current data?')}
                  disabled={loading}
                >
                  Reduction Actions
                </button>
              </div>
            </>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`ai-chat-popup-msg ai-chat-popup-msg--${msg.role}`}>
                  {msg.role === 'assistant' ? (
                    <div className="ai-chat-popup-msg-content">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="normal-regular">{msg.content}</p>
                  )}
                </div>
              ))}
              {loading && (
                <div className="ai-chat-popup-msg ai-chat-popup-msg--assistant">
                  <div className="ai-chat-popup-msg-content">
                    <span className="ai-chat-popup-typing">Thinking...</span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="ai-chat-popup-input-wrap">
          <textarea
            ref={inputRef}
            className="ai-chat-popup-input"
            placeholder="What can I help you with today?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            rows={1}
            aria-label="Message"
          />
          <button
            type="button"
            className="ai-chat-popup-send"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </>
  );
};

export default AIChatPopup;
