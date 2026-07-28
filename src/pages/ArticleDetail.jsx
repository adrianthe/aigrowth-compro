import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchContentItems } from '../lib/contentApi';
import './ArticleDetail.css';

export default function ArticleDetail() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetchContentItems('article').then((items) => {
      if (!active) return;
      setArticle(items.find((item) => item.slug === slug) || null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <div className="article-page container fade-in article-status"><h2>Memuat artikel...</h2></div>;
  }

  if (!article) {
    return (
      <div className="article-page container fade-in article-status">
        <h2>Artikel tidak ditemukan</h2>
        <Link to="/" className="action-btn cyan-btn">Kembali ke Beranda</Link>
      </div>
    );
  }

  return (
    <div className="article-page container fade-in">
      <div className="article-header glass-panel">
        <Link to="/" className="back-link">Kembali</Link>
        <h1 className="article-title">{article.title}</h1>
        <p className="article-meta">Dipublikasikan pada {new Date(article.createdAt).toLocaleDateString('id-ID')}</p>
      </div>

      <div className="article-content glass-panel">
        {article.description.split('\n').map((paragraph, index) => (
          paragraph ? <p key={index}>{paragraph}</p> : <br key={index} />
        ))}
      </div>

      <div className="upsell-cta glass-panel glow-border">
        <div className="upsell-content">
          <h2 className="upsell-title">Mau Belajar AI Lebih Dalam?</h2>
          <p className="upsell-desc">Bergabunglah dengan komunitas AIGrowth untuk mendapatkan kelas praktis, tutorial mendalam, dan sesi mentoring langsung.</p>
          <a href="https://whatsapp.com/channel/0029VbAm408HltY5n38tJ31d" target="_blank" rel="noopener noreferrer" className="action-btn cyan-btn upsell-btn">
            Gabung Komunitas
          </a>
        </div>
      </div>
    </div>
  );
}
