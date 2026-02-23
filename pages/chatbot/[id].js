// pages/chatbot/[id].js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabaseAdmin } from '../../lib/supabase';

export async function getServerSideProps({ params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) {
      return { notFound: true };
    }

    return {
      props: {
        chatbot: {
          ...data,
          questions: typeof data.questions === 'string' ? JSON.parse(data.questions) : data.questions,
        }
      }
    };
  } catch {
    return { notFound: true };
  }
}

export default function ChatbotPage({ chatbot }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: chatbot.welcome_message }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [visitorEmail, setVisitorEmail] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch('/api/B2B/chatbot-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          chatbot_id: chatbot.id,
          visitor_email: visitorEmail || undefined,
        }),
      });

      const data = await res.json();

      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        if (data.detected_email) setVisitorEmail(data.detected_email);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Une erreur est survenue. Veuillez réessayer." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const accent = chatbot.color || '#8b5cf6';

  return (
    <>
      <Head>
        <title>{chatbot.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0a0a0f;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .chat-container {
          width: 100%;
          max-width: 480px;
          height: 680px;
          display: flex;
          flex-direction: column;
          background: #111118;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03);
        }

        .chat-header {
          padding: 20px 24px;
          background: #16161f;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
          background: ${accent}22;
          border: 1px solid ${accent}44;
        }

        .header-info { flex: 1; }

        .header-name {
          font-size: 15px;
          font-weight: 600;
          color: #f0f0f8;
          letter-spacing: -0.2px;
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .status-text {
          font-size: 12px;
          color: #6b7280;
          font-family: 'DM Mono', monospace;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.1) transparent;
        }

        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }

        .message {
          display: flex;
          gap: 10px;
          animation: fadeIn 0.25s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .msg-avatar {
          width: 30px;
          height: 30px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .message.assistant .msg-avatar {
          background: ${accent}22;
          border: 1px solid ${accent}33;
        }

        .message.user .msg-avatar {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
        }

        .bubble {
          max-width: 78%;
          padding: 11px 15px;
          border-radius: 16px;
          font-size: 14px;
          line-height: 1.55;
          white-space: pre-wrap;
        }

        .message.assistant .bubble {
          background: #1e1e2a;
          color: #d4d4e8;
          border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 4px;
        }

        .message.user .bubble {
          background: ${accent};
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .typing {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 11px 15px;
          background: #1e1e2a;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          width: fit-content;
        }

        .typing span {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6b7280;
          animation: bounce 1.2s infinite;
        }

        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-5px); }
        }

        .input-area {
          padding: 16px;
          background: #16161f;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          gap: 10px;
          align-items: flex-end;
        }

        .input-wrap {
          flex: 1;
          background: #1e1e2a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          transition: border-color 0.2s;
        }

        .input-wrap:focus-within {
          border-color: ${accent}66;
        }

        textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #e0e0f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 11px 14px;
          resize: none;
          max-height: 100px;
          line-height: 1.5;
        }

        textarea::placeholder { color: #4b5563; }

        .send-btn {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          border: none;
          background: ${accent};
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }

        .send-btn:hover:not(:disabled) { opacity: 0.85; transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .send-btn svg { width: 18px; height: 18px; }

        .powered {
          text-align: center;
          font-size: 11px;
          color: #374151;
          padding: 8px;
          font-family: 'DM Mono', monospace;
          background: #0e0e16;
        }
      `}</style>

      <div className="chat-container">
        <div className="chat-header">
          <div className="avatar">{chatbot.avatar || '🤖'}</div>
          <div className="header-info">
            <div className="header-name">{chatbot.name}</div>
            <div className="header-status">
              <div className="status-dot" />
              <span className="status-text">En ligne</span>
            </div>
          </div>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message ${msg.role}`}>
              <div className="msg-avatar">
                {msg.role === 'assistant' ? (chatbot.avatar || '🤖') : '👤'}
              </div>
              <div className="bubble">{msg.content}</div>
            </div>
          ))}
          {loading && (
            <div className="message assistant">
              <div className="msg-avatar">{chatbot.avatar || '🤖'}</div>
              <div className="typing">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-wrap">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Écrivez votre message…"
              disabled={loading}
            />
          </div>
          <button className="send-btn" onClick={sendMessage} disabled={!input.trim() || loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        <div className="powered">Propulsé par ProspectBot B2B</div>
      </div>
    </>
  );
}
