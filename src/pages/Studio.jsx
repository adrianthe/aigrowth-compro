import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import './Studio.css';

export default function Studio() {
  const { t } = useLanguage();
  const projects = [
    {
      id: 1,
      title: "Astra Analytics Dashboard",
      category: "UI/UX Design",
      image: "/images/studio_portfolio_1_1778477624070.png"
    },
    {
      id: 2,
      title: "Spectre Automotive Concept",
      category: "3D Rendering",
      image: "/images/studio_portfolio_2_1778477639975.png"
    }
  ];

  return (
    <div className="studio-page">
      <section className="container" style={{ padding: '80px 24px' }}>
        <div className="gallery-header fade-in" style={{ marginBottom: '60px' }}>
          <div className="tagline glass-panel">Our Work</div>
          <h2 className="section-title">{t('studio_title')}</h2>
          <p className="hero-subtitle text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
            {t('studio_subtitle')}
          </p>
        </div>

        <div className="studio-grid fade-in">
          {projects.map(project => (
            <div key={project.id} className="studio-card glass-panel">
              <div className="studio-img-wrapper">
                <img src={project.image} alt={project.title} />
              </div>
              <div className="studio-info">
                <span className="studio-category">{project.category}</span>
                <h3 className="studio-title">{project.title}</h3>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
