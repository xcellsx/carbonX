import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; 
import './SproutAIPage.css';
import logoPath from '../../assets/carbonx.png';
import { 
  LayoutDashboard, Archive, ChartColumnBig, Network, 
  FileText, Sprout, Settings, Send,
  File, MessageSquare, ChevronRight
} from 'lucide-react';
import { API_BASE, productAPI } from '../../services/api';

const MOCK_ARCHIVE_DATA = [
  {
    id: 'arc_001',
    type: 'prompt',
    title: 'Explanation of Scope 3 Emissions',
    date: '2025-11-14',
    icon: MessageSquare
  },
  {
    id: 'arc_002',
    type: 'prompt',
    title: 'Low-carbon packaging alternatives',
    date: '2025-11-12',
    icon: MessageSquare
  }
];

const SproutAiPage = () => {
  const [userId] = useState(localStorage.getItem('userId') || '');
  const [isProUser] = useState(localStorage.getItem('isProUser') === 'true'); 
  const navigate = useNavigate();
  const location = useLocation(); 

  const [activeTab, setActiveTab] = useState('chat');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatHistoryRef = useRef(null);

  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Fetch products (Java backend: GET /api/products), filter by user ---
  useEffect(() => {
    if (!userId) return;
    productAPI.getAllProducts()
      .then(res => {
        const raw = Array.isArray(res.data) ? res.data : [];
        const filtered = raw.filter((p) => p.userId === userId);
        setInventory(filtered.map((p) => ({ productId: p.id ?? p.key, productName: p.name })));
      })
      .catch(err => console.error("Failed to load inventory for AI context:", err));
  }, [userId]);

  // --- Handle Sending Messages ---
  const handleSend = (overrideText = null) => {
    const textToSend = overrideText || input;
    if (textToSend.trim() === '' || isSending) return;

    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setInput('');
    setIsSending(true);

    // Mock AI response delay
    setTimeout(() => {
      let aiResponse = { type: 'text', content: "I'm sorry, I can only help with specific carbon analysis tasks at the moment." };
      
      const lowerInput = textToSend.toLowerCase();

      // --- Logic for "Report Generation" ---
      if (lowerInput.includes("report")) {
        
        // --- UPDATED SMART MATCHING LOGIC ---
        // 1. Try to find a product where at least 2 words from its name appear in the input
        // e.g. "Dried Sesame" input will match "Dried White Sesame" product
        const targetProduct = inventory.find(p => {
            const nameParts = p.productName.toLowerCase().split(/[\s-]+/).filter(w => w.length > 3); // Split by space or dash, ignore short words
            if (nameParts.length === 0) return false;
            
            // Check how many parts are in the user input
            const matches = nameParts.filter(part => lowerInput.includes(part));
            
            // Match if we found at least 2 keywords (or 1 if the name is very short)
            return matches.length >= Math.min(2, nameParts.length);
        });
        
        if (targetProduct) {
             // --- DYNAMIC REPORT GENERATION (Unchanged) ---
             
             // Parse components
             let components = [];
             try { components = JSON.parse(targetProduct.dppData || '[]'); } catch(e) {}

             // Calculate Total
             const totalLca = targetProduct.lcaResult || components.reduce((sum, c) => sum + (c.lcaValue || 0), 0);

             // Find hotspots
             const sortedComponents = [...components].sort((a, b) => (b.lcaValue || 0) - (a.lcaValue || 0));
             const topComponent = sortedComponents[0] || { component: 'None', lcaValue: 0 };

             // Generate Highlights
             const dynamicHighlights = [
                { 
                    label: "Total Product Footprint", 
                    value: `${totalLca.toFixed(2)} kg CO2e`, 
                    change: "N/A", 
                    type: "neutral", 
                    source: "Inventory Calc" 
                }
             ];

             if (topComponent.lcaValue) {
                 const share = totalLca > 0 ? ((topComponent.lcaValue / totalLca) * 100).toFixed(1) : 0;
                 dynamicHighlights.push({
                     label: `${topComponent.component || topComponent.ingredient} (Top Contributor)`,
                     value: `${(topComponent.lcaValue || 0).toFixed(2)} kg CO2e`,
                     change: `${share}%`,
                     type: "negative",
                     source: "Component Share"
                 });
             }

             // Build Report
             const newReport = {
                id: `rpt_${Date.now()}`,
                reportName: `Analysis: ${targetProduct.productName}`,
                description: `Automated sustainability report based on inventory data for ${targetProduct.productName}.`,
                date: new Date().toISOString().split('T')[0],
                fullData: {
                    productName: targetProduct.productName,
                    boardStatement: `This report details the life cycle analysis of our '${targetProduct.productName}' product, derived directly from our CarbonX inventory data. It highlights key hotspots and emission drivers.`,
                    frameworks: ["GRI Standards", "GHG Protocol"],
                    performanceHighlights: dynamicHighlights,
                    materialFactors: [
                        {
                            title: "Primary Hotspot: " + (topComponent.component || topComponent.ingredient || "Main Ingredient"),
                            commitment: "To investigate lower-emission alternatives for our primary inputs.",
                            performanceSummary: `This component accounts for the majority of the product's footprint. Reducing its impact is critical.`,
                            metrics: [
                                { label: "Global Warming", value: `${(topComponent.lcaValue || 0).toFixed(2)} kg CO2e`, change: "contribution" }
                            ]
                        }
                    ],
                    targetSummary: [
                        { target: "Reduce total product carbon footprint by 10%", status: "On Track", performance: "Inventory baseline established." },
                        { target: "Engage top suppliers on emission data", status: "In Progress", performance: "Data collection phase." }
                    ]
                }
            };

            // Save to LocalStorage
            const existingReports = JSON.parse(localStorage.getItem('carbonx_reports') || '[]');
            const exists = existingReports.find(r => r.reportName === newReport.reportName);
            if (!exists) {
                localStorage.setItem('carbonx_reports', JSON.stringify([newReport, ...existingReports]));
            }

            aiResponse = { 
                type: 'report_success', 
                content: `I have generated a dynamic sustainability report for '${targetProduct.productName}' based on your real-time inventory data.`
            };
        } else {
            // Fallback if matching fails
            aiResponse = { 
                type: 'text', 
                content: "I couldn't find a matching product in your inventory. Please try including specific keywords from your product name (e.g., 'Sesame' or 'Golden Lion')." 
            };
        }
      
      } else if (lowerInput.includes("scope 3")) {
        aiResponse = { type: 'text', content: "Scope 3 emissions are all indirect emissions (not included in scope 2) that occur in the value chain of the reporting company, both upstream and downstream." };
      } else if (lowerInput.includes("plastic pouch")) {
        aiResponse = { type: 'text', content: "Based on typical inventory data, plastic packaging often contributes significantly to fossil resource depletion. I recommend exploring bioplastic alternatives like PLA or recycled LDPE." };
      }

      setMessages(prev => [...prev, { sender: 'assistant', ...aiResponse }]);
      setIsSending(false);
    }, 1500);
  };

  const handleArchiveClick = (item) => {
      alert(`Loading chat history for: "${item.title}"`);
  };

  return (
    <div className="container">
      <div className="sidebar">
        <div className="sidebar-top">
          <button type="button" onClick={() => navigate('/dashboard')} className="logo-button" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
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

      <div className="content-section-main" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        
        <div className="content-container-main" style={{ paddingBottom: '0' }}> 
          <div className="header-group">
            <h1>Sprout AI</h1>
            <p className = "medium-regular">Your generative AI assistant.</p>
          </div>
          
          <div className="chip-group" style={{ marginTop: '1rem' }}>
            <button className={`chip ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
            <button className={`chip ${activeTab === 'archive' ? 'active' : ''}`} onClick={() => setActiveTab('archive')}>Archive</button>
          </div>
        </div>
        
        {activeTab === 'chat' && (
          <div className="chat-container">
            {messages.length === 0 ? (
              <div className="chat-welcome-container">
                <Sprout size={48} style={{ color: 'rgba(var(--primary), 1)', marginBottom: '1rem' }} />
                <p className="large-bold">Hi there!</p>
                <p className="medium-regular" style={{color: 'rgba(var(--greys), 1)'}}>
                  What can I help you with today?
                </p>
              </div>
            ) : (
              <div className="chat-history-container" ref={chatHistoryRef}>
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                    <div className="message-content">
                      {msg.type === 'report_success' ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              <p>{msg.content}</p>
                              <button 
                                className="default" 
                                style={{ backgroundColor: 'rgba(var(--whites), 1)', color: 'rgba(var(--primary), 1)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                onClick={() => navigate('/report')}
                              >
                                <FileText size={18} />
                                View Generated Report
                              </button>
                          </div>
                      ) : (
                          msg.text || msg.content
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
            )}

            <div className="chat-footer">
              {messages.length === 0 && (
                <div className="suggestion-cards-grid">
                  <div className="suggestion-card" onClick={() => handleSend('Explain Scope 3 emissions')}>
                    <MessageSquare size={18} />
                    <p>Explain Scope 3 emissions</p>
                  </div>
                  {/* --- SUGGESTION CARD FOR REPORT --- */}
                  <div className="suggestion-card" onClick={() => handleSend('Write a report on the carbon emissions from my Dried Sesame product')}>
                    <FileText size={18} />
                    <p>Write a report on the carbon emissions from my Dried Sesame product</p>
                  </div>
                  <div className="suggestion-card" onClick={() => handleSend('Analyze the carbon emissions for my "Plastic pouch"')}>
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
                <button className="send-button" onClick={() => handleSend()} disabled={isSending}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'archive' && (
          <div className="archive-container">
            {MOCK_ARCHIVE_DATA.map(item => (
              <div key={item.id} className="archive-item" onClick={() => handleArchiveClick(item)}>
                <div className="archive-item-icon">{React.createElement(item.icon, { size: 20 })}</div>
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