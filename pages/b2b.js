// pages/b2b.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function B2BDashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({
    totalProspects: 1234,
    qualifiedLeads: 456,
    emailsSent: 789,
    conversions: 189
  });

  const [chatbots, setChatbots] = useState([
    { id: 1, name: 'Qualification Lead B2B', conversations: 47, qualified: 23, active: true },
    { id: 2, name: 'Support Client', conversations: 12, qualified: 8, active: false }
  ]);

  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Campagne SaaS Tech', sent: 234, openRate: 67 },
    { id: 2, name: 'Relance Prospects', sent: 89, openRate: 38 }
  ]);

  return (
    <>
      <Head>
        <title>ProspectBot Builder - B2B</title>
      </Head>

      <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        {/* SIDEBAR */}
        <div style={{
          width: '260px',
          background: 'linear-gradient(180deg, #2d3748 0%, #1a202c 100%)',
          color: 'white',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* LOGO */}
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              marginBottom: '10px'
            }}>
              ⚡
            </div>
            <h1 style={{ margin: '0', fontSize: '1.3rem', fontWeight: '700' }}>ProspectBot</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: '0.85rem', opacity: '0.7' }}>Builder v1.0</p>
          </div>

          {/* NAVIGATION */}
          <nav style={{ flex: 1 }}>
            {[
              { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
              { id: 'chatbot', icon: '🤖', label: 'Chatbot Builder' },
              { id: 'email-auto', icon: '📧', label: 'Email Auto' },
              { id: 'email-sender', icon: '✉️', label: 'Email Sender' },
              { id: 'scraper', icon: '🔍', label: 'Web Scraper' },
              { id: 'workflows', icon: '⚡', label: 'Workflows' }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  background: activeSection === item.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeSection !== item.id) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* PROFIL */}
          <div style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem'
            }}>
              MP
            </div>
            <div>
              <p style={{ margin: '0', fontSize: '0.9rem', fontWeight: '600' }}>Mon Profil</p>
              <p style={{ margin: '0', fontSize: '0.75rem', opacity: '0.7' }}>Version Personnelle</p>
            </div>
          </div>

          {/* LIEN RETOUR */}
          <Link href="/">
            <a style={{
              marginTop: '20px',
              padding: '10px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '8px',
              color: 'white',
              textDecoration: 'none',
              textAlign: 'center',
              fontSize: '0.85rem',
              display: 'block',
              transition: 'background 0.2s'
            }}>
              ← Accueil
            </a>
          </Link>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, background: '#f7fafc', padding: '40px' }}>
          {activeSection === 'dashboard' && <DashboardContent stats={stats} chatbots={chatbots} campaigns={campaigns} />}
          {activeSection === 'chatbot' && <ChatbotBuilder chatbots={chatbots} setChatbots={setChatbots} />}
          {activeSection === 'email-auto' && <EmailAuto campaigns={campaigns} />}
          {activeSection === 'email-sender' && <EmailSender />}
          {activeSection === 'scraper' && <WebScraper />}
          {activeSection === 'workflows' && <Workflows />}
        </div>
      </div>
    </>
  );
}

// ========== COMPOSANTS DE CONTENU ==========

function DashboardContent({ stats, chatbots, campaigns }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ 
            margin: '0 0 10px 0', 
            fontSize: '2.2rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Tableau de Bord
          </h1>
          <p style={{ margin: 0, color: '#718096', fontSize: '1rem' }}>
            Vue d'ensemble de vos campagnes de prospection
          </p>
        </div>
        <button style={{
          padding: '12px 24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '1rem',
          fontWeight: '600',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
        }}>
          + Nouveau Workflow
        </button>
      </div>

      {/* STATS CARDS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '20px', 
        marginBottom: '40px' 
      }}>
        <StatCard 
          icon="👥" 
          value={stats.totalProspects.toLocaleString()} 
          label="Prospects Totaux" 
          trend="+12% ce mois"
          color="linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
        />
        <StatCard 
          icon="🎯" 
          value={stats.qualifiedLeads} 
          label="Leads Qualifiés" 
          trend="+8% ce mois"
          color="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <StatCard 
          icon="📧" 
          value={stats.emailsSent} 
          label="Emails Envoyés" 
          trend="3 actives"
          color="linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
        />
        <StatCard 
          icon="⚡" 
          value={stats.conversions} 
          label="Conversions" 
          trend="24% taux"
          color="linear-gradient(135deg, #ec4899 0%, #db2777 100%)"
        />
      </div>

      {/* CHATBOTS ET CAMPAGNES */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* CHATBOTS ACTIFS */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1a202c' }}>Chatbots Actifs</h2>
            <span style={{ fontSize: '1.5rem' }}>🤖</span>
          </div>
          {chatbots.map(bot => (
            <div key={bot.id} style={{
              padding: '15px',
              background: '#f7fafc',
              borderRadius: '10px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: bot.active ? '#10b981' : '#94a3b8'
                }}></div>
                <div>
                  <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1a202c' }}>{bot.name}</p>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                    {bot.conversations} conversations · {bot.qualified} qualifiés
                  </p>
                </div>
              </div>
              <button style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#64748b'
              }}>›</button>
            </div>
          ))}
        </div>

        {/* CAMPAGNES EMAIL */}
        <div style={{
          background: 'white',
          borderRadius: '15px',
          padding: '25px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, fontSize: '1.3rem', color: '#1a202c' }}>Campagnes Email</h2>
            <span style={{ fontSize: '1.5rem' }}>📧</span>
          </div>
          {campaigns.map(campaign => (
            <div key={campaign.id} style={{
              padding: '15px',
              background: '#f7fafc',
              borderRadius: '10px',
              marginBottom: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1a202c' }}>{campaign.name}</p>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  {campaign.sent} envoyés · {campaign.openRate}% ouverture
                </p>
              </div>
              <button style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#64748b'
              }}>›</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, trend, color }) {
  return (
    <div style={{
      background: color,
      borderRadius: '15px',
      padding: '25px',
      color: 'white',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '5px' }}>{value}</div>
      <div style={{ fontSize: '0.95rem', opacity: '0.9', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>{trend}</div>
    </div>
  );
}

function ChatbotBuilder({ chatbots, setChatbots }) {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>🤖 Chatbot Builder</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Créez et gérez vos chatbots de qualification</p>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</p>
        <h2 style={{ marginBottom: '10px' }}>Section en construction</h2>
        <p style={{ color: '#64748b' }}>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  );
}

function EmailAuto({ campaigns }) {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>📧 Email Automation</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Automatisez vos campagnes d'emailing</p>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</p>
        <h2 style={{ marginBottom: '10px' }}>Section en construction</h2>
        <p style={{ color: '#64748b' }}>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  );
}

function EmailSender() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>✉️ Email Sender</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Envoyez des emails personnalisés en masse</p>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</p>
        <h2 style={{ marginBottom: '10px' }}>Section en construction</h2>
        <p style={{ color: '#64748b' }}>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  );
}

function WebScraper() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>🔍 Web Scraper</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Scrapez des prospects depuis LinkedIn, etc.</p>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</p>
        <h2 style={{ marginBottom: '10px' }}>Section en construction</h2>
        <p style={{ color: '#64748b' }}>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  );
}

function Workflows() {
  return (
    <div>
      <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>⚡ Workflows</h1>
      <p style={{ color: '#64748b', marginBottom: '30px' }}>Automatisez vos processus de prospection</p>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        textAlign: 'center'
      }}>
        <p style={{ fontSize: '3rem', marginBottom: '20px' }}>🚧</p>
        <h2 style={{ marginBottom: '10px' }}>Section en construction</h2>
        <p style={{ color: '#64748b' }}>Cette fonctionnalité sera bientôt disponible</p>
      </div>
    </div>
  );
}
