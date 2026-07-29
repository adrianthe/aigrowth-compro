import { useEffect, useMemo, useState } from 'react';
import { getDefaultContent } from '../data/contentDefaults';
import { fetchContentItems } from '../lib/contentApi';
import './Tools.css';

export default function Tools() {
  const [tools, setTools] = useState(() => getDefaultContent('tool'));
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    let active = true;
    fetchContentItems('tool').then((items) => {
      if (active) setTools(items);
    });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(
    () => ['All', ...new Set(tools.map((tool) => tool.category).filter(Boolean))],
    [tools],
  );
  const filteredTools = activeCategory === 'All'
    ? tools
    : tools.filter((tool) => tool.category === activeCategory);

  return (
    <div className="tools-container fade-in">
      <div className="background-glow" style={{ top: '10%', left: '10%' }}></div>
      <div className="background-glow" style={{ top: '30%', right: '10%', background: 'radial-gradient(circle, rgba(162, 59, 255, 0.15) 0%, transparent 70%)' }}></div>

      <section className="tools-hero container">
        <div className="glass-panel unified-section tools-intro">
          <h1 className="hero-title"><span className="highlight-cyan">Tools</span> yang Kami Gunakan</h1>
          <p className="hero-subtitle">Rekomendasi platform AI yang dipakai oleh tim AIGrowth untuk meningkatkan produktivitas dan pelayanan.</p>
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button key={category} className={`filter-btn ${activeCategory === category ? 'active' : ''}`} onClick={() => setActiveCategory(category)}>
              {category}
            </button>
          ))}
        </div>
      </section>

      <section className="tools-grid-section container">
        <div className="tools-grid">
          {filteredTools.length === 0 && <div className="glass-panel empty-state">Belum ada tool di kategori ini.</div>}
          {filteredTools.map((tool) => (
            <article key={tool.id} className="tool-card glass-panel">
              {tool.featured && <div className="badge-hot">Rekomendasi</div>}
              <div className={`tool-image ${tool.imageUrl ? '' : 'tool-image-placeholder'}`}>
                {tool.imageUrl ? <img src={tool.imageUrl} alt={tool.title} /> : <span>AIGROWTH TOOL</span>}
              </div>
              <div className="tool-content">
                <div className="tool-header">
                  <span className="tool-category">{tool.category || 'AI Tool'}</span>
                  {tool.label && <span className="tool-price">{tool.label}</span>}
                </div>
                <h2 className="tool-title">{tool.title}</h2>
                <p className="tool-desc">{tool.description}</p>
                {tool.url && <a href={tool.url} target="_blank" rel="noopener noreferrer" className="buy-btn">Buka Tool</a>}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="disclaimer-section container">
        <p className="disclaimer-text">*Beberapa tautan di atas adalah tautan afiliasi. AIGrowth dapat menerima komisi tanpa biaya tambahan bagi Anda.</p>
      </section>
    </div>
  );
}
