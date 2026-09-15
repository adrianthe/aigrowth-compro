import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { isAdminUser, isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import './Login.css';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi.');

      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const allowed = await isAdminUser(data.user?.id);
      if (!allowed) {
        await supabase.auth.signOut();
        throw new Error('Akun ini tidak memiliki akses admin.');
      }

      navigate('/admin');
    } catch (error) {
      setErrorMsg(error.message || 'Login gagal. Periksa email dan kata sandi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page container fade-in">
      <div className="login-box glass-panel">
        <h2 className="section-title text-center" style={{ fontSize: '32px' }}>{t('admin_login_title')}</h2>
        <p className="hero-subtitle text-center">Masuk untuk mengelola konten dan melihat traffic AIGrowth.</p>

        <form onSubmit={handleLogin} className="login-form">
          {errorMsg && <div className="error-message">{errorMsg}</div>}

          <div className="form-group">
            <label htmlFor="admin-email">Email admin</label>
            <input
              id="admin-email"
              type="email"
              className="glass-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Kata sandi</label>
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
