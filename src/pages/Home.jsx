import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import './Home.css';

const rotatingWords = ['Belajar', 'Berkembang', 'Ber-progress', 'Bertumbuh'];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [articles, setArticles] = useState([]);
  
  // Word Rotator state
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data, error } = await supabase
        .from('articles')
        .select('id, title, slug, content, created_at')
        .order('created_at', { ascending: false })
        .limit(3);
      if (!error && data) {
        setArticles(data);
      }
    };

    fetchArticles();
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section container">
        <div className="hero-content fade-in">
          <h1 className="hero-title">
            {t('hero_title')} <span className="text-gradient">{t('hero_title_highlight')}</span>
          </h1>
          <p className="hero-subtitle">
            {t('hero_subtitle')}
          </p>
          <button className="primary-btn large-btn" onClick={() => navigate('/courses')}>
            {t('hero_cta')}
          </button>
        </div>
      </section>

      {/* Community Section */}
      <section className="community-section container fade-in" style={{width: '100%', padding: '40px 24px'}}>
        <div className="community-content glass-panel" style={{margin: '0 auto'}}>
          <h2 className="community-title">
            Gabung Komunitas AIGrowth untuk <br/>
            <span className="glow-text fade-text" key={currentWordIndex} style={{ display: 'inline-block' }}>
              {rotatingWords[currentWordIndex]}
            </span> di Era AI
          </h2>
          <p className="community-subtitle">
            Tempat kamu bertumbuh bareng praktisi, kreator, dan pemilik bisnis yang belajar dan praktek AI bareng-bareng.
          </p>
          <a 
            href="https://Wa.me/6285716280788" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="whatsapp-btn"
          >
            Join Komunitasnya sekarang ➔
          </a>

          <div className="social-buttons-row">
            <a href="https://www.youtube.com/@Aigrowthid" className="social-btn youtube" target="_blank" rel="noopener noreferrer" title="YouTube">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
            </a>
            <a href="https://www.instagram.com/aigrowth.id/" className="social-btn instagram" target="_blank" rel="noopener noreferrer" title="Instagram">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="https://www.tiktok.com/@aigrowthid" className="social-btn tiktok" target="_blank" rel="noopener noreferrer" title="TikTok">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
            </a>
            <a href="https://Wa.me/6285716280788" className="social-btn whatsapp" target="_blank" rel="noopener noreferrer" title="WhatsApp">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>
        </div>
      </section>

      {/* Profile/Catalog Sections */}
      <section className="profile-catalog-section container fade-in" style={{padding: '0 24px 40px 24px'}}>
        <div className="profile-wrapper">
          
          {/* Unified About & Founders Section */}
          <div className="glass-panel unified-section" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px', marginBottom: '32px' }}>
            
            {/* About Card */}
            <div className="profile-card about-card" style={{ padding: 0, border: 'none', background: 'transparent', boxShadow: 'none', alignItems: 'center' }}>
              <div className="about-avatar" style={{ border: 'none', background: 'transparent', width: '120px', height: '120px', flexShrink: 0, borderRadius: '50%', overflow: 'hidden' }}>
                <img src="/logo.jpg" alt="AIGrowth Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="about-info">
                <h2 className="about-card-title" style={{ fontSize: '32px' }}>About <span className="highlight-cyan">AIGrowth.id</span></h2>
                <p className="about-card-desc" style={{ fontSize: '16px', maxWidth: '800px' }}>
                  Platform komunitas yang membahas AI Generative untuk pembuatan konten gambar, video, dan produktivitas. Aktif sharing tutorial dan tips seputar AI.
                </p>
              </div>
            </div>

            {/* Meet the Founders Section */}
            <div className="founders-section">
              <h2 className="content-title" style={{fontSize: '32px', marginBottom: '24px', textAlign: 'center'}}>MEET THE <span className="highlight-cyan">FOUNDERS</span></h2>
              <div className="founders-grid">
                {/* Founder 1 */}
                <div className="founder-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div 
                    className="founder-image" 
                    style={{ backgroundImage: 'url(/adrian.png)' }}
                  ></div>
                  <div className="founder-overlay">
                    <div className="founder-badges">
                      <span className="founder-role">FOUNDER</span>
                    </div>
                    <div className="founder-bottom">
                      <div className="founder-info">
                        <h3>Adrian The</h3>
                        <p>AI Strategist & Creator</p>
                      </div>
                      <a href="https://www.instagram.com/adrianthe_/" target="_blank" rel="noopener noreferrer" className="founder-link-btn">↗</a>
                    </div>
                  </div>
                </div>

                {/* Founder 2 */}
                <div className="founder-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div 
                    className="founder-image" 
                    style={{ backgroundImage: 'url(/adriel.png)' }}
                  ></div>
                  <div className="founder-overlay">
                    <div className="founder-badges">
                      <span className="founder-role">CO-FOUNDER</span>
                    </div>
                    <div className="founder-bottom">
                      <div className="founder-info">
                        <h3>Adriel Edgard</h3>
                        <p>AI Engineer & Innovator</p>
                      </div>
                      <a href="https://www.instagram.com/adrieledgard/" target="_blank" rel="noopener noreferrer" className="founder-link-btn">↗</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Event Showcase Section */}
            <div className="event-showcase-section" style={{ marginTop: '20px' }}>
              <h2 className="content-title" style={{fontSize: '32px', marginBottom: '24px', textAlign: 'center'}}>AIGROWTH <span className="highlight-cyan">EVENTS</span></h2>
              <div className="event-gallery-grid">
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/elshinta.jpg" alt="AIGrowth x Elshinta Radio" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">RADIO TALKSHOW</span>
                        <p>AIGrowth x Elshinta Radio</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/smesco.png" alt="AIGrowth x Smesco" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">WEBINAR UMKM</span>
                        <p>AIGrowth x Smesco</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/cekatai.jpg" alt="AIGrowth x Cekat AI" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">TECH CONFERENCE</span>
                        <p>AIGrowth x Cekat AI</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/ombotak.jpg" alt="AIGrowth x Om Botak" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">WORKSHOP</span>
                        <p>AIGrowth x Om Botak</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/china1.jpg" alt="AI Trip to China" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">INTERNATIONAL</span>
                        <p>AI Tech Trip - Shenzhen</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="event-card glass-panel" style={{ background: 'rgba(255, 255, 255, 0.02)', padding: 0 }}>
                  <div className="event-image-wrapper">
                    <img src="/china2.jpg" alt="AI Trip to China" />
                    <div className="event-caption-overlay">
                      <div>
                        <span className="highlight-cyan">ROBOTICS</span>
                        <p>Exploring Future Tech</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Latest Articles Section */}
      <section className="latest-articles-section container fade-in" style={{padding: '40px 24px 80px 24px'}}>
        <div className="profile-wrapper">
          <h2 className="section-title" style={{textAlign: 'center', marginBottom: '30px'}}>Belajar AI <span className="highlight-cyan">Gratis</span></h2>
          <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
            {(articles.length > 0 ? articles : [
              {
                id: 'dummy-1',
                title: 'Cara Gampang Bikin Video AI Modal HP (Contoh)',
                slug: 'contoh-artikel-1',
                content: 'Ini adalah contoh teks deskripsi artikel tutorial yang akan muncul di beranda. Nanti Anda bisa menulis isi yang lebih panjang dan bermanfaat untuk audiens...',
              },
              {
                id: 'dummy-2',
                title: 'Memulai Otomasi Kerja dengan AI (Contoh)',
                slug: 'contoh-artikel-2',
                content: 'Pelajari cara sederhana memilih tugas yang bisa diotomasi agar pekerjaan harian menjadi lebih cepat dan terukur.',
              }
            ]).map(article => (
              <Link to={`/blog/${article.slug}`} key={article.id} className="profile-card about-card glass-panel" style={{textDecoration: 'none', color: 'inherit'}}>
                <div className="about-avatar" style={{borderRadius: '16px', border: 'none', background: 'rgba(255,255,255,0.05)', fontSize: '12px', fontWeight: '700', letterSpacing: '1px'}}>
                  ARTIKEL
                </div>
                <div className="about-info" style={{flex: 1}}>
                  <h3 className="about-card-title" style={{fontSize: '22px', marginBottom: '8px'}}>{article.title}</h3>
                  <p className="about-card-desc" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'}}>
                    {article.content}
                  </p>
                  <span style={{color: '#00d2ff', fontSize: '14px', fontWeight: 'bold', marginTop: '12px', display: 'inline-block'}}>
                    Baca Selengkapnya
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
