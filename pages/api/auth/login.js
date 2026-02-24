// pages/api/auth/login.js

import { verifyCredentials, createSessionToken, setSessionCookie } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }

  const agent = await verifyCredentials(email, password);

  if (!agent) {
    await new Promise(resolve => setTimeout(resolve, 400));
    return res.status(401).json({ error: 'Identifiants incorrects' });
  }

  // Bloque si email non vérifié (sauf admin)
  if (agent.role !== 'admin' && agent.email_verified === false) {
    return res.status(403).json({ error: 'not_verified' });
  }

  const token = createSessionToken(agent);
  setSessionCookie(res, token);

  return res.status(200).json({
    success: true,
    agent: { email: agent.email, name: agent.name, role: agent.role, plan: agent.plan },
  });
}
