// pages/api/auth/login.js

import { verifyCredentials, createSessionToken, setSessionCookie } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const agent = verifyCredentials(email, password);

  if (!agent) {
    // Délai artificiel pour éviter le brute-force timing
    return setTimeout(() => {
      res.status(401).json({ error: 'Identifiants incorrects' });
    }, 400);
  }

  const token = createSessionToken(agent);
  setSessionCookie(res, token);

  return res.status(200).json({
    success: true,
    agent: { email: agent.email, name: agent.name, role: agent.role },
  });
}
