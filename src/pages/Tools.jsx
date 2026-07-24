import { useState } from 'react';
import './Tools.css';

const tools = [
  {
    id: 1,
    name: 'Dibales.ai',
    category: 'Social Media',
    description: 'Platform AI untuk otomasi media sosial yang membantu membalas komentar dan pesan pelanggan secara lebih cepat.',
    affiliateLink: 'https://s.id/dibalesai',
    price: 'Lihat Detail',
    isHot: true,
  },
];

export default function Tools() {
  const [activeCategory, setActiveCategory] = useState('All');
  const categories = ['All', ...new Set(tools.map((tool) => tool.category))];
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
          {filteredTools.map((tool) => (
            <article key={tool.id} className="tool-card glass-panel">
              {tool.isHot && <div className="badge-hot">Rekomendasi</div>}
              <div className="tool-content">
                <div className="tool-header">
                  <span className="tool-category">{tool.category}</span>
                  <span className="tool-price">{tool.price}</span>
                </div>
                <h2 className="tool-title">{tool.name}</h2>
                <p className="tool-desc">{tool.description}</p>
                <a href={tool.affiliateLink} target="_blank" rel="noopener noreferrer" className="buy-btn">Buka Tool</a>
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