import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <>
      <Head>
        <title>ProspectBot Builder - Immobilier</title>
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
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            margin: '0 0 20px 0',
            color: '#1a202c'
          }}>
            🏠 ProspectBot
          </h1>
          
          <p style={{ 
            fontSize: '1.2rem', 
            color: '#718096',
            marginBottom: '40px'
          }}>
            Plateforme de prospection immobilière
          </p>
          
          <Link href="/immobilier">
            <a style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '15px 40px',
              borderRadius: '10px',
              textDecoration: 'none',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}>
              Accéder au Dashboard →
            </a>
          </Link>
          
          <div style={{ 
            marginTop: '40px',
            padding: '20px',
            background: '#f7fafc',
            borderRadius: '10px'
          }}>
            <p style={{ 
              margin: '0',
              color: '#4a5568',
              fontSize: '0.9rem'
            }}>
              ✨ Gestion des biens immobiliers<br/>
              🎯 Matching automatique acheteurs-vendeurs<br/>
              📊 Statistiques en temps réel
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
