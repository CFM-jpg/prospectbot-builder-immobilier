// pages/index.js
import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ProspectBot Builder</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div style={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '60px 40px',
          maxWidth: '800px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ 
              fontSize: '3rem', 
              margin: '0 0 20px 0',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: '800'
            }}>
              ⚡ ProspectBot Builder
            </h1>
            
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#718096',
              marginBottom: '0'
            }}>
              Plateforme de prospection tout-en-un
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '30px',
            marginTop: '50px'
          }}>
            {/* CARTE B2B */}
            <Link href="/b2b">
              <a style={{
                display: 'block',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '40px 30px',
                borderRadius: '15px',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(102, 126, 234, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(102, 126, 234, 0.3)';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🤖</div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  margin: '0 0 15px 0',
                  fontWeight: '700'
                }}>
                  B2B
                </h2>
                <p style={{ 
                  fontSize: '1rem', 
                  margin: '0',
                  opacity: '0.9'
                }}>
                  Chatbots • Emails • Scraping<br/>
                  Workflows • Automation
                </p>
              </a>
            </Link>

            {/* CARTE IMMOBILIER */}
            <Link href="/immobilier">
              <a style={{
                display: 'block',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                padding: '40px 30px',
                borderRadius: '15px',
                textDecoration: 'none',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(245, 87, 108, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 15px 40px rgba(245, 87, 108, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 87, 108, 0.3)';
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🏠</div>
                <h2 style={{ 
                  fontSize: '1.8rem', 
                  margin: '0 0 15px 0',
                  fontWeight: '700'
                }}>
                  Immobilier
                </h2>
                <p style={{ 
                  fontSize: '1rem', 
                  margin: '0',
                  opacity: '0.9'
                }}>
                  Biens • Matching<br/>
                  Acheteurs • Vendeurs
                </p>
              </a>
            </Link>
          </div>

          <div style={{
            marginTop: '50px',
            padding: '25px',
            background: '#f7fafc',
            borderRadius: '10px'
          }}>
            <p style={{
              margin: '0',
              color: '#4a5568',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}>
              <strong>Version 1.0</strong> • Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}