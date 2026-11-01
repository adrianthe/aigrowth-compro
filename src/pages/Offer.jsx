import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchContentBySlug, formatRupiah, getYouTubeVideoId } from '../lib/contentApi';
import { newEventId, submitLead } from '../lib/leadApi';
import { whatsappLink } from '../lib/site';
import { rememberCheckout, trackEvent } from '../lib/tracking';
import './Offer.css';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidWhatsapp = (value) => /^(\+?62|0)?8\d{7,13}$/.test(String(value).replace(/[\s-]/g, ''));

function Check() {
  return (
    <svg className="of-check" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" />
      <path d="M6 10.4l2.6 2.6L14 7.6" />
    </svg>
  );
}

function Price({ offer, compact = false }) {
  if (!offer.price) return null;
  const save = offer.comparePrice > offer.price ? Math.round((1 - offer.price / offer.comparePrice) * 100) : 0;
  return (
    <div className={`of-price${compact ? ' is-compact' : ''}`}>
      {save > 0 && <s>{formatRupiah(offer.comparePrice)}</s>}
      <strong>{formatRupiah(offer.price)}</strong>
      {save > 0 && <span className="of-save">Hemat {save}%</span>}
    </div>
  );
}

function LeadForm({ offer, kind, onDone }) {
  const [values, setValues] = useState({ name: '', email: '', whatsapp: '', website: '' });
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isCheckout = kind === 'course';

  const update = (field) => (event) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = values.name.trim();
    const email = values.email.trim();
    if (!name) return setError('Nama wajib diisi.');
    if (isCheckout && !EMAIL_PATTERN.test(email)) return setError('Email wajib diisi dengan benar, akses kelas dikirim ke email ini.');
    if (!isCheckout && email && !EMAIL_PATTERN.test(email)) return setError('Format email belum valid.');
    if (!isValidWhatsapp(values.whatsapp)) return setError('Nomor WhatsApp belum valid. Contoh: 0812xxxxxxx');

    setError('');
    setIsSending(true);
    const eventId = newEventId();
    const meta = { id: offer.id, title: offer.title, category: offer.category, value: offer.price || undefined };
    trackEvent(isCheckout ? 'InitiateCheckout' : 'Lead', meta, eventId);

    try {
      const result = await submitLead({ type: offer.type, slug: offer.slug, name, email, whatsapp: values.whatsapp, website: values.website, eventId });
      onDone({ ...result, name, email });
    } catch (submitError) {
      // A failed save must never block a sale: only validation errors stop the checkout
      if (isCheckout && submitError.status !== 400 && offer.checkoutUrl) {
        onDone({ checkoutUrl: offer.checkoutUrl, name, email });
        return;
      }
      setError(submitError.message);
      setIsSending(false);
    }
  };

  return (
    <form className="of-form" onSubmit={handleSubmit} noValidate>
      <label>
        <span>Nama lengkap</span>
        <input value={values.name} onChange={update('name')} autoComplete="name" placeholder="Nama kamu" required />
      </label>
      <label>
        <span>Email{isCheckout ? '' : ' (opsional)'}</span>
        <input type="email" value={values.email} onChange={update('email')} autoComplete="email" inputMode="email" placeholder="nama@email.com" required={isCheckout} />
      </label>
      <label>
        <span>Nomor WhatsApp</span>
        <input type="tel" value={values.whatsapp} onChange={update('whatsapp')} autoComplete="tel" inputMode="tel" placeholder="0812xxxxxxx" required />
      </label>
      <label className="of-hp" aria-hidden="true">
        Website
        <input tabIndex={-1} autoComplete="off" value={values.website} onChange={update('website')} />
      </label>
      {error && <p className="of-error" role="alert">{error}</p>}
      <button type="submit" className="primary-btn of-submit" disabled={isSending}>
        {isSending ? (isCheckout ? 'Menuju pembayaran...' : 'Mengirim...') : isCheckout ? 'Lanjut ke Pembayaran →' : 'Kirim & Ambil Gratis →'}
      </button>
      <p className="of-fine">
        {isCheckout
          ? 'Pembayaran diproses aman oleh Mayar (QRIS, transfer bank, e-wallet). Pakai email yang sama di halaman pembayaran ya.'
          : 'Data kamu aman. Kami hanya mengirim info materi dan kelas AIGrowth.'}
      </p>
    </form>
  );
}

function Video({ url, title }) {
  const id = getYouTubeVideoId(url);
  if (!id) return null;
  return (
    <div className="of-video">
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}

export default function Offer({ type }) {
  const { slug } = useParams();
  const dialogRef = useRef(null);
  const [state, setState] = useState({ slug: null, offer: null });
  const [freebieResult, setFreebieResult] = useState(null);
  const isCourse = type === 'course';
  const isLoading = state.slug !== slug;
  const offer = isLoading ? null : state.offer;

  useEffect(() => {
    let active = true;
    fetchContentBySlug(type, slug).then((item) => {
      if (!active) return;
      setState({ slug, offer: item });
      setFreebieResult(null);
      if (item) {
        document.title = `${item.title} | AIGrowth`;
        trackEvent('ViewContent', { id: item.id, title: item.title, category: item.category, value: item.price || undefined });
      }
    });
    return () => {
      active = false;
      document.title = 'AIGrowth';
    };
  }, [type, slug]);

  if (isLoading) {
    return <div className="of-page"><div className="of-loading" aria-live="polite">Memuat halaman...</div></div>;
  }

  if (!offer) {
    return (
      <div className="of-page">
        <section className="of-missing">
          <h1>Halaman tidak ditemukan</h1>
          <p>Link-nya mungkin sudah berubah. Cek daftar {isCourse ? 'course' : 'freebies'} terbaru di bawah.</p>
          <Link className="primary-btn" to={isCourse ? '/courses' : '/gratis'}>Lihat {isCourse ? 'semua course' : 'semua freebies'}</Link>
        </section>
      </div>
    );
  }

  const sales = offer.sales || {};
  const benefits = sales.benefits || [];
  const audience = sales.audience || [];
  const curriculum = sales.curriculum || [];
  const faq = sales.faq || [];
  const canCheckout = isCourse && Boolean(offer.checkoutUrl);
  const ctaLabel = sales.ctaLabel || (isCourse ? 'Daftar Sekarang' : 'Ambil Gratis');
  const askLink = whatsappLink(`Halo AIGrowth, saya mau tanya soal ${offer.title}`);

  const openForm = () => dialogRef.current?.showModal();
  const closeForm = () => dialogRef.current?.close();

  const handleDone = (result) => {
    if (isCourse) {
      rememberCheckout({ slug: offer.slug, title: offer.title, leadId: result.leadId, email: result.email });
      window.location.assign(result.checkoutUrl || offer.checkoutUrl);
      return;
    }
    setFreebieResult(result);
  };

  const cta = isCourse && !canCheckout ? (
    <a className="primary-btn of-cta" href={askLink} target="_blank" rel="noopener noreferrer">Tanya via WhatsApp →</a>
  ) : (
    <button type="button" className="primary-btn of-cta" onClick={openForm}>{ctaLabel} →</button>
  );

  return (
    <div className="of-page">
      <section className="of-hero">
        <div className="of-hero-copy">
          <span className="of-kicker"><i />{isCourse ? (offer.category || 'Online Course') : 'Freebies AIGrowth'}</span>
          <h1>{offer.title}</h1>
          {sales.headline && <p className="of-headline">{sales.headline}</p>}
          <p className="of-sub">{sales.subheadline || offer.description}</p>
          {isCourse ? <Price offer={offer} /> : <div className="of-price"><strong>Gratis</strong></div>}
          <div className="of-actions">
            {cta}
            {(curriculum.length > 0 || benefits.length > 0) && <a className="of-ghost" href="#materi">Lihat isi materi</a>}
          </div>
          <ul className="of-trust">
            {isCourse ? (
              <>
                <li><Check />Akses lewat portal member</li>
                <li><Check />Bayar QRIS / transfer / e-wallet</li>
                <li><Check />Dibimbing tim AIGrowth</li>
              </>
            ) : (
              <>
                <li><Check />100% gratis</li>
                <li><Check />Langsung bisa dibuka</li>
              </>
            )}
          </ul>
        </div>
        <div className={`of-hero-media${!getYouTubeVideoId(sales.videoUrl) && !offer.imageUrl ? ' is-placeholder' : ''}`}>
          {getYouTubeVideoId(sales.videoUrl) ? (
            <Video url={sales.videoUrl} title={offer.title} />
          ) : offer.imageUrl ? (
            <img src={offer.imageUrl} alt={offer.title} />
          ) : (
            <div className="of-art" aria-hidden="true"><span>AIGROWTH</span></div>
          )}
        </div>
      </section>

      {benefits.length > 0 && (
        <section className="of-section" id="materi">
          <span className="of-label">Yang kamu dapat</span>
          <h2>Setelah ikut {isCourse ? 'kelas ini' : 'materi ini'}, kamu bisa:</h2>
          <div className="of-benefits">
            {benefits.map((benefit, index) => (
              <div className="of-benefit" key={benefit}>
                <span className="of-num">{String(index + 1).padStart(2, '0')}</span>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {curriculum.length > 0 && (
        <section className="of-section" id={benefits.length ? undefined : 'materi'}>
          <span className="of-label">Isi materi</span>
          <h2>{curriculum.length} modul, disusun dari dasar sampai praktik.</h2>
          <ol className="of-modules">
            {curriculum.map((module, index) => (
              <li key={`${module.title}-${index}`}>
                <span className="of-num">Modul {index + 1}</span>
                <div>
                  <h3>{module.title}</h3>
                  {module.detail && <p>{module.detail}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {audience.length > 0 && (
        <section className="of-section">
          <span className="of-label">Cocok untuk</span>
          <h2>Kelas ini dibuat buat kamu yang:</h2>
          <ul className="of-audience">
            {audience.map((item) => <li key={item}><Check />{item}</li>)}
          </ul>
        </section>
      )}

      {offer.description && sales.subheadline && (
        <section className="of-section of-about">
          <span className="of-label">Tentang {isCourse ? 'kelas' : 'materi'}</span>
          <p>{offer.description}</p>
        </section>
      )}

      {faq.length > 0 && (
        <section className="of-section">
          <span className="of-label">FAQ</span>
          <h2>Pertanyaan yang sering masuk</h2>
          <div className="of-faq">
            {faq.map((item) => (
              <details key={item.q}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="of-final">
        <h2>{isCourse ? 'Siap mulai belajar?' : 'Ambil sekarang, gratis.'}</h2>
        <p>{offer.title}</p>
        {isCourse && <Price offer={offer} />}
        {cta}
        <a className="of-ask" href={askLink} target="_blank" rel="noopener noreferrer">Masih ragu? Tanya dulu via WhatsApp</a>
      </section>

      <div className="of-sticky">
        <div>
          <small>{offer.title}</small>
          {isCourse ? <Price offer={offer} compact /> : <strong>Gratis</strong>}
        </div>
        {cta}
      </div>

      <dialog className="of-dialog" ref={dialogRef} onClick={(event) => event.target === dialogRef.current && closeForm()}>
        <div className="of-dialog-card">
          <button type="button" className="of-close" onClick={closeForm} aria-label="Tutup">×</button>
          {freebieResult ? (
            <div className="of-success">
              <span className="of-kicker"><i />Berhasil</span>
              <h2>Siap, {freebieResult.name.split(' ')[0]}!</h2>
              {freebieResult.deliveryUrl ? (
                <>
                  <p>Materinya sudah bisa kamu buka sekarang. Simpan link-nya ya.</p>
                  <a className="primary-btn of-submit" href={freebieResult.deliveryUrl} target="_blank" rel="noopener noreferrer">Buka Materi →</a>
                </>
              ) : (
                <>
                  <p>Data kamu sudah masuk. Tim AIGrowth akan kirim materinya lewat WhatsApp.</p>
                  <a className="primary-btn of-submit" href={whatsappLink(`Halo AIGrowth, saya sudah isi form ${offer.title}`)} target="_blank" rel="noopener noreferrer">Chat WhatsApp →</a>
                </>
              )}
              <Link className="of-ask" to="/courses" onClick={closeForm}>Lihat course lengkap AIGrowth</Link>
            </div>
          ) : (
            <>
              <span className="of-kicker"><i />{isCourse ? 'Langkah 1 dari 2' : 'Freebies'}</span>
              <h2>{isCourse ? 'Isi data dulu, lalu bayar' : 'Isi data untuk ambil materi'}</h2>
              <p className="of-dialog-sub">{offer.title}{isCourse && offer.price ? ` · ${formatRupiah(offer.price)}` : ''}</p>
              <LeadForm offer={offer} kind={type} onDone={handleDone} />
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
