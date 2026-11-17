import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Arrow } from '../components/ui';
import { PORTFOLIO, PORTFOLIO_KINDS } from '../data/portfolio';
import { pad } from '../lib/brand';
import { COMMUNITY_URL } from '../lib/site';
import './Portfolio.css';

const INSTAGRAM_URL = 'https://www.instagram.com/aigrowth.id/';
const PARTNERS = ['Paragon Corp', 'Smesco', 'JNE', 'Radio Elshinta', 'Star Kolega', 'Ceritaombotak', 'GBI BFC Makassar'];

function EventCard({ event, index, onZoom }) {
  const [active, setActive] = useState(0);
  const image = event.images[active];

  return (
    <article className="pf-card" style={{ '--d': index }}>
      <button type="button" className="pf-media" onClick={() => onZoom(image, event.title)} aria-label={`Perbesar foto ${event.title}`}>
        <img className="pf-blur" src={image} alt="" aria-hidden="true" loading="lazy" />
        <img className="pf-img" src={image} alt={event.title} loading="lazy" />
        <span className="pf-num">{pad(index + 1)}</span>
      </button>
      {event.images.length > 1 && (
        <div className="pf-thumbs" role="group" aria-label="Foto lainnya">
          {event.images.map((src, i) => (
            <button key={src} type="button" className={i === active ? 'on' : ''} aria-pressed={i === active} aria-label={`Foto ${i + 1}`} onClick={() => setActive(i)}>
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <div className="pf-body">
        <small>{event.partner}</small>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        {event.meta && <span className="pf-meta">{event.meta}</span>}
        <div className="pf-tags">{event.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
      </div>
    </article>
  );
}

export default function Portfolio() {
  const dialogRef = useRef(null);
  const [zoom, setZoom] = useState(null);

  useEffect(() => {
    document.title = 'Portfolio | AIGrowth';
    return () => {
      document.title = 'AIGrowth';
    };
  }, []);

  const openZoom = (src, title) => {
    setZoom({ src, title });
    dialogRef.current?.showModal();
  };

  const groups = Object.entries(PORTFOLIO_KINDS).map(([kind, label]) => ({
    kind,
    label,
    items: PORTFOLIO.filter((event) => event.kind === kind),
  }));

  return (
    <div className="ui pf-page">
      <section className="wrap page-hero">
        <div className="copy">
          <span className="pill" data-reveal>Our portfolio</span>
          <h1 data-reveal style={{ '--d': 1 }}>Event yang sudah <span className="grad">kami jalanin.</span></h1>
          <p className="lead" data-reveal style={{ '--d': 2 }}>Training perusahaan, kelas offline, webinar UMKM, sampai radio dan podcast. Semua membawa AI yang praktis dan langsung kepake.</p>
        </div>
      </section>

      <section className="wrap">
        <div className="pf-partners panel" data-reveal style={{ '--d': 4 }}>
          <small>PERNAH BERKOLABORASI DENGAN</small>
          {PARTNERS.map((name) => <span key={name}>{name}</span>)}
        </div>
      </section>

      {groups.map((group) => (
        <section className="wrap pf-group" id={group.kind} key={group.kind}>
          <div className="pf-head">
            <span className="pill">{group.label}</span>
            <span className="pf-count">{pad(group.items.length)} event</span>
          </div>
          <div className={`pf-grid${group.kind === 'media' ? ' is-compact' : ''}`}>
            {group.items.map((event, index) => <EventCard key={event.id} event={event} index={index} onZoom={openZoom} />)}
          </div>
        </section>
      ))}

      <section className="wrap sec-final">
        <div className="final">
          <span className="pill">Kolaborasi</span>
          <h2>Bawa AI ke tim, brand, <span className="grad">atau komunitasmu.</span></h2>
          <p className="lead">Training in-house, workshop, webinar, sampai talkshow. Materinya disesuaikan dengan kasus nyata audiensmu.</p>
          <div className="acts">
            <a className="btn btn-primary" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">DM Instagram AIGrowth <span className="arr">→</span></a>
            <a className="btn btn-glass" href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">Join WhatsApp Channel <Arrow /></a>
          </div>
          <Link className="pf-more" to="/courses">Atau mulai dari course AIGrowth →</Link>
        </div>
      </section>

      <dialog className="pf-zoom" ref={dialogRef} onClose={() => setZoom(null)} onClick={(event) => event.target === dialogRef.current && dialogRef.current.close()}>
        {zoom && <img src={zoom.src} alt={zoom.title} />}
        <button type="button" className="pf-close" onClick={() => dialogRef.current?.close()} aria-label="Tutup">×</button>
      </dialog>
    </div>
  );
}
