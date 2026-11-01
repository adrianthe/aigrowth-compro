import { useEffect, useRef, useState } from 'react';
import { CONTENT_TYPE_LABELS } from '../../data/contentDefaults';
import {
  fetchDeliveryUrl,
  formatRupiah,
  getContentPath,
  getYouTubeVideoId,
  saveContentItem,
  saveDeliveryUrl,
  slugify,
  uploadContentImage,
} from '../../lib/contentApi';
import RowsEditor from './RowsEditor';
import {
  SALES_TYPES,
  SITE_ORIGIN,
  discountPercent,
  emptyForm,
  faqRow,
  formSignature,
  formToItem,
  itemToForm,
  moduleRow,
  pagePath,
  readinessChecks,
  textRow,
  validateForm,
} from './formModel';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const THANK_YOU_URL = `${SITE_ORIGIN}/terima-kasih`;

const CATEGORY_PLACEHOLDERS = {
  video: 'Contoh: AI Automation',
  event: 'Contoh: Workshop',
  course: 'Contoh: Online Course',
  freebie: 'Contoh: Template gratis',
  tool: 'Contoh: Automasi Sosial Media',
};

function Section({ id, title, hint, children }) {
  return (
    <section className="adm-card adm-section" id={`sec-${id}`}>
      <header>
        <h2>{title}</h2>
        {hint && <p>{hint}</p>}
      </header>
      <div className="adm-section-body">{children}</div>
    </section>
  );
}

function Field({ id, label, hint, optional, warn, children }) {
  return (
    <div className="adm-field">
      <label htmlFor={id}>
        {label}
        {optional && <em>opsional</em>}
      </label>
      {children}
      {warn && <span className="adm-hint is-warn">{warn}</span>}
      {hint && <span className="adm-hint">{hint}</span>}
    </div>
  );
}

function MoneyInput({ id, value, onChange, placeholder }) {
  return (
    <div className="adm-affix">
      <span>Rp</span>
      <input
        id={id}
        className="adm-input"
        type="text"
        inputMode="numeric"
        value={value ? Number(value).toLocaleString('id-ID') : ''}
        onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
      />
    </div>
  );
}

function PreviewCard({ type, form }) {
  const label = CONTENT_TYPE_LABELS[type];
  const videoId = type === 'video' ? getYouTubeVideoId(form.url) : '';
  const image = form.imageUrl || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '');
  const discount = discountPercent(form.price, form.comparePrice);
  const isFree = type === 'freebie';

  return (
    <div className="adm-preview">
      <div className="adm-preview-cover">
        {image ? <img src={image} alt="" /> : <span>{label.toUpperCase()}</span>}
        {isFree && <i>Gratis</i>}
        {!isFree && form.featured && <i>Pilihan</i>}
      </div>
      <div className="adm-preview-body">
        <small>{form.category || (isFree ? 'Gratis' : label)}</small>
        <h3>{form.title || 'Judul akan tampil di sini'}</h3>
        <p>{form.description || 'Deskripsi singkat untuk kartu di katalog.'}</p>
        {type === 'course' && (
          <div className="adm-preview-price">
            <b>{Number(form.price) > 0 ? formatRupiah(form.price) : 'Harga belum diisi'}</b>
            {discount > 0 && <><s>{formatRupiah(form.comparePrice)}</s><em>-{discount}%</em></>}
          </div>
        )}
        {SALES_TYPES.includes(type) && (
          <span className="adm-preview-cta">{form.ctaLabel || (isFree ? 'Ambil Gratis' : 'Daftar Sekarang')} →</span>
        )}
      </div>
    </div>
  );
}

function Readiness({ checks }) {
  const done = checks.filter((check) => check.done).length;
  const percent = Math.round((done / checks.length) * 100);
  const jump = (id) => {
    const section = document.getElementById(`sec-${id}`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    section?.querySelector('input, textarea, button')?.focus({ preventScroll: true });
  };

  return (
    <div className="adm-card adm-ready">
      <div className="adm-ready-head">
        <h3>Kesiapan halaman</h3>
        <b>{done}/{checks.length}</b>
      </div>
      <div className="adm-meter"><span style={{ width: `${percent}%` }} /></div>
      <p>{percent === 100 ? 'Siap dipromosikan. Gas sebar link-nya!' : 'Lengkapi yang belum dicentang supaya halaman meyakinkan.'}</p>
      <ul>
        {checks.map((check) => (
          <li key={check.label}>
            <button type="button" className={check.done ? 'is-done' : ''} onClick={() => jump(check.id)}>
              <i aria-hidden="true">{check.done ? '✓' : ''}</i>
              <span>{check.label}</span>
              {check.hint && !check.done && <small>{check.hint}</small>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ContentEditor({ type, item, seed, onBack, onSaved, onDirtyChange, notify }) {
  const label = CONTENT_TYPE_LABELS[type];
  const isSalesType = SALES_TYPES.includes(type);
  const fileInputRef = useRef(null);
  const [editingId, setEditingId] = useState(item?.id || null);
  const [form, setForm] = useState(() => seed || (item ? itemToForm(item) : emptyForm));
  const [savedSignature, setSavedSignature] = useState(() => formSignature(item ? itemToForm(item) : emptyForm));
  const [autoSlug, setAutoSlug] = useState(!item);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const isUploading = uploadProgress > 0 && uploadProgress < 100;

  const isDirty = formSignature(form) !== savedSignature;
  const path = pagePath(type, form.slug);
  const fullUrl = path ? `${SITE_ORIGIN}${path}` : '';
  const checks = readinessChecks(form, type);
  const discount = discountPercent(form.price, form.comparePrice);
  const videoId = type === 'video' ? getYouTubeVideoId(form.url) : '';
  const introVideoId = getYouTubeVideoId(form.videoUrl);

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);

  // The freebie delivery link lives in a private table, so it loads separately
  useEffect(() => {
    if (type !== 'freebie' || !item?.id) return;
    let active = true;
    fetchDeliveryUrl(item.id)
      .then((deliveryUrl) => {
        if (!active) return;
        setForm((current) => ({ ...current, deliveryUrl }));
        setSavedSignature(formSignature({ ...itemToForm(item), deliveryUrl }));
      })
      .catch((error) => notify(error.message || 'Link materi gagal dimuat.', 'error'));
    return () => {
      active = false;
    };
  }, [item, type, notify]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const updateTitle = (value) => {
    setForm((current) => ({ ...current, title: value, ...(autoSlug && isSalesType ? { slug: slugify(value) } : {}) }));
  };

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text);
      notify(`${what} disalin.`);
    } catch {
      notify('Gagal menyalin. Salin manual ya.', 'error');
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      notify('Format foto harus JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      notify('Ukuran foto maksimal 5 MB.', 'error');
      return;
    }

    setUploadProgress(35);
    try {
      const imageUrl = await uploadContentImage(file, type);
      updateField('imageUrl', imageUrl);
      notify('Foto berhasil diupload.');
    } catch (error) {
      notify(error.message || 'Foto gagal diupload.', 'error');
    } finally {
      setUploadProgress(0);
    }
  };

  const submit = async (openPage = false) => {
    if (isSubmitting || isUploading) return;
    const error = validateForm(form, type);
    if (error) {
      notify(error, 'error');
      return;
    }

    // Open the tab before awaiting so the popup blocker allows it
    const pageWindow = openPage ? window.open('', '_blank') : null;
    setIsSubmitting(true);
    try {
      const saved = await saveContentItem(formToItem(form, type, editingId));
      if (type === 'freebie') await saveDeliveryUrl(saved.id, form.deliveryUrl);
      setEditingId(saved.id);
      setSavedSignature(formSignature(form));
      setAutoSlug(false);
      onSaved(saved);
      notify(`${label} berhasil disimpan.`);
      const savedPath = getContentPath(saved);
      if (pageWindow) {
        if (savedPath) pageWindow.location.href = savedPath;
        else pageWindow.close();
      }
    } catch (saveError) {
      pageWindow?.close();
      notify(saveError.message || 'Konten gagal disimpan.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cmd/Ctrl+S saves without leaving the editor
  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        submitRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const doneCount = checks.filter((check) => check.done).length;

  return (
    <form
      className="adm-editor"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      noValidate
    >
      <header className="adm-editor-head">
        <button type="button" className="adm-back" onClick={onBack}>← Kembali ke daftar {label.toLowerCase()}</button>
        <h1>{editingId ? form.title || `Edit ${label.toLowerCase()}` : seed ? `Salinan ${label.toLowerCase()}` : `Tambah ${label.toLowerCase()}`}</h1>
        {path && editingId && (
          <a className="adm-head-link" href={path} target="_blank" rel="noopener noreferrer">{fullUrl.replace('https://', '')} ↗</a>
        )}
      </header>

      <div className="adm-editor-grid">
        <div className="adm-editor-main">
          <Section id="info" title="Info dasar" hint="Tampil di kartu katalog dan homepage.">
            <Field id="f-title" label="Judul">
              <input id="f-title" className="adm-input adm-input-lg" value={form.title} onChange={(event) => updateTitle(event.target.value)} placeholder={type === 'course' ? 'Contoh: Framework AI Influencer yang Konsisten' : 'Judul'} />
            </Field>
            <Field id="f-desc" label="Deskripsi singkat" hint={`${form.description.length} karakter · idealnya 1–2 kalimat.`}>
              <textarea id="f-desc" className="adm-input" rows={3} value={form.description} onChange={(event) => updateField('description', event.target.value)} placeholder="Ringkasan yang bikin orang mau klik." />
            </Field>
            <div className="adm-grid-2">
              <Field id="f-cat" label="Kategori" optional>
                <input id="f-cat" className="adm-input" value={form.category} onChange={(event) => updateField('category', event.target.value)} placeholder={CATEGORY_PLACEHOLDERS[type]} />
              </Field>
              {type === 'event' && (
                <Field id="f-date" label="Tanggal event" optional>
                  <input id="f-date" className="adm-input" type="date" value={form.eventDate} onChange={(event) => updateField('eventDate', event.target.value)} />
                </Field>
              )}
            </div>

            {type === 'video' && (
              <Field
                id="f-yt"
                label="Link video YouTube"
                hint={videoId ? '✓ Video terdeteksi, otomatis jadi embed.' : 'Bisa link biasa, Shorts, Live, atau youtu.be.'}
                warn={form.url && !videoId ? 'Link ini belum dikenali sebagai video YouTube.' : ''}
              >
                <input id="f-yt" className="adm-input" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
              </Field>
            )}

            {type !== 'video' && (
              <div className="adm-grid-2">
                <Field
                  id="f-url"
                  label={isSalesType ? 'Link luar' : 'Link tujuan'}
                  optional
                  hint={isSalesType ? 'Hanya dipakai kalau belum ada halaman di aigrowth.id (mis. Scalev/Lynk).' : ''}
                >
                  <input id="f-url" className="adm-input" type="url" value={form.url} onChange={(event) => updateField('url', event.target.value)} placeholder="https://..." />
                </Field>
                <Field id="f-label" label="Label tombol/status" optional>
                  <input id="f-label" className="adm-input" value={form.label} onChange={(event) => updateField('label', event.target.value)} placeholder="Contoh: Lihat Detail" />
                </Field>
              </div>
            )}

            {(type === 'course' || type === 'tool') && (
              <label className="adm-switch">
                <input type="checkbox" checked={form.featured} onChange={(event) => updateField('featured', event.target.checked)} />
                <span aria-hidden="true" />
                <b>Tandai sebagai rekomendasi</b>
              </label>
            )}
          </Section>

          {type !== 'video' && (
            <Section id="image" title="Gambar cover" hint="Rasio 16:10 paling pas. JPG, PNG, atau WebP, maksimal 5 MB.">
              <div className="adm-upload">
                <label className={`adm-drop ${isUploading ? 'is-busy' : ''}`}>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} disabled={isUploading} />
                  {form.imageUrl ? <img src={form.imageUrl} alt="Preview cover" /> : <span className="adm-drop-plus">+</span>}
                  <b>{isUploading ? `Mengupload ${uploadProgress}%...` : form.imageUrl ? 'Ganti foto' : 'Pilih foto dari perangkat'}</b>
                </label>
                <div className="adm-upload-side">
                  <Field id="f-img" label="atau pakai URL foto">
                    <input id="f-img" className="adm-input" type="url" value={form.imageUrl} onChange={(event) => updateField('imageUrl', event.target.value)} placeholder="https://..." />
                  </Field>
                  {form.imageUrl && <button type="button" className="adm-btn adm-btn-ghost adm-btn-sm" onClick={() => updateField('imageUrl', '')}>Hapus foto</button>}
                </div>
              </div>
              {isUploading && <div className="adm-meter"><span style={{ width: `${uploadProgress}%` }} /></div>}
            </Section>
          )}

          {isSalesType && (
            <Section id="page" title="Alamat halaman" hint={type === 'course' ? 'Kosongkan kalau course ini masih pakai link luar.' : 'Wajib untuk freebies, ini halaman form-nya.'}>
              <Field id="f-slug" label="Slug" hint={autoSlug ? 'Otomatis mengikuti judul sampai kamu ubah sendiri.' : ''}>
                <div className="adm-affix">
                  <span>aigrowth.id/{type === 'course' ? 'courses' : 'gratis'}/</span>
                  <input
                    id="f-slug"
                    className="adm-input"
                    value={form.slug}
                    onChange={(event) => {
                      setAutoSlug(false);
                      updateField('slug', event.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="ai-influencer"
                  />
                  <button type="button" onClick={() => { updateField('slug', slugify(form.title)); setAutoSlug(true); }} disabled={!form.title}>Dari judul</button>
                </div>
              </Field>
              {fullUrl && (
                <div className="adm-urlbox">
                  <code>{fullUrl}</code>
                  <button type="button" className="adm-btn adm-btn-soft adm-btn-sm" onClick={() => copy(fullUrl, 'Link halaman')}>Salin</button>
                  {editingId && <a className="adm-btn adm-btn-ghost adm-btn-sm" href={path} target="_blank" rel="noopener noreferrer">Buka ↗</a>}
                </div>
              )}
            </Section>
          )}

          {type === 'course' && (
            <Section id="pricing" title="Harga & checkout" hint="Pembeli isi form di aigrowth.id, lalu diarahkan ke checkout Mayar.">
              <div className="adm-grid-2">
                <Field id="f-price" label="Harga jual" hint={Number(form.price) > 0 ? `Tampil: ${formatRupiah(form.price)}` : ''}>
                  <MoneyInput id="f-price" value={form.price} onChange={(value) => updateField('price', value)} placeholder="199.000" />
                </Field>
                <Field
                  id="f-compare"
                  label="Harga coret"
                  optional
                  hint={discount > 0 ? `Hemat ${discount}% tampil di halaman.` : ''}
                  warn={form.comparePrice && Number(form.comparePrice) <= Number(form.price) ? 'Harga coret harus lebih besar dari harga jual, kalau tidak akan disembunyikan.' : ''}
                >
                  <MoneyInput id="f-compare" value={form.comparePrice} onChange={(value) => updateField('comparePrice', value)} placeholder="499.000" />
                </Field>
              </div>
              <Field
                id="f-checkout"
                label="Link checkout Mayar"
                hint="Salin dari produk Online Course di dashboard Mayar."
                warn={form.checkoutUrl && !/^https:\/\//.test(form.checkoutUrl.trim())
                  ? 'Harus diawali https://'
                  : form.checkoutUrl && !/myr\.id|mayar\./i.test(form.checkoutUrl)
                    ? 'Ini bukan link Mayar (myr.id). Pastikan memang link checkout yang benar.'
                    : form.slug && !form.checkoutUrl ? 'Tanpa link checkout, tombol di halaman akan diarahkan ke WhatsApp.' : ''}
              >
                <div className="adm-affix">
                  <input id="f-checkout" className="adm-input" type="url" value={form.checkoutUrl} onChange={(event) => updateField('checkoutUrl', event.target.value)} placeholder="https://aigrowth.myr.id/course/..." />
                  <a className={`adm-affix-btn ${form.checkoutUrl ? '' : 'is-disabled'}`} href={form.checkoutUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!form.checkoutUrl}>Tes link ↗</a>
                </div>
              </Field>
              <div className="adm-note">
                <span>Di Mayar, isi <b>Redirect URL</b> produk ini dengan</span>
                <code>{THANK_YOU_URL}</code>
                <button type="button" className="adm-btn adm-btn-soft adm-btn-sm" onClick={() => copy(THANK_YOU_URL, 'Redirect URL')}>Salin</button>
              </div>
            </Section>
          )}

          {type === 'freebie' && (
            <Section id="delivery" title="Akses materi" hint="Rahasia: baru muncul setelah pengunjung isi nama + WhatsApp.">
              <Field id="f-delivery" label="Link materi" optional hint="Kosongkan kalau materi dikirim manual lewat WhatsApp.">
                <div className="adm-affix">
                  <input id="f-delivery" className="adm-input" type="url" value={form.deliveryUrl} onChange={(event) => updateField('deliveryUrl', event.target.value)} placeholder="https://drive.google.com/..." />
                  <a className={`adm-affix-btn ${form.deliveryUrl ? '' : 'is-disabled'}`} href={form.deliveryUrl || undefined} target="_blank" rel="noopener noreferrer" aria-disabled={!form.deliveryUrl}>Tes link ↗</a>
                </div>
              </Field>
            </Section>
          )}

          {isSalesType && (
            <>
              <Section id="copy" title="Isi halaman" hint="Semua opsional. Kalau kosong, judul dan deskripsi yang dipakai.">
                <Field id="f-headline" label="Headline" optional>
                  <input id="f-headline" className="adm-input" value={form.headline} onChange={(event) => updateField('headline', event.target.value)} placeholder={type === 'course' ? 'Bikin AI influencer yang mukanya konsisten di setiap konten' : 'Template auto-post Threads gratis, tinggal pakai'} />
                </Field>
                <Field id="f-sub" label="Subheadline" optional>
                  <textarea id="f-sub" className="adm-input" rows={2} value={form.subheadline} onChange={(event) => updateField('subheadline', event.target.value)} placeholder="Kalimat pendek di bawah judul." />
                </Field>
                <div className="adm-grid-2">
                  <Field
                    id="f-video"
                    label="Video intro YouTube"
                    optional
                    hint={introVideoId ? '✓ Video terdeteksi' : ''}
                    warn={form.videoUrl && !introVideoId ? 'Link belum dikenali sebagai video YouTube.' : ''}
                  >
                    <input id="f-video" className="adm-input" type="url" value={form.videoUrl} onChange={(event) => updateField('videoUrl', event.target.value)} placeholder="https://youtu.be/..." />
                  </Field>
                  <Field id="f-cta" label="Teks tombol" optional>
                    <input id="f-cta" className="adm-input" value={form.ctaLabel} onChange={(event) => updateField('ctaLabel', event.target.value)} placeholder={type === 'course' ? 'Daftar Sekarang' : 'Ambil Gratis'} />
                  </Field>
                </div>
              </Section>

              <Section id="benefits" title="Yang didapat" hint="Tulis hasil yang dirasakan, bukan fitur. Minimal 3.">
                <RowsEditor
                  rows={form.benefits}
                  onChange={(rows) => updateField('benefits', rows)}
                  fields={[{ name: 'text', label: 'Benefit', placeholder: 'Bikin karakter AI yang konsisten di setiap konten' }]}
                  makeRow={() => textRow()}
                  addLabel="Tambah benefit"
                  emptyText="Belum ada benefit."
                />
              </Section>

              {type === 'course' && (
                <Section id="curriculum" title="Kurikulum" hint="Urutan modul seperti yang akan dipelajari.">
                  <RowsEditor
                    rows={form.curriculum}
                    onChange={(rows) => updateField('curriculum', rows)}
                    fields={[
                      { name: 'title', label: 'Judul modul', placeholder: 'Judul modul, contoh: Dasar prompting' },
                      { name: 'detail', label: 'Penjelasan modul', placeholder: 'Penjelasan singkat (opsional)', multiline: true },
                    ]}
                    makeRow={() => moduleRow()}
                    addLabel="Tambah modul"
                    emptyText="Belum ada modul."
                    numbered
                  />
                </Section>
              )}

              <Section id="audience" title="Cocok untuk" hint="Siapa yang paling dapat manfaat.">
                <RowsEditor
                  rows={form.audience}
                  onChange={(rows) => updateField('audience', rows)}
                  fields={[{ name: 'text', label: 'Target', placeholder: 'Kreator yang mau produksi konten lebih cepat' }]}
                  makeRow={() => textRow()}
                  addLabel="Tambah target"
                  emptyText="Belum ada target audiens."
                />
              </Section>

              <Section id="faq" title="FAQ" hint="Jawab keraguan sebelum orang bertanya di WhatsApp.">
                <RowsEditor
                  rows={form.faq}
                  onChange={(rows) => updateField('faq', rows)}
                  fields={[
                    { name: 'q', label: 'Pertanyaan', placeholder: 'Pertanyaan, contoh: Aksesnya berapa lama?' },
                    { name: 'a', label: 'Jawaban', placeholder: 'Jawaban', multiline: true },
                  ]}
                  makeRow={() => faqRow()}
                  addLabel="Tambah FAQ"
                  emptyText="Belum ada FAQ."
                  numbered
                />
              </Section>
            </>
          )}
        </div>

        <aside className="adm-editor-side">
          {checks.length > 0 && <Readiness checks={checks} />}
          <div className="adm-card adm-preview-wrap">
            <span className="adm-side-label">Preview kartu</span>
            <PreviewCard type={type} form={form} />
          </div>
        </aside>
      </div>

      <div className="adm-savebar">
        <div className={`adm-save-state ${isDirty ? 'is-dirty' : ''}`}>
          <i aria-hidden="true" />
          <span>{isDirty ? 'Ada perubahan belum disimpan' : editingId ? 'Semua perubahan tersimpan' : 'Belum disimpan'}</span>
          {checks.length > 0 && <small>{doneCount}/{checks.length} siap</small>}
        </div>
        <div className="adm-save-actions">
          <button type="button" className="adm-btn adm-btn-ghost" onClick={onBack}>Batal</button>
          {isSalesType && form.slug && (
            <button type="button" className="adm-btn adm-btn-soft" onClick={() => submit(true)} disabled={isSubmitting || isUploading}>
              <span>Simpan &amp; lihat<span className="adm-hide-sm"> halaman</span></span>
            </button>
          )}
          <button type="submit" className="adm-btn adm-btn-primary" disabled={isSubmitting || isUploading}>
            {isUploading ? 'Tunggu upload...' : isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </form>
  );
}
