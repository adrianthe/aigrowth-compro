import React, { useState } from 'react';
import './Tools.css';

const MOCK_TOOLS = [
  {
    id: 1,
    name: 'Open Claw Course',
    category: 'Classes',
    description: 'Kelas panduan komprehensif dari AIGrowth untuk memaksimalkan potensi AI dalam alur kerja profesional Anda.',
    image: 'https://picsum.photos/seed/course/400/300',
    affiliateLink: 'https://s.id/openclawadr',
    price: 'Lihat Detail',
    isHot: true,
  },
  {
    id: 2,
    name: 'Dibales.ai',
    category: 'Social Media',
    description: 'Platform AI canggih untuk Social Media Automation. Membalas komentar dan DM pelanggan secara cerdas dan otomatis 24/7.',
    image: 'https://picsum.photos/seed/dibales/400/300',
    affiliateLink: 'https://s.id/dibalesai',
    price: 'Lihat Detail',
    isHot: false,
  }
];

export default function Tools() {
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Get unique categories
  const categories = ['All', ...new Set(MOCK_TOOLS.map(tool => tool.category))];
  
  // Filter tools based on active category
  const filteredTools = activeCategory === 'All' 
    ? MOCK_TOOLS 
    : MOCK_TOOLS.filter(tool => tool.category === activeCategory);

  return (
    <div className="tools-container fade-in">
      {/* Background glow effects */}
      <div className="background-glow" style={{ top: '10%', left: '10%' }}></div>
      <div className="background-glow" style={{ top: '30%', right: '10%', background: 'radial-gradient(circle, rgba(162, 59, 255, 0.15) 0%, transparent 70%)' }}></div>

      {/* Hero Section */}
      <section className="tools-hero container">
        <div className="glass-panel unified-section" style={{ padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="hero-title" style={{ fontSize: '48px', marginBottom: '24px' }}>
            <span className="highlight-cyan">Tools</span> yang Kami Gunakan
          </h1>
          <p className="hero-subtitle" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '18px', lineHeight: '1.6' }}>
            Rekomendasi platform dan aplikasi AI terbaik yang dipakai oleh tim AIGrowth untuk memaksimalkan produktivitas dan kreativitas setiap harinya.
          </p>
        </div>
        
        {/* Category Filters */}
        <div className="category-filters">
          {categories.map(category => (
            <button
              key={category}
              className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Tools Grid Section */}
      <section className="tools-grid-section container">
        <div className="tools-grid">
          {filteredTools.map((tool) => (
            <div key={tool.id} className="tool-card glass-panel">
              {tool.isHot && <div className="badge-hot">🔥 Rekomendasi</div>}
              
              <div className="tool-image-wrapper">
                <img src={tool.image} alt={tool.name} className="tool-image" />
              </div>
              
              <div className="tool-content">
                <div className="tool-header">
                  <span className="tool-category">{tool.category}</span>
                  <span className="tool-price">{tool.price}</span>
                </div>
                
                <h3 className="tool-title">{tool.name}</h3>
                <p className="tool-desc">{tool.description}</p>
                
                <a 
                  href={tool.affiliateLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="buy-btn"
                >
                  Coba Sekarang ➔
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>
      
      {/* Disclaimer Section */}
      <section className="disclaimer-section container">
        <p className="disclaimer-text">
          *Beberapa tautan di atas adalah tautan afiliasi. AIGrowth mungkin mendapatkan sedikit komisi tanpa tambahan biaya bagi Anda jika Anda mendaftar melalui tautan tersebut. Terima kasih atas dukungannya!
        </p>
      </section>
    </div>
  );
}
