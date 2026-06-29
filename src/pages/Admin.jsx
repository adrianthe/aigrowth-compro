import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import imageCompression from 'browser-image-compression';
import { useLanguage } from '../contexts/LanguageContext';
import './Admin.css';

export default function Admin() {
  const { t } = useLanguage();
  // Global States
  const [activeTab, setActiveTab] = useState('prompts'); // 'prompts' or 'articles'
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Prompts States
  const [imageFile, setImageFile] = useState(null);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [promptsList, setPromptsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [customTag, setCustomTag] = useState('');
  
  // Admin List Filters
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminActiveTag, setAdminActiveTag] = useState('All');

  // Articles States
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleImageFile, setArticleImageFile] = useState(null);
  const [articlesList, setArticlesList] = useState([]);
  const [editingArticleId, setEditingArticleId] = useState(null);

  const availableTags = ['Poster', 'Product Commerce', 'Cute n Unique'];

  useEffect(() => {
    fetchPrompts();
    fetchArticles();
  }, []);

  // --- PROMPTS LOGIC ---
  const fetchPrompts = async () => {
    const { data, error } = await supabase.from('prompts').select('*').order('created_at', { ascending: false });
    if (!error) setPromptsList(data || []);
  };

  const handleTagToggle = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };

  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const tag = customTag.trim();
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
    setCustomTag('');
  };

  const handleEditPrompt = (item) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setPrompt(item.prompt);
    setSelectedTags(item.tags || []);
    setImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePrompt = async (id) => {
    if (!window.confirm("Yakin ingin menghapus prompt ini?")) return;
    const { error } = await supabase.from('prompts').delete().eq('id', id);
    if (!error) fetchPrompts();
  };

  const cancelEditPrompt = () => {
    setEditingId(null); setTitle(''); setPrompt(''); setSelectedTags([]); setImageFile(null); setCustomTag('');
  };

  const handlePromptSubmit = async (e) => {
    e.preventDefault();
    if (!editingId && !imageFile) return setErrorMsg('Harap pilih file gambar untuk prompt baru.');
    if (!title || !prompt || selectedTags.length === 0) return setErrorMsg('Harap lengkapi Judul, Prompt, dan minimal 1 Tag.');
    
    setIsSubmitting(true); setErrorMsg('');
    try {
      let finalImageUrl = null;
      if (imageFile) {
        // Compress image before upload
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressedFile = await imageCompression(imageFile, options);
        
        const filePath = `${Math.random()}.${compressedFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('showcase-images').upload(filePath, compressedFile);
        if (uploadError) throw uploadError;
        finalImageUrl = supabase.storage.from('showcase-images').getPublicUrl(filePath).data.publicUrl;
      }

      if (editingId) {
        const updateData = { title, prompt, tags: selectedTags };
        if (finalImageUrl) updateData.imageUrl = finalImageUrl;
        let { error } = await supabase.from('prompts').update(updateData).eq('id', editingId);
        
        // Fallback if 'title' column doesn't exist
        if (error && error.message.includes('title')) {
          delete updateData.title;
          updateData.prompt = `[${title}]\n\n${prompt}`;
          const { error: fallbackError } = await supabase.from('prompts').update(updateData).eq('id', editingId);
          if (fallbackError) throw fallbackError;
        } else if (error) throw error;
        
      } else {
        const insertData = { imageUrl: finalImageUrl, title, prompt, tags: selectedTags };
        let { error } = await supabase.from('prompts').insert([insertData]);
        
        // Fallback if 'title' column doesn't exist
        if (error && error.message.includes('title')) {
          delete insertData.title;
          insertData.prompt = `[${title}]\n\n${prompt}`;
          const { error: fallbackError } = await supabase.from('prompts').insert([insertData]);
          if (fallbackError) throw fallbackError;
        } else if (error) throw error;
      }
      cancelEditPrompt(); fetchPrompts(); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) { setErrorMsg(error.message); } finally { setIsSubmitting(false); }
  };

  // --- ARTICLES LOGIC ---
  const fetchArticles = async () => {
    const { data, error } = await supabase.from('articles').select('*').order('created_at', { ascending: false });
    if (!error) setArticlesList(data || []);
  };

  const generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleEditArticle = (item) => {
    setEditingArticleId(item.id);
    setArticleTitle(item.title || '');
    setArticleContent(item.content || '');
    setArticleImageFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm("Yakin ingin menghapus artikel ini?")) return;
    const { error } = await supabase.from('articles').delete().eq('id', id);
    if (!error) fetchArticles();
  };

  const cancelEditArticle = () => {
    setEditingArticleId(null); setArticleTitle(''); setArticleContent(''); setArticleImageFile(null);
  };

  const handleArticleSubmit = async (e) => {
    e.preventDefault();
    if (!articleTitle || !articleContent) return setErrorMsg('Judul dan Konten wajib diisi.');
    
    setIsSubmitting(true); setErrorMsg('');
    try {
      let finalImageUrl = null;
      if (articleImageFile) {
        // Compress image before upload
        const options = { maxSizeMB: 0.3, maxWidthOrHeight: 1200, useWebWorker: true };
        const compressedFile = await imageCompression(articleImageFile, options);

        const filePath = `articles/${Math.random()}.${compressedFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('showcase-images').upload(filePath, compressedFile);
        if (uploadError) throw uploadError;
        finalImageUrl = supabase.storage.from('showcase-images').getPublicUrl(filePath).data.publicUrl;
      }

      const slug = generateSlug(articleTitle);

      if (editingArticleId) {
        const updateData = { title: articleTitle, slug, content: articleContent };
        if (finalImageUrl) updateData.image_url = finalImageUrl;
        const { error } = await supabase.from('articles').update(updateData).eq('id', editingArticleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('articles').insert([{ title: articleTitle, slug, content: articleContent, image_url: finalImageUrl }]);
        if (error) throw error;
      }
      cancelEditArticle(); fetchArticles(); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) { setErrorMsg(error.message); } finally { setIsSubmitting(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="admin-page container fade-in">
      <div className="admin-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
        <div>
          <h2 className="section-title">Admin Dashboard</h2>
          <p className="hero-subtitle">Manage your gallery prompts and articles.</p>
        </div>
        <button onClick={handleLogout} className="glass-panel" style={{padding: '8px 16px', color: '#ff4d4d', cursor: 'pointer', border: '1px solid #ff4d4d'}}>
          {t('admin_logout')}
        </button>
      </div>

      <div className="admin-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
        <button className={`filter-tag glass-panel ${activeTab === 'prompts' ? 'active' : ''}`} onClick={() => setActiveTab('prompts')} style={{fontSize: '16px', padding: '12px 24px'}}>
          Kelola Prompts
        </button>
        <button className={`filter-tag glass-panel ${activeTab === 'articles' ? 'active' : ''}`} onClick={() => setActiveTab('articles')} style={{fontSize: '16px', padding: '12px 24px'}}>
          Kelola Artikel / Blog
        </button>
      </div>

      {showSuccess && <div className="success-message glass-panel">✅ Berhasil tersimpan ke Supabase!</div>}
      {errorMsg && <div className="success-message glass-panel" style={{color: 'red', backgroundColor: 'rgba(255,0,0,0.1)', borderColor: 'red'}}>❌ Error: {errorMsg}</div>}

      {/* --- PROMPTS TAB --- */}
      {activeTab === 'prompts' && (
        <>
          <form className="admin-form glass-panel" onSubmit={handlePromptSubmit}>
            <h3 style={{marginBottom: '20px'}}>{editingId ? t('admin_update') : t('admin_upload_title')}</h3>
            <div className="form-group">
              <label>{editingId ? t('admin_file_edit') : t('admin_file')}</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && setImageFile(e.target.files[0])} required={!editingId} className="glass-input" style={{padding: '12px'}} />
            </div>
            <div className="form-group">
              <label>Title (Judul Karya)</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="glass-input" style={{padding: '12px'}} />
            </div>
            <div className="form-group">
              <label>{t('admin_prompt_text')}</label>
              <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} required className="glass-input" rows="5" />
            </div>
            <div className="form-group">
              <label>{t('admin_tags')}</label>
              <div className="tags-selector">
                {availableTags.map(tag => (
                  <button type="button" key={tag} className={`filter-tag glass-panel ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => handleTagToggle(tag)}>{tag}</button>
                ))}
                {selectedTags.filter(t => !availableTags.includes(t)).map(tag => (
                  <button type="button" key={tag} className="filter-tag glass-panel active" onClick={() => handleTagToggle(tag)}>{tag}</button>
                ))}
              </div>
              <div style={{display: 'flex', gap: '8px', marginTop: '10px'}}>
                <input 
                  type="text" 
                  placeholder="Kategori baru..." 
                  className="glass-input" 
                  value={customTag} 
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTag(e); } }}
                  style={{padding: '10px 12px', flex: 1}}
                />
                <button type="button" onClick={handleAddCustomTag} className="glass-panel" style={{padding: '10px 16px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)'}}>
                  Tambah
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting} style={{ margin: 0, flex: 1 }}>
                {isSubmitting ? 'Menyimpan...' : (editingId ? t('admin_update') : t('admin_publish'))}
              </button>
              {editingId && <button type="button" className="glass-panel" onClick={cancelEditPrompt} style={{ padding: '0 20px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>Cancel</button>}
            </div>
          </form>

          <div className="admin-list-section">
            <h3 className="section-title" style={{ marginTop: '60px', marginBottom: '20px', fontSize: '24px' }}>{t('admin_list_title')}</h3>
            
            {/* Search & Filter Controls */}
            <div className="filter-controls" style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <input 
                type="text" 
                className="glass-input" 
                placeholder="Cari berdasarkan Judul atau Prompt..." 
                value={adminSearchTerm}
                onChange={(e) => setAdminSearchTerm(e.target.value)}
                style={{ padding: '12px', width: '100%', maxWidth: '600px' }}
              />
              <div className="tags-selector" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {['All', ...new Set(promptsList.flatMap(item => item.tags || []))].map(tag => (
                  <button 
                    key={tag} 
                    type="button"
                    className={`filter-tag glass-panel ${adminActiveTag === tag ? 'active' : ''}`}
                    onClick={() => setAdminActiveTag(tag)}
                    style={{ fontSize: '13px', padding: '6px 16px', cursor: 'pointer' }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="prompts-list">
              {promptsList.filter(item => {
                const hasFallbackTitle = item.prompt && item.prompt.startsWith('[') && item.prompt.includes(']\n\n');
                const displayTitle = item.title || (hasFallbackTitle ? item.prompt.split(']\n\n')[0].substring(1) : 'Untitled');
                
                const matchesSearch = displayTitle.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
                                      (item.prompt && item.prompt.toLowerCase().includes(adminSearchTerm.toLowerCase()));
                const matchesTag = adminActiveTag === 'All' || (item.tags && item.tags.includes(adminActiveTag));
                return matchesSearch && matchesTag;
              }).map(item => {
                const hasFallbackTitle = item.prompt && item.prompt.startsWith('[') && item.prompt.includes(']\n\n');
                const displayTitle = item.title || (hasFallbackTitle ? item.prompt.split(']\n\n')[0].substring(1) : 'Untitled');
                const displayPrompt = hasFallbackTitle ? item.prompt.split(']\n\n')[1] : item.prompt;

                return (
                <div key={item.id} className="prompt-list-item glass-panel">
                  <div className="item-image"><img src={item.imageUrl} alt="visual" /></div>
                  <div className="item-details">
                    <h4 style={{margin: '0 0 8px 0', fontSize: '18px'}}>{displayTitle}</h4>
                    <p className="item-prompt">{displayPrompt}</p>
                    <div className="item-tags">{item.tags?.map(t => <span key={t} className="tiny-tag">{t}</span>)}</div>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditPrompt({ ...item, title: displayTitle, prompt: displayPrompt })} className="edit-btn">{t('admin_btn_edit')}</button>
                    <button onClick={() => {
                        if (window.confirm(t('admin_confirm_delete'))) {
                          handleDeletePrompt(item.id);
                        }
                      }} className="delete-btn">{t('admin_btn_delete')}</button>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </>
      )}

      {/* --- ARTICLES TAB --- */}
      {activeTab === 'articles' && (
        <>
          <form className="admin-form glass-panel" onSubmit={handleArticleSubmit}>
            <h3 style={{marginBottom: '20px'}}>{editingArticleId ? 'Edit Artikel' : 'Tulis Artikel Baru'}</h3>
            <div className="form-group">
              <label>Thumbnail Artikel {editingArticleId && '(Kosongkan jika tidak ubah gambar)'}</label>
              <input type="file" accept="image/*" onChange={(e) => e.target.files && setArticleImageFile(e.target.files[0])} className="glass-input" style={{padding: '12px'}} />
            </div>
            <div className="form-group">
              <label>Judul Artikel</label>
              <input type="text" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} required className="glass-input" style={{padding: '12px'}} />
            </div>
            <div className="form-group">
              <label>Isi Konten (Dukung HTML sederhana / baris baru)</label>
              <textarea placeholder="Tulis konten artikel di sini..." value={articleContent} onChange={(e) => setArticleContent(e.target.value)} required className="glass-input" rows="12" />
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting} style={{ margin: 0, flex: 1 }}>
                {isSubmitting ? 'Menyimpan...' : (editingArticleId ? 'Update Artikel' : 'Publish Artikel')}
              </button>
              {editingArticleId && <button type="button" className="glass-panel" onClick={cancelEditArticle} style={{ padding: '0 20px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>Cancel</button>}
            </div>
          </form>

          <div className="admin-list-section">
            <h3 className="section-title" style={{ marginTop: '60px', marginBottom: '20px', fontSize: '24px' }}>Daftar Artikel</h3>
            <div className="prompts-list">
              {articlesList.map(item => (
                <div key={item.id} className="prompt-list-item glass-panel" style={{alignItems: 'center'}}>
                  {item.image_url && (
                    <div className="item-image" style={{maxWidth: '120px'}}><img src={item.image_url} alt="thumbnail" style={{borderRadius: '8px'}}/></div>
                  )}
                  <div className="item-details">
                    <h4 style={{margin: '0 0 4px 0', fontSize: '18px'}}>{item.title}</h4>
                    <span style={{fontSize: '12px', color: '#00d2ff', display: 'block', marginBottom: '8px'}}>/blog/{item.slug}</span>
                    <p className="item-prompt" style={{maxHeight: '40px', overflow: 'hidden'}}>{item.content}</p>
                  </div>
                  <div className="item-actions">
                    <button onClick={() => handleEditArticle(item)} className="edit-btn">Edit</button>
                    <button onClick={() => handleDeleteArticle(item.id)} className="delete-btn">Hapus</button>
                  </div>
                </div>
              ))}
              {articlesList.length === 0 && <p style={{textAlign: 'center', opacity: 0.5}}>Belum ada artikel.</p>}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
