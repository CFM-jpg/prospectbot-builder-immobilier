// pages/api/auth/me.js

import { getSession } from '../../../lib/auth';

export default function handler(req, res) {
  const session = getSession(req);

  if (!session) {
    return res.status(401).json({ authenticated: false });
  }

  return res.status(200).json({
    authenticated: true,
    agent: { email: session.email, name: session.name, role: session.role, plan: session.plan },
  });
}
