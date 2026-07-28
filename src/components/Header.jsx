import { NavLink, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import './Header.css';

export default function Header() {
  const navigate = useNavigate();
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <header className="app-header glass-panel fade-in">
      <div className="container header-inner">
        <NavLink to="/" className="logo-area">
          <img src="/logo.jpg" alt="AIGrowth Logo" style={{ height: '40px', width: 'auto', borderRadius: '8px' }} />
        </NavLink>

        <nav className="nav-links">
          <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>{t('nav_home')}</NavLink>
          <NavLink to="/courses" className={({ isActive }) => isActive ? "active" : ""}>{t('nav_courses')}</NavLink>
          <NavLink to="/tools" className={({ isActive }) => isActive ? "active" : ""}>{t('nav_tools')}</NavLink>
        </nav>

        <div className="header-actions">
          <button 
            className="lang-toggle-btn glass-panel" 
            onClick={toggleLanguage}
            style={{marginRight: '12px', padding: '8px 12px', fontWeight: 'bold'}}
          >
            {language.toUpperCase()}
          </button>
          <button className="primary-btn" onClick={() => navigate('/courses')}>
            {t('get_started')}
          </button>
        </div>
      </div>
    </header>
  );
}
