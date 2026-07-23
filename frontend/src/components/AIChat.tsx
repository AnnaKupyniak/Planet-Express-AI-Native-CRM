import React, { useState, useRef, useEffect } from 'react';
import { api } from '../App';

interface ChatMessage {
  text: string;
  isUser: boolean;
}

export const AIChat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { text: "How can I assist you with today's deliveries, meatbag?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [thought, setThought] = useState('> Authenticating neural link...\n> Access granted.');
  const [showLogs, setShowLogs] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, isUser: true }]);
    setInput('');

    setThought('> Connecting to Python Agent...\n> ...');
    setShowLogs(true); // Показувати логи під час завантаження
    
    try {
      const res = await api.post('/chat', { prompt: userMsg });
      
      setThought(res.data.logs || '> Analysis complete.');
      setShowLogs(false); // Ховаємо логи після отримання відповіді
      setMessages(prev => [...prev, { 
        text: res.data.response || "I couldn't process that properly.", 
        isUser: false 
      }]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message;
      const errorDetails = error.response?.data?.details || '';
      setThought(`> Connection failed.\n> Error: ${errorMsg}\n> Details: ${errorDetails}`);
      setShowLogs(false); // Ховаємо логи у разі помилки
      setMessages(prev => [...prev, { 
        text: "Error communicating with the neural network. Try again later.", 
        isUser: false 
      }]);
    }
  };

  return (
    <aside className="sidebar-right">
      <div className="chat-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img 
          src="https://api.dicebear.com/7.x/bottts/svg?seed=PlanetExpressAI&backgroundColor=0B0D17" 
          alt="AI Avatar" 
          style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--neon-green)' }}
        />
        <h2 className="chat-title" style={{ flex: 1 }}>Planet Express AI</h2>
        <div className="status-indicator"></div>
      </div>

      <div 
        className="thought-logs-header" 
        onClick={() => setShowLogs(!showLogs)}
        style={{ cursor: 'pointer', padding: '8px 24px', fontSize: '11px', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', backgroundColor: 'rgba(0,0,0,0.2)' }}
      >
        <span>TERMINAL LOGS</span>
        <span>{showLogs ? '▼' : '▶'}</span>
      </div>

      {showLogs && (
        <div className="thought-logs" style={{ whiteSpace: 'pre-line' }}>
          {thought}
        </div>
      )}

      <div className="chat-box" ref={chatBoxRef}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-msg ${msg.isUser ? 'user-msg' : 'ai-msg'}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          className="chat-input" 
          placeholder="Ask AI to create or assign..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="btn-send" onClick={handleSend}>SEND</button>
      </div>
    </aside>
  );
};
