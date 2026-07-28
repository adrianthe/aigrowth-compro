import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

export default function Login() {
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Login gagal.');
      navigate('/admin');
    } catch (error) {
      setErrorMsg(error.message || 'Login gagal. Periksa kata sandi admin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page container fade-in">
      <div className="login-box glass-panel">
        <h2 className="section-title text-center" style={{ fontSize: '32px' }}>{t('admin_login_title')}</h2>
        <p className="hero-subtitle text-center">Masuk untuk mengelola konten website AIGrowth.</p>

        <form onSubmit={handleLogin} className="login-form">
          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <div className="form-group">
            <label htmlFor="admin-password">Kata sandi admin</label>
            <input
              id="admin-password"
              type="password"
              className="glass-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="primary-btn submit-btn" disabled={isLoading}>
            {isLoading ? 'Memeriksa...' : t('admin_signin')}
          </button>
        </form>
      </div>
    </div>
  );
}
