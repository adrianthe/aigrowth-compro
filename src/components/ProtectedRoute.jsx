import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children }) {
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    let active = true;

    fetch('/api/auth', { credentials: 'same-origin', cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (active) setAuthenticated(Boolean(payload.authenticated));
      })
      .catch(() => {
        if (active) setAuthenticated(false);
      });

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
