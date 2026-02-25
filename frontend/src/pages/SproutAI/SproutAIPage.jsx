import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import './SproutAIPage.css';
import Navbar from '../../components/Navbar/Navbar';
import ConfirmationModal from '../../components/ConfirmationModal/ConfirmationModal';
import { Send, FileText, MessageSquare, Sprout, PlusCircle, Trash2, Sparkles, ThumbsUp, ThumbsDown } from 'lucide-react';
import InstructionalCarousel from '../../components/InstructionalCarousel/InstructionalCarousel';
import { chatCompletion, reportSummaryForChat, generateStructuredReport } from '../../services/openRouter';
import { useProSubscription } from '../../hooks/useProSubscription';
import { validateReportSchema } from '../../utils/reportSchema';

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

const SYSTEM_PROMPT = `You are Sprout AI, a helpful assistant for CarbonX—a sustainability and carbon footprint platform. You answer questions about Scope 1/2/3 emissions, life cycle assessment (LCA), carbon reporting, and general sustainability. When a user asks you to generate or write a report, give a brief acknowledgment only (e.g. that you're generating it); the full report is produced separately. For normal chat questions, be concise and helpful.`;

function summarizeSessionTitle(messages) {
  const firstUser = messages.find(m => m.sender === 'user');
  const text = (firstUser?.text || firstUser?.content || 'Chat').trim();
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= 56) return oneLine;
  const firstSentence = oneLine.match(/^[^.!?]+[.!?]?/)?.[0]?.trim() || oneLine.slice(0, 56);
  return firstSentence.length <= 56 ? firstSentence : firstSentence.slice(0, 53) + '…';
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

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

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
    const lower = text.toLowerCase();
    return /\b(report|generate a report|write a report|create a report|draft a report)\b/.test(lower);
  };

  function buildReportRequestWithContext(currentText) {
    const recent = messages.slice(-6);
    if (recent.length === 0) return currentText;
    const lines = recent.map((m) => {
      const label = m.sender === 'user' ? 'User' : 'Assistant';
      const body = m.sender === 'user' ? (m.text || m.content) : (m.type === 'report_success' ? '[Generated a report]' : (m.content || m.text || ''));
      return `${label}: ${(body || '').slice(0, 200)}`;
    });
    return `Conversation context:\n${lines.join('\n')}\n\nLatest request: ${currentText}\n\nGenerate the report based on the full conversation (e.g. if the user asked to change company or scope, use that).`;
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
    const openRouterMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...historyForApi,
      { role: 'user', content: textToSend },
    ];

    try {
      if (isReportRequest(textToSend)) {
        const fullRequest = buildReportRequestWithContext(textToSend);
        const [chatSummary, fullData] = await Promise.all([
          reportSummaryForChat(fullRequest),
          generateStructuredReport(fullRequest).catch(() => null),
        ]);
        if (fullData) {
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
        }
        const fallbackTitle = textToSend.slice(0, 60) + (textToSend.length > 60 ? '…' : '');
        const reportName = fullData?.reportTitle || fallbackTitle;
        const description = fullData?.reportSummary || (fullData ? 'AI-generated sustainability report.' : 'AI-generated report based on your request.');
        const newReport = {
          id: `rpt_${Date.now()}`,
          reportName,
          description,
          date: new Date().toISOString().split('T')[0],
          fullData: fullData || {
            productName: fallbackTitle,
            boardStatement: chatSummary,
            frameworks: ['AI Generated'],
            aiGenerated: true,
          },
        };
        const existingReports = JSON.parse(localStorage.getItem('carbonx_reports') || '[]');
        localStorage.setItem('carbonx_reports', JSON.stringify([newReport, ...existingReports]));
        setMessages(prev => [...prev, { sender: 'assistant', type: 'report_success', content: chatSummary, reportId: newReport.id }]);
      } else {
        const reply = await chatCompletion(openRouterMessages);
        setMessages(prev => [...prev, { sender: 'assistant', type: 'text', content: reply }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'assistant', type: 'text', content: `Sorry, I couldn't complete that: ${err.message}` }]);
    } finally {
      setIsSending(false);
    }
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
              <div className="chat-welcome-container">
                <Sprout size={48} className="sproutai-welcome-icon" />
                <p className="large-bold">What can I help you with today?</p>
              </div>
            ) : (
              <div className="chat-output-wrapper">
                <div className="chat-history-container chat-output-box" ref={chatHistoryRef}>
                  {messages.map((msg, index) => (
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
                        {msg.sender === 'assistant' && getEffectiveSessionId() && (
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
                  ))}
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

            <div className="chat-footer">
              {messages.length === 0 && (
                <div className="suggestion-cards-grid">
                  <div className="suggestion-card" onClick={() => handleSend('Generate a plan to increase efficiency for Product X.')}>
                    <Sparkles size={18} />
                    <p>Generate a plan to increase efficiency for Product X.</p>
                  </div>
                  <div className="suggestion-card" onClick={() => handleSend('Write a report on the carbon emissions from Product 2.')}>
                    <Sparkles size={18} />
                    <p>Write a report on the carbon emissions from Product 2.</p>
                  </div>
                  <div className="suggestion-card" onClick={() => handleSend('Analyze the carbon emissions for Product 2.')}>
                    <Sparkles size={18} />
                    <p>Analyze the carbon emissions for Product 2.</p>
                  </div>
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
    </div>
  );
};

export default SproutAiPage;