// pages/immobilier.js
// Dashboard principal ProspectBot
// Onglets : Vue d'ensemble · B2B · Assistant IA
// Les pages dédiées gèrent : Biens, Acheteurs, Matches, Vendeurs, Liquidité, Portefeuille, Rapport PDF

import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/useAuth';

const NAV_LINKS = [
  ['Dashboard', '/immobilier'],
  ['Biens', '/biens'],
  ['Acheteurs', '/acheteurs'],
  ['Matches', '/matches'],
  ['Vendeurs', '/vendeurs-potentiels'],
  ['Liquidité', '/liquidite'],
  ['Portefeuille', '/analyse-portefeuille'],
  ['Rapport PDF', '/rapport-pdf'],
];

const SHORTCUTS = [
  { href: '/biens',                icon: '🏠', label: 'Biens & mandats',       desc: 'Gérez vos annonces',          color: '#d4a853' },
  { href: '/acheteurs',            icon: '👤', label: 'Acheteurs',              desc: 'Portefeuille clients',         color: '#3b82f6' },
  { href: '/matches',              icon: '⚡', label: 'Matches',                desc: 'Correspondances auto',         color: '#8b5cf6' },
  { href: '/vendeurs-potentiels',  icon: '📍', label: 'Vendeurs potentiels',    desc: 'Prospection DVF',              color: '#16a34a' },
  { href: '/liquidite',            icon: '📊', label: 'Score liquidité',        desc: 'Dynamique de marché',          color: '#f97316' },
  { href: '/analyse-portefeuille', icon: '🧠', label: 'Analyse portefeuille',   desc: 'IA + tendances DVF',           color: '#ec4899' },
  { href: '/rapport-pdf',          icon: '📄', label: 'Rapport PDF',            desc: 'Document brandé prospect',    color: '#14b8a6' },
  { href: '/upgrade',              icon: '✦',  label: 'Changer de plan',        desc: 'Pro · Agence',                color: '#d4a853' },
];

// ─── Composant Assistant IA ───────────────────────────────────────────────────
function AssistantIA({ agentEmail }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant ProspectBot. Je connais vos biens, acheteurs et matches en temps réel. Comment puis-je vous aider ?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const res = await fetch('/api/ia/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: msg, history: newMessages.slice(1, -1) }),
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'assistant', content: data.reply || 'Désolé, je ne peux pas répondre.' }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Erreur de connexion.' }]);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 520, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14 }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              background: m.role === 'user' ? 'linear-gradient(135deg, #8b6914, #d4a853)' : 'rgba(255,255,255,0.05)',
              border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.07)',
              fontSize: 13.5, color: m.role === 'user' ? '#0a0a0a' : 'rgba(255,255,255,0.8)',
              lineHeight: 1.6, fontWeight: m.role === 'user' ? 500 : 300,
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '10px 16px', borderRadius: '14px 14px 14px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4a853', opacity: 0.6, animation: `bounce 1s ${i * 0.15}s infinite` }} />)}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions rapides */}
      {messages.length === 1 && (
        <div style={{ padding: '0 16px 12px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['Résume mon portefeuille', 'Quels sont mes meilleurs matches ?', 'Conseille-moi sur la prospection'].map(s => (
            <button key={s} onClick={() => { setInput(s); }}
              style={{ fontSize: 11.5, padding: '5px 12px', borderRadius: 20, border: '1px solid rgba(212,168,83,0.25)', background: 'rgba(212,168,83,0.06)', color: 'rgba(212,168,83,0.8)', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Posez une question sur vos biens, acheteurs, marché…"
          style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 8, padding: '10px 14px', fontSize: 13.5, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ padding: '10px 18px', background: input.trim() ? 'linear-gradient(135deg, #8b6914, #d4a853)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: input.trim() ? '#0a0a0a' : 'rgba(255,255,255,0.2)', cursor: input.trim() ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', whiteSpace: 'nowrap' }}>
          Envoyer
        </button>
      </div>
    </div>
  );
}

// ─── Composant B2B ────────────────────────────────────────────────────────────
function B2BPanel() {
  const [subTab, setSubTab] = useState('chatbot');
  const [chatbots, setChatbots] = useState([]);
  const [convs, setConvs] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loadingChatbot, setLoadingChatbot] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', welcomeMessage: '', color: '#d4a853' });
  const [saving, setSaving] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({ name: '', trigger: 'new_prospect' });
  const [wfCreating, setWfCreating] = useState(false);
  const [showWfForm, setShowWfForm] = useState(false);

  useEffect(() => {
    if (subTab === 'chatbot') fetchChatbots();
    if (subTab === 'conversations') fetchConvs();
    if (subTab === 'workflows') fetchWorkflows();
  }, [subTab]);

  const fetchChatbots = async () => {
    setLoadingChatbot(true);
    const res = await fetch('/api/B2B/chatbot');
    const data = await res.json();
    setChatbots(data.chatbots || []);
    setLoadingChatbot(false);
  };

  const fetchConvs = async () => {
    const res = await fetch('/api/B2B/chatbot-conversations');
    const data = await res.json();
    setConvs(data.conversations || []);
  };

  const fetchWorkflows = async () => {
    const res = await fetch('/api/B2B/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'list' }) });
    const data = await res.json();
    setWorkflows(data.workflows || []);
  };

  const createChatbot = async () => {
    if (!form.name || !form.welcomeMessage) return;
    setSaving(true);
    await fetch('/api/B2B/chatbot', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, questions: ['Quel est votre projet ?'] }) });
    setSaving(false); setShowForm(false);
    fetchChatbots();
  };

  const deleteChatbot = async (id) => {
    if (!confirm('Supprimer ce chatbot ?')) return;
    await fetch('/api/B2B/chatbot', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    fetchChatbots();
  };

  const createWorkflow = async () => {
    if (!workflowForm.name) return;
    setWfCreating(true);
    await fetch('/api/B2B/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...workflowForm }) });
    setWfCreating(false); setShowWfForm(false);
    fetchWorkflows();
  };

  const toggleWorkflow = async (id, active) => {
    await fetch('/api/B2B/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', workflow_id: id, active: !active }) });
    fetchWorkflows();
  };

  const deleteWorkflow = async (id) => {
    await fetch('/api/B2B/workflows', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', workflow_id: id }) });
    fetchWorkflows();
  };

  const SUB_TABS = [['chatbot', 'Chatbots'], ['conversations', 'Conversations'], ['workflows', 'Workflows']];

  return (
    <div>
      {/* Sous-onglets */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
        {SUB_TABS.map(([id, label]) => (
          <button key={id} onClick={() => setSubTab(id)}
            style={{ padding: '7px 16px', borderRadius: 7, border: 'none', background: subTab === id ? 'rgba(212,168,83,0.12)' : 'transparent', color: subTab === id ? '#d4a853' : 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Chatbots */}
      {subTab === 'chatbot' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e8e8e8' }}>Mes chatbots</h3>
            <button onClick={() => setShowForm(s => !s)}
              style={{ padding: '8px 16px', background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 7, fontSize: 12.5, color: '#d4a853', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
              {showForm ? '✕ Annuler' : '+ Nouveau chatbot'}
            </button>
          </div>

          {showForm && (
            <div style={{ background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 12, padding: '18px 20px', marginBottom: 16 }}>
              {[['name', 'Nom du chatbot'], ['welcomeMessage', 'Message d\'accueil']].map(([key, label]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>{label}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '9px 12px', fontSize: 13, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }} />
                </div>
              ))}
              <button onClick={createChatbot} disabled={saving}
                style={{ padding: '9px 18px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {saving ? 'Création…' : 'Créer →'}
              </button>
            </div>
          )}

          {loadingChatbot ? (
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Chargement…</p>
          ) : chatbots.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>Aucun chatbot. Créez-en un pour qualifier vos prospects automatiquement.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chatbots.map(bot => (
                <div key={bot.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${bot.color || '#d4a853'}18`, border: `1.5px solid ${bot.color || '#d4a853'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{bot.avatar || '🤖'}</div>
                    <div>
                      <div style={{ fontSize: 14, color: '#e8e8e8' }}>{bot.name}</div>
                      <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{bot.welcome_message?.slice(0, 60)}…</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(22,163,74,0.1)', border: '1px solid rgba(22,163,74,0.25)', color: '#16a34a' }}>Actif</span>
                    <button onClick={() => deleteChatbot(bot.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14' }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Conversations */}
      {subTab === 'conversations' && (
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e8e8e8', marginBottom: 16 }}>Conversations récentes</h3>
          {convs.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aucune conversation pour l'instant.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {convs.map(conv => (
                <div key={conv.id} style={{ padding: '13px 18px', background: conv.qualified ? 'rgba(22,163,74,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${conv.qualified ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, color: '#e8e8e8' }}>{conv.visitor_email || 'Anonyme'}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: conv.qualified ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${conv.qualified ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.07)'}`, color: conv.qualified ? '#16a34a' : 'rgba(255,255,255,0.3)' }}>
                      {conv.qualified ? '✓ Qualifié' : 'Non qualifié'}
                    </span>
                  </div>
                  {conv.qualification_reason && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{conv.qualification_reason}</div>}
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{new Date(conv.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workflows */}
      {subTab === 'workflows' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: '#e8e8e8' }}>Mes workflows</h3>
              <button onClick={() => setShowWfForm(s => !s)}
                style={{ padding: '8px 16px', background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', borderRadius: 7, fontSize: 12.5, color: '#d4a853', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                {showWfForm ? '✕ Annuler' : '+ Nouveau'}
              </button>
            </div>
            {showWfForm && (
              <div style={{ background: 'rgba(212,168,83,0.04)', border: '1px solid rgba(212,168,83,0.15)', borderRadius: 10, padding: '16px', marginBottom: 12 }}>
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Nom</label>
                  <input value={workflowForm.name} onChange={e => setWorkflowForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Accueil nouveau prospect"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 5 }}>Déclencheur</label>
                  <select value={workflowForm.trigger} onChange={e => setWorkflowForm(f => ({ ...f, trigger: e.target.value }))}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, padding: '8px 12px', fontSize: 13, color: '#e8e8e8', fontFamily: 'DM Sans, sans-serif' }}>
                    <option value="new_prospect">Nouveau prospect (chatbot)</option>
                    <option value="new_match">Nouveau match immobilier</option>
                  </select>
                </div>
                <button onClick={createWorkflow} disabled={wfCreating}
                  style={{ padding: '8px 16px', background: 'linear-gradient(135deg,#8b6914,#d4a853)', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, color: '#0a0a0a', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                  {wfCreating ? 'Création…' : 'Créer →'}
                </button>
              </div>
            )}
            {workflows.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10 }}>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aucun workflow actif.</p>
              </div>
            ) : workflows.map(wf => (
              <div key={wf.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: wf.active ? 'rgba(22,163,74,0.03)' : 'rgba(255,255,255,0.02)', border: `1px solid ${wf.active ? 'rgba(22,163,74,0.15)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 10, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13.5, color: '#e8e8e8' }}>{wf.name}</div>
                  <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{wf.trigger === 'new_prospect' ? 'Nouveau prospect' : 'Nouveau match'}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button onClick={() => toggleWorkflow(wf.id, wf.active)}
                    style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: wf.active ? 'rgba(22,163,74,0.1)' : 'rgba(255,255,255,0.05)', color: wf.active ? '#16a34a' : 'rgba(255,255,255,0.3)', border: `1px solid ${wf.active ? 'rgba(22,163,74,0.2)' : 'rgba(255,255,255,0.07)'}`, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>
                    {wf.active ? '● Actif' : '○ Inactif'}
                  </button>
                  <button onClick={() => deleteWorkflow(wf.id)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: 14 }}>✕</button>
                </div>
              </div>
            ))}
          </div>

          {/* Explication */}
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px' }}>
            <h4 style={{ fontSize: 14, fontWeight: 500, color: '#e8e8e8', marginBottom: 16 }}>Comment ça marche ?</h4>
            {[['1', 'Un prospect contacte votre chatbot', 'Il laisse son email en discutant avec votre bot.'],
              ['2', 'Le workflow se déclenche', 'NestLead détecte le contact et exécute les actions.'],
              ['3', 'Email automatique envoyé', 'Le prospect reçoit un email, votre équipe est notifiée.'],
              ['4', 'Vous intervenez au bon moment', 'Vous rappelez un prospect déjà informé et engagé.'],
            ].map(([n, t, d]) => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(212,168,83,0.1)', border: '1px solid rgba(212,168,83,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#d4a853', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8e8', marginBottom: 2 }}>{t}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.5 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
function ImmobilierDashboard() {
  const router = useRouter();
  const { agent, plan } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [alertes, setAlertes] = useState([]);

  useEffect(() => {
    fetch('/api/immobilier/stats')
      .then(r => r.json())
      .then(d => d.success && setStats(d.data))
      .catch(() => {});

    // Charger les alertes portefeuille si disponibles
    fetch('/api/immobilier/analyse-portefeuille')
      .then(r => r.json())
      .then(d => d.alertes?.length && setAlertes(d.alertes))
      .catch(() => {});
  }, []);

  const TABS = [
    { id: 'overview', label: 'Vue d\'ensemble' },
    { id: 'b2b', label: 'B2B & Automation' },
    { id: 'ia', label: 'Assistant IA' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard — ProspectBot</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'DM Sans',sans-serif;background:#080809;color:#e8e8e8;min-height:100vh}
        body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");opacity:0.4}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        input,textarea,select{font-family:'DM Sans',sans-serif}
        input:focus,textarea:focus,select:focus{outline:none}
        input::placeholder,textarea::placeholder{color:rgba(255,255,255,0.2)}
        .shortcut:hover{background:rgba(255,255,255,0.05)!important;transform:translateY(-2px)}
        .shortcut{transition:all 0.2s!important}
        a{text-decoration:none}
      `}</style>

      {/* Nav */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(8,8,9,0.9)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, color: '#d4a853', fontStyle: 'italic', letterSpacing: 1 }}>ProspectBot</span>
          <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {NAV_LINKS.map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, color: href === '/immobilier' ? '#d4a853' : 'rgba(255,255,255,0.35)', background: href === '/immobilier' ? 'rgba(212,168,83,0.08)' : 'transparent' }}>{label}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {plan && <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(212,168,83,0.08)', border: '1px solid rgba(212,168,83,0.2)', color: '#d4a853' }}>{plan}</span>}
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>{agent?.name}</span>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '88px 28px 60px', position: 'relative', zIndex: 1, animation: 'fadeUp 0.45s both' }}>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 300, color: '#f0f0f0', letterSpacing: '-0.5px', marginBottom: 6 }}>
            Bonjour, <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{agent?.name || 'Agent'}</em>
          </h1>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Alertes portefeuille */}
        {alertes.length > 0 && (
          <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>⚠</span>
              <span style={{ fontSize: 13, color: '#ef4444' }}>{alertes.length} mandat{alertes.length > 1 ? 's' : ''} dans un marché en baisse — action recommandée</span>
            </div>
            <a href="/analyse-portefeuille" style={{ fontSize: 12.5, padding: '6px 14px', borderRadius: 7, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444' }}>Voir →</a>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: 4, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '8px 20px', borderRadius: 7, border: 'none', background: tab === t.id ? 'rgba(212,168,83,0.12)' : 'transparent', color: tab === t.id ? '#d4a853' : 'rgba(255,255,255,0.35)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Vue d'ensemble ── */}
        {tab === 'overview' && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>

            {/* KPIs */}
            {stats && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 28 }}>
                {[
                  ['Biens actifs', stats.totalBiens, '#d4a853', '/biens'],
                  ['Acheteurs', stats.totalAcheteurs, '#3b82f6', '/acheteurs'],
                  ['Matches', stats.totalMatches, '#8b5cf6', '/matches'],
                  ['Nouveaux cette semaine', stats.nouveauxMatches, '#16a34a', '/matches'],
                ].map(([label, val, color, href]) => (
                  <a key={label} href={href} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px', textAlign: 'center', textDecoration: 'none', transition: 'border-color 0.2s', display: 'block' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = `${color}40`}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, color, fontWeight: 500 }}>{val ?? '—'}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>{label}</div>
                  </a>
                ))}
              </div>
            )}

            {/* Stats prix */}
            {stats && (stats.prixMoyen > 0 || stats.budgetMoyen > 0) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
                {[
                  ['Prix moyen des biens', stats.prixMoyen ? `${Math.round(stats.prixMoyen / 1000)}k€` : '—', '#d4a853'],
                  ['Budget moyen acheteurs', stats.budgetMoyen ? `${Math.round(stats.budgetMoyen / 1000)}k€` : '—', '#3b82f6'],
                  ['Taux de matching', `${stats.tauxMatching ?? 0}%`, '#16a34a'],
                ].map(([label, val, color]) => (
                  <div key={label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '14px 18px' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, color, fontWeight: 500, marginBottom: 4 }}>{val}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Raccourcis */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 14 }}>Accès rapide</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                {SHORTCUTS.map(s => (
                  <a key={s.href} href={s.href} className="shortcut"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer' }}>
                    <div style={{ fontSize: 22 }}>{s.icon}</div>
                    <div style={{ fontSize: 13.5, color: '#e8e8e8', fontWeight: 500 }}>{s.label}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)' }}>{s.desc}</div>
                    <div style={{ height: 2, borderRadius: 1, background: s.color, opacity: 0.4, marginTop: 4 }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── B2B ── */}
        {tab === 'b2b' && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>
            <B2BPanel />
          </div>
        )}

        {/* ── Assistant IA ── */}
        {tab === 'ia' && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 300, color: '#f0f0f0', marginBottom: 6 }}>
                Assistant <em style={{ fontStyle: 'italic', background: 'linear-gradient(135deg,#8b6914,#d4a853)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>IA</em>
              </h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 300 }}>Connecté à vos données en temps réel — biens, acheteurs, matches et marché.</p>
            </div>
            <AssistantIA agentEmail={agent?.email} />
          </div>
        )}

      </div>
    </>
  );
}

export default dynamic(() => Promise.resolve(ImmobilierDashboard), { ssr: false });
