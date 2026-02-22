// lib/auth.js
// Gestion de l'authentification par cookie signé

import { serialize, parse } from 'cookie';

const SESSION_COOKIE = 'prospectbot_session';
const MAX_AGE = 60 * 60 * 8; // 8 heures

// Agents autorisés — à terme dans Supabase, pour l'instant en env vars
// Format : EMAIL:MOT_DE_PASSE séparés par des virgules dans AGENTS_LIST
// Ex: agent1@cabinet.fr:motdepasse1,agent2@cabinet.fr:motdepasse2
function getAuthorizedAgents() {
  const list = process.env.AGENTS_LIST || '';
  const defaultAdmin = {
    email: process.env.ADMIN_EMAIL || 'admin@prospectbot.fr',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    name: 'Administrateur',
    role: 'admin',
  };

  const agents = [defaultAdmin];

  if (list) {
    list.split(',').forEach(entry => {
      const parts = entry.trim().split(':');
      if (parts.length >= 2) {
        agents.push({
          email: parts[0].toLowerCase(),
          password: parts[1],
          name: parts[2] || parts[0].split('@')[0],
          role: 'agent',
        });
      }
    });
  }

  return agents;
}

// Vérifie les credentials et retourne l'agent ou null
export function verifyCredentials(email, password) {
  const agents = getAuthorizedAgents();
  const agent = agents.find(
    a => a.email === email.toLowerCase() && a.password === password
  );
  if (!agent) return null;
  return { email: agent.email, name: agent.name, role: agent.role };
}

// Crée un token de session simple (base64 signé avec secret)
export function createSessionToken(agent) {
  const secret = process.env.SESSION_SECRET || 'prospectbot-secret-key-change-in-prod';
  const payload = {
    email: agent.email,
    name: agent.name,
    role: agent.role,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  // Signature simple HMAC-like avec le secret
  const crypto = require('crypto');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

// Vérifie et décode un token de session
export function verifySessionToken(token) {
  if (!token) return null;
  try {
    const secret = process.env.SESSION_SECRET || 'prospectbot-secret-key-change-in-prod';
    const crypto = require('crypto');
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;
    const expectedSig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(data, 'base64').toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Cookie de session
export function setSessionCookie(res, token) {
  const cookie = serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  res.setHeader('Set-Cookie', cookie);
}

// Récupère la session depuis la requête
export function getSession(req) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  return verifySessionToken(token);
}

export { SESSION_COOKIE };
