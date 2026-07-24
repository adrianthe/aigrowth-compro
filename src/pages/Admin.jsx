import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useLanguage } from '../contexts/LanguageContext';
import './Admin.css';

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articles, setArticles] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, content, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setArticles(data || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchArticles();
  }, []);

  const generateSlug = (text) => text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const resetForm = () => {
    setEditingId(null);
    setArticleTitle('');
    setArticleContent('');
  };

  const handleEdit = (article) => {
    setEditingId(article.id);
    setArticleTitle(article.title || '');
    setArticleContent(article.content || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus artikel ini?')) return;

    setErrorMessage('');
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (error) {
      setErrorMessage(error.message);
      return;
    }

    await fetchArticles();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!articleTitle.trim() || !articleContent.trim()) {
      setErrorMessage('Judul dan konten wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    const articleData = {
      title: articleTitle.trim(),
      slug: generateSlug(articleTitle),
      content: articleContent.trim(),
    };

    const query = editingId
      ? supabase.from('articles').update(articleData).eq('id', editingId)
      : supabase.from('articles').insert([articleData]);

    const { error } = await query;
    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    resetForm();
    await fetchArticles();
    setMessage('Artikel berhasil disimpan.');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div>
          <h1 className="section-title">Admin Artikel</h1>
          <p className="hero-subtitle">Kelola artikel teks AIGrowth tanpa upload gambar.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">{t('admin_logout')}</button>
      </div>

      {message && <div className="success-message glass-panel">{message}</div>}
      {errorMessage && <div className="error-message glass-panel">{errorMessage}</div>}

      <form className="admin-form glass-panel" onSubmit={handleSubmit}>
        <h2>{editingId ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h2>
        <div className="form-group">
          <label htmlFor="article-title">Judul</label>
          <input id="article-title" type="text" value={articleTitle} onChange={(event) => setArticleTitle(event.target.value)} className="glass-input" required />
        </div>
        <div className="form-group">
          <label htmlFor="article-content">Konten</label>
          <textarea id="article-content" value={articleContent} onChange={(event) => setArticleContent(event.target.value)} className="glass-input" rows="12" required />
        </div>
        <div className="form-actions">
          <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : editingId ? 'Perbarui Artikel' : 'Publikasikan Artikel'}
          </button>
          {editingId && <button type="button" className="cancel-btn" onClick={resetForm}>Batal</button>}
        </div>
      </form>

      <section className="admin-list-section">
        <h2 className="section-title article-list-title">Daftar Artikel</h2>
        <div className="article-list">
          {articles.length === 0 && <div className="glass-panel empty-state">Belum ada artikel.</div>}
          {articles.map((article) => (
            <article key={article.id} className="article-list-item glass-panel">
              <div className="item-details">
                <h3>{article.title}</h3>
                <p className="item-prompt">{article.content}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(article)} className="edit-btn">{t('admin_btn_edit')}</button>
                <button onClick={() => handleDelete(article.id)} className="delete-btn">{t('admin_btn_delete')}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}