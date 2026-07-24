import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import './Login.css';

export default function Login() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;
      
      if (data.session) {
        navigate('/admin');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page container fade-in">
      <div className="login-box glass-panel">
        <h2 className="section-title text-center" style={{fontSize: '32px'}}>{t('admin_login_title')}</h2>
        <p className="hero-subtitle text-center">{t('admin_login_subtitle')}</p>

        <form onSubmit={handleLogin} className="login-form">
          {errorMsg && (
            <div className="error-message">
              {errorMsg}
            </div>
          )}
          
          <div className="form-group">
            <label>{t('admin_email')}</label>
            <input 
              type="email" 
              className="glass-input" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>{t('admin_password')}</label>
            <input 
              type="password" 
              className="glass-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          
          <button type="submit" className="primary-btn submit-btn" disabled={isLoading}>
            {isLoading ? 'Signing in...' : t('admin_signin')}
          </button>
        </form>
      </div>
    </div>
  );
}
