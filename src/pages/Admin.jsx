import { useEffect, useMemo, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import { useNavigate } from 'react-router-dom';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '../data/contentDefaults';
import { useLanguage } from '../contexts/LanguageContext';
import './Admin.css';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const emptyForm = {
  title: '',
  description: '',
  category: '',
  url: '',
  imageUrl: '',
  eventDate: '',
  label: '',
  featured: false,
};

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const fileInputRef = useRef(null);
  const [activeType, setActiveType] = useState('event');
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const activeItems = useMemo(
    () => items.filter((item) => item.type === activeType),
    [items, activeType],
  );

  async function fetchItems() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/content', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Konten gagal dimuat.');
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (error) {
      setErrorMessage(error.message || 'Konten gagal dimuat.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const changeType = (type) => {
    setActiveType(type);
    setMessage('');
    setErrorMessage('');
    resetForm();
  };

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage('');
    setErrorMessage('');
    setUploadProgress(0);

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Format foto harus JPG, PNG, atau WebP.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setErrorMessage('Ukuran foto maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
      const blob = await upload(`cms/images/${activeType}-${Date.now()}-${safeName}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
        onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
      });
      updateField('imageUrl', blob.url);
      setMessage('Foto berhasil diupload. Lanjut isi data lalu tekan Simpan.');
    } catch (error) {
      setErrorMessage(error.message || 'Foto gagal diupload.');
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  const removeImage = () => {
    updateField('imageUrl', '');
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEdit = (item) => {
    setActiveType(item.type);
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      url: item.url || '',
      imageUrl: item.imageUrl || '',
      eventDate: item.eventDate || '',
      label: item.label || '',
      featured: Boolean(item.featured),
    });
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus ${CONTENT_TYPE_LABELS[item.type]}: ${item.title}?`)) return;

    setErrorMessage('');
    setMessage('');
    const response = await fetch(`/api/content?id=${encodeURIComponent(item.id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const payload = await response.json();
    if (!response.ok) {
      setErrorMessage(payload.error || 'Konten gagal dihapus.');
      return;
    }

    await fetchItems();
    setMessage('Konten berhasil dihapus.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setErrorMessage('Judul dan deskripsi wajib diisi.');
      return;
    }
    if (activeType === 'video' && !form.url.trim()) {
      setErrorMessage('Link video YouTube wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    const item = {
      ...form,
      id: editingId || undefined,
      type: activeType,
    };

    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ item }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Konten gagal disimpan.');

      resetForm();
      await fetchItems();
      setMessage(`${CONTENT_TYPE_LABELS[activeType]} berhasil disimpan.`);
    } catch (error) {
      setErrorMessage(error.message || 'Konten gagal disimpan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'logout' }),
    });
    navigate('/login');
  };

  const typeLabel = CONTENT_TYPE_LABELS[activeType];

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div>
          <h1 className="section-title">Admin Konten</h1>
          <p className="hero-subtitle">Tambah Video YouTube, Event, Course, dan Tools tanpa mengubah coding.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">{t('admin_logout')}</button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Jenis konten">
        {CONTENT_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`admin-tab ${activeType === type ? 'active' : ''}`}
            onClick={() => changeType(type)}
          >
            {CONTENT_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {message && <div className="success-message glass-panel">{message}</div>}
      {errorMessage && <div className="error-message glass-panel">{errorMessage}</div>}

      <form className="admin-form glass-panel" onSubmit={handleSubmit}>
        <h2>{editingId ? `Edit ${typeLabel}` : `Tambah ${typeLabel}`}</h2>

        <div className="form-group">
          <label htmlFor="content-title">Judul</label>
          <input id="content-title" type="text" value={form.title} onChange={(event) => updateField('title', event.target.value)} className="glass-input" required />
        </div>

        <div className="form-group">
          <label htmlFor="content-description">Deskripsi</label>
          <textarea id="content-description" value={form.description} onChange={(event) => updateField('description', event.target.value)} className="glass-input" rows={5} required />
        </div>

        <div className="form-group">
          <label htmlFor="content-category">Kategori</label>
          <input id="content-category" type="text" value={form.category} onChange={(event) => updateField('category', event.target.value)} className="glass-input" placeholder={activeType === 'video' ? 'Contoh: AI Automation' : activeType === 'event' ? 'Contoh: Workshop' : 'Contoh: Online Course'} />
        </div>

        {activeType !== 'video' && (
          <div className="form-group">
            <label>Foto (opsional)</label>
            <div className="image-upload-panel">
              <label className={`image-upload-button ${isUploading ? 'is-uploading' : ''}`}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageUpload}
                  disabled={isUploading}
                />
                <span className="upload-plus" aria-hidden="true">+</span>
                <span>{isUploading ? `Mengupload ${uploadProgress}%` : 'Pilih foto dari perangkat'}</span>
                <small>JPG, PNG, atau WebP - maksimal 5 MB</small>
              </label>
              <div className="image-url-option">
                <span>atau gunakan URL foto</span>
                <input type="url" value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} className="glass-input" placeholder="https://..." />
              </div>
            </div>
            {isUploading && <progress className="upload-progress" value={uploadProgress} max="100">{uploadProgress}%</progress>}
            {form.imageUrl && (
              <div className="image-preview-card">
                <img src={form.imageUrl} alt="Preview foto konten" />
                <div>
                  <strong>Foto siap dipakai</strong>
                  <button type="button" onClick={removeImage}>Hapus dari form</button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeType === 'video' && (
          <div className="form-group">
            <label htmlFor="youtube-url">Link video YouTube</label>
            <input id="youtube-url" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} className="glass-input" placeholder="https://www.youtube.com/watch?v=..." required />
            <span className="field-hint">Paste link YouTube biasa, Shorts, Live, atau youtu.be. Video otomatis menjadi embed.</span>
          </div>
        )}

        {activeType === 'event' && (
          <div className="form-group">
            <label htmlFor="event-date">Tanggal event (opsional)</label>
            <input id="event-date" type="date" value={form.eventDate} onChange={(event) => updateField('eventDate', event.target.value)} className="glass-input" />
          </div>
        )}

        {activeType !== 'video' && (
          <div className="admin-form-grid">
            <div className="form-group">
              <label htmlFor="content-url">Link tujuan (opsional)</label>
              <input id="content-url" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} className="glass-input" placeholder="https://..." />
            </div>
            <div className="form-group">
              <label htmlFor="content-label">Label tombol/status (opsional)</label>
              <input id="content-label" type="text" value={form.label} onChange={(event) => updateField('label', event.target.value)} className="glass-input" placeholder="Contoh: Lihat Detail" />
            </div>
          </div>
        )}

        {(activeType === 'course' || activeType === 'tool') && (
          <label className="featured-toggle">
            <input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
            Tandai sebagai rekomendasi
          </label>
        )}

        <div className="form-actions">
          <button type="submit" className="primary-btn submit-btn" disabled={isSubmitting || isUploading}>
            {isUploading ? 'Tunggu upload...' : isSubmitting ? 'Menyimpan...' : editingId ? `Perbarui ${typeLabel}` : `Simpan ${typeLabel}`}
          </button>
          {editingId && <button type="button" className="cancel-btn" onClick={resetForm}>Batal</button>}
        </div>
      </form>

      <section className="admin-list-section">
        <h2 className="section-title article-list-title">Daftar {typeLabel}</h2>
        <div className="article-list">
          {isLoading && <div className="glass-panel empty-state">Memuat konten...</div>}
          {!isLoading && activeItems.length === 0 && <div className="glass-panel empty-state">Belum ada {typeLabel.toLowerCase()}.</div>}
          {activeItems.map((item) => (
            <article key={item.id} className="article-list-item glass-panel">
              {item.imageUrl && <img className="admin-item-image" src={item.imageUrl} alt="" />}
              <div className="item-details">
                <div className="content-type-badge">{CONTENT_TYPE_LABELS[item.type]}</div>
                <h3>{item.title}</h3>
                <p className="item-prompt">{item.description}</p>
                {item.type === 'video' && item.url && <a className="item-link" href={item.url} target="_blank" rel="noopener noreferrer">Buka video YouTube</a>}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)} className="edit-btn">{t('admin_btn_edit')}</button>
                <button onClick={() => handleDelete(item)} className="delete-btn">{t('admin_btn_delete')}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
