import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './SproutAiPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Send,
  File, MessageSquare, ChevronRight
} from 'lucide-react';

// --- NEW: Mock Data for Archive/History ---
const MOCK_ARCHIVE_DATA = [
  {
    id: 'arc_001',
    type: 'report', // To distinguish it
    title: 'Q4 2025 - Dried Sesame Analysis',
    date: '2025-11-15',
    icon: FileText
  },
  {
    id: 'arc_002',
    type: 'prompt',
    title: 'Explanation of Scope 3 Emissions',
    date: '2025-11-14',
    icon: MessageSquare
  },
  {
    id: 'arc_003',
    type: 'prompt',
    title: 'Low-carbon packaging alternatives',
    date: '2025-11-12',
    icon: MessageSquare
  }
];


// --- Main Page Component ---
const SproutAiPage = () => {
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation(); 

  // --- State for the Chat UI ---
  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef(null);

  // --- Scroll to bottom when new messages appear ---
  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Mock send message handler ---
  const handleSend = () => {
    if (input.trim() === '' || isSending) return;

    const newMessages = [...messages, { sender: 'user', text: input }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    // Mock AI response delay
    setTimeout(() => {
      let aiResponse = "This is a mock response. In a real app, I would provide a detailed answer about: " + input;
      if (input.toLowerCase().includes("scope 3")) {
        aiResponse = "Scope 3 emissions are all indirect emissions (not included in scope 2) that occur in the value chain of the reporting company, both upstream and downstream. This is often the largest and most difficult category to track, including things like purchased goods, transportation, and end-of-life treatment of sold products.";
      }
      setMessages(prev => [...prev, { sender: 'assistant', text: aiResponse }]);
      setIsSending(false);
    }, 1500);
  };

  // --- NEW: Handler for archive clicks ---
  const handleArchiveClick = (item) => {
    if (item.type === 'report') {
      navigate('/report'); 
    } else {
      alert(`Loading chat history for: "${item.title}"`);
    }
  };

  return (
    <div className="container">
      <div className="sidebar">
        {/* --- Sidebar (Unchanged) --- */}
        <div className="sidebar-top">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard')}
            className="logo-button" 
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <img src={logoPath} alt="Logo" width="48" style={{ margin: 0, padding: 0, display: 'block' }}/>
          </button>
          <p className ="descriptor">Core Features</p>
          <div className="navbar">
            <button type="button" onClick={() => navigate('/dashboard')} className={`nav ${location.pathname === '/dashboard' ? 'active' : ''}`}>
              <LayoutDashboard /><span>Dashboard</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/inventory' ? 'active' : ''}`} onClick={() => navigate('/inventory')}>
              <Archive /><span>Inventory</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/analytics' ? 'active' : ''}`} onClick={() => navigate('/analytics')}>
              <ChartColumnBig /><span>Analytics</span>
            </button>
          </div>
          <p className ="descriptor">Plugins</p>
          <div className = "navbar">
            <button type="button" className={`nav ${location.pathname === '/network' ? 'active' : ''}`} onClick={() => navigate('/network')} disabled={!isProUser}>
              <Network /><span>Network</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/report' ? 'active' : ''}`} onClick={() => navigate('/report')} disabled={!isProUser}>
              <FileText /><span>Report</span>
            </button>
            <button type="button" className={`nav ${location.pathname === '/chat' ? 'active' : ''}`} onClick={() => navigate('/chat')} disabled={!isProUser}>
              <Sprout /><span>Sprout AI</span>
            </button>
          </div>
        </div>
        <div className="sidebar-bottom">
          <button type="button" className={`nav ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => navigate("/settings")}>
            <Settings /><span>Settings</span>
          </button>
        </div>
      </div>

      {/* --- Main Content Area --- */}
      <div className="content-section-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        {/* --- Header and Tabs (UPDATED) --- */}
        <div className="content-container-main" style={{ paddingBottom: '0' }}> 
          <div className="header-group">
            <h1>Sprout AI</h1>
            <p className = "medium-regular">Your generative AI assistant.</p>
          </div>
          
          {/* --- UPDATED: Using chip-group and chip classes --- */}
          <div className="chip-group" style={{ marginTop: '1rem' }}>
            <button 
              className={`chip ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button 
              className={`chip ${activeTab === 'archive' ? 'active' : ''}`}
              onClick={() => setActiveTab('archive')}
            >
              Archive
            </button>
          </div>
        </div>
        
        {/* --- Chat UI --- */}
        {activeTab === 'chat' && (
          <div className="chat-container">
            
            {/* --- Welcome Block / Chat History --- */}
            {messages.length === 0 ? (
              // --- WELCOME BLOCK ---
              <div className="chat-welcome-container">
                <Sprout size={48} style={{ color: 'rgba(var(--primary), 1)', marginBottom: '1rem' }} />
                <p className="large-bold">Hi there!</p>
                <p className="medium-regular" style={{color: 'rgba(var(--greys), 1)'}}>
                  What can I help you with today?
                </p>
              </div>
            ) : (
              // --- MESSAGE HISTORY ---
              <div className="chat-history-container" ref={chatHistoryRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                    <div className="message-content">
                      {msg.text}
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
            )}

            {/* --- Input Area (Unchanged) --- */}
            <div className="chat-footer">
              
              {messages.length === 0 && (
                <div className="suggestion-cards-grid">
                  <div className="suggestion-card" onClick={() => setInput('Explain Scope 3 emissions')}>
                    <MessageSquare size={18} />
                    <p>Explain Scope 3 emissions</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setInput('Write a report on the carbon emissions from my Dried Sesame product')}>
                    <FileText size={18} />
                    <p>Write a report on the carbon emissions from my Dried Sesame product</p>
                  </div>
                  <div className="suggestion-card" onClick={() => setInput('Analyze the carbon emissions for my "Plastic pouch"')}>
                    <Archive size={18} />
                    <p>Analyze the carbon emissions for my "Plastic pouch"</p>
                  </div>
                </div>
              )}

              <div className="chat-input-container">
                <input 
                  type="text" 
                  className="chat-input" 
                  placeholder="Ask a question or make a request..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSend()}
                  disabled={isSending}
                />
                <button 
                  className="send-button" 
                  onClick={handleSend}
                  disabled={isSending}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* --- Archive Tab Content (Unchanged) --- */}
        {activeTab === 'archive' && (
          <div className="archive-container">
            {MOCK_ARCHIVE_DATA.map(item => (
              <div key={item.id} className="archive-item" onClick={() => handleArchiveClick(item)}>
                <div className="archive-item-icon">
                  {React.createElement(item.icon, { size: 20 })}
                </div>
                <div className="archive-item-text">
                  <p className="normal-bold">{item.title}</p>
                  <p className="small-regular" style={{color: 'rgba(var(--greys), 1)'}}>
                    {item.type === 'report' ? 'Report' : 'Prompt'} • Modified: {item.date}
                  </p>
                </div>
                <ChevronRight size={20} style={{ marginLeft: 'auto', color: 'rgba(var(--greys), 1)' }} />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default SproutAiPage;