import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import LeadsPanel from '../components/LeadsPanel';
import { CONTENT_TYPES, CONTENT_TYPE_LABELS } from '../data/contentDefaults';
import {
  deleteContentItem,
  fetchAllContentItems,
  fetchDeliveryUrl,
  getContentPath,
  saveContentItem,
  saveDeliveryUrl,
  slugify,
  uploadContentImage,
} from '../lib/contentApi';
import { supabase } from '../lib/supabaseClient';
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
  slug: '',
  price: '',
  comparePrice: '',
  checkoutUrl: '',
  deliveryUrl: '',
  headline: '',
  subheadline: '',
  videoUrl: '',
  ctaLabel: '',
  benefits: '',
  audience: '',
  curriculum: '',
  faq: '',
};

const SALES_TYPES = ['course', 'freebie'];

const toLines = (text) => text.split('\n').map((line) => line.trim()).filter(Boolean);

// "Judul | detail" per line keeps the sales page editable without a page builder
function splitPairs(text, [first, second]) {
  return toLines(text).map((line) => {
    const [head, ...rest] = line.split('|');
    return { [first]: head.trim(), [second]: rest.join('|').trim() };
  });
}

const joinPairs = (items = [], [first, second]) => items
  .map((item) => (item[second] ? `${item[first]} | ${item[second]}` : item[first]))
  .join('\n');

function salesFromForm(form) {
  return {
    headline: form.headline.trim(),
    subheadline: form.subheadline.trim(),
    videoUrl: form.videoUrl.trim(),
    ctaLabel: form.ctaLabel.trim(),
    benefits: toLines(form.benefits),
    audience: toLines(form.audience),
    curriculum: splitPairs(form.curriculum, ['title', 'detail']),
    faq: splitPairs(form.faq, ['q', 'a']).filter((item) => item.a),
  };
}

function salesToForm(sales = {}) {
  return {
    headline: sales.headline || '',
    subheadline: sales.subheadline || '',
    videoUrl: sales.videoUrl || '',
    ctaLabel: sales.ctaLabel || '',
    benefits: (sales.benefits || []).join('\n'),
    audience: (sales.audience || []).join('\n'),
    curriculum: joinPairs(sales.curriculum, ['title', 'detail']),
    faq: joinPairs(sales.faq, ['q', 'a']),
  };
}

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
      setItems(await fetchAllContentItems());
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
      setUploadProgress(35);
      const imageUrl = await uploadContentImage(file, activeType);
      setUploadProgress(100);
      updateField('imageUrl', imageUrl);
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
      ...emptyForm,
      title: item.title || '',
      description: item.description || '',
      category: item.category || '',
      url: item.url || '',
      imageUrl: item.imageUrl || '',
      eventDate: item.eventDate || '',
      label: item.label || '',
      featured: Boolean(item.featured),
      slug: item.slug || '',
      price: item.price ?? '',
      comparePrice: item.comparePrice ?? '',
      checkoutUrl: item.checkoutUrl || '',
      ...salesToForm(item.sales),
    });
    setUploadProgress(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (item.type === 'freebie') {
      fetchDeliveryUrl(item.id)
        .then((deliveryUrl) => setForm((current) => ({ ...current, deliveryUrl })))
        .catch((error) => setErrorMessage(error.message || 'Link materi gagal dimuat.'));
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Yakin ingin menghapus ${CONTENT_TYPE_LABELS[item.type]}: ${item.title}?`)) return;

    setErrorMessage('');
    setMessage('');
    try {
      await deleteContentItem(item.id);
    } catch (error) {
      setErrorMessage(error.message || 'Konten gagal dihapus.');
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
    if (form.slug && form.slug !== slugify(form.slug)) {
      setErrorMessage('Alamat halaman hanya boleh huruf kecil, angka, dan tanda strip. Contoh: ai-influencer');
      return;
    }
    if (form.checkoutUrl && !/^https:\/\//.test(form.checkoutUrl.trim())) {
      setErrorMessage('Link checkout Mayar harus diawali https://');
      return;
    }
    if (activeType === 'freebie' && !form.slug) {
      setErrorMessage('Freebies butuh alamat halaman supaya form-nya bisa dibuka.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    setMessage('');

    const isSalesType = SALES_TYPES.includes(activeType);
    const item = {
      ...form,
      id: editingId || undefined,
      type: activeType,
      slug: isSalesType ? form.slug : '',
      price: activeType === 'course' ? form.price : '',
      comparePrice: activeType === 'course' ? form.comparePrice : '',
      checkoutUrl: activeType === 'course' ? form.checkoutUrl : '',
      sales: isSalesType ? salesFromForm(form) : {},
    };

    try {
      const saved = await saveContentItem(item);
      if (activeType === 'freebie') await saveDeliveryUrl(saved.id, form.deliveryUrl);
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
    await supabase.auth.signOut();
    navigate('/login');
  };

  const typeLabel = CONTENT_TYPE_LABELS[activeType];

  return (
    <div className="admin-page fade-in">
      <div className="admin-header">
        <div>
          <h1 className="section-title">Admin Konten</h1>
          <p className="hero-subtitle">Kelola video, event, course, freebies, tools, dan leads tanpa mengubah coding.</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">{t('admin_logout')}</button>
      </div>

      <div className="admin-tabs" role="tablist" aria-label="Jenis konten">
        <button
          type="button"
          className={`admin-tab ${activeType === 'analytics' ? 'active' : ''}`}
          onClick={() => changeType('analytics')}
        >
          Analytics
        </button>
        <button
          type="button"
          className={`admin-tab ${activeType === 'leads' ? 'active' : ''}`}
          onClick={() => changeType('leads')}
        >
          Leads & Penjualan
        </button>
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

      {activeType === 'analytics' ? (
        <AnalyticsDashboard />
      ) : activeType === 'leads' ? (
        <LeadsPanel />
      ) : (
        <>
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

        {SALES_TYPES.includes(activeType) && (
          <fieldset className="admin-fieldset">
            <legend>Halaman {activeType === 'course' ? 'jualan' : 'freebies'} di aigrowth.id</legend>

            <div className="form-group">
              <label htmlFor="sales-slug">Alamat halaman</label>
              <div className="slug-input">
                <input id="sales-slug" type="text" value={form.slug} onChange={(event) => updateField('slug', event.target.value.toLowerCase())} className="glass-input" placeholder="contoh: ai-influencer" />
                <button type="button" className="cancel-btn" onClick={() => updateField('slug', slugify(form.title))} disabled={!form.title}>Dari judul</button>
              </div>
              <span className="field-hint">
                {form.slug ? `Halaman: aigrowth.id${activeType === 'course' ? '/courses/' : '/gratis/'}${form.slug}` : activeType === 'course' ? 'Kosongkan kalau course ini masih pakai link luar (Scalev/Lynk).' : 'Wajib diisi untuk freebies.'}
              </span>
            </div>

            {activeType === 'course' && (
              <>
                <div className="admin-form-grid">
                  <div className="form-group">
                    <label htmlFor="sales-price">Harga (Rp)</label>
                    <input id="sales-price" type="text" inputMode="numeric" value={form.price} onChange={(event) => updateField('price', event.target.value.replace(/[^0-9]/g, ''))} className="glass-input" placeholder="contoh: 199000" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="sales-compare">Harga coret (opsional)</label>
                    <input id="sales-compare" type="text" inputMode="numeric" value={form.comparePrice} onChange={(event) => updateField('comparePrice', event.target.value.replace(/[^0-9]/g, ''))} className="glass-input" placeholder="contoh: 499000" />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="sales-checkout">Link checkout Mayar</label>
                  <input id="sales-checkout" type="url" value={form.checkoutUrl} onChange={(event) => updateField('checkoutUrl', event.target.value)} className="glass-input" placeholder="https://namakamu.myr.id/course/..." />
                  <span className="field-hint">Salin dari halaman produk Online Course di Mayar. Di Mayar, isi Redirect URL produk ke https://www.aigrowth.id/terima-kasih</span>
                </div>
              </>
            )}

            {activeType === 'freebie' && (
              <div className="form-group">
                <label htmlFor="sales-delivery">Link materi (rahasia)</label>
                <input id="sales-delivery" type="url" value={form.deliveryUrl} onChange={(event) => updateField('deliveryUrl', event.target.value)} className="glass-input" placeholder="https://drive.google.com/..." />
                <span className="field-hint">Baru muncul setelah pengunjung isi nama + WhatsApp. Kosongkan kalau materi dikirim manual lewat WA.</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="sales-headline">Headline (opsional)</label>
              <input id="sales-headline" type="text" value={form.headline} onChange={(event) => updateField('headline', event.target.value)} className="glass-input" placeholder="contoh: Bikin AI influencer yang mukanya konsisten di setiap konten" />
            </div>
            <div className="form-group">
              <label htmlFor="sales-subheadline">Subheadline (opsional)</label>
              <textarea id="sales-subheadline" value={form.subheadline} onChange={(event) => updateField('subheadline', event.target.value)} className="glass-input" rows={2} placeholder="Kalimat pendek di bawah judul. Kalau kosong, deskripsi yang dipakai." />
            </div>
            <div className="admin-form-grid">
              <div className="form-group">
                <label htmlFor="sales-video">Video intro YouTube (opsional)</label>
                <input id="sales-video" type="url" value={form.videoUrl} onChange={(event) => updateField('videoUrl', event.target.value)} className="glass-input" placeholder="https://youtu.be/..." />
              </div>
              <div className="form-group">
                <label htmlFor="sales-cta">Teks tombol (opsional)</label>
                <input id="sales-cta" type="text" value={form.ctaLabel} onChange={(event) => updateField('ctaLabel', event.target.value)} className="glass-input" placeholder={activeType === 'course' ? 'Daftar Sekarang' : 'Ambil Gratis'} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="sales-benefits">Yang didapat (satu per baris)</label>
              <textarea id="sales-benefits" value={form.benefits} onChange={(event) => updateField('benefits', event.target.value)} className="glass-input" rows={4} placeholder={'Bikin karakter AI yang konsisten\nProduksi 30 konten dalam sehari'} />
            </div>
            {activeType === 'course' && (
              <div className="form-group">
                <label htmlFor="sales-curriculum">Isi materi / modul (satu per baris: Judul | penjelasan)</label>
                <textarea id="sales-curriculum" value={form.curriculum} onChange={(event) => updateField('curriculum', event.target.value)} className="glass-input" rows={5} placeholder={'Dasar prompting | Cara menyusun prompt yang konsisten\nWorkflow produksi | Dari ide sampai siap posting'} />
              </div>
            )}
            <div className="form-group">
              <label htmlFor="sales-audience">Cocok untuk (satu per baris)</label>
              <textarea id="sales-audience" value={form.audience} onChange={(event) => updateField('audience', event.target.value)} className="glass-input" rows={3} placeholder={'Kreator yang mau konten lebih cepat\nPemilik bisnis yang belum pernah pakai AI'} />
            </div>
            <div className="form-group">
              <label htmlFor="sales-faq">FAQ (satu per baris: Pertanyaan | Jawaban)</label>
              <textarea id="sales-faq" value={form.faq} onChange={(event) => updateField('faq', event.target.value)} className="glass-input" rows={4} placeholder={'Aksesnya berapa lama? | Selamanya, termasuk update materi.'} />
            </div>
          </fieldset>
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
                {SALES_TYPES.includes(item.type) && (getContentPath(item)
                  ? <a className="item-page-link" href={getContentPath(item)} target="_blank" rel="noopener noreferrer">Buka halaman {getContentPath(item)} ↗</a>
                  : <span className="item-page-link is-missing">Belum punya halaman di aigrowth.id</span>)}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEdit(item)} className="edit-btn">{t('admin_btn_edit')}</button>
                <button onClick={() => handleDelete(item)} className="delete-btn">{t('admin_btn_delete')}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
}
