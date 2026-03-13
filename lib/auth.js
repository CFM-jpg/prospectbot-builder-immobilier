// lib/auth.js
// Gestion de l'authentification par cookie signé + Supabase

import { serialize, parse } from 'cookie';
import { supabaseAdmin } from './supabase';
import bcrypt from 'bcryptjs';

const SESSION_COOKIE = 'prospectbot_session';
const MAX_AGE = 60 * 60 * 8; // 8 heures

// Vérifie les credentials dans Supabase et retourne l'agent ou null
export async function verifyCredentials(email, password) {
  const { data, error } = await supabaseAdmin
    .from('agents')
    .select('id, email, name, role, plan, email_verified, password')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !data) return null;

  // Comparaison sécurisée — supporte à la fois les passwords hashés (bcrypt) et en clair (migration)
  let passwordOk = false;
  if (data.password?.startsWith('$2')) {
    // Hash bcrypt
    passwordOk = await bcrypt.compare(password, data.password);
  } else {
    // Ancien mot de passe en clair (migration) — on accepte puis on hash
    passwordOk = data.password === password;
    if (passwordOk) {
      // Migration automatique vers bcrypt
      const hashed = await bcrypt.hash(password, 12);
      await supabaseAdmin.from('agents').update({ password: hashed }).eq('email', data.email);
    }
  }

  if (!passwordOk) return null;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role: data.role,
    plan: data.plan,
    email_verified: data.email_verified,
  };
}

// Crée un token de session signé
export function createSessionToken(agent) {
  const secret = process.env.SESSION_SECRET || 'prospectbot-secret-key-change-in-prod';
  const payload = {
    id: agent.id,
    email: agent.email,
    name: agent.name,
    role: agent.role,
    plan: agent.plan,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
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
