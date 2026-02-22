// lib/useAuth.js
// Hook React pour gérer l'authentification côté client

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export function useAuth() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated) {
          setAgent(data.agent);
        } else {
          setAgent(null);
        }
      })
      .catch(() => setAgent(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch('/api/auth/logout');
    router.push('/login');
  };

  return { agent, loading, logout };
}
