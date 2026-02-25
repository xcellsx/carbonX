import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sprout } from 'lucide-react';
import { chatCompletion, POPUP_MODEL } from '../../services/openRouter';
import ReactMarkdown from 'react-markdown';
import './AIChatPopup.css';

const SESSIONS_KEY = 'sproutai_sessions';

const DEFAULT_SYSTEM = `You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. You answer questions about Scope 1/2/3 emissions, metrics, analytics, inventory, and general sustainability.

Format your replies for easy reading:
- Use **bold** for key terms and important phrases.
- Use short paragraphs (2–4 sentences max); add a blank line between paragraphs.
- For lists of items, facts, or steps, use bullet points (- or *).
- For multiple distinct topics, use ### subheadings.
- Do not output one long wall of text; break content into clear, scannable sections.`;

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

function saveSessions(sessions) {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {}
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
      ? `\n\nCurrent page data (use this to summarize the page or answer questions about the user's data; when asked to "summarise" or "summarize" the Analytics page, use this data):\n${contextSummary}`
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
    const sessions = loadSessions();
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
    saveSessions(sessions);
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
      const reply = await chatCompletion(apiMessages, { model: POPUP_MODEL, max_tokens: 2048, temperature: 0.6 });
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
                <button
                  type="button"
                  className="ai-chat-popup-suggestion-btn"
                  onClick={() => handleSend('Summarize my dashboard.')}
                  disabled={loading}
                >
                  Summarize My Dashboard
                </button>
                <button
                  type="button"
                  className="ai-chat-popup-suggestion-btn"
                  onClick={() => handleSend('Summarize my analytics.')}
                  disabled={loading}
                >
                  Summarize My Analytics
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
