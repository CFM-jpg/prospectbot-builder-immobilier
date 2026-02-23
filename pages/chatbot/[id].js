// pages/chatbot/[id].js
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { supabaseAdmin } from '../../lib/supabase';

export async function getServerSideProps({ params }) {
  try {
    const { data, error } = await supabaseAdmin
      .from('chatbots')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !data) return { notFound: true };

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
      setMessages(prev => [...prev, { role: 'assistant', content: 'Une erreur est survenue. Veuillez réessayer.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const accent = chatbot.color || '#7c6af7';

  return (
    <>
      <Head>
        <title>{chatbot.name}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=DM+Sans:wght@300;400;500&family=DM+Mono:wght@400&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #080809;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background-image: radial-gradient(ellipse at 20% 50%, rgba(124,106,247,0.04) 0%, transparent 60%),
                            radial-gradient(ellipse at 80% 20%, rgba(90,69,212,0.03) 0%, transparent 50%);
        }

        .chat-wrap {
          width: 100%;
          max-width: 460px;
          height: 660px;
          display: flex;
          flex-direction: column;
          background: #0e0e11;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 50px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.02);
        }

        .header {
          padding: 18px 22px;
          background: #0a0a0d;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex;
          align-items: center;
          gap: 14px;
          flex-shrink: 0;
        }

        .header-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(124,106,247,0.1);
          border: 1px solid rgba(124,106,247,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .header-icon svg { width: 18px; height: 18px; }

        .header-info { flex: 1; min-width: 0; }

        .header-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 400;
          color: #e8e8ee;
          letter-spacing: 0.1px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 3px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #22c55e;
          flex-shrink: 0;
          animation: pulse 2.5s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.3); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }

        .status-text {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          letter-spacing: 0.5px;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 22px 18px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.06) transparent;
        }

        .messages::-webkit-scrollbar { width: 3px; }
        .messages::-webkit-scrollbar-track { background: transparent; }
        .messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

        .msg-row {
          display: flex;
          gap: 10px;
          animation: appear 0.2s ease;
        }

        @keyframes appear {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .msg-row.user { flex-direction: row-reverse; }

        .msg-dot {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          flex-shrink: 0;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .msg-row.assistant .msg-dot {
          background: rgba(124,106,247,0.1);
          border: 1px solid rgba(124,106,247,0.18);
        }

        .msg-row.user .msg-dot {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
        }

        .msg-dot svg { width: 13px; height: 13px; }

        .bubble {
          max-width: 80%;
          padding: 11px 14px;
          border-radius: 14px;
          font-size: 13.5px;
          line-height: 1.6;
          white-space: pre-wrap;
          letter-spacing: 0.1px;
        }

        .msg-row.assistant .bubble {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          color: rgba(232,232,238,0.9);
          border-bottom-left-radius: 4px;
        }

        .msg-row.user .bubble {
          background: linear-gradient(135deg, #5a45d4, ${accent});
          color: #fff;
          border-bottom-right-radius: 4px;
        }

        .typing-row {
          display: flex;
          gap: 10px;
          animation: appear 0.2s ease;
        }

        .typing-bubble {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 14px;
          border-bottom-left-radius: 4px;
        }

        .typing-bubble span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          animation: blink 1.4s ease infinite;
        }
        .typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
        .typing-bubble span:nth-child(3) { animation-delay: 0.4s; }

        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
          30% { opacity: 1; transform: scale(1.2); }
        }

        .input-area {
          padding: 14px 16px;
          background: #0a0a0d;
          border-top: 1px solid rgba(255,255,255,0.06);
          display: flex;
          gap: 10px;
          align-items: flex-end;
          flex-shrink: 0;
        }

        .input-box {
          flex: 1;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          transition: border-color 0.2s, background 0.2s;
        }

        .input-box:focus-within {
          border-color: rgba(124,106,247,0.4);
          background: rgba(124,106,247,0.03);
        }

        textarea {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #d4d4e0;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          padding: 10px 13px;
          resize: none;
          max-height: 90px;
          line-height: 1.5;
        }

        textarea::placeholder { color: rgba(255,255,255,0.2); font-size: 13px; }

        .send {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #5a45d4, ${accent});
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: opacity 0.2s, transform 0.15s;
        }

        .send:hover:not(:disabled) { opacity: 0.85; transform: translateY(-1px); }
        .send:active:not(:disabled) { transform: scale(0.95); }
        .send:disabled { opacity: 0.3; cursor: not-allowed; }
        .send svg { width: 15px; height: 15px; }

        .footer {
          text-align: center;
          padding: 8px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          color: rgba(255,255,255,0.12);
          background: #080809;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
      `}</style>

      <div className="chat-wrap">
        <div className="header">
          <div className="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-12z"/>
            </svg>
          </div>
          <div className="header-info">
            <div className="header-name">{chatbot.name}</div>
            <div className="header-status">
              <div className="status-dot" />
              <span className="status-text">Disponible</span>
            </div>
          </div>
        </div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.role}`}>
              <div className="msg-dot">
                {msg.role === 'assistant' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-12z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                )}
              </div>
              <div className="bubble">{msg.content}</div>
            </div>
          ))}

          {loading && (
            <div className="typing-row">
              <div className="msg-dot" style={{ background: 'rgba(124,106,247,0.1)', border: '1px solid rgba(124,106,247,0.18)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a8 8 0 0 1 8 8v4a8 8 0 0 1-8 8H8l-4 2v-4a8 8 0 0 1 0-12z"/>
                </svg>
              </div>
              <div className="typing-bubble">
                <span /><span /><span />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <div className="input-box">
            <textarea
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Votre message..."
              disabled={loading}
            />
          </div>
          <button className="send" onClick={sendMessage} disabled={!input.trim() || loading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2" fill="#fff"/>
            </svg>
          </button>
        </div>

        <div className="footer">ProspectBot B2B</div>
      </div>
    </>
  );
}
