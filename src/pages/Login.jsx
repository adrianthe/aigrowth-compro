import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { isAdminUser, isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import './Login.css';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [noticeMsg, setNoticeMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState(() => {
    const authType = new URLSearchParams(window.location.hash.slice(1)).get('type');
    return authType === 'invite' || authType === 'recovery' ? 'set-password' : 'login';
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session || mode === 'set-password') return;

      if (await isAdminUser(data.session.user.id)) navigate('/admin');
    };

    checkSession();
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setMode('set-password');
    });

    return () => listener.subscription.unsubscribe();
  }, [mode, navigate]);

  const handleLogin = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    setNoticeMsg('');

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

  const handleSetPassword = async (event) => {
    event.preventDefault();
    setErrorMsg('');
    setNoticeMsg('');

    if (password.length < 8) {
      setErrorMsg('Kata sandi minimal 8 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak sama.');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      if (!(await isAdminUser(data.user?.id))) throw new Error('Akun ini tidak memiliki akses admin.');
      navigate('/admin');
    } catch (error) {
      setErrorMsg(error.message || 'Kata sandi gagal disimpan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setErrorMsg('');
    setNoticeMsg('');
    if (!email) {
      setErrorMsg('Masukkan email admin terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) throw error;
      setNoticeMsg('Link untuk membuat ulang kata sandi sudah dikirim ke email.');
    } catch (error) {
      setErrorMsg(error.message || 'Email reset gagal dikirim.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page container fade-in">
      <div className="login-box glass-panel">
        <h2 className="section-title text-center" style={{ fontSize: '32px' }}>
          {mode === 'set-password' ? 'Buat Kata Sandi Admin' : t('admin_login_title')}
        </h2>
        <p className="hero-subtitle text-center">
          {mode === 'set-password'
            ? 'Buat kata sandi untuk mengaktifkan akses dashboard admin.'
            : 'Masuk untuk mengelola konten dan melihat traffic AIGrowth.'}
        </p>

        <form onSubmit={mode === 'set-password' ? handleSetPassword : handleLogin} className="login-form">
          {errorMsg && <div className="error-message">{errorMsg}</div>}
          {noticeMsg && <div className="success-message">{noticeMsg}</div>}

          {mode === 'login' && (
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
          )}

          <div className="form-group">
            <label htmlFor="admin-password">Kata sandi</label>
            <input
              id="admin-password"
              type="password"
              className="glass-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === 'set-password' ? 'new-password' : 'current-password'}
              required
            />
          </div>

          {mode === 'set-password' && (
            <div className="form-group">
              <label htmlFor="admin-password-confirmation">Ulangi kata sandi</label>
              <input
                id="admin-password-confirmation"
                type="password"
                className="glass-input"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          )}

          <button type="submit" className="primary-btn submit-btn" disabled={isLoading}>
            {isLoading
              ? 'Memproses...'
              : mode === 'set-password' ? 'Simpan Kata Sandi' : t('admin_signin')}
          </button>

          {mode === 'login' && (
            <button type="button" className="login-secondary-btn" onClick={handleForgotPassword} disabled={isLoading}>
              Lupa kata sandi?
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
