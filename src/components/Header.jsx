import React from 'react';
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
          <NavLink to="/library" className={({ isActive }) => isActive ? "active" : ""}>{t('nav_library')}</NavLink>
          <NavLink to="/studio" className={({ isActive }) => isActive ? "active" : ""}>{t('nav_studio')}</NavLink>
          <NavLink to="/admin" className={({ isActive }) => isActive ? "active" : ""} style={{color: 'var(--accent-color)'}}>{t('nav_admin')}</NavLink>
        </nav>

        <div className="header-actions">
          <button 
            className="lang-toggle-btn glass-panel" 
            onClick={toggleLanguage}
            style={{marginRight: '12px', padding: '8px 12px', fontWeight: 'bold'}}
          >
            {language.toUpperCase()}
          </button>
          <button className="primary-btn" onClick={() => navigate('/library')}>
            {t('get_started')}
          </button>
        </div>
      </div>
    </header>
  );
}
