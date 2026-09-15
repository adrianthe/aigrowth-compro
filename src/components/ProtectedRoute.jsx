import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminUser, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

export default function ProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    let active = true;

    async function verifySession() {
      if (!isSupabaseConfigured) {
        if (active) setAuthenticated(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const allowed = await isAdminUser(data.session?.user?.id);
      if (active) setAuthenticated(allowed);
    }

    verifySession();
    return () => {
      active = false;
    };
  }, []);

  if (authenticated === null) {
    return <div className="container" style={{ padding: '100px 24px', textAlign: 'center' }}>Memeriksa akses admin...</div>;
  }

  if (!authenticated) return <Navigate to="/login" replace />;
  return children;
}
