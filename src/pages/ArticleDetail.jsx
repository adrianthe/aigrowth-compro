import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .single();
        
      if (!error && data) {
        setArticle(data);
      }
      setLoading(false);
    };

    fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="article-page container fade-in" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Loading article...</h2>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-page container fade-in" style={{textAlign: 'center', paddingTop: '100px'}}>
        <h2>Artikel tidak ditemukan</h2>
        <Link to="/" className="action-btn cyan-btn" style={{marginTop: '20px'}}>Kembali ke Home</Link>
      </div>
    );
  }

  return (
    <div className="article-page container fade-in">
      <div className="article-header glass-panel">
        <Link to="/" className="back-link">← Kembali</Link>
        <h1 className="article-title">{article.title}</h1>
        <p className="article-meta">Dipublikasikan pada: {new Date(article.created_at).toLocaleDateString('id-ID')}</p>
      </div>

      {article.image_url && (
        <div className="article-hero-image">
          <img src={article.image_url} alt={article.title} />
        </div>
      )}

      <div className="article-content glass-panel">
        <div dangerouslySetInnerHTML={{ __html: article.content.replace(/\n/g, '<br/>') }} />
      </div>

      {/* Upselling CTA Section */}
      <div className="upsell-cta glass-panel glow-border">
        <div className="upsell-content">
          <h2 className="upsell-title">Mau Belajar AI Lebih Dalam?</h2>
          <p className="upsell-desc">
            Kamu baru saja membaca sebagian kecil dari materi luar biasa di AIGrowth. 
            Bergabunglah dengan komunitas premium kami untuk mendapatkan akses ke ratusan prompt eksklusif, tutorial mendalam, dan sesi mentoring langsung!
          </p>
          <a 
            href="https://whatsapp.com/channel/0029VbAm408HltY5n38tJ31d" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="action-btn cyan-btn upsell-btn"
          >
            GABUNG KOMUNITAS SEKARANG ➔
          </a>
        </div>
      </div>
    </div>
  );
}
